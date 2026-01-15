/**
 * Rate Limiter using Upstash Redis
 * Implements sliding window rate limiting with fail-open behavior
 * 
 * @module rate-limiter
 */

import { createLogger } from './logger.ts';

const logger = createLogger('RateLimit');

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check rate limit for a user/endpoint combination using sliding window algorithm
 * @param userId - User ID or IP address
 * @param endpoint - Endpoint identifier (e.g., 'sync-integration-data')
 * @param maxRequests - Maximum requests allowed in the window (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const url = Deno.env.get('UPSTASH_REDIS_URL');
  const token = Deno.env.get('UPSTASH_REDIS_TOKEN');

  // Fail-open if Redis is not configured (development mode)
  if (!url || !token) {
    logger.warn('Upstash not configured, bypassing rate limit');
    return { allowed: true, remaining: maxRequests, resetAt: 0, limit: maxRequests };
  }

  const key = `ratelimit:${endpoint}:${userId}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  try {
    // Pipeline for atomic operations:
    // 1. ZREMRANGEBYSCORE - Remove old entries outside the window
    // 2. ZADD - Add current request timestamp
    // 3. ZCOUNT - Count requests in the current window
    // 4. EXPIRE - Set TTL to prevent stale keys
    const pipeline = [
      ['ZREMRANGEBYSCORE', key, '0', windowStart.toString()],
      ['ZADD', key, now.toString(), `${now}-${crypto.randomUUID().slice(0, 8)}`],
      ['ZCOUNT', key, windowStart.toString(), now.toString()],
      ['EXPIRE', key, (windowSeconds * 2).toString()]
    ];

    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!response.ok) {
      logger.error('Redis pipeline error', response.status);
      // Fail-open on Redis errors
      return { allowed: true, remaining: maxRequests, resetAt: 0, limit: maxRequests };
    }

    const results = await response.json();
    
    // ZCOUNT result is at index 2
    const requestCount = results[2]?.result || 0;
    const allowed = requestCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - requestCount);
    const resetAt = Math.ceil((now + windowSeconds * 1000) / 1000);

    if (!allowed) {
      logger.warn(`Rate limit exceeded for ${userId} on ${endpoint}: ${requestCount}/${maxRequests}`);
    }

    return { allowed, remaining, resetAt, limit: maxRequests };
  } catch (error) {
    logger.error('Error checking rate limit', error);
    // Fail-open - allow request if Redis fails
    return { allowed: true, remaining: maxRequests, resetAt: 0, limit: maxRequests };
  }
}

/**
 * Generate standard rate limit headers for HTTP responses
 * @param result - RateLimitResult from checkRateLimit
 * @returns Headers object with X-RateLimit-* headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };
}

/**
 * Check if the request is using service_role key (internal call)
 * @param authHeader - Authorization header value
 * @returns true if using service_role key
 */
export function isServiceRole(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) return false;
  return authHeader === `Bearer ${serviceRoleKey}`;
}

/**
 * Create a 429 Too Many Requests response with proper headers
 * @param result - RateLimitResult from checkRateLimit
 * @param corsHeaders - CORS headers to include
 * @returns Response object
 */
export function rateLimitExceededResponse(
  result: RateLimitResult, 
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = Math.max(1, result.resetAt - Math.floor(Date.now() / 1000));
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too Many Requests',
      message: 'Limite de requisições excedido. Tente novamente em alguns segundos.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders(result),
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
