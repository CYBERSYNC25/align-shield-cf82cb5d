/**
 * Proxy API Request - Dynamic Integration Connector (SECURED)
 * 
 * Acts as a secure proxy for external API requests using stored OAuth tokens.
 * Now supports encrypted token decryption.
 * 
 * SECURITY IMPROVEMENTS:
 * - Decrypts tokens before use
 * - Never exposes decrypted tokens to frontend
 * - Sensitive data filtered from logs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inline crypto utilities for token decryption
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
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

interface ApiRequestPayload {
  integration_name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  query_params?: Record<string, string>;
}

/**
 * Filter sensitive data from response before logging
 * Enhanced to catch more PII and sensitive data patterns
 */
function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  // Extended list of sensitive field patterns
  const sensitiveKeys = [
    // Authentication & secrets
    'password', 'secret', 'token', 'key', 'authorization', 'api_key', 'apiKey',
    'access_token', 'refresh_token', 'bearer', 'credential', 'auth', 'private',
    // Personal identifiable information (PII)
    'ssn', 'social_security', 'tax_id', 'national_id', 'passport',
    // Financial data
    'credit_card', 'card_number', 'cvv', 'expiry', 'bank_account', 'routing_number', 'iban',
    // Contact info that may be sensitive
    'phone', 'mobile', 'cell',
  ];

  // Patterns for value-based redaction
  const sensitiveValuePatterns = [
    /^\d{3}-\d{2}-\d{4}$/, // SSN format
    /^\d{16}$/, // Credit card (16 digits)
    /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/, // Credit card with separators
  ];
  
  const filtered = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key of Object.keys(filtered)) {
    const lowerKey = key.toLowerCase();
    const value = filtered[key];
    
    // Check if key matches sensitive patterns
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      filtered[key] = '[REDACTED]';
    } 
    // Check if string value matches sensitive patterns
    else if (typeof value === 'string') {
      if (sensitiveValuePatterns.some(pattern => pattern.test(value))) {
        filtered[key] = '[REDACTED]';
      }
    }
    // Recursively filter nested objects
    else if (typeof value === 'object') {
      filtered[key] = filterSensitiveData(value);
    }
  }
  
  return filtered;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Proxy API Request: Starting request');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const tokenEncryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Proxy API Request: User ${user.id} authenticated`);

    const payload: ApiRequestPayload = await req.json();
    const { integration_name, endpoint, method, headers: customHeaders, body, query_params } = payload;

    if (!integration_name || !endpoint || !method) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['integration_name', 'endpoint', 'method']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Proxy API Request: Fetching token for integration "${integration_name}"`);

    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('integration_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_name', integration_name)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Integration not connected',
          message: `No OAuth token found for integration "${integration_name}". Please connect your account first.`
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    let accessToken = tokenData.access_token;

    if (expiresAt <= now) {
      console.log('Token expired, needs refresh...');
      
      if (!tokenData.refresh_token) {
        return new Response(
          JSON.stringify({ 
            error: 'Token expired',
            message: 'Access token expired and no refresh token available. Please reconnect your account.'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Token expired',
          message: 'Access token expired. Please reconnect your account.',
          hint: 'Future versions will auto-refresh tokens'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Decrypt token if encrypted
    if (tokenEncryptionKey && isEncrypted(accessToken)) {
      console.log('Proxy API Request: Decrypting access token...');
      try {
        accessToken = await decryptToken(accessToken, tokenEncryptionKey);
        console.log('Proxy API Request: Token decrypted successfully');
      } catch (decryptError) {
        console.error('Proxy API Request: Token decryption failed:', decryptError);
        return new Response(
          JSON.stringify({ 
            error: 'Token decryption failed',
            message: 'Unable to decrypt stored token. Please reconnect your account.'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build full URL with query params
    let fullUrl = endpoint;
    if (query_params && Object.keys(query_params).length > 0) {
      const queryString = new URLSearchParams(query_params).toString();
      fullUrl += `?${queryString}`;
    }

    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    console.log(`Proxy API Request: Calling ${method} ${fullUrl}`);

    const startTime = Date.now();
    let apiResponse: Response;
    
    try {
      apiResponse = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (fetchError) {
      console.error('API request failed:', fetchError);
      
      await supabaseClient.from('integration_webhooks').insert({
        integration_name,
        event_type: 'api_request',
        status: 'failed',
        error_message: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        payload: {
          endpoint: fullUrl,
          method,
          user_id: user.id,
          error: fetchError instanceof Error ? fetchError.message : String(fetchError)
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'API request failed',
          message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          details: { endpoint: fullUrl, method }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const duration = Date.now() - startTime;

    let responseData: any;
    const contentType = apiResponse.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await apiResponse.json();
    } else {
      responseData = await apiResponse.text();
    }

    console.log(`Proxy API Request: Response ${apiResponse.status} (${duration}ms)`);

    // SECURITY: Filter sensitive data before logging
    const filteredResponse = filterSensitiveData(responseData);

    await supabaseClient.from('integration_webhooks').insert({
      integration_name,
      event_type: 'api_request',
      status: apiResponse.ok ? 'success' : 'failed',
      error_message: apiResponse.ok ? null : `HTTP ${apiResponse.status}`,
      payload: {
        endpoint: fullUrl,
        method,
        user_id: user.id,
        status_code: apiResponse.status,
        duration_ms: duration,
        request: {
          headers: customHeaders,
          body: filterSensitiveData(body),
          query_params
        },
        response: filteredResponse
      },
      processed_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: apiResponse.ok,
        status_code: apiResponse.status,
        status_text: apiResponse.statusText,
        duration_ms: duration,
        content_type: contentType,
        data: responseData,
        headers: Object.fromEntries(apiResponse.headers.entries())
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Proxy API Request Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
