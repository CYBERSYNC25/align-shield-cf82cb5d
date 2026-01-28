/**
 * Centralized Validation Schemas
 * 
 * All form validations should use these schemas to ensure consistency
 * and security across the application.
 */

import { z } from 'zod';
import { validateWebhookUrl, getSsrfErrorMessage } from '@/lib/security/ssrfValidator';

// ============= Safe Primitives =============

export const safeStringSchema = (opts?: { min?: number; max?: number }) =>
  z.string()
    .trim()
    .min(opts?.min ?? 1, 'Campo obrigatório')
    .max(opts?.max ?? 1000, `Máximo ${opts?.max ?? 1000} caracteres`)
    .refine((v) => !v.includes('\0'), 'Caracteres inválidos');

export const optionalSafeStringSchema = (opts?: { max?: number }) =>
  z.string()
    .trim()
    .max(opts?.max ?? 1000, `Máximo ${opts?.max ?? 1000} caracteres`)
    .refine((v) => !v.includes('\0'), 'Caracteres inválidos')
    .optional()
    .or(z.literal(''));

export const emailSchema = z
  .string()
  .trim()
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .toLowerCase();

export const urlSchema = z
  .string()
  .trim()
  .url('URL inválida')
  .max(2048, 'URL muito longa')
  .refine(
    (url) => url.startsWith('https://'),
    'URL deve usar HTTPS'
  );

/**
 * Enhanced webhook URL schema with comprehensive SSRF protection
 * 
 * Blocks:
 * - Private IPs (10.x, 172.16-31.x, 192.168.x)
 * - Localhost (127.x.x.x, localhost, 0.0.0.0)
 * - IPv6 local (::1, fe80::, fc00::, fd00::)
 * - Link-local (169.254.x.x)
 * - Cloud metadata endpoints (169.254.169.254, metadata.google)
 * - Kubernetes internal (kubernetes.default.svc)
 * - Non-HTTPS protocols
 */
export const webhookUrlSchema = z
  .string()
  .trim()
  .url('URL inválida')
  .max(2048, 'URL muito longa')
  .refine(
    (url) => {
      const result = validateWebhookUrl(url);
      return result.valid;
    },
    (url) => {
      const result = validateWebhookUrl(url);
      return { message: getSsrfErrorMessage(result) };
    }
  );

export const safeFilenameSchema = z
  .string()
  .trim()
  .max(255, 'Nome do arquivo muito longo')
  .refine(
    (name) => !/[\/\\:\*\?"<>\|]/.test(name),
    'Nome contém caracteres inválidos'
  )
  .refine(
    (name) => !name.includes('..'),
    'Nome não pode conter ..'
  )
  .refine(
    (name) => !/^\./.test(name),
    'Nome não pode começar com ponto'
  );

// ============= Brazilian Document Schemas =============

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11, 'CPF deve ter 11 dígitos')
  .refine(validateCPF, 'CPF inválido');

export const cnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 14, 'CNPJ deve ter 14 dígitos')
  .refine(validateCNPJ, 'CNPJ inválido');

function validateCPF(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0, remainder;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf[i - 1]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf[i - 1]) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf[10]);
}

function validateCNPJ(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  let size = cnpj.length - 2, numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0, pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size++; numbers = cnpj.substring(0, size);
  sum = 0; pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

// ============= Form Schemas =============

export const severityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const statusEnum = z.enum(['active', 'mitigated', 'accepted', 'pending', 'in_progress', 'resolved', 'closed']);

export const createPlaybookSchema = z.object({
  name: safeStringSchema({ min: 3, max: 200 }),
  description: optionalSafeStringSchema({ max: 2000 }),
  category: z.enum(['Security', 'Infrastructure', 'Performance', 'Data Protection']),
  severity: severityEnum,
  estimatedTime: optionalSafeStringSchema({ max: 50 }),
  roles: optionalSafeStringSchema({ max: 500 }),
  triggers: optionalSafeStringSchema({ max: 1000 }),
});

export const reportIncidentSchema = z.object({
  title: safeStringSchema({ min: 3, max: 200 }),
  description: safeStringSchema({ min: 10, max: 5000 }),
  severity: severityEnum,
  impactLevel: z.enum(['low', 'medium', 'high']),
  affectedSystems: optionalSafeStringSchema({ max: 500 }),
  assignedTo: safeStringSchema({ min: 2, max: 100 }),
});

export const createRiskSchema = z.object({
  title: safeStringSchema({ min: 3, max: 200 }),
  description: optionalSafeStringSchema({ max: 2000 }),
  category: z.enum(['operacional', 'financeiro', 'estrategico', 'tecnologico', 'regulatorio', 'reputacional']),
  probability: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  owner: safeStringSchema({ min: 3, max: 100 }),
  owner_role: optionalSafeStringSchema({ max: 100 }),
  status: z.enum(['active', 'mitigated', 'accepted']),
  next_review: z.string().optional(),
});

export const createAuditSchema = z.object({
  name: safeStringSchema({ min: 3, max: 200 }),
  framework: z.string().min(1, 'Framework é obrigatório'),
  auditor: optionalSafeStringSchema({ max: 100 }),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'review', 'completed']),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  { message: 'Data de término deve ser após data de início', path: ['end_date'] }
);

export const webhookFormSchema = z.object({
  name: safeStringSchema({ min: 3, max: 100 }),
  url: webhookUrlSchema,
  secret: safeStringSchema({ min: 16, max: 256 }).optional().or(z.literal('')),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento'),
  enabled: z.boolean().default(true),
});

// Type exports
export type CreatePlaybookFormData = z.infer<typeof createPlaybookSchema>;
export type ReportIncidentFormData = z.infer<typeof reportIncidentSchema>;
export type CreateRiskFormData = z.infer<typeof createRiskSchema>;
export type CreateAuditFormData = z.infer<typeof createAuditSchema>;
export type WebhookFormData = z.infer<typeof webhookFormSchema>;
