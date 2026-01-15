import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/crypto-utils.ts';
import { checkRateLimit, isServiceRole, rateLimitExceededResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// Provider Credential Interfaces
// =============================================================================

interface CloudflareCredentials {
  email: string;
  apiToken: string;
}

interface JiraCredentials {
  domain: string;
  email: string;
  apiToken: string;
}

interface GitHubCredentials {
  personalAccessToken: string;
}

interface GitLabCredentials {
  domain: string;
  accessToken: string;
}

interface SlackCredentials {
  botToken: string;
}

interface BambooHRCredentials {
  subdomain: string;
  apiKey: string;
}

interface CrowdStrikeCredentials {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

interface IntuneCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

interface AzureADCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

// =============================================================================
// Data Collection Functions (collect and persist resources)
// =============================================================================

async function collectCloudflareData(credentials: CloudflareCredentials, userId: string, supabaseAdmin: any) {
  console.log('[Cloudflare] Collecting data for user:', userId);
  let zonesCollected = 0;
  
  const headers = {
    'X-Auth-Email': credentials.email,
    'Authorization': `Bearer ${credentials.apiToken}`,
    'Content-Type': 'application/json',
  };

  // Collect zones
  const zonesResponse = await fetch('https://api.cloudflare.com/client/v4/zones?per_page=50', { headers });
  const zonesData = await zonesResponse.json();

  console.log('[Cloudflare] Zones API response success:', zonesData.success);

  if (zonesData.success && zonesData.result) {
    for (const zone of zonesData.result) {
      const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'cloudflare',
        resource_type: 'zones',
        resource_id: zone.id,
        resource_data: {
          name: zone.name,
          status: zone.status,
          paused: zone.paused,
          type: zone.type,
          name_servers: zone.name_servers,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      
      if (error) {
        console.error('[Cloudflare] UPSERT ERROR for zone:', zone.id, JSON.stringify(error));
      } else {
        console.log('[Cloudflare] UPSERT SUCCESS for zone:', zone.name);
        zonesCollected++;
      }
    }
  }

  console.log('[Cloudflare] Total zones collected:', zonesCollected);
  return { zones: zonesCollected };
}

async function collectJiraData(credentials: JiraCredentials, userId: string, supabaseAdmin: any) {
  console.log('[Jira] Collecting data...');
  
  const auth = btoa(`${credentials.email}:${credentials.apiToken}`);
  const domain = credentials.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
  };

  // Collect current user
  const userResponse = await fetch(`https://${domain}/rest/api/3/myself`, { headers });
  const userData = await userResponse.json();

  await supabaseAdmin.from('integration_collected_data').upsert({
    user_id: userId,
    integration_name: 'jira',
    resource_type: 'users',
    resource_id: userData.accountId,
    resource_data: {
      name: userData.displayName,
      email: userData.emailAddress,
      accountType: userData.accountType,
      active: userData.active,
    },
    collected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });

  // Collect projects
  const projectsResponse = await fetch(`https://${domain}/rest/api/3/project/search?maxResults=50`, { headers });
  const projectsData = await projectsResponse.json();

  for (const project of projectsData.values || []) {
    await supabaseAdmin.from('integration_collected_data').upsert({
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
  }

  console.log('[Jira] Collected projects:', projectsData.values?.length || 0);
  return { user: userData.displayName, projects: projectsData.total || projectsData.values?.length || 0 };
}

async function collectGitHubData(credentials: GitHubCredentials, userId: string, supabaseAdmin: any) {
  console.log('[GitHub] Collecting data for user:', userId);
  let usersCollected = 0;
  let reposCollected = 0;
  
  const headers = {
    'Authorization': `Bearer ${credentials.personalAccessToken}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Collect authenticated user
  const userResponse = await fetch('https://api.github.com/user', { headers });
  const userData = await userResponse.json();

  console.log('[GitHub] User API response:', userData.login);

  const { error: userError } = await supabaseAdmin.from('integration_collected_data').upsert({
    user_id: userId,
    integration_name: 'github',
    resource_type: 'users',
    resource_id: userData.id.toString(),
    resource_data: {
      login: userData.login,
      name: userData.name,
      email: userData.email,
      company: userData.company,
      public_repos: userData.public_repos,
      followers: userData.followers,
      two_factor_authentication: userData.two_factor_authentication,
    },
    collected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });

  if (userError) {
    console.error('[GitHub] UPSERT ERROR for user:', JSON.stringify(userError));
  } else {
    console.log('[GitHub] UPSERT SUCCESS for user:', userData.login);
    usersCollected++;
  }

  // Collect repositories
  const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers });
  const repos = await reposResponse.json();

  console.log('[GitHub] Repos API response count:', repos.length);

  for (const repo of repos) {
    const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'github',
      resource_type: 'repositories',
      resource_id: repo.id.toString(),
      resource_data: {
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        visibility: repo.visibility,
        default_branch: repo.default_branch,
        language: repo.language,
        updated_at: repo.updated_at,
        has_branch_protection: false,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    
    if (error) {
      console.error('[GitHub] UPSERT ERROR for repo:', repo.name, JSON.stringify(error));
    } else {
      reposCollected++;
    }
  }

  // Collect organization members if org repos exist
  const orgRepos = repos.filter((r: any) => r.owner?.type === 'Organization');
  const orgs = [...new Set(orgRepos.map((r: any) => r.owner?.login))];
  
  for (const org of orgs) {
    try {
      const membersResponse = await fetch(`https://api.github.com/orgs/${org}/members?per_page=100`, { headers });
      if (membersResponse.ok) {
        const members = await membersResponse.json();
        for (const member of members) {
          await supabaseAdmin.from('integration_collected_data').upsert({
            user_id: userId,
            integration_name: 'github',
            resource_type: 'org_members',
            resource_id: `${org}-${member.id}`,
            resource_data: {
              login: member.login,
              organization: org,
              site_admin: member.site_admin,
            },
            collected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
        }
      }
    } catch (e) {
      console.log(`[GitHub] Could not fetch members for org ${org}`);
    }
  }

  console.log('[GitHub] Total collected - users:', usersCollected, 'repos:', reposCollected);
  return { user: userData.login, repos: reposCollected };
}

async function collectGitLabData(credentials: GitLabCredentials, userId: string, supabaseAdmin: any) {
  console.log('[GitLab] Collecting data...');
  
  const domain = credentials.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = domain.includes('gitlab.com') ? 'https://gitlab.com' : `https://${domain}`;
  const headers = { 'PRIVATE-TOKEN': credentials.accessToken };

  // Collect user
  const userResponse = await fetch(`${baseUrl}/api/v4/user`, { headers });
  const userData = await userResponse.json();

  await supabaseAdmin.from('integration_collected_data').upsert({
    user_id: userId,
    integration_name: 'gitlab',
    resource_type: 'users',
    resource_id: userData.id.toString(),
    resource_data: {
      username: userData.username,
      name: userData.name,
      email: userData.email,
      state: userData.state,
      is_admin: userData.is_admin,
      two_factor_enabled: userData.two_factor_enabled,
    },
    collected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });

  // Collect projects
  const projectsResponse = await fetch(`${baseUrl}/api/v4/projects?membership=true&per_page=100`, { headers });
  const projects = await projectsResponse.json();

  for (const project of projects) {
    await supabaseAdmin.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'gitlab',
      resource_type: 'projects',
      resource_id: project.id.toString(),
      resource_data: {
        name: project.name,
        path_with_namespace: project.path_with_namespace,
        visibility: project.visibility,
        default_branch: project.default_branch,
        last_activity_at: project.last_activity_at,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
  }

  const totalHeader = projectsResponse.headers.get('x-total');
  const projectCount = totalHeader ? parseInt(totalHeader) : projects.length;

  console.log('[GitLab] Collected projects:', projectCount);
  return { user: userData.username, projects: projectCount };
}

async function collectSlackData(credentials: SlackCredentials, userId: string, supabaseAdmin: any) {
  console.log('[Slack] Collecting data...');
  
  const headers = { 'Authorization': `Bearer ${credentials.botToken}` };

  // Get team info
  const teamResponse = await fetch('https://slack.com/api/auth.test', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const teamData = await teamResponse.json();

  // Collect workspace members
  const usersResponse = await fetch('https://slack.com/api/users.list?limit=200', { headers });
  const usersData = await usersResponse.json();

  const activeUsers: any[] = [];
  for (const member of usersData.members || []) {
    if (!member.deleted && !member.is_bot && member.id !== 'USLACKBOT') {
      activeUsers.push(member);
      await supabaseAdmin.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'slack',
        resource_type: 'users',
        resource_id: member.id,
        resource_data: {
          name: member.real_name || member.name,
          email: member.profile?.email,
          is_admin: member.is_admin,
          is_owner: member.is_owner,
          is_restricted: member.is_restricted,
          is_ultra_restricted: member.is_ultra_restricted,
          has_2fa: member.has_2fa,
          title: member.profile?.title,
          status_text: member.profile?.status_text,
          updated: member.updated,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }
  }

  // Collect channels
  const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200', { headers });
  const channelsData = await channelsResponse.json();

  for (const channel of channelsData.channels || []) {
    await supabaseAdmin.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'slack',
      resource_type: 'channels',
      resource_id: channel.id,
      resource_data: {
        name: channel.name,
        is_private: channel.is_private,
        is_archived: channel.is_archived,
        num_members: channel.num_members,
        topic: channel.topic?.value,
        purpose: channel.purpose?.value,
        created: channel.created,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
  }

  console.log('[Slack] Collected users:', activeUsers.length, 'channels:', channelsData.channels?.length);
  return { team: teamData.team, user: teamData.user, users: activeUsers.length, channels: channelsData.channels?.length || 0 };
}

async function collectBambooHRData(credentials: BambooHRCredentials, userId: string, supabaseAdmin: any) {
  console.log('[BambooHR] Collecting data...');
  
  const subdomain = credentials.subdomain.replace(/\.bamboohr\.com$/, '').trim();
  const auth = btoa(`${credentials.apiKey}:x`);
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
  };

  // Collect employee directory
  const response = await fetch(`https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`, { headers });
  const data = await response.json();

  for (const employee of data.employees || []) {
    await supabaseAdmin.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'bamboohr',
      resource_type: 'employees',
      resource_id: employee.id,
      resource_data: {
        displayName: employee.displayName,
        firstName: employee.firstName,
        lastName: employee.lastName,
        jobTitle: employee.jobTitle,
        department: employee.department,
        location: employee.location,
        workEmail: employee.workEmail,
        supervisor: employee.supervisor,
        photoUrl: employee.photoUrl,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
  }

  console.log('[BambooHR] Collected employees:', data.employees?.length);
  return { employees: data.employees?.length || 0 };
}

async function collectCrowdStrikeData(credentials: CrowdStrikeCredentials, userId: string, supabaseAdmin: any) {
  console.log('[CrowdStrike] Collecting data...');
  
  const baseUrl = credentials.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Get OAuth2 token
  const tokenResponse = await fetch(`https://${baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(credentials.clientId)}&client_secret=${encodeURIComponent(credentials.clientSecret)}`,
  });
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get device IDs
  const devicesQueryResponse = await fetch(`https://${baseUrl}/devices/queries/devices/v1?limit=100`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const devicesQueryData = await devicesQueryResponse.json();
  const deviceIds = devicesQueryData.resources || [];

  // Get device details
  if (deviceIds.length > 0) {
    const detailsResponse = await fetch(`https://${baseUrl}/devices/entities/devices/v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: deviceIds.slice(0, 100) }),
    });
    const detailsData = await detailsResponse.json();

    for (const device of detailsData.resources || []) {
      await supabaseAdmin.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'crowdstrike',
        resource_type: 'devices',
        resource_id: device.device_id,
        resource_data: {
          hostname: device.hostname,
          platform_name: device.platform_name,
          os_version: device.os_version,
          machine_domain: device.machine_domain,
          status: device.status,
          last_seen: device.last_seen,
          agent_version: device.agent_version,
          external_ip: device.external_ip,
          local_ip: device.local_ip,
          mac_address: device.mac_address,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }
  }

  console.log('[CrowdStrike] Collected devices:', deviceIds.length);
  return { hosts: devicesQueryData.meta?.pagination?.total || deviceIds.length };
}

async function collectIntuneData(credentials: IntuneCredentials, userId: string, supabaseAdmin: any) {
  console.log('[Intune] Collecting data...');

  // Get OAuth2 token from Azure AD
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(credentials.clientId)}&client_secret=${encodeURIComponent(credentials.clientSecret)}&scope=https://graph.microsoft.com/.default&grant_type=client_credentials`,
  });
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Collect managed devices
  const devicesResponse = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$top=100', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'ConsistencyLevel': 'eventual',
    },
  });
  const devicesData = await devicesResponse.json();

  for (const device of devicesData.value || []) {
    await supabaseAdmin.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'intune',
      resource_type: 'devices',
      resource_id: device.id,
      resource_data: {
        deviceName: device.deviceName,
        managedDeviceOwnerType: device.managedDeviceOwnerType,
        enrolledDateTime: device.enrolledDateTime,
        lastSyncDateTime: device.lastSyncDateTime,
        operatingSystem: device.operatingSystem,
        osVersion: device.osVersion,
        complianceState: device.complianceState,
        jailBroken: device.jailBroken,
        managementAgent: device.managementAgent,
        model: device.model,
        manufacturer: device.manufacturer,
        serialNumber: device.serialNumber,
        userPrincipalName: device.userPrincipalName,
        emailAddress: device.emailAddress,
        isEncrypted: device.isEncrypted,
        isSupervised: device.isSupervised,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
  }

  const totalDevices = devicesData['@odata.count'] || devicesData.value?.length || 0;
  console.log('[Intune] Collected devices:', totalDevices);
  return { devices: totalDevices };
}

// =============================================================================
// Provider Test Functions (used for connection validation)
// =============================================================================

async function testCloudflareConnection(credentials: CloudflareCredentials) {
  console.log('[Cloudflare] Testing connection...');
  
  const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
    headers: {
      'X-Auth-Email': credentials.email,
      'Authorization': `Bearer ${credentials.apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMessage = data.errors?.[0]?.message || 'Credenciais inválidas';
    throw new Error(errorMessage);
  }

  console.log('[Cloudflare] Connection successful, zones found:', data.result?.length);
  return { success: true, resources: { zones: data.result?.length || 0 } };
}

async function testJiraConnection(credentials: JiraCredentials) {
  console.log('[Jira] Testing connection...');
  
  const auth = btoa(`${credentials.email}:${credentials.apiToken}`);
  const domain = credentials.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  const response = await fetch(`https://${domain}/rest/api/3/myself`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' },
  });

  if (!response.ok) throw new Error(`Falha na autenticação Jira: ${response.status}`);
  const userData = await response.json();
  
  const projectsResponse = await fetch(`https://${domain}/rest/api/3/project/search?maxResults=100`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' },
  });
  const projectsData = projectsResponse.ok ? await projectsResponse.json() : { total: 0 };

  console.log('[Jira] Connection successful, user:', userData.displayName);
  return { success: true, resources: { user: userData.displayName, projects: projectsData.total || projectsData.values?.length || 0 } };
}

async function testGitHubConnection(credentials: GitHubCredentials) {
  console.log('[GitHub] Testing connection...');
  
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${credentials.personalAccessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Token inválido');
  }

  const userData = await response.json();
  console.log('[GitHub] Connection successful, user:', userData.login);
  return { success: true, resources: { user: userData.login, repos: userData.public_repos || 0 } };
}

async function testGitLabConnection(credentials: GitLabCredentials) {
  console.log('[GitLab] Testing connection...');
  
  const domain = credentials.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = domain.includes('gitlab.com') ? 'https://gitlab.com' : `https://${domain}`;
  
  const response = await fetch(`${baseUrl}/api/v4/user`, {
    headers: { 'PRIVATE-TOKEN': credentials.accessToken },
  });

  if (!response.ok) throw new Error('Token inválido ou expirado');
  const userData = await response.json();
  
  const projectsResponse = await fetch(`${baseUrl}/api/v4/projects?membership=true&per_page=1`, {
    headers: { 'PRIVATE-TOKEN': credentials.accessToken },
  });
  const totalHeader = projectsResponse.headers.get('x-total');

  console.log('[GitLab] Connection successful, user:', userData.username);
  return { success: true, resources: { user: userData.username, projects: totalHeader ? parseInt(totalHeader) : 0 } };
}

async function testSlackConnection(credentials: SlackCredentials) {
  console.log('[Slack] Testing connection...');
  
  const response = await fetch('https://slack.com/api/auth.test', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${credentials.botToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Token inválido');

  console.log('[Slack] Connection successful, team:', data.team);
  return { success: true, resources: { team: data.team, user: data.user } };
}

async function testBambooHRConnection(credentials: BambooHRCredentials) {
  console.log('[BambooHR] Testing connection...');
  
  const subdomain = credentials.subdomain.replace(/\.bamboohr\.com$/, '').trim();
  const auth = btoa(`${credentials.apiKey}:x`);
  
  const response = await fetch(`https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' },
  });

  if (!response.ok) throw new Error(`Credenciais inválidas: ${response.status}`);
  const data = await response.json();

  console.log('[BambooHR] Connection successful, employees found:', data.employees?.length);
  return { success: true, resources: { employees: data.employees?.length || 0 } };
}

async function testCrowdStrikeConnection(credentials: CrowdStrikeCredentials) {
  console.log('[CrowdStrike] Testing connection...');
  
  const baseUrl = credentials.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  const tokenResponse = await fetch(`https://${baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(credentials.clientId)}&client_secret=${encodeURIComponent(credentials.clientSecret)}`,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}));
    throw new Error(errorData.errors?.[0]?.message || 'Credenciais inválidas');
  }

  const tokenData = await tokenResponse.json();
  const devicesResponse = await fetch(`https://${baseUrl}/devices/queries/devices/v1?limit=1`, {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });

  if (!devicesResponse.ok) throw new Error('Falha ao consultar dispositivos');
  const devicesData = await devicesResponse.json();

  console.log('[CrowdStrike] Connection successful, total devices:', devicesData.meta?.pagination?.total);
  return { success: true, resources: { hosts: devicesData.meta?.pagination?.total || 0 } };
}

async function testIntuneConnection(credentials: IntuneCredentials) {
  console.log('[Intune] Testing connection...');
  
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(credentials.clientId)}&client_secret=${encodeURIComponent(credentials.clientSecret)}&scope=https://graph.microsoft.com/.default&grant_type=client_credentials`,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Credenciais inválidas');
  }

  const tokenData = await tokenResponse.json();
  const devicesResponse = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$top=1&$count=true', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'ConsistencyLevel': 'eventual' },
  });

  if (!devicesResponse.ok) {
    const errorData = await devicesResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Falha ao consultar dispositivos');
  }

  const devicesData = await devicesResponse.json();
  console.log('[Intune] Connection successful, devices:', devicesData['@odata.count'] || devicesData.value?.length);
  return { success: true, resources: { devices: devicesData['@odata.count'] || devicesData.value?.length || 0 } };
}

async function testAzureADConnection(credentials: AzureADCredentials) {
  console.log('[Azure AD] Testing connection...');
  
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(credentials.clientId)}&client_secret=${encodeURIComponent(credentials.clientSecret)}&scope=https://graph.microsoft.com/.default&grant_type=client_credentials`,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Credenciais inválidas');
  }

  const tokenData = await tokenResponse.json();
  
  // Test /users endpoint
  const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=1&$count=true', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'ConsistencyLevel': 'eventual' },
  });

  if (!usersResponse.ok) {
    const errorData = await usersResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Falha ao consultar usuários - verifique permissões User.Read.All');
  }

  const usersData = await usersResponse.json();
  
  // Test /groups endpoint
  const groupsResponse = await fetch('https://graph.microsoft.com/v1.0/groups?$top=1&$count=true', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'ConsistencyLevel': 'eventual' },
  });
  const groupsData = groupsResponse.ok ? await groupsResponse.json() : { value: [] };

  console.log('[Azure AD] Connection successful, users:', usersData['@odata.count'] || usersData.value?.length, 'groups:', groupsData['@odata.count'] || groupsData.value?.length);
  return { 
    success: true, 
    resources: { 
      users: usersData['@odata.count'] || usersData.value?.length || 0,
      groups: groupsData['@odata.count'] || groupsData.value?.length || 0
    } 
  };
}

async function collectAzureADData(credentials: AzureADCredentials, userId: string, supabaseAdmin: any) {
  console.log('[Azure AD] Collecting data...');

  // Get OAuth2 token from Azure AD
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(credentials.clientId)}&client_secret=${encodeURIComponent(credentials.clientSecret)}&scope=https://graph.microsoft.com/.default&grant_type=client_credentials`,
  });
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  let usersCollected = 0;
  let groupsCollected = 0;
  let policiesCollected = 0;

  // Collect users
  const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=100&$select=id,displayName,mail,userPrincipalName,accountEnabled,userType,createdDateTime,signInActivity', {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'ConsistencyLevel': 'eventual' },
  });
  const usersData = await usersResponse.json();

  for (const user of usersData.value || []) {
    const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'azure-ad',
      resource_type: 'users',
      resource_id: user.id,
      resource_data: {
        displayName: user.displayName,
        mail: user.mail,
        userPrincipalName: user.userPrincipalName,
        accountEnabled: user.accountEnabled,
        userType: user.userType,
        createdDateTime: user.createdDateTime,
        lastSignInDateTime: user.signInActivity?.lastSignInDateTime,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    
    if (!error) usersCollected++;
  }

  // Collect groups
  const groupsResponse = await fetch('https://graph.microsoft.com/v1.0/groups?$top=100&$select=id,displayName,description,mailEnabled,securityEnabled,groupTypes,createdDateTime', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const groupsData = await groupsResponse.json();

  for (const group of groupsData.value || []) {
    const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
      user_id: userId,
      integration_name: 'azure-ad',
      resource_type: 'groups',
      resource_id: group.id,
      resource_data: {
        displayName: group.displayName,
        description: group.description,
        mailEnabled: group.mailEnabled,
        securityEnabled: group.securityEnabled,
        groupTypes: group.groupTypes,
        createdDateTime: group.createdDateTime,
      },
      collected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    
    if (!error) groupsCollected++;
  }

  // Collect conditional access policies
  try {
    const policiesResponse = await fetch('https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (policiesResponse.ok) {
      const policiesData = await policiesResponse.json();
      
      for (const policy of policiesData.value || []) {
        const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'azure-ad',
          resource_type: 'conditional_access_policies',
          resource_id: policy.id,
          resource_data: {
            displayName: policy.displayName,
            state: policy.state,
            createdDateTime: policy.createdDateTime,
            modifiedDateTime: policy.modifiedDateTime,
            conditions: policy.conditions,
            grantControls: policy.grantControls,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
        
        if (!error) policiesCollected++;
      }
    }
  } catch (e) {
    console.log('[Azure AD] Could not fetch conditional access policies (may require Policy.Read.All permission)');
  }

  console.log('[Azure AD] Collected users:', usersCollected, 'groups:', groupsCollected, 'policies:', policiesCollected);
  return { users: usersCollected, groups: groupsCollected, policies: policiesCollected };
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, credentials, name, testOnly } = await req.json();

    console.log(`[save-integration-credentials] Provider: ${provider}, testOnly: ${testOnly}`);

    // 1. Validate user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting - bypass for service_role (internal calls)
    if (!isServiceRole(authHeader)) {
      const supabaseTemp = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user: tempUser } } = await supabaseTemp.auth.getUser();
      const rateLimitId = tempUser?.id || req.headers.get('x-forwarded-for') || 'anonymous';

      const rateLimit = await checkRateLimit(rateLimitId, 'save-integration-credentials', 10, 60);
      if (!rateLimit.allowed) {
        return rateLimitExceededResponse(rateLimit, corsHeaders);
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('[save-integration-credentials] Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[save-integration-credentials] User authenticated: ${user.id}`);

    // 2. Test connection with the provider
    let testResult;
    
    switch (provider) {
      case 'cloudflare':
        testResult = await testCloudflareConnection(credentials as CloudflareCredentials);
        break;
      case 'jira':
        testResult = await testJiraConnection(credentials as JiraCredentials);
        break;
      case 'github':
        testResult = await testGitHubConnection(credentials as GitHubCredentials);
        break;
      case 'gitlab':
        testResult = await testGitLabConnection(credentials as GitLabCredentials);
        break;
      case 'slack':
        testResult = await testSlackConnection(credentials as SlackCredentials);
        break;
      case 'bamboohr':
        testResult = await testBambooHRConnection(credentials as BambooHRCredentials);
        break;
      case 'crowdstrike':
        testResult = await testCrowdStrikeConnection(credentials as CrowdStrikeCredentials);
        break;
      case 'intune':
        testResult = await testIntuneConnection(credentials as IntuneCredentials);
        break;
      case 'azure-ad':
        testResult = await testAzureADConnection(credentials as AzureADCredentials);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Provider '${provider}' não suportado` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // 3. If only testing, return the result
    if (testOnly) {
      console.log(`[save-integration-credentials] Test only mode, returning result`);
      return new Response(
        JSON.stringify({ success: true, message: 'Conexão testada com sucesso', resources: testResult.resources }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Encrypt credentials before saving
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('[save-integration-credentials] TOKEN_ENCRYPTION_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Chave de criptografia não configurada no servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encryptedCredentials: Record<string, string> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === 'string' && value.length > 0) {
        encryptedCredentials[key] = await encryptToken(value, encryptionKey);
      }
    }

    console.log(`[save-integration-credentials] Credentials encrypted, saving to database`);

    // 5. Save to database using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Save to integrations table (use 'connected' status to match sync-integration-data query)
    const { error: saveError } = await supabaseAdmin
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: provider,
        name: name || `${provider} Integration`,
        configuration: encryptedCredentials,
        status: 'connected',
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider', ignoreDuplicates: false });

    if (saveError) {
      console.error('[save-integration-credentials] Save error:', JSON.stringify(saveError));
      
      // Fallback: try inserting if upsert fails
      const { error: insertError } = await supabaseAdmin
        .from('integrations')
        .insert({
          user_id: user.id,
          provider: provider,
          name: name || `${provider} Integration`,
          configuration: encryptedCredentials,
          status: 'connected',
          last_sync_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[save-integration-credentials] Insert error:', JSON.stringify(insertError));
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao salvar integração no banco de dados' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Collect and persist full data from the provider
    console.log(`[save-integration-credentials] Collecting data for provider: ${provider}`);
    
    let collectedResources = testResult.resources;
    
    try {
      switch (provider) {
        case 'cloudflare':
          collectedResources = await collectCloudflareData(credentials as CloudflareCredentials, user.id, supabaseAdmin);
          break;
        case 'jira':
          collectedResources = await collectJiraData(credentials as JiraCredentials, user.id, supabaseAdmin);
          break;
        case 'github':
          collectedResources = await collectGitHubData(credentials as GitHubCredentials, user.id, supabaseAdmin);
          break;
        case 'gitlab':
          collectedResources = await collectGitLabData(credentials as GitLabCredentials, user.id, supabaseAdmin);
          break;
        case 'slack':
          collectedResources = await collectSlackData(credentials as SlackCredentials, user.id, supabaseAdmin);
          break;
        case 'bamboohr':
          collectedResources = await collectBambooHRData(credentials as BambooHRCredentials, user.id, supabaseAdmin);
          break;
        case 'crowdstrike':
          collectedResources = await collectCrowdStrikeData(credentials as CrowdStrikeCredentials, user.id, supabaseAdmin);
          break;
        case 'intune':
          collectedResources = await collectIntuneData(credentials as IntuneCredentials, user.id, supabaseAdmin);
          break;
        case 'azure-ad':
          collectedResources = await collectAzureADData(credentials as AzureADCredentials, user.id, supabaseAdmin);
          break;
      }
      console.log(`[save-integration-credentials] Data collection completed for ${provider}`);
    } catch (collectError) {
      console.error(`[save-integration-credentials] Data collection error for ${provider}:`, collectError);
      // Don't fail the request if data collection fails, credentials are already saved
    }

    // 7. Update integration_status table
    const { error: statusError } = await supabaseAdmin
      .from('integration_status')
      .upsert({
        user_id: user.id,
        integration_name: provider,
        status: 'healthy',
        health_score: 100,
        last_sync_at: new Date().toISOString(),
        metadata: collectedResources,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name', ignoreDuplicates: false });

    if (statusError) {
      console.error('[save-integration-credentials] Status update error:', statusError);
    }

    console.log(`[save-integration-credentials] Integration saved successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Integração conectada com sucesso',
        resources: collectedResources,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[save-integration-credentials] Error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao processar requisição' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
