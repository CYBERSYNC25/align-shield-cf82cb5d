
# Auditoria Completa de Segurança do Sistema APOC

## Resumo Executivo

Realizei uma auditoria completa de segurança no sistema APOC, cobrindo as 5 áreas solicitadas. Foram identificadas **12 vulnerabilidades** distribuídas em diferentes níveis de severidade.

| Severidade | Quantidade |
|------------|------------|
| Critical   | 1          |
| High       | 3          |
| Medium     | 6          |
| Low        | 2          |

---

## 1. SQL Injection

### Status: ✅ SEGURO (com observações)

**Análise:**
- Todas as queries utilizam o SDK do Supabase com prepared statements
- Chamadas `.rpc()` passam parâmetros como objetos (não concatenação de strings)
- Não foram encontrados padrões de `execute_sql()` ou `.raw()` com input de usuário

**Funções SQL auditadas:**
- `create_notification`, `enqueue_job`, `validate_api_key` - ✅ Seguras
- `get_trust_center_by_slug` - ✅ Parâmetros tratados corretamente
- Cache invalidation usa concatenação de strings, mas com valores internos (não user input)

**Vulnerabilidades Encontradas:** 0

---

## 2. XSS (Cross-Site Scripting)

### Status: ⚠️ VULNERABILIDADES ENCONTRADAS

| # | Severidade | Localização | Descrição |
|---|------------|-------------|-----------|
| 1 | **Medium** | `src/components/ui/chart.tsx:70-85` | `dangerouslySetInnerHTML` para injetar CSS. Se `ChartConfig` contiver valores de usuário não sanitizados, pode permitir XSS via CSS injection. |
| 2 | **Medium** | `supabase/functions/send-notification/index.ts:134` | `payload.title` e `payload.message` enviados para Slack sem sanitização. |
| 3 | **Low** | `src/components/inventory/ExportCSVButton.tsx` | Função `escapeCSV` não previne CSV Injection (fórmulas `=`, `+`, `-`, `@`). |
| 4 | **Medium** | Múltiplos locais | JSON.parse de dados externos renderizados sem sanitização explícita. |

**Biblioteca de Sanitização:** ❌ DOMPurify ou equivalente **NÃO instalado**

**Correções Necessárias:**
```typescript
// 1. Instalar DOMPurify
// npm install dompurify @types/dompurify

// 2. chart.tsx - Validar cores antes de injetar
const isValidColor = (color: string) => /^(#[0-9a-f]{3,8}|rgb|hsl|[a-z]+)$/i.test(color);
const sanitizedColor = isValidColor(color) ? color : '#000000';

// 3. CSV Export - Prevenir formula injection
function escapeCSV(value: string): string {
  // Prevenir CSV injection
  if (/^[=+\-@\t\r]/.test(value)) {
    value = "'" + value; // Prefixar com apóstrofo
  }
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// 4. Slack notifications - Escapar markdown
const escapeSlackMarkdown = (text: string) => 
  text.replace(/[*_~`>]/g, '\\$&');
```

---

## 3. CSRF (Cross-Site Request Forgery)

### Status: ⚠️ PARCIALMENTE IMPLEMENTADO

| # | Severidade | Componente | Status |
|---|------------|------------|--------|
| 1 | ✅ OK | OAuth Flows | CSRF state token implementado com expiração de 10 min |
| 2 | ✅ OK | Supabase Auth | SameSite cookies protegem sessões |
| 3 | **Low** | Forms gerais | Sem tokens CSRF explícitos em formulários de dados |

**Análise:**
- OAuth (Google, Azure) usa `state` parameter com timestamp e random UUID
- Supabase Auth usa `SameSite=Lax` cookies por padrão
- APIs internas dependem de JWT no header Authorization (stateless, não vulnerável a CSRF tradicional)

**Recomendação:** A arquitetura atual (JWT-based) não requer tokens CSRF tradicionais para APIs. O risco é **Baixo** porque:
- Todas as mutations requerem JWT válido no header
- Browsers modernos respeitam SameSite cookies

---

## 4. Credenciais Expostas

### Status: ⚠️ VULNERABILIDADES ENCONTRADAS

| # | Severidade | Problema | Localização |
|---|------------|----------|-------------|
| 1 | **Critical** | `.env` **NÃO** está no `.gitignore` | `.gitignore` não inclui `.env` |
| 2 | **High** | Supabase keys hardcoded | `src/integrations/supabase/client.ts:4-5` |
| 3 | **High** | Supabase keys no `.env` commitado | `.env` contém `VITE_SUPABASE_*` |

**Detalhes da Análise:**

```text
# .gitignore atual:
logs, *.log, node_modules, dist, *.local, .vscode/*, .idea, .DS_Store...
# ❌ FALTA: .env, .env.local, .env.*.local
```

```typescript
// src/integrations/supabase/client.ts - HARDCODED!
const SUPABASE_URL = "https://ofbyxnpprwwuieabwhdo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**Mitigação Existente:**
- ✅ Credenciais de integrações são criptografadas (AES-256-GCM via `crypto-utils.ts`)
- ✅ `TOKEN_ENCRYPTION_KEY` armazenado em Supabase Secrets (não no código)
- ✅ Auditor tokens são hasheados (SHA-256)

**Correções Necessárias:**
```gitignore
# Adicionar ao .gitignore:
.env
.env.local
.env.*.local
*.env
```

**Nota sobre SUPABASE_PUBLISHABLE_KEY:** Esta é uma chave pública (anon key) que é **esperada** estar no frontend. Ela NÃO é um secret. O risco real é a `SERVICE_ROLE_KEY` que está corretamente apenas em Supabase Secrets.

---

## 5. Autenticação

### Status: ⚠️ VULNERABILIDADES ENCONTRADAS

| # | Severidade | Problema | Correção |
|---|------------|----------|----------|
| 1 | **High** | Sem rate limiting no login | Implementar limite 5 tentativas/15min |
| 2 | **Medium** | Sem lockout de conta temporário | Bloquear por 30min após 5 falhas |
| 3 | ✅ OK | CAPTCHA implementado | Cloudflare Turnstile ativo |
| 4 | **Medium** | CAPTCHA não aumenta após falhas | Adicionar progressive CAPTCHA |
| 5 | ⚠️ WARN | Leaked Password Protection desabilitado | Habilitar no Supabase Dashboard |

**Análise Detalhada:**

1. **Rate Limiting no Login:**
   - ❌ `src/pages/Auth.tsx` não implementa tracking de tentativas
   - ✅ Rate limiter existe (`_shared/rate-limiter.ts`) mas não é usado no auth
   - ✅ API pública tem rate limiting (100 req/min free tier)

2. **CAPTCHA:**
   - ✅ Cloudflare Turnstile implementado no login
   - ❌ Não é progressivo (aparece sempre, não aumenta dificuldade)

3. **Account Lockout:**
   - ❌ Não implementado
   - Supabase Auth não tem lockout nativo

**Correções Necessárias:**

```sql
-- Criar tabela de tracking de login
CREATE TABLE auth_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false
);

CREATE INDEX idx_login_attempts_email_time 
  ON auth_login_attempts(email, attempted_at);

-- Função para verificar se pode tentar login
CREATE OR REPLACE FUNCTION can_attempt_login(p_email TEXT)
RETURNS TABLE(allowed BOOLEAN, attempts_remaining INT, locked_until TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  recent_failures INT;
  last_failure TIMESTAMPTZ;
  lockout_period INTERVAL := '15 minutes';
  max_attempts INT := 5;
BEGIN
  SELECT COUNT(*), MAX(attempted_at) INTO recent_failures, last_failure
  FROM auth_login_attempts
  WHERE email = p_email 
    AND success = false
    AND attempted_at > now() - lockout_period;
  
  IF recent_failures >= max_attempts THEN
    RETURN QUERY SELECT 
      false, 
      0, 
      last_failure + lockout_period;
  ELSE
    RETURN QUERY SELECT 
      true, 
      max_attempts - recent_failures, 
      NULL::TIMESTAMPTZ;
  END IF;
END;
$$;
```

---

## Resumo de Vulnerabilidades

| ID | Severidade | Categoria | Descrição | Correção |
|----|------------|-----------|-----------|----------|
| V1 | **Critical** | Credentials | `.env` não está no `.gitignore` | Adicionar `.env` ao `.gitignore` |
| V2 | **High** | Auth | Sem rate limiting no login | Implementar limite 5 tentativas/15min |
| V3 | **High** | Auth | Sem lockout de conta | Bloquear por 30min após 5 falhas |
| V4 | **High** | Credentials | Supabase keys hardcoded | Usar variáveis de ambiente |
| V5 | **Medium** | XSS | `dangerouslySetInnerHTML` em chart.tsx | Validar cores antes de injetar |
| V6 | **Medium** | XSS | Slack notifications não sanitizadas | Escapar markdown characters |
| V7 | **Medium** | XSS | JSON.parse sem sanitização | Sanitizar antes de renderizar |
| V8 | **Medium** | Auth | CAPTCHA não progressivo | Aumentar dificuldade após falhas |
| V9 | **Medium** | Auth | Leaked Password Protection desabilitado | Habilitar no Supabase Dashboard |
| V10 | **Low** | XSS | CSV Injection não prevenida | Prefixar fórmulas com apóstrofo |
| V11 | **Low** | CSRF | Sem tokens em forms gerais | Baixo risco (JWT-based) |
| V12 | Info | Lib | DOMPurify não instalado | Instalar para sanitização HTML |

---

## Plano de Implementação

### Fase 1: Correções Críticas (Imediato)

1. **Atualizar `.gitignore`** para incluir `.env`
2. **Habilitar Leaked Password Protection** no Supabase Dashboard

### Fase 2: Correções de Alta Prioridade

3. **Criar sistema de rate limiting para login:**
   - Tabela `auth_login_attempts`
   - Função `can_attempt_login()`
   - Hook `useLoginRateLimiter` no frontend
   - Integrar com `src/pages/Auth.tsx`

4. **Implementar account lockout:**
   - Bloquear por 30 minutos após 5 falhas
   - Exibir mensagem de tempo restante para usuário
   - Notificar admin via email

### Fase 3: Correções Médias

5. **Sanitizar chart.tsx:**
   - Validar padrão de cores CSS
   - Rejeitar valores inválidos

6. **Sanitizar Slack notifications:**
   - Escapar markdown characters
   - Limitar tamanho de mensagens

7. **Instalar DOMPurify:**
   - Usar para qualquer conteúdo HTML de usuário

### Fase 4: Melhorias

8. **CSV Injection prevention:**
   - Prefixar fórmulas com apóstrofo

9. **CAPTCHA progressivo:**
   - Invisible inicialmente
   - Visível após 2 falhas
   - Challenge após 4 falhas

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `.gitignore` | Adicionar `.env`, `.env.local`, `.env.*.local` |
| `src/pages/Auth.tsx` | Integrar rate limiting e lockout |
| `src/hooks/useLoginRateLimiter.ts` | **NOVO** - Hook para gerenciar tentativas |
| `src/components/ui/chart.tsx` | Validar cores antes de injetar CSS |
| `src/components/inventory/ExportCSVButton.tsx` | Prevenir CSV injection |
| `supabase/functions/send-notification/index.ts` | Escapar markdown para Slack |
| `package.json` | Adicionar `dompurify` como dependência |
| **Database Migration** | Criar `auth_login_attempts` e função `can_attempt_login` |

---

## Seção Técnica: Implementação de Rate Limiting

### 1. Hook useLoginRateLimiter

```typescript
// src/hooks/useLoginRateLimiter.ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitStatus {
  allowed: boolean;
  attemptsRemaining: number;
  lockedUntil: Date | null;
}

export function useLoginRateLimiter() {
  const [status, setStatus] = useState<RateLimitStatus>({
    allowed: true,
    attemptsRemaining: 5,
    lockedUntil: null
  });

  const checkCanAttempt = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('can_attempt_login', { p_email: email });
    
    if (error || !data?.[0]) return true;
    
    setStatus({
      allowed: data[0].allowed,
      attemptsRemaining: data[0].attempts_remaining,
      lockedUntil: data[0].locked_until ? new Date(data[0].locked_until) : null
    });
    
    return data[0].allowed;
  };

  const recordAttempt = async (email: string, success: boolean) => {
    await supabase.from('auth_login_attempts').insert({
      email,
      ip_address: null, // Obtido via Edge Function se necessário
      success
    });
  };

  return { status, checkCanAttempt, recordAttempt };
}
```

### 2. Integração em Auth.tsx

```typescript
// Adicionar ao handleSignIn
const { status, checkCanAttempt, recordAttempt } = useLoginRateLimiter();

const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const canAttempt = await checkCanAttempt(data.email);
  if (!canAttempt) {
    toast({
      title: "Conta temporariamente bloqueada",
      description: `Muitas tentativas de login. Tente novamente em ${getTimeRemaining(status.lockedUntil)}`,
      variant: "destructive"
    });
    return;
  }
  
  const { error } = await signIn(data.email, data.password);
  await recordAttempt(data.email, !error);
  
  // ... resto do código
};
```

### 3. Validação de Cores (chart.tsx)

```typescript
// Adicionar validação antes de usar dangerouslySetInnerHTML
const isValidCSSColor = (color: string): boolean => {
  // Aceita: #hex, rgb(), hsl(), named colors
  const patterns = [
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i,
    /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i,
    /^(transparent|currentColor|inherit|initial|unset)$/i,
    /^[a-z]{3,20}$/i // Named colors (red, blue, etc.)
  ];
  return patterns.some(p => p.test(color.trim()));
};

// No ChartStyle component
const sanitizedColor = isValidCSSColor(color) ? color : 'currentColor';
```
