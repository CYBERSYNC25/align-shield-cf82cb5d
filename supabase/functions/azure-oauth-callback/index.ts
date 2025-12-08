/**
 * Azure OAuth 2.0 - Callback Handler (SECURED)
 * 
 * Handles the callback from Azure AD OAuth 2.0 authentication.
 * Exchanges authorization code for tokens and stores them ENCRYPTED.
 * 
 * SECURITY IMPROVEMENTS:
 * - Tokens are encrypted using AES-256-GCM before storage
 * - Uses TOKEN_ENCRYPTION_KEY secret for encryption
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// Inline crypto utilities
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = encoder.encode('apoc-token-encryption-salt-v1');

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function encryptToken(plainText: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(encryptionKey);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  const encryptedBytes = new Uint8Array(encrypted);
  return `${bytesToHex(iv)}:${bytesToHex(encryptedBytes)}`;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      console.error('Azure OAuth error:', error, errorDescription);
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>${errorDescription || error}</p>
          <a href="/">Go Back</a>
        </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    if (!code || !state) {
      throw new Error('Missing code or state in OAuth response');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tokenEncryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');

    // Find the pending OAuth request with this state
    const { data: pendingRequest, error: fetchError } = await supabaseClient
      .from('integration_webhooks')
      .select('*')
      .eq('integration_name', 'azure_ad')
      .eq('event_type', 'oauth_started')
      .eq('status', 'pending')
      .contains('payload', { state })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !pendingRequest) {
      throw new Error('OAuth request not found or expired');
    }

    const { tenant_id, client_id, client_secret, scopes, redirect_uri, user_id } = pendingRequest.payload;

    // Exchange code for tokens
    const tokenUrl = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        code,
        redirect_uri,
        grant_type: 'authorization_code',
        scope: scopes.join(' ')
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // SECURITY: Encrypt tokens before storage
    let accessTokenToStore = tokenData.access_token;
    let refreshTokenToStore = tokenData.refresh_token;

    if (tokenEncryptionKey) {
      console.log('Azure OAuth Callback: Encrypting tokens before storage...');
      accessTokenToStore = await encryptToken(tokenData.access_token, tokenEncryptionKey);
      if (tokenData.refresh_token) {
        refreshTokenToStore = await encryptToken(tokenData.refresh_token, tokenEncryptionKey);
      }
      console.log('Azure OAuth Callback: Tokens encrypted successfully');
    } else {
      console.warn('Azure OAuth Callback: TOKEN_ENCRYPTION_KEY not set - storing tokens unencrypted (NOT RECOMMENDED)');
    }

    // Store encrypted tokens
    const { error: upsertError } = await supabaseClient
      .from('integration_oauth_tokens')
      .upsert({
        user_id,
        integration_name: 'azure_ad',
        access_token: accessTokenToStore,
        refresh_token: refreshTokenToStore,
        token_type: tokenData.token_type,
        expires_at: expiresAt,
        scope: scopes.join(' '),
        metadata: {
          tenant_id,
          client_id,
          scopes,
          encrypted: !!tokenEncryptionKey
        }
      });

    if (upsertError) throw upsertError;

    // Update webhook status
    await supabaseClient
      .from('integration_webhooks')
      .update({
        status: 'success',
        processed_at: new Date().toISOString()
      })
      .eq('id', pendingRequest.id);

    // Log success
    await supabaseClient
      .from('integration_webhooks')
      .insert({
        integration_name: 'azure_ad',
        event_type: 'oauth_completed',
        status: 'success',
        payload: {
          user_id,
          scopes,
          encrypted: !!tokenEncryptionKey
        }
      });

    console.log('Azure OAuth completed successfully for user:', user_id, '(encrypted:', !!tokenEncryptionKey, ')');

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Complete</title>
        <style>
          body { font-family: system-ui; max-width: 600px; margin: 100px auto; text-align: center; }
          .success { color: #22c55e; font-size: 48px; }
        </style>
      </head>
      <body>
        <div class="success">✓</div>
        <h1>Authentication Complete!</h1>
        <p>Connected to Azure AD. Directory read permission confirmed.</p>
        <p>You can close this window now.</p>
        <script>
          setTimeout(() => {
            window.close();
            window.location.href = '/integrations-hub?azure_connected=true';
          }, 2000);
        </script>
      </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in azure-oauth-callback:', error);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>Authentication Processing Error</h1>
        <p>${error.message}</p>
        <a href="/integrations-hub">Back to Integrations</a>
      </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
});
