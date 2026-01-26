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

export const webhookUrl = safeUrl.refine((url) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    if (hostname === 'localhost') return false;
    if (hostname === '127.0.0.1') return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname)) return false;
    if (['::1', '0.0.0.0'].includes(hostname)) return false;
    if (hostname.endsWith('.local')) return false;
    
    return true;
  } catch {
    return false;
  }
}, 'URL cannot point to localhost or internal IPs');

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
