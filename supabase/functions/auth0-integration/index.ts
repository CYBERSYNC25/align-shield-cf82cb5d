/**
 * Auth0 Integration Edge Function
 * 
 * Coleta evidências de identidade e acesso via Auth0 Management API.
 * PERSISTE dados no banco de dados Supabase para uso em todo o software.
 * 
 * SECRETS NECESSÁRIAS (configurar no Supabase Dashboard):
 * - AUTH0_DOMAIN (ex: dev-xxxxx.us.auth0.com)
 * - AUTH0_CLIENT_ID
 * - AUTH0_CLIENT_SECRET
 * 
 * Autenticação: OAuth 2.0 Client Credentials Flow
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Auth0User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  created_at: string;
  last_login: string;
  logins_count: number;
  email_verified: boolean;
  blocked: boolean;
  identities: Array<{
    provider: string;
    connection: string;
  }>;
}

interface Auth0Connection {
  id: string;
  name: string;
  strategy: string;
  enabled_clients: string[];
}

interface Auth0Client {
  client_id: string;
  name: string;
  description: string;
  app_type: string;
  is_first_party: boolean;
}

interface Auth0Action {
  id: string;
  name: string;
  supported_triggers: Array<{ id: string }>;
  status: string;
  created_at: string;
}

interface Auth0ActionsResponse {
  actions: Auth0Action[];
  total: number;
  per_page: number;
  page: number;
}

async function getManagementToken(domain: string, clientId: string, clientSecret: string): Promise<string> {
  console.log('Auth0: Obtaining Management API token...');
  
  const tokenUrl = `https://${domain}/oauth/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Auth0: Failed to get token', errorText);
    throw new Error(`Failed to obtain Management API token: ${response.status}`);
  }

  const data = await response.json();
  console.log('Auth0: Token obtained successfully');
  return data.access_token;
}

async function fetchAuth0Resource<T>(
  domain: string, 
  token: string, 
  endpoint: string
): Promise<T[]> {
  const url = `https://${domain}/api/v2${endpoint}`;
  console.log(`Auth0: Fetching ${endpoint}...`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`Auth0: Failed to fetch ${endpoint}:`, errorText);
    return [];
  }

  return response.json();
}

async function fetchAuth0Actions(
  domain: string, 
  token: string
): Promise<Auth0Action[]> {
  const url = `https://${domain}/api/v2/actions/actions`;
  console.log('Auth0: Fetching actions...');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('Auth0: Failed to fetch actions:', errorText);
    return [];
  }

  const data: Auth0ActionsResponse = await response.json();
  return data.actions || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auth0 Integration: Starting request');

    // Criar cliente Supabase com service role para persistir dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter usuário autenticado
    const authHeader = req.headers.get('authorization');
    let authUserId: string | null = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      authUserId = user?.id || null;
    }

    // Try to get credentials from request body first, then fall back to env secrets
    let body: { domain?: string; clientId?: string; clientSecret?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, will use env variables
    }

    // Priority: body > env
    const auth0Domain = body.domain || Deno.env.get('AUTH0_DOMAIN');
    const auth0ClientId = body.clientId || Deno.env.get('AUTH0_CLIENT_ID');
    const auth0ClientSecret = body.clientSecret || Deno.env.get('AUTH0_CLIENT_SECRET');

    // Validate credentials
    if (!auth0Domain || !auth0ClientId || !auth0ClientSecret) {
      const missing = [];
      if (!auth0Domain) missing.push('domain');
      if (!auth0ClientId) missing.push('clientId');
      if (!auth0ClientSecret) missing.push('clientSecret');
      
      console.error(`Auth0 Integration: Missing credentials: ${missing.join(', ')}`);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Credenciais Auth0 não fornecidas',
          missing,
          instructions: 'Forneça domain, clientId e clientSecret'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Auth0 Integration: Using domain ${auth0Domain}`);

    // Get Management API token
    const token = await getManagementToken(auth0Domain, auth0ClientId, auth0ClientSecret);

    // Fetch all resources in parallel
    const [users, connections, clients, actions] = await Promise.all([
      fetchAuth0Resource<Auth0User>(auth0Domain, token, '/users?per_page=100'),
      fetchAuth0Resource<Auth0Connection>(auth0Domain, token, '/connections'),
      fetchAuth0Resource<Auth0Client>(auth0Domain, token, '/clients'),
      fetchAuth0Actions(auth0Domain, token),
    ]);

    console.log(`Auth0 Integration: Found ${users.length} users, ${connections.length} connections, ${clients.length} clients, ${actions.length} actions`);

    // Se temos usuário autenticado, persistir dados no banco
    if (authUserId) {
      console.log(`Auth0 Integration: Persisting data for user ${authUserId}`);

      // Salvar usuários
      for (const user of users) {
        await supabase.from('integration_collected_data').upsert({
          user_id: authUserId,
          integration_name: 'auth0',
          resource_type: 'users',
          resource_id: user.user_id,
          resource_data: {
            email: user.email,
            name: user.name,
            picture: user.picture,
            emailVerified: user.email_verified,
            blocked: user.blocked,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            loginsCount: user.logins_count,
            providers: user.identities?.map(i => i.provider) || [],
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      }

      // Salvar aplicações
      for (const client of clients) {
        await supabase.from('integration_collected_data').upsert({
          user_id: authUserId,
          integration_name: 'auth0',
          resource_type: 'applications',
          resource_id: client.client_id,
          resource_data: {
            name: client.name,
            description: client.description,
            type: client.app_type,
            isFirstParty: client.is_first_party,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      }

      // Salvar conexões
      for (const connection of connections) {
        await supabase.from('integration_collected_data').upsert({
          user_id: authUserId,
          integration_name: 'auth0',
          resource_type: 'connections',
          resource_id: connection.id,
          resource_data: {
            name: connection.name,
            strategy: connection.strategy,
            enabledClients: connection.enabled_clients?.length || 0,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      }

      // Salvar actions
      for (const action of actions) {
        await supabase.from('integration_collected_data').upsert({
          user_id: authUserId,
          integration_name: 'auth0',
          resource_type: 'actions',
          resource_id: action.id,
          resource_data: {
            name: action.name,
            triggers: action.supported_triggers?.map(t => t.id) || [],
            status: action.status,
            createdAt: action.created_at,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      }

      // Atualizar status da integração
      await supabase.from('integration_status').upsert({
        user_id: authUserId,
        integration_name: 'auth0',
        status: 'healthy',
        health_score: 100,
        last_sync_at: new Date().toISOString(),
        metadata: {
          domain: auth0Domain,
          users_count: users.length,
          apps_count: clients.length,
          connections_count: connections.length,
          actions_count: actions.length,
        },
      }, { onConflict: 'user_id,integration_name' });

      console.log('Auth0 Integration: Data persisted successfully');
    }

    // Compile evidence for response
    const evidence = {
      timestamp: new Date().toISOString(),
      domain: auth0Domain,
      users: {
        total: users.length,
        verified: users.filter(u => u.email_verified).length,
        blocked: users.filter(u => u.blocked).length,
        withMfa: 0,
        list: users.map(u => ({
          id: u.user_id,
          email: u.email,
          name: u.name,
          picture: u.picture,
          emailVerified: u.email_verified,
          blocked: u.blocked,
          createdAt: u.created_at,
          lastLogin: u.last_login,
          loginsCount: u.logins_count,
          providers: u.identities?.map(i => i.provider) || [],
        })),
      },
      connections: {
        total: connections.length,
        list: connections.map(c => ({
          id: c.id,
          name: c.name,
          strategy: c.strategy,
          enabledClients: c.enabled_clients?.length || 0,
        })),
      },
      applications: {
        total: clients.length,
        firstParty: clients.filter(c => c.is_first_party).length,
        list: clients.map(c => ({
          id: c.client_id,
          name: c.name,
          description: c.description,
          type: c.app_type,
          isFirstParty: c.is_first_party,
        })),
      },
      actions: {
        total: actions.length,
        deployed: actions.filter(a => a.status === 'built').length,
        list: actions.map(a => ({
          id: a.id,
          name: a.name,
          triggers: a.supported_triggers?.map(t => t.id) || [],
          status: a.status,
          createdAt: a.created_at,
        })),
      },
    };

    console.log('Auth0 Integration: Evidence collected successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: evidence,
        persisted: !!authUserId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Auth0 Integration Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to Auth0',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
