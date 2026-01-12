/**
 * Okta Integration Edge Function
 * 
 * Esta função coleta dados do Okta e persiste no banco de dados.
 * Aceita credenciais via request body OU usa Supabase Secrets como fallback.
 * 
 * AUTENTICAÇÃO:
 * - Prioridade 1: Credenciais enviadas no body (domain, apiToken)
 * - Prioridade 2: Secrets do Supabase (OKTA_DOMAIN, OKTA_API_TOKEN)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Get auth user from JWT
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id ?? null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for credentials
    const body = await req.json().catch(() => ({}));
    
    // Priority: body credentials > env secrets
    const oktaDomain = body.domain || Deno.env.get('OKTA_DOMAIN');
    const oktaApiToken = body.apiToken || Deno.env.get('OKTA_API_TOKEN');

    // Validate credentials
    if (!oktaDomain || !oktaApiToken) {
      console.error('Okta Integration: Missing required credentials');
      const missing = [];
      if (!oktaDomain) missing.push('domain');
      if (!oktaApiToken) missing.push('apiToken');
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Okta credentials not provided',
          missing,
          instructions: 'Provide domain and apiToken in request body or configure OKTA_DOMAIN and OKTA_API_TOKEN secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean domain (remove https:// if present)
    const cleanDomain = oktaDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    console.log(`Okta Integration: Using domain ${cleanDomain}`);

    // Create auth headers
    const oktaHeaders = {
      'Authorization': `SSWS ${oktaApiToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Collect users
    console.log('Okta Integration: Collecting users...');
    const usersUrl = `https://${cleanDomain}/api/v1/users?limit=200`;
    const usersResponse = await fetch(usersUrl, { headers: oktaHeaders });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('Okta Integration: Failed to fetch users', errorText);
      
      if (usersResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid API Token',
            message: 'The provided API Token is invalid or expired'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Okta API error: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    console.log(`Okta Integration: Found ${users.length} users`);

    // Collect groups
    console.log('Okta Integration: Collecting groups...');
    const groupsUrl = `https://${cleanDomain}/api/v1/groups?limit=200`;
    const groupsResponse = await fetch(groupsUrl, { headers: oktaHeaders });
    const groups = groupsResponse.ok ? await groupsResponse.json() : [];
    console.log(`Okta Integration: Found ${groups.length} groups`);

    // Collect applications
    console.log('Okta Integration: Collecting applications...');
    const appsUrl = `https://${cleanDomain}/api/v1/apps?limit=200`;
    const appsResponse = await fetch(appsUrl, { headers: oktaHeaders });
    const apps = appsResponse.ok ? await appsResponse.json() : [];
    console.log(`Okta Integration: Found ${apps.length} applications`);

    // Collect authentication policies
    console.log('Okta Integration: Collecting authentication policies...');
    const policiesUrl = `https://${cleanDomain}/api/v1/policies?type=OKTA_SIGN_ON`;
    const policiesResponse = await fetch(policiesUrl, { headers: oktaHeaders });
    const policies = policiesResponse.ok ? await policiesResponse.json() : [];
    console.log(`Okta Integration: Found ${policies.length} authentication policies`);

    // Create Supabase admin client for data persistence
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Persist users
    console.log('Okta Integration: Persisting users...');
    for (const user of users) {
      const userData = {
        id: user.id,
        email: user.profile?.email,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        status: user.status,
        created: user.created,
        lastLogin: user.lastLogin,
      };

      await supabaseAdmin.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'okta',
        resource_type: 'users',
        resource_id: user.id,
        resource_data: userData,
        collected_at: new Date().toISOString()
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }

    // Persist groups
    console.log('Okta Integration: Persisting groups...');
    for (const group of groups) {
      const groupData = {
        id: group.id,
        name: group.profile?.name,
        description: group.profile?.description,
      };

      await supabaseAdmin.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'okta',
        resource_type: 'groups',
        resource_id: group.id,
        resource_data: groupData,
        collected_at: new Date().toISOString()
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }

    // Persist applications
    console.log('Okta Integration: Persisting applications...');
    for (const app of apps) {
      const appData = {
        id: app.id,
        name: app.name,
        label: app.label,
        status: app.status,
      };

      await supabaseAdmin.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'okta',
        resource_type: 'applications',
        resource_id: app.id,
        resource_data: appData,
        collected_at: new Date().toISOString()
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }

    // Persist policies
    console.log('Okta Integration: Persisting policies...');
    for (const policy of policies) {
      const policyData = {
        id: policy.id,
        name: policy.name,
        status: policy.status,
        priority: policy.priority,
      };

      await supabaseAdmin.from('integration_collected_data').upsert({
        user_id: userId,
        integration_name: 'okta',
        resource_type: 'policies',
        resource_id: policy.id,
        resource_data: policyData,
        collected_at: new Date().toISOString()
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }

    // Update integration status
    console.log('Okta Integration: Updating integration status...');
    await supabaseAdmin.from('integration_status').upsert({
      user_id: userId,
      integration_name: 'okta',
      status: 'healthy',
      health_score: 100,
      last_sync_at: new Date().toISOString(),
      metadata: {
        domain: cleanDomain,
        users_count: users.length,
        groups_count: groups.length,
        apps_count: apps.length,
        policies_count: policies.length,
        active_users: users.filter((u: any) => u.status === 'ACTIVE').length,
        suspended_users: users.filter((u: any) => u.status === 'SUSPENDED').length,
      }
    }, { onConflict: 'user_id,integration_name' });

    // Compile evidence response
    const evidence = {
      timestamp: new Date().toISOString(),
      domain: cleanDomain,
      users: {
        total: users.length,
        active: users.filter((u: any) => u.status === 'ACTIVE').length,
        suspended: users.filter((u: any) => u.status === 'SUSPENDED').length,
        deprovisioned: users.filter((u: any) => u.status === 'DEPROVISIONED').length,
        list: users.map((u: any) => ({
          id: u.id,
          email: u.profile?.email,
          firstName: u.profile?.firstName,
          lastName: u.profile?.lastName,
          status: u.status,
          created: u.created,
          lastLogin: u.lastLogin,
        })),
      },
      groups: {
        total: groups.length,
        list: groups.map((g: any) => ({
          id: g.id,
          name: g.profile?.name,
          description: g.profile?.description,
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

    console.log('Okta Integration: Evidence collected and persisted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: evidence 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Okta Integration Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
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
