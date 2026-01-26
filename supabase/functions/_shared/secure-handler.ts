/**
 * Secure Handler Wrapper for Edge Functions
 * Combines CORS, security middleware, rate limiting, and timeouts
 * 
 * @module secure-handler
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { 
  validateRequest, 
  corsHeaders, 
  securityHeaders, 
  logSuspiciousActivity,
  autoBlockIp,
  getClientIP,
  SecurityConfig 
} from './security-middleware.ts';
import { 
  checkTieredRateLimit, 
  rateLimitHeaders, 
  rateLimitExceededResponse,
  RateLimitTier,
  RateLimitResult,
} from './rate-limiter.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('SecureHandler');

/**
 * Context passed to the handler function
 */
export interface SecurityContext {
  /** Rate limit tier applied to this request */
  tier: RateLimitTier;
  /** Identifier used for rate limiting (user_id, api_key_id, or IP) */
  identifier: string;
  /** Rate limit result with remaining requests */
  rateLimitResult: RateLimitResult;
  /** Client IP address */
  ip: string;
  /** User ID if authenticated */
  userId?: string;
  /** Organization ID if authenticated */
  orgId?: string;
}

/**
 * Options for the secure handler
 */
export interface HandlerOptions {
  /** Endpoint name for rate limiting and logging */
  endpoint?: string;
  /** Security middleware configuration */
  security?: SecurityConfig;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Skip rate limiting (use carefully!) */
  skipRateLimit?: boolean;
  /** Custom rate limit tier (overrides auto-detection) */
  rateLimitTier?: RateLimitTier;
  /** Custom max requests (overrides tier defaults) */
  maxRequests?: number;
  /** Custom window in seconds (overrides tier defaults) */
  windowSeconds?: number;
}

/**
 * Hash API key using SHA-256
 */
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Determine rate limit tier based on request authentication
 */
async function determineRateLimitTier(
  req: Request,
  ip: string
): Promise<{ tier: RateLimitTier; identifier: string; userId?: string; orgId?: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { tier: 'unauthenticated', identifier: `ip:${ip}` };
  }
  
  // 1. Check for API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && supabaseServiceKey) {
    try {
      const keyHash = await hashApiKey(apiKey);
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data, error } = await supabase.rpc('validate_api_key', { p_key_hash: keyHash });
      
      if (!error && data?.[0]?.is_valid) {
        const keyData = data[0];
        const tierMap: Record<string, RateLimitTier> = {
          'free': 'api_free',
          'pro': 'api_pro',
          'enterprise': 'api_enterprise',
        };
        const tier = tierMap[keyData.rate_limit_tier] || 'api_free';
        
        return {
          tier,
          identifier: `apikey:${keyData.api_key_id}`,
          userId: keyData.user_id,
          orgId: keyData.org_id,
        };
      }
    } catch (error) {
      logger.error('Error validating API key', error);
    }
  }
  
  // 2. Check for JWT authentication
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        // Get org_id from profile
        let orgId: string | undefined;
        if (supabaseServiceKey) {
          const adminClient = createClient(supabaseUrl, supabaseServiceKey);
          const { data: profile } = await adminClient
            .from('profiles')
            .select('org_id')
            .eq('user_id', user.id)
            .single();
          orgId = profile?.org_id;
        }
        
        return {
          tier: 'authenticated',
          identifier: `user:${user.id}`,
          userId: user.id,
          orgId,
        };
      }
    } catch (error) {
      logger.error('Error validating JWT', error);
    }
  }
  
  // 3. Fall back to IP-based rate limiting
  return { tier: 'unauthenticated', identifier: `ip:${ip}` };
}

/**
 * Create a secure handler wrapper for Edge Functions
 * 
 * @example
 * ```typescript
 * Deno.serve(createSecureHandler(async (req, ctx) => {
 *   // Your handler logic here
 *   // ctx contains: tier, identifier, rateLimitResult, ip, userId, orgId
 *   return new Response(JSON.stringify({ success: true }));
 * }, {
 *   endpoint: 'my-endpoint',
 *   security: { requireJsonContentType: true },
 * }));
 * ```
 */
export function createSecureHandler(
  handler: (req: Request, ctx: SecurityContext) => Promise<Response>,
  options?: HandlerOptions
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const startTime = Date.now();
    const endpoint = options?.endpoint || 'unknown';
    
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }
    
    // 2. Security validation
    const securityResult = await validateRequest(req, options?.security);
    if (!securityResult.valid) {
      logger.warn(`Security validation failed: ${securityResult.reason}`, { endpoint });
      return securityResult.response;
    }
    
    const ip = securityResult.ip;
    
    // 3. Determine rate limit tier
    const { tier, identifier, userId, orgId } = options?.rateLimitTier
      ? { tier: options.rateLimitTier, identifier: `custom:${ip}`, userId: undefined, orgId: undefined }
      : await determineRateLimitTier(req, ip);
    
    // 4. Apply rate limiting
    let rateLimitResult: RateLimitResult = { allowed: true, remaining: 999, resetAt: 0, limit: 999 };
    
    if (!options?.skipRateLimit) {
      rateLimitResult = await checkTieredRateLimit(
        identifier,
        tier,
        endpoint,
        options?.maxRequests,
        options?.windowSeconds
      );
      
      if (!rateLimitResult.allowed) {
        // Log suspicious activity if severely exceeded
        if (rateLimitResult.remaining < -10) {
          await logSuspiciousActivity(ip, 'rate_limit_abuse', endpoint, {
            tier,
            identifier,
            exceeded_by: Math.abs(rateLimitResult.remaining),
          }, userId);
          
          // Auto-block if extremely abusive (100+ requests over limit)
          if (rateLimitResult.remaining < -100) {
            await autoBlockIp(ip, `Rate limit abuse: ${Math.abs(rateLimitResult.remaining)} over limit on ${endpoint}`, 1);
          }
        }
        
        return rateLimitExceededResponse(rateLimitResult, { ...corsHeaders, ...securityHeaders });
      }
    }
    
    // 5. Create security context
    const ctx: SecurityContext = {
      tier,
      identifier,
      rateLimitResult,
      ip,
      userId,
      orgId,
    };
    
    // 6. Execute handler with timeout
    const timeout = options?.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await Promise.race([
        handler(req, ctx),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Request timeout'));
          });
        }),
      ]);
      
      clearTimeout(timeoutId);
      
      // 7. Add security and rate limit headers to response
      const headers = new Headers(response.headers);
      
      Object.entries(securityHeaders).forEach(([k, v]) => headers.set(k, v));
      Object.entries(corsHeaders).forEach(([k, v]) => {
        if (!headers.has(k)) headers.set(k, v);
      });
      Object.entries(rateLimitHeaders(rateLimitResult)).forEach(([k, v]) => headers.set(k, v));
      
      headers.set('Content-Type', 'application/json');
      
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        logger.warn(`Slow request: ${endpoint} took ${duration}ms`);
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.message === 'Request timeout') {
        logger.warn(`Request timeout: ${endpoint} after ${timeout}ms`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Request Timeout',
            message: 'A requisição excedeu o tempo limite.',
          }),
          {
            status: 408,
            headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      logger.error(`Handler error: ${endpoint}`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Erro interno do servidor.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
