/**
 * Google OAuth 2.0 - Start Flow
 * 
 * Inicia o fluxo OAuth 2.0 gerando a URL de consentimento do Google.
 * O usuário será redirecionado para esta URL para autorizar o acesso.
 * 
 * SECRETS NECESSÁRIAS (Supabase Dashboard):
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * 
 * FLUXO:
 * 1. Gera state aleatório para proteção CSRF
 * 2. Cria URL de autorização do Google com scopes necessários
 * 3. Retorna URL para o frontend redirecionar o usuário
 * 
 * IMPORTANTE:
 * - O state deve ser validado no callback
 * - Scopes devem ser ajustados conforme necessidade
 * - Redirect URI deve corresponder ao configurado no Google Cloud Console
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Gera uma string aleatória para uso como state no OAuth
 * Protege contra ataques CSRF
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google OAuth Start: Initiating OAuth flow');

    // ✅ Buscar credenciais dos Supabase Secrets
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Validar credenciais
    if (!clientId || !clientSecret) {
      console.error('Google OAuth: Missing required credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Google OAuth credentials not configured',
          required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
          instructions: 'Configure estas secrets no Supabase Dashboard > Settings > Edge Functions > Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Google OAuth: Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter o token de autenticação do usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Google OAuth: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com o token do usuário
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { authorization: authHeader }
      }
    });

    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Google OAuth: Invalid user token', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Google OAuth: User ${user.id} starting OAuth flow`);

    // Gerar state aleatório para proteção CSRF
    const state = generateState();
    
    // Armazenar state temporariamente (seria ideal usar Redis ou similar)
    // Por simplicidade, vamos incluir no próprio state codificado
    const stateData = {
      userId: user.id,
      timestamp: Date.now(),
      random: state
    };
    const encodedState = btoa(JSON.stringify(stateData));

    // Definir redirect URI (deve corresponder ao configurado no Google Cloud Console)
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    // Scopes necessários para Google Workspace
    // Ajuste conforme as necessidades da sua aplicação
    const scopes = [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.group.readonly',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'openid',
      'profile',
      'email'
    ].join(' ');

    // Construir URL de autorização do Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', encodedState);
    authUrl.searchParams.set('access_type', 'offline'); // Para obter refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Forçar tela de consentimento

    console.log('Google OAuth: Authorization URL generated successfully');
    console.log(`Google OAuth: Redirect URI: ${redirectUri}`);
    console.log(`Google OAuth: Scopes: ${scopes}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        authUrl: authUrl.toString(),
        instructions: 'Redirecione o usuário para authUrl. Após autorização, o Google redirecionará para o callback.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google OAuth Start Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to initialize OAuth flow',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
