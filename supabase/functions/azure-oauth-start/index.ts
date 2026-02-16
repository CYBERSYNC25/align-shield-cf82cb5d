import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encryption utilities for securing credentials in database
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('apoc-token-encryption-salt-v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptSecret(plainText: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(encryptionKey);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plainText));
  return `v1:${bytesToHex(iv)}:${bytesToHex(new Uint8Array(encrypted))}`;
}

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

    // Default scopes include User.Read.All and Directory.Read.All for full directory access
    const defaultScopes = ['User.Read.All', 'Directory.Read.All'];
    const requestedScopes = scopes || defaultScopes;

    const state = crypto.randomUUID();
    const redirect_uri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/azure-oauth-callback`;

    // SECURITY: Encrypt client_secret before storing in database
    const tokenEncryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
    let encryptedClientSecret = client_secret;
    let encryptedClientId = client_id;
    if (tokenEncryptionKey) {
      encryptedClientSecret = await encryptSecret(client_secret, tokenEncryptionKey);
      encryptedClientId = await encryptSecret(client_id, tokenEncryptionKey);
      console.log('Azure OAuth: Credentials encrypted before database storage');
    } else {
      console.warn('Azure OAuth: TOKEN_ENCRYPTION_KEY not set - credentials stored without encryption (NOT RECOMMENDED)');
    }

    // Store state and config temporarily in database for callback validation
    // SECURITY: client_id and client_secret are encrypted before storage
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
          client_id: encryptedClientId,
          client_secret: encryptedClientSecret,
          credentials_encrypted: !!tokenEncryptionKey,
          scopes: requestedScopes,
          redirect_uri
        }
      });

    if (insertError) throw insertError;

    // Construct Azure OAuth authorization URL
    const scopeString = requestedScopes.join(' ');
    const authUrl = new URL(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set('client_id', client_id);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('scope', scopeString);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');
    
    // Always request admin consent to ensure full directory read permissions
    authUrl.searchParams.set('prompt', 'admin_consent');
    console.log('Admin consent prompt added for directory permissions');

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
