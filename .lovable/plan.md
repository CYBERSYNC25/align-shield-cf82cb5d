
# Plano: Proteções Contra Abuso de API

## Análise do Estado Atual

### ✅ O que já existe:
| Componente | Status | Implementação |
|------------|--------|---------------|
| Rate Limiting (Upstash Redis) | ✅ | `_shared/rate-limiter.ts` com sliding window |
| Login Rate Limiter | ✅ | 5 tentativas/15min via `useLoginRateLimiter` + `auth_login_attempts` table |
| CAPTCHA (Cloudflare Turnstile) | ✅ | Integrado no login em `Auth.tsx` |
| Webhook Signature Validation | ✅ | HMAC-SHA256 por provider em `webhook-validators.ts` |
| Request Validation (Zod) | ✅ | `_shared/validation.ts` com schemas tipados |
| API Key Validation | ✅ | `public-api/index.ts` com hash SHA-256 |

### ❌ O que está faltando:
| Componente | Prioridade | Descrição |
|------------|------------|-----------|
| Rate Limits por Tier | **HIGH** | Autenticado: 1000/h, API Key Pro: 5000/h, Enterprise: 20000/h |
| Rate Limit por IP (não-autenticado) | **HIGH** | 100 req/hora por IP |
| Security Headers | **HIGH** | X-Frame-Options, CSP, HSTS, etc. |
| Content-Type Validation | **MEDIUM** | Rejeitar requests sem application/json |
| Payload Size Limit | **MEDIUM** | Limitar a 10MB |
| Request Timeout | **MEDIUM** | 30s timeout |
| Suspicious Headers Detection | **LOW** | Bloquear headers maliciosos |
| IP Blacklist | **LOW** | Tabela para bloquear IPs suspeitos |

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Request Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│  │ Request  │───▶│ Security        │───▶│ Rate Limit      │    │
│  │          │    │ Middleware      │    │ Middleware      │    │
│  └──────────┘    └─────────────────┘    └─────────────────┘    │
│                         │                       │               │
│                         ▼                       ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Validates:                                                │  │
│  │ • Content-Type = application/json                        │  │
│  │ • Payload size <= 10MB                                   │  │
│  │ • No suspicious headers                                  │  │
│  │ • IP not in blacklist                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Rate Limits (by tier):                                    │  │
│  │ • Unauthenticated: 100/hour per IP                       │  │
│  │ • Authenticated: 1000/hour per user                      │  │
│  │ • API Key Free: 100/minute                               │  │
│  │ • API Key Pro: 5000/hour (83/min)                        │  │
│  │ • API Key Enterprise: 20000/hour (333/min)               │  │
│  │ • Login endpoint: 5 attempts/15min (já existe)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Response with Security Headers:                           │  │
│  │ • X-Content-Type-Options: nosniff                        │  │
│  │ • X-Frame-Options: DENY                                  │  │
│  │ • X-XSS-Protection: 1; mode=block                        │  │
│  │ • Strict-Transport-Security: max-age=31536000            │  │
│  │ • Content-Security-Policy: (restrictive)                 │  │
│  │ • X-RateLimit-* headers                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Plano de Implementação

### Fase 1: Middleware de Segurança Centralizado

#### 1.1 Criar `_shared/security-middleware.ts`

```typescript
// Novo arquivo centralizado com:
// - Security headers padrão
// - Validação de Content-Type
// - Validação de tamanho de payload
// - Detecção de headers suspeitos
// - IP blacklist check

interface SecurityConfig {
  maxPayloadSize?: number;        // Default: 10MB
  requireJsonContentType?: boolean; // Default: true
  timeout?: number;               // Default: 30s
  allowedMethods?: string[];      // Default: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

#### 1.2 Função de Validação de Request

```typescript
export async function validateRequest(
  req: Request,
  config?: SecurityConfig
): Promise<{ valid: true } | { valid: false; response: Response }> {
  // 1. Check HTTP method
  // 2. Check Content-Type for POST/PUT/PATCH
  // 3. Check payload size
  // 4. Check for suspicious headers
  // 5. Check IP against blacklist
}
```

---

### Fase 2: Rate Limiting Avançado

#### 2.1 Atualizar `_shared/rate-limiter.ts`

Adicionar rate limits por tier de usuário:

```typescript
export type RateLimitTier = 
  | 'unauthenticated'  // 100/hour per IP
  | 'authenticated'    // 1000/hour per user
  | 'api_free'        // 100/minute
  | 'api_pro'         // 5000/hour
  | 'api_enterprise'  // 20000/hour
  | 'login';          // 5/15min (já existe)

export const RATE_LIMIT_CONFIGS: Record<RateLimitTier, { max: number; window: number }> = {
  unauthenticated: { max: 100, window: 3600 },
  authenticated: { max: 1000, window: 3600 },
  api_free: { max: 100, window: 60 },
  api_pro: { max: 5000, window: 3600 },
  api_enterprise: { max: 20000, window: 3600 },
  login: { max: 5, window: 900 },
};

export async function checkTieredRateLimit(
  identifier: string,
  tier: RateLimitTier,
  endpoint?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[tier];
  return checkRateLimit(identifier, endpoint || 'global', config.max, config.window);
}
```

#### 2.2 Função para Determinar Tier

```typescript
export async function determineRateLimitTier(
  req: Request,
  supabase: SupabaseClient
): Promise<{ tier: RateLimitTier; identifier: string }> {
  // 1. Check for API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    const keyHash = await hashApiKey(apiKey);
    const { data } = await supabase.rpc('validate_api_key', { p_key_hash: keyHash });
    if (data?.[0]?.is_valid) {
      return {
        tier: `api_${data[0].rate_limit_tier}` as RateLimitTier,
        identifier: `apikey:${data[0].api_key_id}`
      };
    }
  }
  
  // 2. Check for JWT auth
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { tier: 'authenticated', identifier: `user:${user.id}` };
    }
  }
  
  // 3. Fall back to IP-based
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('cf-connecting-ip') || 
             'unknown';
  return { tier: 'unauthenticated', identifier: `ip:${ip}` };
}
```

---

### Fase 3: Tabela de IPs Bloqueados

#### 3.1 Migration SQL

```sql
-- Tabela para IPs bloqueados
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

-- Index para lookup rápido
CREATE INDEX idx_blocked_ips_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_active ON public.blocked_ips(ip_address) 
  WHERE expires_at IS NULL OR expires_at > now();

-- RLS: apenas admins podem gerenciar
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked IPs"
  ON public.blocked_ips
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Tabela para logs de atividade suspeita
CREATE TABLE public.suspicious_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_id UUID,
  activity_type TEXT NOT NULL, -- 'rate_limit_exceeded', 'invalid_signature', 'brute_force', etc
  endpoint TEXT,
  request_count INT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suspicious_activity_ip ON public.suspicious_activity_logs(ip_address);
CREATE INDEX idx_suspicious_activity_type ON public.suspicious_activity_logs(activity_type);

-- RLS: apenas service_role pode inserir, admins podem ler
ALTER TABLE public.suspicious_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert suspicious logs"
  ON public.suspicious_activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view suspicious logs"
  ON public.suspicious_activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Função para verificar IP bloqueado
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip_address = p_ip_address
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Função para auto-bloquear IPs suspeitos
CREATE OR REPLACE FUNCTION public.auto_block_suspicious_ip(
  p_ip_address TEXT,
  p_reason TEXT,
  p_duration_hours INT DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_block_id UUID;
BEGIN
  INSERT INTO blocked_ips (ip_address, reason, expires_at)
  VALUES (
    p_ip_address,
    p_reason,
    now() + (p_duration_hours || ' hours')::interval
  )
  ON CONFLICT (ip_address) DO UPDATE SET
    expires_at = GREATEST(blocked_ips.expires_at, now() + (p_duration_hours || ' hours')::interval)
  RETURNING id INTO v_block_id;
  
  RETURN v_block_id;
END;
$$;
```

---

### Fase 4: Security Headers no Frontend

#### 4.1 Criar `public/_headers` (para Lovable deploy)

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/api/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### 4.2 Adicionar CSP ao `index.html`

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
    script-src 'self' 'unsafe-inline' 'unsafe-eval' challenges.cloudflare.com; 
    style-src 'self' 'unsafe-inline' fonts.googleapis.com; 
    font-src 'self' fonts.gstatic.com; 
    img-src 'self' data: https:; 
    connect-src 'self' https://ofbyxnpprwwuieabwhdo.supabase.co wss://ofbyxnpprwwuieabwhdo.supabase.co https://challenges.cloudflare.com;
    frame-src 'self' challenges.cloudflare.com;
    frame-ancestors 'none';">
```

---

### Fase 5: Wrapper de Função Edge Segura

#### 5.1 Criar `_shared/secure-handler.ts`

```typescript
export function createSecureHandler(
  handler: (req: Request, ctx: SecurityContext) => Promise<Response>,
  options?: HandlerOptions
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const startTime = Date.now();
    
    // 1. CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
    }
    
    // 2. Security validation
    const securityResult = await validateRequest(req, options?.security);
    if (!securityResult.valid) {
      return securityResult.response;
    }
    
    // 3. Rate limiting
    const { tier, identifier } = await determineRateLimitTier(req);
    const rateLimitResult = await checkTieredRateLimit(identifier, tier, options?.endpoint);
    
    if (!rateLimitResult.allowed) {
      // Log suspicious activity if threshold exceeded
      if (rateLimitResult.remaining < -10) {
        await logSuspiciousActivity(identifier, 'rate_limit_abuse', options?.endpoint);
      }
      return rateLimitExceededResponse(rateLimitResult, { ...corsHeaders, ...securityHeaders });
    }
    
    // 4. Timeout wrapper
    const timeout = options?.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await handler(req, { tier, identifier, rateLimitResult });
      clearTimeout(timeoutId);
      
      // Add security headers to response
      const headers = new Headers(response.headers);
      Object.entries(securityHeaders).forEach(([k, v]) => headers.set(k, v));
      Object.entries(rateLimitHeaders(rateLimitResult)).forEach(([k, v]) => headers.set(k, v));
      
      return new Response(response.body, {
        status: response.status,
        headers
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout' }),
          { status: 408, headers: { ...corsHeaders, ...securityHeaders } }
        );
      }
      throw error;
    }
  };
}
```

---

### Fase 6: Atualizar Edge Functions Existentes

#### 6.1 Migrar funções para usar `createSecureHandler`

Exemplo de migração para `public-api/index.ts`:

```typescript
// ANTES:
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  // ... resto da lógica
});

// DEPOIS:
import { createSecureHandler } from '../_shared/secure-handler.ts';

Deno.serve(createSecureHandler(async (req, ctx) => {
  // Lógica simplificada - security já validada
  // Rate limit já aplicado
  // Headers de segurança adicionados automaticamente
}, {
  endpoint: 'public-api',
  security: {
    requireJsonContentType: true,
    maxPayloadSize: 10 * 1024 * 1024, // 10MB
  }
}));
```

---

### Fase 7: Cloudflare DDoS Protection (Nota)

O Lovable já faz deploy via Cloudflare, que oferece proteção DDoS nativa. Além disso, já temos:

1. **Rate Limiting via Upstash Redis** - Implementado
2. **Cloudflare Turnstile (CAPTCHA)** - Implementado para login
3. **Webhook Signature Validation** - Implementado

**Recomendações adicionais** (configuração manual no Cloudflare Dashboard):
- Ativar "Under Attack Mode" quando necessário
- Configurar regras de firewall WAF
- Habilitar "Bot Fight Mode"
- Configurar "Rate Limiting Rules" no dashboard

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/_shared/security-middleware.ts` | **NOVO** | Headers de segurança, validação de request |
| `supabase/functions/_shared/rate-limiter.ts` | Modificar | Adicionar tiers e rate limits avançados |
| `supabase/functions/_shared/secure-handler.ts` | **NOVO** | Wrapper unificado para Edge Functions |
| `public/_headers` | **NOVO** | Headers de segurança para deploy |
| `index.html` | Modificar | Adicionar CSP meta tag |
| `supabase/functions/public-api/index.ts` | Modificar | Usar secure handler |
| `supabase/functions/sync-integration-data/index.ts` | Modificar | Usar secure handler |
| **Database Migration** | Criar | Tabelas `blocked_ips`, `suspicious_activity_logs` |

---

## Resumo de Limites Implementados

| Endpoint/Tier | Limite | Janela |
|--------------|--------|--------|
| Não autenticado (por IP) | 100 | 1 hora |
| Autenticado (por user_id) | 1000 | 1 hora |
| API Key Free | 100 | 1 minuto |
| API Key Pro | 5000 | 1 hora |
| API Key Enterprise | 20000 | 1 hora |
| Login | 5 | 15 minutos |
| Webhook por provider | 30-200 | 1 minuto |

---

## Benefícios da Implementação

1. **Proteção DDoS em Camadas**: Cloudflare + Rate Limiting + IP Blacklist
2. **Flexibilidade de Tiers**: Diferentes limites por tipo de usuário
3. **Visibilidade**: Logs de atividade suspeita para auditoria
4. **Defense in Depth**: Múltiplas camadas de validação
5. **Conformidade**: SOC2, ISO27001, LGPD compliance
6. **Manutenibilidade**: Middleware centralizado reutilizável

---

## Seção Técnica: Lista de Headers de Segurança

| Header | Valor | Propósito |
|--------|-------|-----------|
| X-Content-Type-Options | nosniff | Previne MIME sniffing |
| X-Frame-Options | DENY | Previne clickjacking |
| X-XSS-Protection | 1; mode=block | Ativa proteção XSS do browser |
| Strict-Transport-Security | max-age=31536000 | Força HTTPS por 1 ano |
| Content-Security-Policy | (restritiva) | Controla recursos carregados |
| Referrer-Policy | strict-origin-when-cross-origin | Limita informações de referrer |
| Permissions-Policy | camera=(), microphone=()... | Desativa APIs sensíveis |

---

## Próximos Passos

1. Aprovar plano
2. Executar migration SQL para tabelas de bloqueio
3. Criar middleware de segurança
4. Atualizar rate limiter com tiers
5. Criar secure handler wrapper
6. Adicionar security headers ao frontend
7. Migrar Edge Functions críticas
8. Testar com carga simulada

