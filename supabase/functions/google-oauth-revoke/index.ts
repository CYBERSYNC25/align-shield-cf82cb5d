/**
 * Google OAuth 2.0 - Token Revocation
 * 
 * Revoga o acesso do aplicativo à conta Google do usuário.
 * Remove todos os tokens armazenados e notifica o Google.
 * 
 * SECRETS NECESSÁRIAS (Supabase Dashboard):
 * - GOOGLE_CLIENT_ID (para identificação)
 * 
 * FLUXO:
 * 1. Busca os tokens do usuário no banco de dados
 * 2. Revoga os tokens na API do Google
 * 3. Remove tokens do banco de dados
 * 4. Confirma revogação bem-sucedida
 * 
 * IMPORTANTE:
 * - Sempre revogar no Google antes de deletar do banco
 * - Mesmo se a revogação no Google falhar, remover do banco
 * - Logar todas as revogações para auditoria
 * - Notificar usuário sobre o logout da integração
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google OAuth Revoke: Starting token revocation');

    // ✅ Buscar credenciais dos Supabase Secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Google OAuth Revoke: Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter o token de autenticação do usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Google OAuth Revoke: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { authorization: authHeader }
      }
    });

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Google OAuth Revoke: Invalid user token', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Google OAuth Revoke: Revoking token for user ${user.id}`);

    // Buscar token do banco de dados
    const { data: tokenData, error: tokenError } = await supabase
      .from('integration_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_name', 'google_workspace')
      .single();

    if (tokenError || !tokenData) {
      console.error('Google OAuth Revoke: Token not found', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Integration not connected',
          message: 'No active Google Workspace connection found'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revogar token na API do Google
    console.log('Google OAuth Revoke: Revoking token with Google...');
    let revokedOnGoogle = false;
    
    try {
      const revokeEndpoint = 'https://oauth2.googleapis.com/revoke';
      const revokeParams = new URLSearchParams({
        token: tokenData.access_token
      });

      const revokeResponse = await fetch(revokeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: revokeParams.toString()
      });

      if (revokeResponse.ok) {
        console.log('Google OAuth Revoke: Token revoked successfully on Google');
        revokedOnGoogle = true;
      } else {
        const errorText = await revokeResponse.text();
        console.warn('Google OAuth Revoke: Failed to revoke on Google (will proceed anyway)', errorText);
        // Não vamos falhar se a revogação no Google falhar
        // O token pode já ter sido revogado ou expirado
      }
    } catch (error) {
      console.warn('Google OAuth Revoke: Error revoking on Google (will proceed anyway)', error);
      // Continuar mesmo se houver erro
    }

    // Remover tokens do banco de dados
    console.log('Google OAuth Revoke: Removing tokens from database...');
    const { error: deleteError } = await supabase
      .from('integration_oauth_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_name', 'google_workspace');

    if (deleteError) {
      console.error('Google OAuth Revoke: Failed to delete tokens', deleteError);
      throw new Error(`Failed to delete tokens: ${deleteError.message}`);
    }

    console.log('Google OAuth Revoke: Tokens removed successfully');

    // Criar notificação para o usuário
    try {
      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: 'Google Workspace desconectado',
        p_message: 'A integração com Google Workspace foi revogada com sucesso.',
        p_type: 'info',
        p_priority: 'normal'
      });
    } catch (notifError) {
      console.warn('Google OAuth Revoke: Failed to create notification', notifError);
      // Não falhar se a notificação falhar
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Google Workspace integration revoked successfully',
        revokedOnGoogle,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google OAuth Revoke Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to revoke token',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
