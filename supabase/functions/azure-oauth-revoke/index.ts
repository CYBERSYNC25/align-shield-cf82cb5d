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

    console.log('Revoking Azure AD connection for user:', user.id);

    // Get token data
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('integration_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_name', 'azure_ad')
      .single();

    if (tokenError || !tokenData) {
      console.log('No Azure AD token found to revoke');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma conexão ativa encontrada'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Delete the token from database
    const { error: deleteError } = await supabaseClient
      .from('integration_oauth_tokens')
      .delete()
      .eq('id', tokenData.id);

    if (deleteError) {
      throw deleteError;
    }

    // Log the revocation
    await supabaseClient
      .from('integration_webhooks')
      .insert({
        integration_name: 'azure_ad',
        event_type: 'oauth_revoked',
        status: 'success',
        payload: {
          user_id: user.id,
          revoked_at: new Date().toISOString()
        }
      });

    console.log('Azure AD connection revoked successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conexão revogada com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in azure-oauth-revoke:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
