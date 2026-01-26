
# Plano: Controles para Dados Pessoais (LGPD/GDPR)

## Análise do Estado Atual

### ✅ O que já existe:
| Componente | Status | Implementação |
|------------|--------|---------------|
| Redação básica de PII | ✅ | `filterSensitiveData()` em `proxy-api-request/index.ts` |
| Exportação de dados LGPD | ✅ | `export-user-data` Edge Function + `useDataExport` hook |
| Exclusão de conta (30 dias) | ✅ | `delete-user-account` Edge Function com soft delete |
| Audit logs imutáveis | ✅ | `system_audit_logs` e `audit_logs` tabelas |
| Páginas legais (Privacidade) | ✅ | `/legal/privacy`, `/legal/terms`, `/legal/dpa` |
| Remoção de dados sensíveis | ✅ | `removeSensitiveData()` em exportações |

### ❌ O que está faltando:
| Componente | Prioridade | Descrição |
|------------|------------|-----------|
| Tabela `data_classification` | **HIGH** | Catalogar campos sensíveis (CPF, email, IP) |
| Função `sanitize_for_logs()` centralizada | **HIGH** | Usar em TODOS os logs |
| Mascaramento parcial | **HIGH** | ex***@example.com, ***.456.789-** |
| Tabela `pii_access_audit` | **HIGH** | Auditoria de acesso a PII |
| Retenção automática (cron) | **MEDIUM** | Deletar dados após 30 dias, anonimizar após 2 anos |
| Stack trace sanitization | **MEDIUM** | Redact PII em stack traces |

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PII Protection Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌────────────────┐    ┌────────────────┐  │
│  │ Data Input   │───▶│ Classification │───▶│ Storage        │  │
│  │              │    │ Check          │    │ (encrypted)    │  │
│  └──────────────┘    └────────────────┘    └────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Data Classification Lookup:                               │  │
│  │ • public: sem restrições                                 │  │
│  │ • internal: org-only access                              │  │
│  │ • confidential: PII, requer auditoria                    │  │
│  │ • restricted: credenciais, nunca logado                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Access/Log Flow:                                          │  │
│  │                                                           │  │
│  │  ┌─────────────┐     ┌──────────────┐     ┌───────────┐  │  │
│  │  │ sanitize_   │────▶│ mask_pii()   │────▶│ Log/      │  │  │
│  │  │ for_logs()  │     │              │     │ Display   │  │  │
│  │  └─────────────┘     └──────────────┘     └───────────┘  │  │
│  │         │                                                 │  │
│  │         ▼                                                 │  │
│  │  ┌─────────────────┐                                      │  │
│  │  │ pii_access_     │ (quando confidential acessado)       │  │
│  │  │ audit log       │                                      │  │
│  │  └─────────────────┘                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Plano de Implementação

### Fase 1: Tabela de Classificação de Dados

#### 1.1 Migration SQL - `data_classification`

```sql
-- Enum para níveis de classificação
CREATE TYPE public.data_classification_level AS ENUM (
  'public',       -- Dados públicos
  'internal',     -- Apenas membros da org
  'confidential', -- PII, requer auditoria de acesso
  'restricted'    -- Credenciais, NUNCA logado
);

-- Tabela de classificação de campos
CREATE TABLE public.data_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  classification_level data_classification_level NOT NULL,
  pii_type TEXT, -- 'cpf', 'email', 'phone', 'ip', 'token', etc.
  mask_pattern TEXT, -- Regex ou função de mascaramento
  retention_days INT, -- NULL = indefinido
  requires_audit BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(table_name, column_name)
);

-- Índices
CREATE INDEX idx_data_classification_level ON public.data_classification(classification_level);
CREATE INDEX idx_data_classification_table ON public.data_classification(table_name);

-- RLS: apenas admins podem gerenciar
ALTER TABLE public.data_classification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage data classification"
  ON public.data_classification
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view classification"
  ON public.data_classification
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

#### 1.2 Seed Inicial de Classificações

```sql
INSERT INTO public.data_classification (table_name, column_name, classification_level, pii_type, mask_pattern, requires_audit) VALUES
-- Profiles
('profiles', 'display_name', 'internal', 'name', NULL, false),
('profiles', 'avatar_url', 'internal', NULL, NULL, false),

-- Auth (conceptual - campos não acessíveis diretamente)
('auth.users', 'email', 'confidential', 'email', 'mask_email', true),
('auth.users', 'phone', 'confidential', 'phone', 'mask_phone', true),

-- Audit logs
('audit_logs', 'ip_address', 'confidential', 'ip', 'mask_ip', true),
('audit_logs', 'user_agent', 'internal', 'user_agent', NULL, false),
('system_audit_logs', 'ip_address', 'confidential', 'ip', 'mask_ip', true),

-- Integrations (credentials = restricted)
('integrations', 'configuration', 'restricted', 'credentials', NULL, true),
('integration_oauth_tokens', 'access_token', 'restricted', 'token', NULL, true),
('integration_oauth_tokens', 'refresh_token', 'restricted', 'token', NULL, true),

-- API Keys
('api_keys', 'key_hash', 'restricted', 'hash', NULL, true),

-- Login attempts
('auth_login_attempts', 'email', 'confidential', 'email', 'mask_email', false),
('auth_login_attempts', 'ip_address', 'confidential', 'ip', 'mask_ip', false);
```

---

### Fase 2: Tabela de Auditoria de Acesso a PII

#### 2.1 Migration SQL - `pii_access_audit`

```sql
-- Tabela de auditoria de acesso a dados pessoais
CREATE TABLE public.pii_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'read', 'export', 'mask', 'decrypt'
  resource_type TEXT NOT NULL, -- 'profile', 'integration', etc.
  resource_id TEXT,
  pii_fields TEXT[] NOT NULL, -- ['email', 'cpf', 'phone']
  access_reason TEXT, -- Motivo do acesso (opcional)
  ip_address TEXT,
  user_agent TEXT,
  access_context JSONB DEFAULT '{}', -- Contexto adicional
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX idx_pii_access_user ON public.pii_access_audit(user_id);
CREATE INDEX idx_pii_access_org ON public.pii_access_audit(org_id);
CREATE INDEX idx_pii_access_resource ON public.pii_access_audit(resource_type, resource_id);
CREATE INDEX idx_pii_access_time ON public.pii_access_audit(created_at DESC);
CREATE INDEX idx_pii_access_pii_fields ON public.pii_access_audit USING GIN(pii_fields);

-- RLS: Append-only, apenas admins podem ler
ALTER TABLE public.pii_access_audit ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode inserir (via Edge Functions)
CREATE POLICY "Service role can insert PII access logs"
  ON public.pii_access_audit FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Admins podem ler logs
CREATE POLICY "Admins can view PII access logs"
  ON public.pii_access_audit FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') AND 
    org_id = get_user_org_id(auth.uid())
  );

-- NENHUM UPDATE/DELETE permitido (imutável)
-- (Sem policies de UPDATE/DELETE = bloqueado por padrão)
```

---

### Fase 3: Função Centralizada `sanitize_for_logs()`

#### 3.1 Criar `_shared/pii-sanitizer.ts`

```typescript
/**
 * PII Sanitizer - Centralized Data Sanitization for Logs
 * 
 * CRITICAL: Use this function for ALL logging operations.
 * Never log raw PII, tokens, credentials, or sensitive data.
 */

// Classification levels
export type ClassificationLevel = 'public' | 'internal' | 'confidential' | 'restricted';

// PII patterns with masking functions
const PII_PATTERNS = {
  // Email: jo***@example.com
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    mask: (email: string) => {
      const [local, domain] = email.split('@');
      if (!local || !domain) return '[REDACTED_EMAIL]';
      const masked = local.substring(0, 2) + '***';
      return `${masked}@${domain}`;
    }
  },
  
  // CPF: ***.456.789-**
  cpf: {
    regex: /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}\b/g,
    mask: (cpf: string) => {
      const digits = cpf.replace(/\D/g, '');
      if (digits.length !== 11) return '[REDACTED_CPF]';
      return `***.${digits.substring(3, 6)}.${digits.substring(6, 9)}-**`;
    }
  },
  
  // Phone: (11) ***-**67
  phone: {
    regex: /\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}\b/g,
    mask: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 8) return '[REDACTED_PHONE]';
      return `***-**${digits.slice(-2)}`;
    }
  },
  
  // IP: 192.168.***.***
  ip: {
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    mask: (ip: string) => {
      const parts = ip.split('.');
      if (parts.length !== 4) return '[REDACTED_IP]';
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  },
  
  // IPv6 (simplified)
  ipv6: {
    regex: /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/g,
    mask: () => '[REDACTED_IPV6]'
  },
  
  // Tokens: sk_live_****abc123 (first 8 + last 4)
  token: {
    regex: /\b(?:sk_live_|pk_live_|sk_test_|pk_test_|Bearer\s+)?[A-Za-z0-9_-]{20,}\b/gi,
    mask: (token: string) => {
      if (token.length < 12) return '[REDACTED_TOKEN]';
      // Keep prefix if recognizable
      const prefixMatch = token.match(/^(sk_live_|pk_live_|sk_test_|pk_test_|Bearer\s+)/i);
      const prefix = prefixMatch ? prefixMatch[0] : '';
      const rest = token.substring(prefix.length);
      if (rest.length < 8) return `${prefix}[REDACTED]`;
      return `${prefix}${rest.substring(0, 4)}****${rest.slice(-4)}`;
    }
  },
  
  // Credit Card: ****-****-****-1234
  creditCard: {
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    mask: (cc: string) => {
      const digits = cc.replace(/\D/g, '');
      if (digits.length < 16) return '[REDACTED_CARD]';
      return `****-****-****-${digits.slice(-4)}`;
    }
  },
  
  // SSN (US): ***-**-1234
  ssn: {
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    mask: (ssn: string) => {
      const digits = ssn.replace(/\D/g, '');
      if (digits.length !== 9) return '[REDACTED_SSN]';
      return `***-**-${digits.slice(-4)}`;
    }
  }
};

// Fields that should NEVER be logged (restricted level)
const RESTRICTED_FIELDS = new Set([
  'password', 'secret', 'token', 'key', 'credential', 'private_key',
  'access_token', 'refresh_token', 'api_key', 'apikey', 'authorization',
  'bearer', 'session_token', 'jwt', 'client_secret', 'webhook_secret',
  'encryption_key', 'signing_key', 'master_key'
]);

// Fields with PII that need masking (confidential level)
const CONFIDENTIAL_FIELDS = new Set([
  'email', 'phone', 'mobile', 'cpf', 'cnpj', 'ssn', 'tax_id',
  'ip_address', 'ip', 'credit_card', 'card_number', 'cvv',
  'bank_account', 'iban', 'passport', 'national_id', 'address',
  'birth_date', 'date_of_birth', 'dob'
]);

/**
 * Masks a single string value by detecting PII patterns
 */
export function maskPiiValue(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  let masked = value;
  
  // Apply all pattern masks
  for (const [type, config] of Object.entries(PII_PATTERNS)) {
    masked = masked.replace(config.regex, (match) => config.mask(match));
  }
  
  return masked;
}

/**
 * Sanitizes an object for safe logging
 * 
 * @param data - Any data to sanitize
 * @param depth - Current recursion depth (prevents stack overflow)
 * @returns Sanitized copy of the data
 */
export function sanitizeForLogs(data: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  
  // Handle null/undefined
  if (data === null || data === undefined) return data;
  
  // Handle primitives
  if (typeof data === 'string') {
    return maskPiiValue(data);
  }
  
  if (typeof data !== 'object') return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogs(item, depth + 1));
  }
  
  // Handle objects
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field is restricted (never log)
    if (RESTRICTED_FIELDS.has(lowerKey) || 
        Array.from(RESTRICTED_FIELDS).some(f => lowerKey.includes(f))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Check if field is confidential (mask PII)
    if (CONFIDENTIAL_FIELDS.has(lowerKey) ||
        Array.from(CONFIDENTIAL_FIELDS).some(f => lowerKey.includes(f))) {
      if (typeof value === 'string') {
        sanitized[key] = maskPiiValue(value);
      } else {
        sanitized[key] = '[REDACTED_PII]';
      }
      continue;
    }
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeForLogs(value, depth + 1);
  }
  
  return sanitized;
}

/**
 * Sanitizes a stack trace, removing PII that might appear in error messages
 */
export function sanitizeStackTrace(stackTrace: string | undefined): string | undefined {
  if (!stackTrace) return stackTrace;
  
  // Mask PII patterns in the stack trace
  return maskPiiValue(stackTrace);
}

/**
 * Creates a sanitized error object for logging
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: maskPiiValue(error.message),
      stack: sanitizeStackTrace(error.stack)
    };
  }
  
  if (typeof error === 'string') {
    return { message: maskPiiValue(error) };
  }
  
  if (typeof error === 'object' && error !== null) {
    return sanitizeForLogs(error) as Record<string, unknown>;
  }
  
  return { message: String(error) };
}

// Export for use in Edge Functions
export default {
  sanitizeForLogs,
  maskPiiValue,
  sanitizeStackTrace,
  sanitizeError
};
```

---

### Fase 4: Atualizar Logger de Edge Functions

#### 4.1 Atualizar `_shared/logger.ts`

```typescript
// Adicionar import do sanitizer
import { sanitizeForLogs, sanitizeError } from './pii-sanitizer.ts';

// Modificar métodos de log para sanitizar automaticamente
private output(entry: LogEntry): void {
  // SANITIZE data before logging
  const sanitizedEntry = {
    ...entry,
    data: entry.data !== undefined ? sanitizeForLogs(entry.data) : undefined
  };
  
  if (this.isProd) {
    console.log(JSON.stringify(sanitizedEntry));
  } else {
    // ... resto do código
  }
}

// Adicionar método para logar com auditoria de PII
async logPiiAccess(
  supabase: any,
  userId: string,
  orgId: string | undefined,
  action: string,
  resourceType: string,
  resourceId: string | undefined,
  piiFields: string[],
  reason?: string
): Promise<void> {
  try {
    await supabase.from('pii_access_audit').insert({
      user_id: userId,
      org_id: orgId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      pii_fields: piiFields,
      access_reason: reason
    });
  } catch (err) {
    console.error('[Logger] Failed to log PII access:', err);
  }
}
```

---

### Fase 5: Atualizar Frontend Logger

#### 5.1 Criar `src/lib/security/piiSanitizer.ts`

Versão frontend do sanitizer (sem dependências Deno), com as mesmas funções de mascaramento.

#### 5.2 Atualizar `src/lib/global-error-handler.ts`

```typescript
import { sanitizeForLogs, sanitizeStackTrace } from '@/lib/security/piiSanitizer';

async function sendLogToBackend(payload: LogPayload) {
  // Sanitize all data before sending
  const sanitizedPayload = {
    ...payload,
    message: sanitizeForLogs(payload.message) as string,
    stack_trace: sanitizeStackTrace(payload.stack_trace),
    metadata: sanitizeForLogs(payload.metadata)
  };
  
  await supabase.functions.invoke('log-event', {
    body: sanitizedPayload
  });
}
```

---

### Fase 6: Automação de Retenção de Dados

#### 6.1 Criar Edge Function `cleanup-pii-data`

```typescript
/**
 * Cleanup PII Data - LGPD/GDPR Compliance
 * 
 * Runs on schedule (daily) to:
 * 1. Hard delete accounts scheduled for deletion (30 days passed)
 * 2. Anonymize inactive accounts (2 years)
 * 3. Clean up expired data exports
 */

const handler = async (req: Request) => {
  // 1. Hard delete scheduled accounts
  const { data: toDelete } = await supabase
    .from('profiles')
    .select('user_id')
    .not('deletion_scheduled_for', 'is', null)
    .lte('deletion_scheduled_for', new Date().toISOString());
  
  for (const profile of toDelete || []) {
    await supabase.auth.admin.deleteUser(profile.user_id);
    // Cascade will handle related data
  }
  
  // 2. Anonymize inactive accounts (2 years)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  await supabase
    .from('profiles')
    .update({ 
      display_name: 'Usuário Anônimo',
      avatar_url: null,
      organization: null
    })
    .lt('updated_at', twoYearsAgo.toISOString())
    .is('deleted_at', null);
  
  // 3. Delete expired data exports
  await supabase.storage
    .from('data-exports')
    .remove(['expired-files/*']); // Clean expired
    
  return new Response(JSON.stringify({ success: true }));
};
```

#### 6.2 Agendar Cron Job (via SQL)

```sql
SELECT cron.schedule(
  'cleanup-pii-data-daily',
  '0 3 * * *', -- 3 AM daily
  $$
  SELECT net.http_post(
    url:='https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/cleanup-pii-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

### Fase 7: API para Solicitação de Exclusão Imediata

#### 7.1 Atualizar `delete-user-account` Edge Function

```typescript
// Adicionar opção de exclusão imediata (com confirmação extra)
if (body.immediate_deletion && body.confirm_immediate) {
  // Verificar dupla autenticação (senha + código email)
  if (!body.confirmation_code || !await verifyCode(body.confirmation_code)) {
    return error('Código de confirmação inválido');
  }
  
  // Executar hard delete imediato
  await supabase.auth.admin.deleteUser(user.id);
  
  // Log auditoria
  await logPiiAccess(supabase, user.id, null, 'immediate_deletion', 
    'user_account', user.id, ['all'], 'User requested immediate deletion');
  
  return { success: true, message: 'Conta excluída permanentemente.' };
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Database Migration** | Criar | Tabelas `data_classification`, `pii_access_audit` |
| `supabase/functions/_shared/pii-sanitizer.ts` | **NOVO** | Sanitizador centralizado de PII |
| `supabase/functions/_shared/logger.ts` | Modificar | Integrar sanitizer + auditoria PII |
| `src/lib/security/piiSanitizer.ts` | **NOVO** | Versão frontend do sanitizer |
| `src/lib/security/index.ts` | Modificar | Exportar novo sanitizer |
| `src/lib/global-error-handler.ts` | Modificar | Usar sanitizer em logs |
| `supabase/functions/cleanup-pii-data/index.ts` | **NOVO** | Job de limpeza de dados |
| `supabase/functions/proxy-api-request/index.ts` | Modificar | Usar sanitizer centralizado |
| `supabase/functions/export-user-data/index.ts` | Modificar | Log acesso a PII |
| `supabase/functions/delete-user-account/index.ts` | Modificar | Opção de exclusão imediata |

---

## Padrões de Mascaramento

| Tipo | Original | Mascarado |
|------|----------|-----------|
| Email | joao.silva@empresa.com | jo***@empresa.com |
| CPF | 123.456.789-01 | ***.456.789-** |
| Telefone | (11) 98765-4321 | ***-**21 |
| IP | 192.168.1.100 | 192.168.*.* |
| Token | sk_live_abc123xyz789... | sk_live_abc1****z789 |
| Cartão | 4111-1111-1111-1234 | ****-****-****-1234 |
| Senha | qualquersenha | [REDACTED] |

---

## Fluxo de Auditoria de PII

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PII Access Audit Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User requests data (export, view profile, etc.)            │
│                        │                                        │
│                        ▼                                        │
│  2. Edge Function checks data_classification table             │
│                        │                                        │
│                        ▼                                        │
│  3. If classification = 'confidential':                         │
│     ├─▶ Log to pii_access_audit                                │
│     │     - who: user_id                                       │
│     │     - when: created_at                                   │
│     │     - what: pii_fields[]                                 │
│     │     - why: access_reason                                 │
│     │                                                          │
│     └─▶ Apply masking if displaying                            │
│                        │                                        │
│                        ▼                                        │
│  4. If classification = 'restricted':                           │
│     ├─▶ Log to pii_access_audit                                │
│     └─▶ NEVER return raw value (only [REDACTED])               │
│                        │                                        │
│                        ▼                                        │
│  5. Return sanitized data to user                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Políticas de Retenção

| Tipo de Dado | Retenção | Ação |
|--------------|----------|------|
| Contas excluídas | 30 dias | Hard delete (dados + auth.users) |
| Contas inativas | 2 anos | Anonimização (display_name, avatar) |
| Logs de auditoria | 7 anos | Imutável (compliance) |
| Exportações | 24 horas | Delete arquivo do storage |
| Tokens OAuth expirados | 90 dias | Revoke + delete |
| Logs de sistema | 90 dias | Delete (configurável) |

---

## Benefícios da Implementação

1. **Conformidade LGPD/GDPR**: Classificação, mascaramento e auditoria
2. **Auditoria Completa**: Quem acessou qual PII, quando e por quê
3. **Logs Seguros**: Nenhum dado sensível em logs
4. **Retenção Automática**: Limpeza programada de dados
5. **Direito ao Esquecimento**: Exclusão imediata disponível
6. **Portabilidade**: Exportação já implementada

---

## Seção Técnica: Resumo de APIs

### Funções do Sanitizer

```typescript
// Sanitizar qualquer dado para logs
sanitizeForLogs(data: unknown): unknown

// Mascarar valor específico
maskPiiValue(value: string): string

// Sanitizar stack trace
sanitizeStackTrace(trace: string): string

// Sanitizar erro completo
sanitizeError(error: unknown): Record<string, unknown>
```

### Uso em Edge Functions

```typescript
import { sanitizeForLogs } from '../_shared/pii-sanitizer.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('MyFunction');

// Logs automaticamente sanitizados
logger.info('Processing request', sanitizeForLogs(requestBody));
```
