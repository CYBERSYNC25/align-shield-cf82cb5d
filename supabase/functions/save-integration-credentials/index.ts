import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/crypto-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// Provider Test Functions
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

  return {
    success: true,
    resources: {
      zones: data.result?.length || 0,
    },
  };
}

async function testJiraConnection(credentials: JiraCredentials) {
  console.log('[Jira] Testing connection...');
  
  const auth = btoa(`${credentials.email}:${credentials.apiToken}`);
  const domain = credentials.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  const response = await fetch(`https://${domain}/rest/api/3/myself`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha na autenticação Jira: ${response.status}`);
  }

  const userData = await response.json();
  
  // Get project count
  const projectsResponse = await fetch(`https://${domain}/rest/api/3/project/search?maxResults=100`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
  });

  const projectsData = projectsResponse.ok ? await projectsResponse.json() : { total: 0 };

  console.log('[Jira] Connection successful, user:', userData.displayName);

  return {
    success: true,
    resources: {
      user: userData.displayName,
      projects: projectsData.total || projectsData.values?.length || 0,
    },
  };
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
  
  // Get repos count
  const reposResponse = await fetch('https://api.github.com/user/repos?per_page=1', {
    headers: {
      'Authorization': `Bearer ${credentials.personalAccessToken}`,
      'Accept': 'application/vnd.github+json',
    },
  });

  // Parse Link header for total count
  const linkHeader = reposResponse.headers.get('Link');
  let repoCount = 0;
  if (linkHeader) {
    const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
    repoCount = lastMatch ? parseInt(lastMatch[1]) : 0;
  }

  console.log('[GitHub] Connection successful, user:', userData.login);

  return {
    success: true,
    resources: {
      user: userData.login,
      repos: repoCount || userData.public_repos || 0,
    },
  };
}

async function testGitLabConnection(credentials: GitLabCredentials) {
  console.log('[GitLab] Testing connection...');
  
  const domain = credentials.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = domain.includes('gitlab.com') ? 'https://gitlab.com' : `https://${domain}`;
  
  const response = await fetch(`${baseUrl}/api/v4/user`, {
    headers: {
      'PRIVATE-TOKEN': credentials.accessToken,
    },
  });

  if (!response.ok) {
    throw new Error('Token inválido ou expirado');
  }

  const userData = await response.json();
  
  // Get projects count
  const projectsResponse = await fetch(`${baseUrl}/api/v4/projects?membership=true&per_page=1`, {
    headers: {
      'PRIVATE-TOKEN': credentials.accessToken,
    },
  });

  const totalHeader = projectsResponse.headers.get('x-total');
  const projectCount = totalHeader ? parseInt(totalHeader) : 0;

  console.log('[GitLab] Connection successful, user:', userData.username);

  return {
    success: true,
    resources: {
      user: userData.username,
      projects: projectCount,
    },
  };
}

async function testSlackConnection(credentials: SlackCredentials) {
  console.log('[Slack] Testing connection...');
  
  const response = await fetch('https://slack.com/api/auth.test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.botToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Token inválido');
  }

  // Get channels count
  const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=1', {
    headers: {
      'Authorization': `Bearer ${credentials.botToken}`,
    },
  });

  const channelsData = await channelsResponse.json();

  console.log('[Slack] Connection successful, team:', data.team);

  return {
    success: true,
    resources: {
      team: data.team,
      user: data.user,
      channels: channelsData.channels?.length || 0,
    },
  };
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
        JSON.stringify({
          success: true,
          message: 'Conexão testada com sucesso',
          resources: testResult.resources,
        }),
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

    // Save to integrations table
    const { error: saveError } = await supabaseAdmin
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: provider,
        name: name || `${provider} Integration`,
        configuration: encryptedCredentials,
        status: 'active',
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id,provider',
        ignoreDuplicates: false 
      });

    if (saveError) {
      console.error('[save-integration-credentials] Save error:', saveError);
      
      // Fallback: try inserting if upsert fails
      const { error: insertError } = await supabaseAdmin
        .from('integrations')
        .insert({
          user_id: user.id,
          provider: provider,
          name: name || `${provider} Integration`,
          configuration: encryptedCredentials,
          status: 'active',
          last_sync_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[save-integration-credentials] Insert error:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao salvar integração no banco de dados' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Update integration_status table
    const { error: statusError } = await supabaseAdmin
      .from('integration_status')
      .upsert({
        user_id: user.id,
        integration_name: provider,
        status: 'healthy',
        health_score: 100,
        last_sync_at: new Date().toISOString(),
        metadata: testResult.resources,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id,integration_name',
        ignoreDuplicates: false 
      });

    if (statusError) {
      console.error('[save-integration-credentials] Status update error:', statusError);
      // Don't fail the request if status update fails, just log
    }

    console.log(`[save-integration-credentials] Integration saved successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Integração conectada com sucesso',
        resources: testResult.resources,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[save-integration-credentials] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar requisição',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});