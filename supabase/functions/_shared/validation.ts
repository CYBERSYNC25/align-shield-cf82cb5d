/**
 * Backend Validation Utilities
 * 
 * CRITICAL: Never trust frontend data. Validate EVERYTHING on the backend.
 */

import { z } from 'npm:zod@3.23.8';

export { z };

// ============= Safe Primitives =============

export const safeString = (opts?: { min?: number; max?: number }) =>
  z.string()
    .trim()
    .min(opts?.min ?? 1, `Minimum ${opts?.min ?? 1} characters`)
    .max(opts?.max ?? 10000, `Maximum ${opts?.max ?? 10000} characters`)
    .transform((v) => v.replace(/\0/g, ''));

export const optionalSafeString = (opts?: { max?: number }) =>
  z.string()
    .trim()
    .max(opts?.max ?? 10000)
    .transform((v) => v.replace(/\0/g, ''))
    .optional()
    .or(z.literal(''));

export const safeEmail = z.string().trim().email().max(255).toLowerCase();

export const safeUrl = z.string().trim().url().max(2048);

/**
 * Enhanced webhook URL validation with comprehensive SSRF protection
 * 
 * Blocks:
 * - Private IPs: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
 * - Localhost: 127.x.x.x, localhost, 0.0.0.0
 * - IPv6 local: ::1, fe80::, fc00::, fd00::
 * - Link-local: 169.254.x.x (APIPA/cloud metadata)
 * - Cloud metadata: 169.254.169.254, metadata.google, metadata.azure.com
 * - Kubernetes: kubernetes.default.svc, *.cluster.local
 * - Non-HTTPS protocols
 */
export const webhookUrl = safeUrl.refine((url) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Must be HTTPS
    if (parsed.protocol !== 'https:') return false;
    
    // Blocked IPv4 patterns
    const blockedIpv4 = [
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // Loopback
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,            // Class A private
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // Class B private
      /^192\.168\.\d{1,3}\.\d{1,3}$/,               // Class C private
      /^169\.254\.\d{1,3}\.\d{1,3}$/,               // Link-local / metadata
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,   // CGNAT
      /^0\.0\.0\.0$/,                                // All interfaces
    ];
    
    for (const pattern of blockedIpv4) {
      if (pattern.test(hostname)) return false;
    }
    
    // Blocked IPv6 patterns
    const blockedIpv6 = [
      /^::1$/i, /^::$/, /^::ffff:127\./i, /^::ffff:10\./i,
      /^::ffff:192\.168\./i, /^::ffff:172\.(1[6-9]|2\d|3[01])\./i,
      /^::ffff:169\.254\./i, /^fe80:/i, /^fc[0-9a-f]{2}:/i, /^fd[0-9a-f]{2}:/i,
    ];
    
    for (const pattern of blockedIpv6) {
      if (pattern.test(hostname)) return false;
    }
    
    // Blocked hostnames (exact match)
    const blockedHostnames = [
      'localhost', '169.254.169.254', 'instance-data',
      'metadata.google.internal', 'metadata.google', 'metadata.azure.com',
      'kubernetes.default', 'kubernetes.default.svc', 'kubernetes.default.svc.cluster.local',
    ];
    
    if (blockedHostnames.includes(hostname)) return false;
    
    // Blocked hostname patterns (suffix match)
    const blockedSuffixes = ['.localhost', '.local', '.internal', '.cluster.local'];
    for (const suffix of blockedSuffixes) {
      if (hostname.endsWith(suffix)) return false;
    }
    
    return true;
  } catch {
    return false;
  }
}, 'URL blocked by SSRF protection policy');

export const safeFilename = z.string()
  .trim()
  .max(255)
  .refine((name) => !name.includes('..'), 'Path traversal not allowed')
  .refine((name) => !/[\/\\:\*\?"<>\|]/.test(name), 'Invalid characters')
  .transform((name) => name.replace(/^\.+/, ''));

export const severityLevel = z.enum(['low', 'medium', 'high', 'critical']);

export const logLevel = z.enum(['debug', 'info', 'warn', 'error', 'critical']);

export const logSource = z.enum(['frontend', 'edge_function', 'webhook', 'scheduled_job', 'database']);

// ============= Response Helpers =============

export function validationError(
  error: z.ZodError,
  corsHeaders: Record<string, string>
): Response {
  const formatted = error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));

  console.error('Validation failed:', JSON.stringify(formatted));

  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formatted,
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

export function parseAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  corsHeaders: Record<string, string>
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return { success: false, response: validationError(result.error, corsHeaders) };
  }
  
  return { success: true, data: result.data };
}

// ============= Common Schemas =============

export const metricsSchema = z.object({
  agent_token: safeString({ min: 1, max: 255 }),
  router_name: safeString({ min: 1, max: 255 }),
  cpu: z.number().min(0).max(100),
  version: safeString({ min: 1, max: 50 }),
});

export const logEventSchema = z.object({
  level: logLevel,
  source: logSource,
  message: safeString({ min: 1, max: 10000 }),
  metadata: z.record(z.unknown()).optional(),
  stack_trace: optionalSafeString({ max: 50000 }),
  function_name: optionalSafeString({ max: 255 }),
  component_name: optionalSafeString({ max: 255 }),
  request_id: optionalSafeString({ max: 255 }),
});

export const queryParamsSchema = z.object({
  severity: severityLevel.optional(),
  resolved: z.enum(['true', 'false']).optional(),
  integration: safeString({ max: 100 }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type MetricsPayload = z.infer<typeof metricsSchema>;
export type LogEventPayload = z.infer<typeof logEventSchema>;
export type QueryParams = z.infer<typeof queryParamsSchema>;
