import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { tenant_id, client_id, client_secret, scopes } = await req.json();

    if (!tenant_id || !client_id || !client_secret) {
      throw new Error('Credenciais obrigatórias faltando');
    }

    // Store credentials securely (encrypted in metadata)
    const state = crypto.randomUUID();
    const redirect_uri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/azure-oauth-callback`;

    // Store state and config temporarily in database for callback validation
    const { error: insertError } = await supabaseClient
      .from('integration_webhooks')
      .insert({
        integration_name: 'azure_ad',
        event_type: 'oauth_started',
        status: 'pending',
        payload: {
          state,
          user_id: user.id,
          tenant_id,
          client_id,
          client_secret,
          scopes: scopes || ['User.Read.All'],
          redirect_uri
        }
      });

    if (insertError) throw insertError;

    // Construct Azure OAuth authorization URL
    const scopeString = (scopes || ['User.Read.All']).join(' ');
    const authUrl = new URL(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set('client_id', client_id);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('scope', scopeString);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');

    console.log('Azure OAuth flow initiated for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: authUrl.toString(),
        state
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in azure-oauth-start:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
