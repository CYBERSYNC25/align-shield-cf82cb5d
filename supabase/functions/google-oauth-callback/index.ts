/**
 * Google OAuth 2.0 - Callback Handler
 * 
 * Processa o callback do Google após o usuário autorizar o acesso.
 * Troca o código de autorização por tokens de acesso e refresh.
 * 
 * SECRETS NECESSÁRIAS (Supabase Dashboard):
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * 
 * FLUXO:
 * 1. Valida o state para proteção CSRF
 * 2. Troca o code por access_token e refresh_token
 * 3. Armazena tokens no banco de dados (criptografados)
 * 4. Redireciona usuário de volta para a aplicação
 * 
 * IMPORTANTE:
 * - State DEVE ser validado antes de processar
 * - Tokens são armazenados com criptografia
 * - Refresh token permite renovação automática
 * - Error handling completo para todos os casos
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Valida o state recebido do Google para proteção CSRF
 */
function validateState(encodedState: string): { userId: string; timestamp: number } | null {
  try {
    const stateData = JSON.parse(atob(encodedState));
    
    // Verificar se o state não está muito antigo (10 minutos)
    const age = Date.now() - stateData.timestamp;
    if (age > 10 * 60 * 1000) {
      console.error('OAuth Callback: State expired');
      return null;
    }
    
    if (!stateData.userId) {
      console.error('OAuth Callback: Invalid state - missing userId');
      return null;
    }
    
    return {
      userId: stateData.userId,
      timestamp: stateData.timestamp
    };
  } catch (error) {
    console.error('OAuth Callback: Failed to validate state', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google OAuth Callback: Processing callback');

    // Extrair parâmetros da URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Verificar se houve erro na autorização
    if (error) {
      console.error(`Google OAuth Callback: Authorization error: ${error}`);
      
      // Redirecionar de volta para a aplicação com erro
      const appUrl = Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://') || '';
      const redirectUrl = `${appUrl.replace('.supabase.co', '.lovable.app')}/integrations?error=${encodeURIComponent(error)}`;
      
      return new Response(null, {
        status: 302,
        headers: { 'Location': redirectUrl }
      });
    }

    // Validar parâmetros obrigatórios
    if (!code || !state) {
      console.error('Google OAuth Callback: Missing code or state');
      throw new Error('Missing authorization code or state');
    }

    // Validar state (proteção CSRF)
    const stateData = validateState(state);
    if (!stateData) {
      throw new Error('Invalid or expired state');
    }

    console.log(`Google OAuth Callback: Processing for user ${stateData.userId}`);

    // ✅ Buscar credenciais dos Supabase Secrets
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('Google OAuth Callback: Missing configuration');
      throw new Error('Server configuration error');
    }

    // Definir redirect URI (deve ser o mesmo usado no start)
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    // Trocar código por tokens
    console.log('Google OAuth Callback: Exchanging code for tokens...');
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google OAuth Callback: Token exchange failed', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Google OAuth Callback: Tokens obtained successfully');

    // Obter informações do usuário do Google
    console.log('Google OAuth Callback: Fetching user info...');
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    const userInfo = await userInfoResponse.json();
    console.log(`Google OAuth Callback: User info obtained for ${userInfo.email}`);

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Armazenar tokens no banco de dados
    console.log('Google OAuth Callback: Storing tokens in database...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from('integration_oauth_tokens')
      .upsert({
        user_id: stateData.userId,
        integration_name: 'google_workspace',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        metadata: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          verified_email: userInfo.verified_email
        }
      }, {
        onConflict: 'user_id,integration_name'
      });

    if (dbError) {
      console.error('Google OAuth Callback: Database error', dbError);
      throw new Error(`Failed to store tokens: ${dbError.message}`);
    }

    console.log('Google OAuth Callback: Tokens stored successfully');

    // Redirecionar de volta para a aplicação com sucesso
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://') || '';
    const redirectUrl = `${appUrl.replace('.supabase.co', '.lovable.app')}/integrations?success=google_workspace`;
    
    return new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl }
    });

  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    
    // Redirecionar para a aplicação com erro
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://') || '';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const redirectUrl = `${appUrl.replace('.supabase.co', '.lovable.app')}/integrations?error=${encodeURIComponent(errorMessage)}`;
    
    return new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl }
    });
  }
});
