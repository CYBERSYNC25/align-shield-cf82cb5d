/**
 * Security Middleware for Edge Functions
 * Provides security headers, request validation, and IP blocking
 * 
 * @module security-middleware
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { createLogger } from './logger.ts';

const logger = createLogger('Security');

/**
 * Standard security headers for all responses
 */
export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

/**
 * Standard CORS headers
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
};

/**
 * Configuration for security middleware
 */
export interface SecurityConfig {
  /** Maximum payload size in bytes (default: 10MB) */
  maxPayloadSize?: number;
  /** Require application/json Content-Type for POST/PUT/PATCH (default: true) */
  requireJsonContentType?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Allowed HTTP methods (default: all standard methods) */
  allowedMethods?: string[];
  /** Skip IP blacklist check (default: false) */
  skipIpCheck?: boolean;
  /** Allow requests without authentication (default: false) */
  allowUnauthenticated?: boolean;
}

const DEFAULT_CONFIG: Required<SecurityConfig> = {
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
  requireJsonContentType: true,
  timeout: 30000, // 30 seconds
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  skipIpCheck: false,
  allowUnauthenticated: false,
};

/**
 * Suspicious header patterns that may indicate malicious requests
 */
const SUSPICIOUS_HEADERS = [
  'x-forwarded-host',  // Host header injection
  'x-original-url',    // URL override attempts
  'x-rewrite-url',     // URL rewrite attempts
];

/**
 * Suspicious User-Agent patterns
 */
const SUSPICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /masscan/i,
  /zgrab/i,
  /dirbuster/i,
  /gobuster/i,
  /nuclei/i,
];

export type SecurityValidationResult = {
  valid: true;
  ip: string;
} | {
  valid: false;
  response: Response;
  reason: string;
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Cloudflare
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  
  // X-Forwarded-For (first IP is the client)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // X-Real-IP
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  
  return 'unknown';
}

/**
 * Check if IP is blocked in the database
 */
async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return false; // Fail-open if not configured
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.rpc('is_ip_blocked', { p_ip_address: ip });
    
    if (error) {
      logger.error('Error checking IP block status', error);
      return false; // Fail-open on error
    }
    
    return data === true;
  } catch (error) {
    logger.error('Exception checking IP block', error);
    return false; // Fail-open on exception
  }
}

/**
 * Log suspicious activity to the database
 */
export async function logSuspiciousActivity(
  ip: string,
  activityType: string,
  endpoint?: string,
  details?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Cannot log suspicious activity - Supabase not configured');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('suspicious_activity_logs').insert({
      ip_address: ip,
      user_id: userId || null,
      activity_type: activityType,
      endpoint: endpoint || null,
      details: details || {},
    });
    
    logger.warn(`Suspicious activity logged: ${activityType} from ${ip}`);
  } catch (error) {
    logger.error('Failed to log suspicious activity', error);
  }
}

/**
 * Auto-block an IP address
 */
export async function autoBlockIp(
  ip: string,
  reason: string,
  durationHours: number = 24
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Cannot auto-block IP - Supabase not configured');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.rpc('auto_block_suspicious_ip', {
      p_ip_address: ip,
      p_reason: reason,
      p_duration_hours: durationHours,
    });
    
    logger.warn(`IP ${ip} auto-blocked for ${durationHours}h: ${reason}`);
  } catch (error) {
    logger.error('Failed to auto-block IP', error);
  }
}

/**
 * Create an error response with security headers
 */
function createErrorResponse(
  status: number,
  message: string,
  details?: string
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      details,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        ...securityHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Validate an incoming request against security rules
 */
export async function validateRequest(
  req: Request,
  config?: SecurityConfig
): Promise<SecurityValidationResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const ip = getClientIP(req);
  
  // 1. Check HTTP method
  if (!cfg.allowedMethods.includes(req.method)) {
    return {
      valid: false,
      response: createErrorResponse(405, 'Method Not Allowed'),
      reason: 'invalid_method',
    };
  }
  
  // 2. Check IP blacklist
  if (!cfg.skipIpCheck) {
    const blocked = await isIpBlocked(ip);
    if (blocked) {
      return {
        valid: false,
        response: createErrorResponse(403, 'Forbidden', 'Your IP has been blocked'),
        reason: 'ip_blocked',
      };
    }
  }
  
  // 3. Check for suspicious headers
  for (const header of SUSPICIOUS_HEADERS) {
    if (req.headers.has(header)) {
      await logSuspiciousActivity(ip, 'suspicious_header', req.url, { header });
      return {
        valid: false,
        response: createErrorResponse(400, 'Bad Request'),
        reason: 'suspicious_header',
      };
    }
  }
  
  // 4. Check for suspicious User-Agent
  const userAgent = req.headers.get('user-agent') || '';
  for (const pattern of SUSPICIOUS_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      await logSuspiciousActivity(ip, 'suspicious_user_agent', req.url, { userAgent });
      return {
        valid: false,
        response: createErrorResponse(403, 'Forbidden'),
        reason: 'suspicious_user_agent',
      };
    }
  }
  
  // 5. Check Content-Type for mutating requests
  if (cfg.requireJsonContentType && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        valid: false,
        response: createErrorResponse(415, 'Unsupported Media Type', 'Content-Type must be application/json'),
        reason: 'invalid_content_type',
      };
    }
  }
  
  // 6. Check Content-Length for payload size
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > cfg.maxPayloadSize) {
      return {
        valid: false,
        response: createErrorResponse(413, 'Payload Too Large', `Maximum payload size is ${cfg.maxPayloadSize / (1024 * 1024)}MB`),
        reason: 'payload_too_large',
      };
    }
  }
  
  return { valid: true, ip };
}

/**
 * Add security headers to an existing Response
 */
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
