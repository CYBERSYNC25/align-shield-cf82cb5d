/**
 * Google OAuth 2.0 - Token Refresh (SECURED)
 * 
 * Automatically renews access tokens using the refresh token.
 * Now supports encrypted token storage/retrieval.
 * 
 * SECURITY IMPROVEMENTS:
 * - Decrypts stored refresh token before use
 * - Encrypts new access token before storage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inline crypto utilities
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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

async function decryptToken(encryptedText: string, encryptionKey: string): Promise<string> {
  const [ivHex, ciphertextHex] = encryptedText.split(':');
  if (!ivHex || !ciphertextHex) {
    throw new Error('Invalid encrypted token format');
  }
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);
  const key = await deriveKey(encryptionKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

function isEncrypted(token: string): boolean {
  if (!token) return false;
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  if (parts[0].length !== 24) return false;
  return /^[0-9a-f]+$/i.test(parts[0]) && /^[0-9a-f]+$/i.test(parts[1]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google OAuth Refresh: Starting token refresh');

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const tokenEncryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');

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

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Google OAuth Refresh: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Google OAuth Refresh: Invalid user token', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Google OAuth Refresh: Refreshing token for user ${user.id}`);

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

    // SECURITY: Decrypt refresh token if encrypted
    let refreshToken = tokenData.refresh_token;
    if (tokenEncryptionKey && isEncrypted(refreshToken)) {
      console.log('Google OAuth Refresh: Decrypting refresh token...');
      try {
        refreshToken = await decryptToken(refreshToken, tokenEncryptionKey);
        console.log('Google OAuth Refresh: Token decrypted successfully');
      } catch (decryptError) {
        console.error('Google OAuth Refresh: Token decryption failed:', decryptError);
        return new Response(
          JSON.stringify({ 
            error: 'Token decryption failed',
            message: 'Please reconnect the integration'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Google OAuth Refresh: Exchanging for new access token...');

    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
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

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // SECURITY: Encrypt new access token before storage
    let accessTokenToStore = tokens.access_token;
    if (tokenEncryptionKey) {
      console.log('Google OAuth Refresh: Encrypting new access token...');
      accessTokenToStore = await encryptToken(tokens.access_token, tokenEncryptionKey);
      console.log('Google OAuth Refresh: Token encrypted successfully');
    }

    console.log('Google OAuth Refresh: Updating tokens in database...');
    const { error: updateError } = await supabase
      .from('integration_oauth_tokens')
      .update({
        access_token: accessTokenToStore,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('integration_name', 'google_workspace');

    if (updateError) {
      console.error('Google OAuth Refresh: Failed to update tokens', updateError);
      throw new Error(`Failed to update tokens: ${updateError.message}`);
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'token.refreshed',
      resource_type: 'oauth_token',
      resource_id: 'google_workspace',
      new_data: { 
        expires_at: expiresAt.toISOString(),
        expires_in: tokens.expires_in,
        encrypted: !!tokenEncryptionKey
      },
    });

    console.log('Google OAuth Refresh: Tokens updated successfully');

    // Return the unencrypted token for immediate use (only in the response, not stored)
    return new Response(
      JSON.stringify({ 
        success: true,
        access_token: tokens.access_token, // Return unencrypted for immediate use
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
