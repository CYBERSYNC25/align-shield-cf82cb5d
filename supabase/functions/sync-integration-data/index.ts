import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, isServiceRole, rateLimitExceededResponse, rateLimitHeaders } from "../_shared/rate-limiter.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('SyncIntegrationData');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import shared crypto utilities (uses consistent salt)
import { decryptToken, isEncrypted, getEncryptionSalt } from "../_shared/crypto-utils.ts";
import { createCredentialLogger } from "../_shared/credential-access-logger.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Rate limiting - bypass for service_role (internal calls)
    if (!isServiceRole(authHeader)) {
      // Extract user ID from token for rate limiting
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user: tempUser } } = await tempClient.auth.getUser();
      const rateLimitId = tempUser?.id || req.headers.get('x-forwarded-for') || 'anonymous';

      const rateLimit = await checkRateLimit(rateLimitId, 'sync-integration-data', 10, 60);
      if (!rateLimit.allowed) {
        return rateLimitExceededResponse(rateLimit, corsHeaders);
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY')!;

    // Validate user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get provider from request
    const { provider } = await req.json();
    if (!provider) {
      throw new Error('Provider is required');
    }

    logger.info(`Starting sync for provider: ${provider}, user: ${user.id}`);

    // Admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create credential logger for audit trail
    const credentialLogger = createCredentialLogger(supabaseAdmin, user.id, 'sync-integration-data');

    // Fetch encrypted credentials
    const { data: integration, error: fetchError } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('status', 'connected')
      .maybeSingle();

    if (fetchError) {
      logger.error('Fetch error', fetchError);
      throw new Error('Failed to fetch integration');
    }

    if (!integration) {
      throw new Error(`Integration ${provider} not found or not connected`);
    }

    // Decrypt credentials with audit logging
    const config = integration.configuration as Record<string, string>;
    const decryptedCredentials: Record<string, string> = {};
    let decryptionSuccess = true;
    let decryptionError: string | undefined;

    try {
      for (const [key, value] of Object.entries(config)) {
        if (typeof value === 'string' && isEncrypted(value)) {
          decryptedCredentials[key] = await decryptToken(value, encryptionKey);
        } else if (typeof value === 'string') {
          decryptedCredentials[key] = value;
        }
      }
    } catch (err) {
      decryptionSuccess = false;
      decryptionError = err instanceof Error ? err.message : 'Decryption failed';
    }

    // Log credential access
    await credentialLogger.logDecrypt(provider, decryptionSuccess, decryptionError);

    if (!decryptionSuccess) {
      throw new Error(`Failed to decrypt credentials for ${provider}`);
    }

    logger.debug(`Credentials decrypted for ${provider}`);

    // Collect data based on provider
    let resourcesCollected = 0;

    switch (provider) {
      case 'cloudflare':
        resourcesCollected = await collectCloudflareData(decryptedCredentials, user.id, supabaseAdmin);
        break;
      case 'github':
        resourcesCollected = await collectGitHubData(decryptedCredentials, user.id, supabaseAdmin);
        break;
      case 'slack':
        resourcesCollected = await collectSlackData(decryptedCredentials, user.id, supabaseAdmin);
        break;
      case 'jira':
        resourcesCollected = await collectJiraData(decryptedCredentials, user.id, supabaseAdmin);
        break;
      case 'bamboohr':
        resourcesCollected = await collectBambooHRData(decryptedCredentials, user.id, supabaseAdmin);
        break;
      case 'crowdstrike':
        resourcesCollected = await collectCrowdStrikeData(decryptedCredentials, user.id, supabaseAdmin);
        break;
      case 'intune':
        resourcesCollected = await collectIntuneData(decryptedCredentials, user.id, supabaseAdmin);
        break;
      default:
        logger.debug(`No specific collector for ${provider}`);
    }

    // Update integration status and last_used_at
    const nowIso = new Date().toISOString();
    
    await supabaseAdmin.from('integration_status').upsert({
      user_id: user.id,
      integration_name: provider,
      status: 'connected',
      last_sync_at: nowIso,
      metadata: { resources_collected: resourcesCollected }
    }, { onConflict: 'user_id,integration_name' });

    // Update last_used_at for inactivity tracking
    await supabaseAdmin.from('integrations').update({
      last_used_at: nowIso,
      updated_at: nowIso,
    }).eq('id', integration.id);

    logger.info(`Completed: ${resourcesCollected} resources collected`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        provider,
        resourcesCollected 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Limit': '10' } }
    );

  } catch (error) {
    logger.error('Error', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Collection functions
async function collectCloudflareData(credentials: Record<string, string>, userId: string, supabase: any): Promise<number> {
  let count = 0;
  const headers = {
    'Authorization': `Bearer ${credentials.apiToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // Collect zones
    const zonesResponse = await fetch('https://api.cloudflare.com/client/v4/zones', { headers });
    const zonesData = await zonesResponse.json();

    if (zonesData.success && zonesData.result) {
      for (const zone of zonesData.result) {
        const { error } = await supabase.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'cloudflare',
          resource_type: 'zones',
          resource_id: zone.id,
          resource_data: {
            name: zone.name,
            status: zone.status,
            plan: zone.plan?.name,
            name_servers: zone.name_servers,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
        
        if (!error) count++;
      }
    }

    // Collect DNS records for each zone
    for (const zone of zonesData.result || []) {
      const dnsResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`, { headers });
      const dnsData = await dnsResponse.json();

      if (dnsData.success && dnsData.result) {
        for (const record of dnsData.result) {
          const { error } = await supabase.from('integration_collected_data').upsert({
            user_id: userId,
            integration_name: 'cloudflare',
            resource_type: 'dns_records',
            resource_id: record.id,
            resource_data: {
              zone_name: zone.name,
              name: record.name,
              type: record.type,
              content: record.content,
              proxied: record.proxied,
            },
            collected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
          
          if (!error) count++;
        }
      }
    }
  } catch (error) {
    logger.error('Cloudflare collection error', error);
  }

  return count;
}

async function collectGitHubData(credentials: Record<string, string>, userId: string, supabase: any): Promise<number> {
  let count = 0;
  const headers = {
    'Authorization': `Bearer ${credentials.personalAccessToken}`,
    'Accept': 'application/vnd.github+json',
  };

  try {
    // Collect user
    const userResponse = await fetch('https://api.github.com/user', { headers });
    const userData = await userResponse.json();

    const { error: userError } = await supabase.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'github',
      resource_type: 'users',
      resource_id: userData.id?.toString() || userData.login,
      resource_data: {
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
        two_factor_authentication: userData.two_factor_authentication,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    
    if (!userError) count++;

    // Collect repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', { headers });
    const repos = await reposResponse.json();

    for (const repo of repos || []) {
      const { error } = await supabase.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'github',
        resource_type: 'repositories',
        resource_id: repo.id?.toString(),
        resource_data: {
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          visibility: repo.visibility,
          default_branch: repo.default_branch,
          language: repo.language,
          updated_at: repo.updated_at,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      
      if (!error) count++;
    }
  } catch (error) {
    logger.error('GitHub collection error', error);
  }

  return count;
}

async function collectSlackData(credentials: Record<string, string>, userId: string, supabase: any): Promise<number> {
  let count = 0;
  const headers = {
    'Authorization': `Bearer ${credentials.botToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // Collect users
    const usersResponse = await fetch('https://slack.com/api/users.list', { headers });
    const usersData = await usersResponse.json();

    if (usersData.ok && usersData.members) {
      for (const member of usersData.members) {
        if (!member.deleted && !member.is_bot) {
          const { error } = await supabase.from('integration_collected_data').upsert({
            user_id: userId,
            integration_name: 'slack',
            resource_type: 'users',
            resource_id: member.id,
            resource_data: {
              name: member.real_name || member.name,
              email: member.profile?.email,
              is_admin: member.is_admin,
              is_owner: member.is_owner,
              title: member.profile?.title,
              updated: member.updated,
            },
            collected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
          
          if (!error) count++;
        }
      }
    }

    // Collect channels
    const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', { headers });
    const channelsData = await channelsResponse.json();

    if (channelsData.ok && channelsData.channels) {
      for (const channel of channelsData.channels) {
        const { error } = await supabase.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'slack',
          resource_type: 'channels',
          resource_id: channel.id,
          resource_data: {
            name: channel.name,
            is_private: channel.is_private,
            num_members: channel.num_members,
            topic: channel.topic?.value,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
        
        if (!error) count++;
      }
    }
  } catch (error) {
    logger.error('Slack collection error', error);
  }

  return count;
}

async function collectJiraData(credentials: Record<string, string>, userId: string, supabase: any): Promise<number> {
  let count = 0;
  const auth = btoa(`${credentials.email}:${credentials.apiToken}`);
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
  };
  const baseUrl = `https://${credentials.domain}.atlassian.net`;

  try {
    // Collect projects
    const projectsResponse = await fetch(`${baseUrl}/rest/api/3/project`, { headers });
    const projects = await projectsResponse.json();

    for (const project of projects || []) {
      const { error } = await supabase.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'jira',
        resource_type: 'projects',
        resource_id: project.id,
        resource_data: {
          key: project.key,
          name: project.name,
          projectTypeKey: project.projectTypeKey,
          style: project.style,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      
      if (!error) count++;
    }

    // Collect users
    const usersResponse = await fetch(`${baseUrl}/rest/api/3/users/search?maxResults=100`, { headers });
    const users = await usersResponse.json();

    for (const user of users || []) {
      if (user.accountType === 'atlassian') {
        const { error } = await supabase.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'jira',
          resource_type: 'users',
          resource_id: user.accountId,
          resource_data: {
            displayName: user.displayName,
            emailAddress: user.emailAddress,
            active: user.active,
            accountType: user.accountType,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
        
        if (!error) count++;
      }
    }
  } catch (error) {
    logger.error('Jira collection error', error);
  }

  return count;
}

async function collectBambooHRData(credentials: Record<string, string>, userId: string, supabase: any): Promise<number> {
  let count = 0;
  const auth = btoa(`${credentials.apiKey}:x`);
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
  };
  const baseUrl = `https://api.bamboohr.com/api/gateway.php/${credentials.subdomain}/v1`;

  try {
    const response = await fetch(`${baseUrl}/employees/directory`, { headers });
    const data = await response.json();

    for (const employee of data.employees || []) {
      const { error } = await supabase.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'bamboohr',
        resource_type: 'employees',
        resource_id: employee.id,
        resource_data: {
          displayName: employee.displayName,
          firstName: employee.firstName,
          lastName: employee.lastName,
          workEmail: employee.workEmail,
          department: employee.department,
          jobTitle: employee.jobTitle,
          location: employee.location,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      
      if (!error) count++;
    }
  } catch (error) {
    logger.error('BambooHR collection error', error);
  }

  return count;
}

async function collectCrowdStrikeData(credentials: Record<string, string>, userId: string, supabase: any): Promise<number> {
  let count = 0;

  try {
    // Get OAuth token
    const tokenResponse = await fetch(`https://${credentials.region || 'api.crowdstrike.com'}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${credentials.clientId}&client_secret=${credentials.clientSecret}`,
    });
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get CrowdStrike token');
    }

    const headers = {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Accept': 'application/json',
    };

    // Get device IDs
    const devicesResponse = await fetch(`https://${credentials.region || 'api.crowdstrike.com'}/devices/queries/devices/v1?limit=100`, { headers });
    const devicesData = await devicesResponse.json();

    if (devicesData.resources) {
      // Get device details
      const detailsResponse = await fetch(`https://${credentials.region || 'api.crowdstrike.com'}/devices/entities/devices/v2`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: devicesData.resources }),
      });
      const detailsData = await detailsResponse.json();

      for (const device of detailsData.resources || []) {
        const { error } = await supabase.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'crowdstrike',
          resource_type: 'devices',
          resource_id: device.device_id,
          resource_data: {
            hostname: device.hostname,
            platform_name: device.platform_name,
            os_version: device.os_version,
            last_seen: device.last_seen,
            agent_version: device.agent_version,
            status: device.status,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
        
        if (!error) count++;
      }
    }
  } catch (error) {
    console.error('[CrowdStrike] Collection error:', error);
  }

  return count;
}

async function collectIntuneData(credentials: Record<string, string>, userId: string, supabase: any): Promise<number> {
  let count = 0;

  try {
    // Get OAuth token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get Intune token');
    }

    const headers = {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Accept': 'application/json',
    };

    // Collect managed devices
    const devicesResponse = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/managedDevices', { headers });
    const devicesData = await devicesResponse.json();

    for (const device of devicesData.value || []) {
      const { error } = await supabase.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'intune',
        resource_type: 'devices',
        resource_id: device.id,
        resource_data: {
          deviceName: device.deviceName,
          managedDeviceOwnerType: device.managedDeviceOwnerType,
          operatingSystem: device.operatingSystem,
          osVersion: device.osVersion,
          complianceState: device.complianceState,
          lastSyncDateTime: device.lastSyncDateTime,
          userPrincipalName: device.userPrincipalName,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      
      if (!error) count++;
    }
  } catch (error) {
    console.error('[Intune] Collection error:', error);
  }

  return count;
}
