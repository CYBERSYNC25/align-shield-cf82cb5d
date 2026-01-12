/**
 * Auth0 Integration Edge Function
 * 
 * Coleta evidências de identidade e acesso via Auth0 Management API.
 * 
 * SECRETS NECESSÁRIAS (configurar no Supabase Dashboard):
 * - AUTH0_DOMAIN (ex: dev-xxxxx.us.auth0.com)
 * - AUTH0_CLIENT_ID
 * - AUTH0_CLIENT_SECRET
 * 
 * Autenticação: OAuth 2.0 Client Credentials Flow
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    // Return empty array for non-critical endpoints
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auth0 Integration: Starting request');

    // Get credentials from Supabase Secrets
    const auth0Domain = Deno.env.get('AUTH0_DOMAIN');
    const auth0ClientId = Deno.env.get('AUTH0_CLIENT_ID');
    const auth0ClientSecret = Deno.env.get('AUTH0_CLIENT_SECRET');

    // Validate credentials
    if (!auth0Domain || !auth0ClientId || !auth0ClientSecret) {
      const missing = [];
      if (!auth0Domain) missing.push('AUTH0_DOMAIN');
      if (!auth0ClientId) missing.push('AUTH0_CLIENT_ID');
      if (!auth0ClientSecret) missing.push('AUTH0_CLIENT_SECRET');
      
      console.error(`Auth0 Integration: Missing secrets: ${missing.join(', ')}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Auth0 credentials not configured',
          missing,
          instructions: 'Go to Supabase Dashboard > Settings > Edge Functions > Secrets'
        }),
        { 
          status: 500, 
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

    // Compile evidence
    const evidence = {
      timestamp: new Date().toISOString(),
      domain: auth0Domain,
      users: {
        total: users.length,
        verified: users.filter(u => u.email_verified).length,
        blocked: users.filter(u => u.blocked).length,
        withMfa: 0, // Would require additional API call
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
        data: evidence 
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
