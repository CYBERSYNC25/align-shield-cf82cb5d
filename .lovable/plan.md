

# Plano de Implementação: Validação Rigorosa de Inputs

## Resumo Executivo

Este plano implementa validação em 3 camadas (Frontend, Backend, Sanitização) para todos os pontos de entrada de dados do sistema APOC.

## Diagnóstico Atual

### ✅ O que já existe:
- Schemas Zod centralizados em `src/lib/form-schemas.ts` e `src/lib/auth-schemas.ts`
- Utilitários de sanitização em `src/lib/security/` (escapeHTML, escapeCSV, escapeSlackMarkdown)
- Validação de upload de arquivos com tipos e tamanhos permitidos
- Validação de assinaturas de webhooks inbound

### ⚠️ Gaps identificados:
1. **Formulários com validação manual** (CreateRiskModal, CreateAuditModal, CreateControlModal) não usam Zod
2. **Edge Functions** têm validação básica de campos obrigatórios, mas faltam schemas tipados
3. **Nomes de arquivos** não são sanitizados contra path traversal (`../../../`)
4. **URLs de webhooks** outbound não validam contra localhost/IPs internos
5. **Falta hook `useSecureForm`** unificado

---

## Fase 1: Hook `useSecureForm` (Novo)

Criar um hook que encapsula react-hook-form + Zod + sanitização automática.

### Arquivo: `src/hooks/useSecureForm.ts`

```typescript
import { useForm, UseFormReturn, FieldValues, DefaultValues, Path, PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { useCallback } from 'react';

interface UseSecureFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  sanitize?: boolean; // Auto-sanitize string fields
  onSubmit: (data: T) => Promise<void> | void;
}

interface UseSecureFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  handleSecureSubmit: (e?: React.FormEvent) => Promise<void>;
  setSecureValue: <K extends Path<T>>(name: K, value: PathValue<T, K>) => void;
}

export function useSecureForm<T extends FieldValues>({
  schema,
  defaultValues,
  sanitize = true,
  onSubmit,
}: UseSecureFormOptions<T>): UseSecureFormReturn<T> {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Sanitize string values
  const sanitizeValue = useCallback((value: unknown): unknown => {
    if (!sanitize) return value;
    
    if (typeof value === 'string') {
      // Trim whitespace
      let sanitized = value.trim();
      // Remove null bytes
      sanitized = sanitized.replace(/\0/g, '');
      // Sanitize HTML (prevents XSS)
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
      return sanitized;
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)])
      );
    }
    
    return value;
  }, [sanitize]);

  // Secure setValue that sanitizes on input
  const setSecureValue = useCallback(<K extends Path<T>>(name: K, value: PathValue<T, K>) => {
    const sanitized = sanitizeValue(value) as PathValue<T, K>;
    form.setValue(name, sanitized, { shouldValidate: true });
  }, [form, sanitizeValue]);

  // Secure submit handler
  const handleSecureSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    await form.handleSubmit(async (data) => {
      // Double-sanitize on submit
      const sanitizedData = sanitizeValue(data) as T;
      
      // Re-validate sanitized data
      const result = schema.safeParse(sanitizedData);
      if (!result.success) {
        console.error('Post-sanitization validation failed:', result.error);
        return;
      }
      
      await onSubmit(result.data);
    })(e);
  }, [form, sanitizeValue, schema, onSubmit]);

  return {
    ...form,
    handleSecureSubmit,
    setSecureValue,
  };
}
```

---

## Fase 2: Schemas de Validação Compartilhados

### Arquivo: `src/lib/validation/index.ts` (Novo)

Centralizar schemas reutilizáveis para frontend e backend.

```typescript
import { z } from 'zod';

// ============= Primitivos Seguros =============

export const safeStringSchema = (opts?: { min?: number; max?: number }) =>
  z.string()
    .trim()
    .min(opts?.min ?? 1, 'Campo obrigatório')
    .max(opts?.max ?? 1000, `Máximo ${opts?.max ?? 1000} caracteres`)
    .refine((v) => !v.includes('\0'), 'Caracteres inválidos');

export const emailSchema = z
  .string()
  .trim()
  .email('Email inválido')
  .max(255)
  .toLowerCase();

export const urlSchema = z
  .string()
  .trim()
  .url('URL inválida')
  .max(2048)
  .refine(
    (url) => url.startsWith('https://'),
    'URL deve usar HTTPS'
  );

// URL de webhook (não permite localhost/IPs internos)
export const webhookUrlSchema = urlSchema.refine(
  (url) => {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Bloquear localhost e variantes
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    
    // Bloquear IPs privados
    const ipv4Private = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;
    if (ipv4Private.test(hostname)) return false;
    
    // Bloquear ::1, 0.0.0.0
    if (['::1', '0.0.0.0', ''].includes(hostname)) return false;
    
    return true;
  },
  'URL não pode apontar para localhost ou IPs internos'
);

// Nome de arquivo seguro
export const safeFilenameSchema = z
  .string()
  .trim()
  .max(255)
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

// CPF (11 dígitos)
export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11, 'CPF deve ter 11 dígitos')
  .refine(validateCPF, 'CPF inválido');

// CNPJ (14 dígitos)  
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

// ============= Schemas de Formulários =============

export const createRiskSchema = z.object({
  title: safeStringSchema({ min: 3, max: 200 }),
  description: safeStringSchema({ max: 2000 }).optional().or(z.literal('')),
  category: z.enum(['operacional', 'financeiro', 'estrategico', 'tecnologico', 'regulatorio', 'reputacional']),
  probability: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  owner: safeStringSchema({ min: 3, max: 100 }),
  owner_role: safeStringSchema({ max: 100 }).optional().or(z.literal('')),
  status: z.enum(['active', 'mitigated', 'accepted']),
  next_review: z.string().optional(),
});

export const createAuditSchema = z.object({
  name: safeStringSchema({ min: 3, max: 200 }),
  framework: z.string().min(1, 'Framework é obrigatório'),
  auditor: safeStringSchema({ max: 100 }).optional().or(z.literal('')),
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

// Adicionar mais schemas conforme necessário...
```

---

## Fase 3: Validação Backend (Edge Functions)

### Arquivo: `supabase/functions/_shared/validation.ts` (Novo)

```typescript
/**
 * Backend Validation Utilities
 * 
 * CRITICAL: Never trust frontend data. Validate EVERYTHING.
 */

import { z } from 'npm:zod@3.23.8';

// Re-export common schemas for Deno
export { z };

// ============= Safe Primitives =============

export const safeString = (opts?: { min?: number; max?: number }) =>
  z.string()
    .trim()
    .min(opts?.min ?? 1)
    .max(opts?.max ?? 10000)
    .transform((v) => v.replace(/\0/g, '')); // Remove null bytes

export const safeEmail = z.string().trim().email().max(255).toLowerCase();

export const safeUrl = z.string().trim().url().max(2048);

// Webhook URL (blocks localhost/internal IPs)
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

// Safe filename (no path traversal)
export const safeFilename = z.string()
  .trim()
  .max(255)
  .refine((name) => !name.includes('..'), 'Path traversal not allowed')
  .refine((name) => !/[\/\\:\*\?"<>\|]/.test(name), 'Invalid characters')
  .transform((name) => name.replace(/^\.+/, '')); // Remove leading dots

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
```

---

## Fase 4: Atualizar Edge Functions

### Exemplo: `supabase/functions/ingest-metrics/index.ts`

```typescript
import { z } from '../_shared/validation.ts';
import { parseAndValidate, safeString } from '../_shared/validation.ts';

const metricsSchema = z.object({
  agent_token: safeString({ min: 1, max: 255 }),
  router_name: safeString({ min: 1, max: 255 }),
  cpu: z.number().min(0).max(100),
  version: safeString({ min: 1, max: 50 }),
});

// Na função:
const parsed = parseAndValidate(metricsSchema, await req.json(), corsHeaders);
if (!parsed.success) return parsed.response;

const { agent_token, router_name, cpu, version } = parsed.data;
// Continuar com dados validados e tipados...
```

### Atualizar: `supabase/functions/public-api/index.ts`

Adicionar validação de query params:

```typescript
const querySchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  resolved: z.enum(['true', 'false']).optional(),
  integration: safeString({ max: 100 }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
```

---

## Fase 5: Sanitização de Nomes de Arquivos

### Atualizar: `src/hooks/useFileUpload.tsx`

```typescript
// Adicionar função de sanitização
function sanitizeFilename(filename: string): string {
  // Remove path separators
  let safe = filename.replace(/[\/\\]/g, '_');
  // Remove path traversal attempts
  safe = safe.replace(/\.\./g, '_');
  // Remove null bytes
  safe = safe.replace(/\0/g, '');
  // Remove special chars that could cause issues
  safe = safe.replace(/[:\*\?"<>\|]/g, '_');
  // Remove leading dots/spaces
  safe = safe.replace(/^[\.\s]+/, '');
  // Limit length
  safe = safe.slice(0, 200);
  // Ensure non-empty
  if (!safe) safe = 'unnamed_file';
  return safe;
}

// Na função uploadFile:
const sanitizedName = sanitizeFilename(file.name);
const fileId = `${Date.now()}-${sanitizedName}`;
```

---

## Fase 6: Refatorar Formulários Existentes

### Atualizar: `src/components/risk/CreateRiskModal.tsx`

Migrar de estado manual para `useSecureForm`:

```typescript
import { useSecureForm } from '@/hooks/useSecureForm';
import { createRiskSchema } from '@/lib/validation';

const CreateRiskModal = ({ onSuccess }: CreateRiskModalProps) => {
  const { createRisk } = useRisks();
  
  const form = useSecureForm({
    schema: createRiskSchema,
    defaultValues: {
      title: '',
      description: '',
      category: 'operacional',
      probability: 'medium',
      impact: 'medium',
      owner: '',
      status: 'active',
    },
    onSubmit: async (data) => {
      const riskData = {
        ...data,
        riskScore: calculateRiskScore(data.probability, data.impact),
        lastReview: new Date().toISOString().split('T')[0],
      };
      await createRisk(riskData);
      onSuccess?.();
    },
  });

  return (
    <Form {...form}>
      {/* Usar FormField com form.control */}
    </Form>
  );
};
```

### Padrão similar para:
- `CreateAuditModal.tsx`
- `CreateControlModal.tsx`
- `CreatePlaybookModal.tsx`
- `CreateIncidentModal.tsx`
- E outros modais de criação...

---

## Fase 7: Validação de URLs de Webhooks Outbound

### Atualizar: `src/components/notifications/OutboundWebhookForm.tsx`

```typescript
import { webhookUrlSchema } from '@/lib/validation';

// No schema do formulário:
const webhookFormSchema = z.object({
  name: safeStringSchema({ min: 3, max: 100 }),
  url: webhookUrlSchema, // Bloqueia localhost/IPs internos
  secret: safeStringSchema({ min: 16, max: 256 }).optional(),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento'),
});
```

### Atualizar: `supabase/functions/send-outbound-webhook/index.ts`

```typescript
import { webhookUrl } from '../_shared/validation.ts';

// Validar URL antes de enviar
const urlResult = webhookUrl.safeParse(webhookConfig.url);
if (!urlResult.success) {
  logger.error('Invalid webhook URL blocked', { url: webhookConfig.url });
  return new Response(
    JSON.stringify({ error: 'Invalid webhook URL' }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useSecureForm.ts` | **NOVO** | Hook unificado com validação + sanitização |
| `src/lib/validation/index.ts` | **NOVO** | Schemas centralizados para frontend |
| `supabase/functions/_shared/validation.ts` | **NOVO** | Schemas e helpers para backend |
| `src/hooks/useFileUpload.tsx` | Modificar | Adicionar sanitização de filenames |
| `src/components/risk/CreateRiskModal.tsx` | Modificar | Migrar para useSecureForm |
| `src/components/audit/CreateAuditModal.tsx` | Modificar | Migrar para useSecureForm |
| `src/components/controls/CreateControlModal.tsx` | Modificar | Migrar para useSecureForm |
| `src/components/incidents/CreatePlaybookModal.tsx` | Modificar | Migrar para useSecureForm |
| `supabase/functions/ingest-metrics/index.ts` | Modificar | Adicionar schema Zod |
| `supabase/functions/public-api/index.ts` | Modificar | Validar query params |
| `supabase/functions/send-outbound-webhook/index.ts` | Modificar | Bloquear URLs internas |
| `supabase/functions/log-event/index.ts` | Modificar | Adicionar schema Zod |
| `supabase/functions/save-integration-credentials/index.ts` | Modificar | Adicionar validação tipada |

---

## Benefícios da Implementação

1. **Type-Safety End-to-End**: Mesmo schema valida frontend e backend
2. **Prevenção de XSS**: DOMPurify integrado no hook
3. **Prevenção de Path Traversal**: Sanitização de nomes de arquivo
4. **Prevenção de SSRF**: URLs de webhook não podem apontar para localhost
5. **Melhor UX**: Validação no onBlur mostra erros em tempo real
6. **Código DRY**: Schemas centralizados, reutilizáveis
7. **Mensagens de Erro Claras**: Retorno 400 com detalhes específicos

---

## Seção Técnica: Detalhes de Implementação

### Padrão de Validação Backend

```typescript
// Padrão recomendado para Edge Functions
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // 1. Validar e tipar
    const parsed = parseAndValidate(mySchema, body, corsHeaders);
    if (!parsed.success) return parsed.response;
    
    // 2. Usar dados tipados
    const { field1, field2 } = parsed.data;
    
    // 3. Lógica de negócio...
    
  } catch (error) {
    // 4. JSON parse errors, etc
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: corsHeaders }
    );
  }
});
```

### Integração com Form Components

```tsx
// Componente com useSecureForm
export function MyForm() {
  const { register, handleSecureSubmit, formState: { errors } } = useSecureForm({
    schema: mySchema,
    onSubmit: async (data) => {
      // data já está validado e sanitizado
      await api.create(data);
    },
  });

  return (
    <form onSubmit={handleSecureSubmit}>
      <Input {...register('name')} />
      {errors.name && <Error>{errors.name.message}</Error>}
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

