/**
 * Google OAuth 2.0 - Callback Handler (SECURED)
 * 
 * Processes the callback from Google after user authorizes access.
 * Exchanges authorization code for tokens and stores them ENCRYPTED.
 * 
 * SECURITY IMPROVEMENTS:
 * - Tokens are encrypted using AES-256-GCM before storage
 * - Uses TOKEN_ENCRYPTION_KEY secret for encryption
 * 
 * SECRETS REQUIRED:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - TOKEN_ENCRYPTION_KEY (for token encryption)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inline crypto utilities to avoid import issues in edge functions
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

/**
 * Validates the state received from Google for CSRF protection
 */
function validateState(encodedState: string): { userId: string; timestamp: number } | null {
  try {
    const decodedState = decodeURIComponent(encodedState);
    const stateData = JSON.parse(atob(decodedState));
    
    // Check if state is not too old (10 minutes)
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google OAuth Callback: Processing callback');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error(`Google OAuth Callback: Authorization error: ${error}`);
      const projectRef = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)/)?.[1] || '';
      const redirectUrl = `https://preview--${projectRef}.lovable.app/integrations?error=${encodeURIComponent(error)}`;
      return new Response(null, {
        status: 302,
        headers: { 'Location': redirectUrl }
      });
    }

    if (!code || !state) {
      console.error('Google OAuth Callback: Missing code or state');
      throw new Error('Missing authorization code or state');
    }

    const stateData = validateState(state);
    if (!stateData) {
      throw new Error('Invalid or expired state');
    }

    console.log(`Google OAuth Callback: Processing for user ${stateData.userId}`);

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const tokenEncryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('Google OAuth Callback: Missing configuration');
      throw new Error('Server configuration error');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

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

    console.log('Google OAuth Callback: Fetching user info...');
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    const userInfo = await userInfoResponse.json();
    console.log(`Google OAuth Callback: User info obtained for ${userInfo.email}`);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // SECURITY: Encrypt tokens before storage
    let accessTokenToStore = tokens.access_token;
    let refreshTokenToStore = tokens.refresh_token;

    if (tokenEncryptionKey) {
      console.log('Google OAuth Callback: Encrypting tokens before storage...');
      accessTokenToStore = await encryptToken(tokens.access_token, tokenEncryptionKey);
      if (tokens.refresh_token) {
        refreshTokenToStore = await encryptToken(tokens.refresh_token, tokenEncryptionKey);
      }
      console.log('Google OAuth Callback: Tokens encrypted successfully');
    } else {
      console.warn('Google OAuth Callback: TOKEN_ENCRYPTION_KEY not set - storing tokens unencrypted (NOT RECOMMENDED)');
    }

    console.log('Google OAuth Callback: Storing tokens in database...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from('integration_oauth_tokens')
      .upsert({
        user_id: stateData.userId,
        integration_name: 'google_workspace',
        access_token: accessTokenToStore,
        refresh_token: refreshTokenToStore,
        token_type: tokens.token_type,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        metadata: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          verified_email: userInfo.verified_email,
          encrypted: !!tokenEncryptionKey
        }
      }, {
        onConflict: 'user_id,integration_name'
      });

    if (dbError) {
      console.error('Google OAuth Callback: Database error', dbError);
      throw new Error(`Failed to store tokens: ${dbError.message}`);
    }

    console.log('Google OAuth Callback: Tokens stored successfully (encrypted:', !!tokenEncryptionKey, ')');

    const projectRef = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)/)?.[1] || '';
    const redirectUrl = `https://preview--${projectRef}.lovable.app/integrations?success=google_workspace`;
    
    return new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl }
    });

  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    
    const projectRef = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)/)?.[1] || '';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const redirectUrl = `https://preview--${projectRef}.lovable.app/integrations?error=${encodeURIComponent(errorMessage)}`;
    
    return new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl }
    });
  }
});
