/**
 * Azure Integration Edge Function
 * 
 * Esta função usa OAuth 2.0 com Azure usando Supabase Secrets.
 * PERSISTE dados coletados no banco de dados Supabase.
 * 
 * SECRETS NECESSÁRIAS (configurar no Supabase Dashboard):
 * - AZURE_TENANT_ID
 * - AZURE_CLIENT_ID
 * - AZURE_CLIENT_SECRET
 * - AZURE_SUBSCRIPTION_ID
 * 
 * IMPORTANTE:
 * - Esta função usa OAuth 2.0 Client Credentials Flow
 * - Tokens de acesso são obtidos dinamicamente (não armazenados)
 * - NUNCA exponha credenciais ou tokens no frontend
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Azure Integration: Starting request');

    // Criar cliente Supabase
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

    // Buscar credenciais dos Supabase Secrets
    const tenantId = Deno.env.get('AZURE_TENANT_ID');
    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
    const subscriptionId = Deno.env.get('AZURE_SUBSCRIPTION_ID');

    // Validar credenciais
    if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
      console.error('Azure Integration: Missing required credentials');
      const missing = [];
      if (!tenantId) missing.push('AZURE_TENANT_ID');
      if (!clientId) missing.push('AZURE_CLIENT_ID');
      if (!clientSecret) missing.push('AZURE_CLIENT_SECRET');
      if (!subscriptionId) missing.push('AZURE_SUBSCRIPTION_ID');
      
      console.error(`Azure Integration: Missing secrets: ${missing.join(', ')}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Azure credentials not configured',
          missing,
          instructions: 'Go to Supabase Dashboard > Settings > Edge Functions > Secrets'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Azure Integration: Credentials loaded successfully');

    // Obter token OAuth 2.0
    console.log('Azure Integration: Requesting OAuth token...');
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://management.azure.com/.default',
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Azure Integration: Failed to obtain token', errorText);
      throw new Error(`Failed to obtain Azure token: ${tokenResponse.status}`);
    }

    const { access_token, expires_in } = await tokenResponse.json();
    console.log(`Azure Integration: Token obtained successfully (expires in ${expires_in}s)`);

    // Coletar recursos do Azure
    console.log('Azure Integration: Collecting Azure resources...');
    const resourcesUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01`;
    const resourcesResponse = await fetch(resourcesUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resourcesResponse.ok) {
      const errorText = await resourcesResponse.text();
      console.error('Azure Integration: Failed to fetch resources', errorText);
      throw new Error(`Failed to fetch Azure resources: ${resourcesResponse.status}`);
    }

    const resources = await resourcesResponse.json();
    console.log(`Azure Integration: Found ${resources.value?.length || 0} resources`);

    // Coletar Resource Groups
    console.log('Azure Integration: Collecting Resource Groups...');
    const rgUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2021-04-01`;
    const rgResponse = await fetch(rgUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const resourceGroups = await rgResponse.json();
    console.log(`Azure Integration: Found ${resourceGroups.value?.length || 0} resource groups`);

    // Persistir dados no banco se temos usuário autenticado
    if (authUserId) {
      console.log('Azure Integration: Persisting data...');

      // Salvar recursos
      for (const resource of (resources.value || [])) {
        await supabase.from('integration_collected_data').upsert({
          user_id: authUserId,
          integration_name: 'azure',
          resource_type: 'resources',
          resource_id: resource.id,
          resource_data: {
            name: resource.name,
            type: resource.type,
            location: resource.location,
            resourceGroup: resource.id.split('/')[4],
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      }

      // Salvar resource groups
      for (const rg of (resourceGroups.value || [])) {
        await supabase.from('integration_collected_data').upsert({
          user_id: authUserId,
          integration_name: 'azure',
          resource_type: 'resource_groups',
          resource_id: rg.id,
          resource_data: {
            name: rg.name,
            location: rg.location,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
      }

      // Atualizar status da integração
      await supabase.from('integration_status').upsert({
        user_id: authUserId,
        integration_name: 'azure',
        status: 'healthy',
        health_score: 100,
        last_sync_at: new Date().toISOString(),
        metadata: {
          subscription: subscriptionId,
          resources_count: resources.value?.length || 0,
          resource_groups_count: resourceGroups.value?.length || 0,
        },
      }, { onConflict: 'user_id,integration_name' });

      console.log('Azure Integration: Data persisted successfully');
    }

    // Compilar evidências para resposta
    const evidence = {
      timestamp: new Date().toISOString(),
      subscription: subscriptionId,
      resources: {
        total: resources.value?.length || 0,
        byType: resources.value?.reduce((acc: any, r: any) => {
          const type = r.type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        list: resources.value?.map((r: any) => ({
          name: r.name,
          type: r.type,
          location: r.location,
          resourceGroup: r.id.split('/')[4],
        })) || [],
      },
      resourceGroups: {
        total: resourceGroups.value?.length || 0,
        list: resourceGroups.value?.map((rg: any) => ({
          name: rg.name,
          location: rg.location,
        })) || [],
      },
    };

    console.log('Azure Integration: Evidence collected successfully');

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
    console.error('Azure Integration Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to Azure',
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
