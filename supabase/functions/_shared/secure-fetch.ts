/**
 * Secure Fetch Wrapper
 * 
 * Wrapper for fetch() with SSRF protection:
 * - URL validation against private IPs and metadata endpoints
 * - Configurable timeout (default 10s)
 * - No automatic redirect following
 * - Full logging of attempts
 */

import { validateWebhookUrl, type SsrfValidationResult, type SsrfBlockedReason } from './ssrf-validator.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface SecureFetchOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  followRedirects?: boolean;
  logAttempt?: boolean;
  userId?: string;
  orgId?: string;
  functionName?: string;
}

export interface SecureFetchResult {
  success: boolean;
  response?: Response;
  responseBody?: string;
  statusCode?: number;
  error?: string;
  blocked?: boolean;
  blockedReason?: SsrfBlockedReason;
  durationMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Log fetch attempt to system_logs table
 */
async function logFetchAttempt(
  options: {
    url: string;
    method: string;
    blocked: boolean;
    blockedReason?: string;
    statusCode?: number;
    error?: string;
    durationMs: number;
    userId?: string;
    orgId?: string;
    functionName?: string;
  }
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Redact sensitive parts of URL
    let sanitizedUrl = options.url;
    try {
      const parsed = new URL(options.url);
      // Remove query params and auth info
      sanitizedUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      // Keep original if parsing fails
    }
    
    await supabase.from('system_logs').insert({
      level: options.blocked ? 'warn' : (options.error ? 'error' : 'info'),
      source: 'edge_function',
      message: options.blocked 
        ? `SSRF blocked: ${sanitizedUrl}` 
        : (options.error ? `Fetch failed: ${sanitizedUrl}` : `Fetch success: ${sanitizedUrl}`),
      function_name: options.functionName || 'secure-fetch',
      user_id: options.userId || null,
      org_id: options.orgId || null,
      metadata: {
        url: sanitizedUrl,
        method: options.method,
        blocked: options.blocked,
        blocked_reason: options.blockedReason || null,
        status_code: options.statusCode || null,
        error: options.error || null,
        duration_ms: options.durationMs,
      },
    });
  } catch (logError) {
    console.error('[secure-fetch] Failed to log attempt:', logError);
  }
}

/**
 * Perform a secure HTTP fetch with SSRF protection
 * 
 * @param options - Fetch configuration
 * @returns Fetch result with success/failure info
 */
export async function secureFetch(options: SecureFetchOptions): Promise<SecureFetchResult> {
  const {
    url,
    method,
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    followRedirects = false,
    logAttempt = true,
    userId,
    orgId,
    functionName,
  } = options;
  
  const startTime = Date.now();
  
  // Step 1: Validate URL against SSRF patterns
  const validation: SsrfValidationResult = validateWebhookUrl(url);
  
  if (!validation.valid) {
    const durationMs = Date.now() - startTime;
    
    console.warn(`[secure-fetch] SSRF blocked: ${url} - ${validation.blockedReason}`);
    
    if (logAttempt) {
      await logFetchAttempt({
        url,
        method,
        blocked: true,
        blockedReason: validation.blockedReason,
        durationMs,
        userId,
        orgId,
        functionName,
      });
    }
    
    return {
      success: false,
      blocked: true,
      blockedReason: validation.blockedReason,
      error: validation.error || 'URL blocked by SSRF protection',
      durationMs,
    };
  }
  
  // Step 2: Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Step 3: Perform fetch with security options
    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'APOC-SecureFetch/1.0',
        ...headers,
      },
      body: body || undefined,
      signal: controller.signal,
      redirect: followRedirects ? 'follow' : 'manual',
    });
    
    clearTimeout(timeoutId);
    
    const durationMs = Date.now() - startTime;
    
    // Read response body
    let responseBody: string | undefined;
    try {
      responseBody = await response.text();
    } catch {
      responseBody = undefined;
    }
    
    // Step 4: Handle redirects (if not following)
    if (!followRedirects && [301, 302, 303, 307, 308].includes(response.status)) {
      const redirectUrl = response.headers.get('location');
      console.warn(`[secure-fetch] Redirect blocked: ${url} -> ${redirectUrl}`);
      
      if (logAttempt) {
        await logFetchAttempt({
          url,
          method,
          blocked: false,
          statusCode: response.status,
          error: `Redirect blocked to ${redirectUrl}`,
          durationMs,
          userId,
          orgId,
          functionName,
        });
      }
      
      return {
        success: false,
        response,
        responseBody,
        statusCode: response.status,
        error: `Redirect not followed (${response.status})`,
        durationMs,
      };
    }
    
    // Step 5: Log successful fetch
    if (logAttempt) {
      await logFetchAttempt({
        url,
        method,
        blocked: false,
        statusCode: response.status,
        durationMs,
        userId,
        orgId,
        functionName,
      });
    }
    
    console.log(`[secure-fetch] ${method} ${url} - ${response.status} (${durationMs}ms)`);
    
    return {
      success: response.ok,
      response,
      responseBody,
      statusCode: response.status,
      durationMs,
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error 
      ? (error.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : error.message)
      : 'Unknown error';
    
    console.error(`[secure-fetch] ${method} ${url} failed: ${errorMessage}`);
    
    if (logAttempt) {
      await logFetchAttempt({
        url,
        method,
        blocked: false,
        error: errorMessage,
        durationMs,
        userId,
        orgId,
        functionName,
      });
    }
    
    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Convenience method for POST requests
 */
export async function securePost(
  url: string,
  body: string,
  headers?: Record<string, string>,
  options?: Partial<Omit<SecureFetchOptions, 'url' | 'method' | 'body' | 'headers'>>
): Promise<SecureFetchResult> {
  return secureFetch({
    url,
    method: 'POST',
    body,
    headers,
    ...options,
  });
}

/**
 * Convenience method for GET requests
 */
export async function secureGet(
  url: string,
  headers?: Record<string, string>,
  options?: Partial<Omit<SecureFetchOptions, 'url' | 'method' | 'headers'>>
): Promise<SecureFetchResult> {
  return secureFetch({
    url,
    method: 'GET',
    headers,
    ...options,
  });
}
