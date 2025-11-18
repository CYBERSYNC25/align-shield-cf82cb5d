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

    console.log('Testing Azure AD connection for user:', user.id);

    // Get stored tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('integration_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_name', 'azure_ad')
      .single();

    if (tokenError || !tokenData) {
      console.error('No Azure AD token found for user');
      return new Response(
        JSON.stringify({
          success: false,
          step: 'token_retrieval',
          error: 'Nenhuma conexão Azure AD encontrada',
          recommendation: 'Complete o fluxo de autenticação OAuth primeiro'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      console.log('Token expired, needs refresh');
      
      // Attempt to refresh token if refresh_token exists
      if (tokenData.refresh_token && tokenData.metadata?.tenant_id && tokenData.metadata?.client_id) {
        const refreshResponse = await fetch(
          `https://login.microsoftonline.com/${tokenData.metadata.tenant_id}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: tokenData.metadata.client_id,
              client_secret: tokenData.metadata.client_secret,
              grant_type: 'refresh_token',
              refresh_token: tokenData.refresh_token,
            }).toString()
          }
        );

        if (!refreshResponse.ok) {
          throw new Error('Falha ao renovar token. Reconecte a integração.');
        }

        const refreshData = await refreshResponse.json();
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

        // Update token
        await supabaseClient
          .from('integration_oauth_tokens')
          .update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || tokenData.refresh_token,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', tokenData.id);

        tokenData.access_token = refreshData.access_token;
      } else {
        throw new Error('Token expirado e sem refresh token disponível');
      }
    }

    // Call Microsoft Graph API /me endpoint
    console.log('Calling Microsoft Graph API /me endpoint');
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const graphData = await graphResponse.json();

    if (!graphResponse.ok) {
      console.error('Microsoft Graph API error:', graphData);
      
      let errorMessage = 'Erro ao acessar Microsoft Graph API';
      let recommendation = 'Verifique as permissões da aplicação';

      if (graphResponse.status === 401) {
        errorMessage = 'Token inválido ou expirado';
        recommendation = 'Reconecte a integração Azure AD';
      } else if (graphResponse.status === 403) {
        errorMessage = 'Permissões insuficientes';
        recommendation = 'Verifique se os escopos User.Read estão configurados';
      }

      // Log error event
      await supabaseClient
        .from('integration_webhooks')
        .insert({
          integration_name: 'azure_ad',
          event_type: 'test_failed',
          status: 'error',
          payload: {
            user_id: user.id,
            error: errorMessage,
            status_code: graphResponse.status,
            graph_error: graphData
          }
        });

      return new Response(
        JSON.stringify({
          success: false,
          step: 'graph_api_call',
          error: errorMessage,
          recommendation,
          details: graphData,
          status_code: graphResponse.status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: graphResponse.status,
        }
      );
    }

    // Success - log the event
    console.log('Azure AD connection test successful');
    await supabaseClient
      .from('integration_webhooks')
      .insert({
        integration_name: 'azure_ad',
        event_type: 'test_success',
        status: 'success',
        payload: {
          user_id: user.id,
          user_info: {
            displayName: graphData.displayName,
            userPrincipalName: graphData.userPrincipalName,
            mail: graphData.mail,
            id: graphData.id
          }
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        step: 'completed',
        message: 'Conexão validada com sucesso',
        user_info: {
          name: graphData.displayName || graphData.userPrincipalName,
          email: graphData.mail || graphData.userPrincipalName,
          id: graphData.id
        },
        token_status: {
          valid: true,
          expires_at: tokenData.expires_at,
          scopes: tokenData.scope
        },
        test_summary: {
          token_retrieval: '✓ Aprovado',
          token_validation: '✓ Aprovado',
          graph_api_call: '✓ Aprovado',
          user_data_retrieval: '✓ Aprovado'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in azure-test-connection:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        step: 'unknown',
        error: error.message,
        recommendation: 'Verifique os logs para mais detalhes'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
