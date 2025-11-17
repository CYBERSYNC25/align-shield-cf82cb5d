/**
 * Google OAuth 2.0 - Token Refresh
 * 
 * Renova automaticamente os tokens de acesso usando o refresh token.
 * Deve ser chamado quando o access_token expira ou está próximo de expirar.
 * 
 * SECRETS NECESSÁRIAS (Supabase Dashboard):
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * 
 * FLUXO:
 * 1. Busca o refresh_token do banco de dados
 * 2. Usa refresh_token para obter novo access_token
 * 3. Atualiza tokens no banco de dados
 * 4. Retorna novo access_token para uso imediato
 * 
 * IMPORTANTE:
 * - Refresh tokens não expiram (a menos que revogados)
 * - Sempre verificar validade antes de usar tokens expirados
 * - Implementar retry logic para falhas de rede
 * - Logar todas as renovações para auditoria
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
    console.log('Google OAuth Refresh: Starting token refresh');

    // ✅ Buscar credenciais dos Supabase Secrets
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('Google OAuth Refresh: Missing configuration');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter o token de autenticação do usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Google OAuth Refresh: No authorization header');
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
      console.error('Google OAuth Refresh: Invalid user token', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Google OAuth Refresh: Refreshing token for user ${user.id}`);

    // Buscar refresh token do banco de dados
    const { data: tokenData, error: tokenError } = await supabase
      .from('integration_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_name', 'google_workspace')
      .single();

    if (tokenError || !tokenData) {
      console.error('Google OAuth Refresh: Token not found', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Integration not connected',
          message: 'Please connect Google Workspace first'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData.refresh_token) {
      console.error('Google OAuth Refresh: No refresh token available');
      return new Response(
        JSON.stringify({ 
          error: 'No refresh token available',
          message: 'Please reconnect the integration'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Google OAuth Refresh: Refresh token found, exchanging for new access token...');

    // Renovar o token
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token'
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google OAuth Refresh: Token refresh failed', errorText);
      
      // Se o refresh token for inválido, o usuário precisa reconectar
      if (tokenResponse.status === 400) {
        return new Response(
          JSON.stringify({ 
            error: 'Refresh token invalid',
            message: 'Please reconnect the integration',
            requiresReconnection: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Token refresh failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Google OAuth Refresh: New access token obtained');

    // Calcular nova data de expiração
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Atualizar tokens no banco de dados
    console.log('Google OAuth Refresh: Updating tokens in database...');
    const { error: updateError } = await supabase
      .from('integration_oauth_tokens')
      .update({
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('integration_name', 'google_workspace');

    if (updateError) {
      console.error('Google OAuth Refresh: Failed to update tokens', updateError);
      throw new Error(`Failed to update tokens: ${updateError.message}`);
    }

    console.log('Google OAuth Refresh: Tokens updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString(),
        expires_in: tokens.expires_in
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google OAuth Refresh Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to refresh token',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
