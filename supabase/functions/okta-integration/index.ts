/**
 * Okta Integration Edge Function
 * 
 * Esta função demonstra o uso correto de API Token com Okta usando Supabase Secrets.
 * 
 * SECRETS NECESSÁRIAS (configurar no Supabase Dashboard):
 * - OKTA_DOMAIN (ex: dev-123456.okta.com)
 * - OKTA_API_TOKEN
 * 
 * IMPORTANTE:
 * - Esta função usa autenticação via SSWS (Okta Session Token)
 * - NUNCA exponha o API Token no frontend
 * - Sempre valide o formato do domain (sem https://)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Okta Integration: Starting request');

    // ✅ CORRETO: Buscar credenciais dos Supabase Secrets
    const oktaDomain = Deno.env.get('OKTA_DOMAIN');
    const oktaApiToken = Deno.env.get('OKTA_API_TOKEN');

    // Validar credenciais
    if (!oktaDomain || !oktaApiToken) {
      console.error('Okta Integration: Missing required credentials');
      const missing = [];
      if (!oktaDomain) missing.push('OKTA_DOMAIN');
      if (!oktaApiToken) missing.push('OKTA_API_TOKEN');
      
      console.error(`Okta Integration: Missing secrets: ${missing.join(', ')}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Okta credentials not configured',
          missing,
          instructions: 'Go to Supabase Dashboard > Settings > Edge Functions > Secrets'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Okta Integration: Using domain ${oktaDomain}`);

    // Criar headers de autenticação
    const oktaHeaders = {
      'Authorization': `SSWS ${oktaApiToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Coletar usuários do Okta
    console.log('Okta Integration: Collecting users...');
    const usersUrl = `https://${oktaDomain}/api/v1/users?limit=200`;
    const usersResponse = await fetch(usersUrl, { headers: oktaHeaders });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('Okta Integration: Failed to fetch users', errorText);
      throw new Error(`Okta API error: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    console.log(`Okta Integration: Found ${users.length} users`);

    // Coletar grupos
    console.log('Okta Integration: Collecting groups...');
    const groupsUrl = `https://${oktaDomain}/api/v1/groups?limit=200`;
    const groupsResponse = await fetch(groupsUrl, { headers: oktaHeaders });

    if (!groupsResponse.ok) {
      const errorText = await groupsResponse.text();
      console.error('Okta Integration: Failed to fetch groups', errorText);
      throw new Error(`Okta API error: ${groupsResponse.status}`);
    }

    const groups = await groupsResponse.json();
    console.log(`Okta Integration: Found ${groups.length} groups`);

    // Coletar aplicações
    console.log('Okta Integration: Collecting applications...');
    const appsUrl = `https://${oktaDomain}/api/v1/apps?limit=200`;
    const appsResponse = await fetch(appsUrl, { headers: oktaHeaders });

    const apps = await appsResponse.json();
    console.log(`Okta Integration: Found ${apps.length} applications`);

    // Coletar políticas de autenticação
    console.log('Okta Integration: Collecting authentication policies...');
    const policiesUrl = `https://${oktaDomain}/api/v1/policies?type=OKTA_SIGN_ON`;
    const policiesResponse = await fetch(policiesUrl, { headers: oktaHeaders });

    const policies = await policiesResponse.json();
    console.log(`Okta Integration: Found ${policies.length} authentication policies`);

    // Compilar evidências
    const evidence = {
      timestamp: new Date().toISOString(),
      domain: oktaDomain,
      users: {
        total: users.length,
        active: users.filter((u: any) => u.status === 'ACTIVE').length,
        suspended: users.filter((u: any) => u.status === 'SUSPENDED').length,
        deprovisioned: users.filter((u: any) => u.status === 'DEPROVISIONED').length,
        list: users.map((u: any) => ({
          id: u.id,
          email: u.profile.email,
          firstName: u.profile.firstName,
          lastName: u.profile.lastName,
          status: u.status,
          created: u.created,
          lastLogin: u.lastLogin,
        })),
      },
      groups: {
        total: groups.length,
        list: groups.map((g: any) => ({
          id: g.id,
          name: g.profile.name,
          description: g.profile.description,
        })),
      },
      applications: {
        total: apps.length,
        active: apps.filter((a: any) => a.status === 'ACTIVE').length,
        list: apps.map((a: any) => ({
          id: a.id,
          name: a.name,
          label: a.label,
          status: a.status,
        })),
      },
      policies: {
        total: policies.length,
        list: policies.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          priority: p.priority,
        })),
      },
    };

    console.log('Okta Integration: Evidence collected successfully');

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
    console.error('Okta Integration Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to Okta',
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
