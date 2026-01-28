
# Plano: Fortalecimento da Proteção contra SSRF em Webhooks

## Visao Geral

O projeto ja possui validacao basica de URLs de webhook em `webhookUrlSchema` (frontend) e `webhookUrl` (backend), mas precisa ser fortalecido para cobrir:
- Mais ranges de IPs privados e especiais
- Cloud metadata endpoints (AWS, GCP, Azure)
- IPv6 local/link-local
- Protecao contra DNS rebinding
- Controle de redirects e timeouts
- Logging completo de tentativas

---

## Analise do Estado Atual

### Gaps Identificados

| Aspecto | Atual | Necessario |
|---------|-------|------------|
| IP localhost | 127.0.0.1 | Todo range 127.x.x.x |
| IPv6 local | ::1 | ::1, fe80::, ::ffff:127.0.0.1 |
| Metadata endpoints | Nenhum | 169.254.169.254, metadata.google, etc |
| Protocolo | Nao verifica HTTPS | Exigir HTTPS |
| Timeout | Sem limite | 10 segundos |
| Redirects | Seguindo | Nao seguir |
| SSL | Nao verificado | Verificar certificado |
| Logging | Parcial | Completo |

### Locais que Precisam de Protecao

| Local | Arquivo | Risco |
|-------|---------|-------|
| Webhook outbound config | `useOutboundWebhooks.tsx` | Cliente envia para URL maliciosa |
| Test webhook (frontend) | `useOutboundWebhooks.tsx:244` | Fetch sem restricoes |
| Test Slack webhook | `useNotificationSettings.tsx:234` | Fetch sem restricoes |
| OAuth callback URLs | `azure-oauth-start` | redirect_uri controlada |
| Proxy API request | `proxy-api-request` | Endpoint fornecido pelo usuario |
| Send outbound webhook | `send-outbound-webhook` | URL do webhook (server-side) |
| SNS subscribe confirm | `integration-webhook-handler:139` | URL de confirmacao AWS |

---

## Arquitetura da Solucao

```text
+-------------------------------------------------------------------+
|                     SSRF Protection Architecture                    |
+-------------------------------------------------------------------+
|                                                                     |
|  +------------------+     +------------------+                     |
|  |   Frontend       |     |   Backend        |                     |
|  |   Validation     |     |   Validation     |                     |
|  +------------------+     +------------------+                     |
|           |                        |                               |
|           v                        v                               |
|  +------------------+     +------------------+                     |
|  | validateWebhook  |     | validateWebhook  |                     |
|  | UrlSchema (zod)  |     | Url.ts (shared)  |                     |
|  +------------------+     +------------------+                     |
|           |                        |                               |
|           +----------+-------------+                               |
|                      |                                             |
|                      v                                             |
|           +------------------+                                     |
|           | Regras SSRF:     |                                     |
|           | - IPv4 privados  |                                     |
|           | - IPv6 locais    |                                     |
|           | - Localhost      |                                     |
|           | - Metadata APIs  |                                     |
|           | - Apenas HTTPS   |                                     |
|           | - DNS check      |                                     |
|           +------------------+                                     |
|                      |                                             |
|                      v                                             |
|           +------------------+                                     |
|           | secureFetch()    | <-- Para todas as chamadas outbound |
|           | - Timeout 10s    |                                     |
|           | - No redirects   |                                     |
|           | - SSL verify     |                                     |
|           | - Full logging   |                                     |
|           +------------------+                                     |
|                                                                     |
+-------------------------------------------------------------------+
```

---

## Fase 1: Biblioteca de Validacao SSRF

### 1.1 Frontend - `src/lib/security/ssrfValidator.ts`

Nova biblioteca com regras completas:

```typescript
// IPs bloqueados (ranges completos)
const BLOCKED_IP_RANGES = [
  // Loopback (IPv4)
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  
  // Private networks (RFC 1918)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  
  // Link-local (APIPA)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  
  // Carrier-grade NAT
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/,
  
  // Loopback IPv6 and mapped
  /^::1$/,
  /^::ffff:127\./i,
  /^fe80:/i,  // Link-local IPv6
  /^fc00:/i,  // Unique local
  /^fd00:/i,  // Unique local
];

// Hostnames bloqueados (metadata endpoints)
const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  
  // AWS metadata
  '169.254.169.254',
  'instance-data',
  
  // GCP metadata  
  'metadata.google.internal',
  'metadata.google',
  
  // Azure metadata
  '169.254.169.254',
  'metadata.azure.com',
  
  // Kubernetes
  'kubernetes.default',
  'kubernetes.default.svc',
  
  // Generic internal
  '*.local',
  '*.internal',
  '*.localhost',
];
```

### 1.2 Funcao Principal

```typescript
interface SsrfValidationResult {
  valid: boolean;
  error?: string;
  blockedReason?: 'private_ip' | 'localhost' | 'metadata' | 'ipv6_local' | 'non_https' | 'blocked_hostname';
}

export function validateWebhookUrl(url: string): SsrfValidationResult
```

### 1.3 Backend - `supabase/functions/_shared/ssrf-validator.ts`

Versao identica para server-side com:
- Resolucao DNS para verificar IP real (evitar DNS rebinding)
- Validacao adicional antes de qualquer fetch

---

## Fase 2: Secure Fetch Wrapper

### 2.1 `supabase/functions/_shared/secure-fetch.ts`

Wrapper para todas as chamadas HTTP outbound:

```typescript
interface SecureFetchOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number; // Default: 10000
  followRedirects?: boolean; // Default: false
  validateSsl?: boolean; // Default: true
  logAttempt?: boolean; // Default: true
}

interface SecureFetchResult {
  success: boolean;
  response?: Response;
  error?: string;
  blocked?: boolean;
  blockedReason?: string;
}

export async function secureFetch(options: SecureFetchOptions): Promise<SecureFetchResult>
```

### 2.2 Caracteristicas

| Feature | Implementacao |
|---------|---------------|
| Timeout | AbortController com 10s default |
| Redirects | redirect: 'manual' |
| SSL | Deno verifica por padrao |
| Logging | Log para system_logs com IP, resultado |
| Pre-check | Validar URL antes do fetch |

---

## Fase 3: Atualizacao do Schema de Validacao

### 3.1 Frontend - `src/lib/validation/index.ts`

Substituir `webhookUrlSchema` por versao fortalecida:

```typescript
export const webhookUrlSchema = z
  .string()
  .trim()
  .url('URL invalida')
  .max(2048)
  .refine(url => url.startsWith('https://'), 'Apenas HTTPS permitido')
  .refine(url => {
    const result = validateWebhookUrl(url);
    return result.valid;
  }, 'URL bloqueada por politica de seguranca SSRF');
```

### 3.2 Backend - `supabase/functions/_shared/validation.ts`

Atualizar `webhookUrl` com as mesmas regras.

---

## Fase 4: Aplicar Protecao nos Pontos Vulneraveis

### 4.1 `send-outbound-webhook/index.ts`

```typescript
// Antes do fetch
const ssrfCheck = validateWebhookUrl(webhook.url);
if (!ssrfCheck.valid) {
  console.error(`[SSRF Blocked] ${webhook.url}: ${ssrfCheck.blockedReason}`);
  return Response.json({ 
    error: 'URL blocked by security policy',
    reason: ssrfCheck.blockedReason 
  }, { status: 400 });
}

// Usar secureFetch ao inves de fetch direto
const result = await secureFetch({
  url: webhook.url,
  method: 'POST',
  headers,
  body: payloadString,
  timeoutMs: 10000,
  followRedirects: false,
  logAttempt: true,
});
```

### 4.2 `proxy-api-request/index.ts`

```typescript
// Validar endpoint fornecido pelo usuario
const ssrfCheck = validateWebhookUrl(fullUrl);
if (!ssrfCheck.valid) {
  return Response.json({
    error: 'Endpoint blocked by security policy',
    reason: ssrfCheck.blockedReason,
  }, { status: 400 });
}
```

### 4.3 `useOutboundWebhooks.tsx` (frontend)

Adicionar validacao antes do fetch de teste:

```typescript
const testWebhookMutation = useMutation({
  mutationFn: async (webhook: OutboundWebhook) => {
    // Validar URL primeiro
    const ssrfCheck = validateWebhookUrl(webhook.url);
    if (!ssrfCheck.valid) {
      throw new Error(`URL bloqueada: ${ssrfCheck.error}`);
    }
    // ... resto do codigo
  }
});
```

### 4.4 `useNotificationSettings.tsx` 

```typescript
const testSlackWebhookMutation = useMutation({
  mutationFn: async (webhookUrl: string) => {
    const ssrfCheck = validateWebhookUrl(webhookUrl);
    if (!ssrfCheck.valid) {
      throw new Error('URL de webhook invalida ou bloqueada');
    }
    // ... fetch
  }
});
```

### 4.5 `integration-webhook-handler` (AWS SNS)

```typescript
if (validationResult.subscribeUrl) {
  const ssrfCheck = validateWebhookUrl(validationResult.subscribeUrl);
  if (!ssrfCheck.valid) {
    logger.error('SNS subscribe URL blocked', { url: validationResult.subscribeUrl });
    return new Response(JSON.stringify({ error: 'Invalid subscription URL' }), { status: 400 });
  }
  await secureFetch({ url: validationResult.subscribeUrl, method: 'GET' });
}
```

---

## Fase 5: Logging de Tentativas

### 5.1 Tabela de Log (usar `system_logs`)

Registrar todas as tentativas de webhook:

```typescript
await supabase.from('system_logs').insert({
  level: blocked ? 'warn' : 'info',
  source: 'webhook',
  message: blocked 
    ? `SSRF blocked: ${url}` 
    : `Webhook sent: ${url}`,
  metadata: {
    url,
    blocked,
    blocked_reason: blockedReason,
    status_code: response?.status,
    response_time_ms: duration,
    user_id: userId,
    org_id: orgId,
  },
  function_name: 'send-outbound-webhook',
});
```

---

## Fase 6: Documentacao no README

### 6.1 Nova Secao

```markdown
### Protecao SSRF

O sistema implementa protecao completa contra Server-Side Request Forgery:

#### URLs Bloqueadas

| Tipo | Exemplos |
|------|----------|
| IPs privados | 10.x.x.x, 172.16-31.x.x, 192.168.x.x |
| Localhost | 127.x.x.x, localhost, 0.0.0.0 |
| IPv6 local | ::1, fe80::, fc00::, fd00:: |
| Link-local | 169.254.x.x (APIPA) |
| Cloud metadata | 169.254.169.254, metadata.google |
| Kubernetes | kubernetes.default.svc |

#### Restricoes de Request

| Configuracao | Valor |
|--------------|-------|
| Protocolo | Apenas HTTPS |
| Timeout | 10 segundos |
| Redirects | Nao seguidos |
| SSL | Verificado |

#### Aplicacao

A protecao SSRF e aplicada em:
- Configuracao de webhooks outbound
- Teste de webhooks
- URLs de callback OAuth
- Proxy de API requests
- Confirmacao de subscricoes SNS

#### Logging

Todas as tentativas de webhook sao logadas:
- URL alvo
- Status de bloqueio
- Motivo (se bloqueado)
- Tempo de resposta
- Codigo HTTP
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/lib/security/ssrfValidator.ts` | **NOVO** | Validacao SSRF frontend |
| `src/lib/security/index.ts` | Modificar | Exportar ssrfValidator |
| `supabase/functions/_shared/ssrf-validator.ts` | **NOVO** | Validacao SSRF backend |
| `supabase/functions/_shared/secure-fetch.ts` | **NOVO** | Wrapper de fetch seguro |
| `src/lib/validation/index.ts` | Modificar | Fortalecer webhookUrlSchema |
| `supabase/functions/_shared/validation.ts` | Modificar | Fortalecer webhookUrl |
| `supabase/functions/send-outbound-webhook/index.ts` | Modificar | Usar secureFetch |
| `supabase/functions/proxy-api-request/index.ts` | Modificar | Validar endpoint |
| `supabase/functions/integration-webhook-handler/index.ts` | Modificar | Validar SNS URL |
| `src/hooks/useOutboundWebhooks.tsx` | Modificar | Validar antes do fetch |
| `src/hooks/useNotificationSettings.tsx` | Modificar | Validar Slack URL |
| `README.md` | Modificar | Secao "Protecao SSRF" |

---

## Regras SSRF Completas

### Bloquear por IP (Regex)

```typescript
const BLOCKED_PATTERNS = [
  // IPv4 Private
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // Loopback
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,            // Class A private
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // Class B private
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                // Class C private
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                // Link-local / metadata
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,    // CGNAT
  /^0\.0\.0\.0$/,                                 // All interfaces
  
  // IPv6
  /^::1$/i,                                       // Loopback
  /^::$/,                                         // Unspecified
  /^::ffff:127\./i,                              // IPv4-mapped loopback
  /^::ffff:10\./i,                               // IPv4-mapped private
  /^::ffff:192\.168\./i,                         // IPv4-mapped private
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./i,         // IPv4-mapped private
  /^fe80:/i,                                      // Link-local
  /^fc00:/i,                                      // Unique local
  /^fd[0-9a-f]{2}:/i,                            // Unique local
];
```

### Bloquear por Hostname

```typescript
const BLOCKED_HOSTNAMES = [
  'localhost',
  '*.localhost',
  '*.local',
  '*.internal',
  '169.254.169.254',           // AWS/Azure metadata
  'instance-data',             // AWS metadata alias
  'metadata.google.internal',  // GCP metadata
  'metadata.google',           // GCP metadata alias
  'metadata.azure.com',        // Azure metadata
  'kubernetes.default',        // K8s internal
  'kubernetes.default.svc',    // K8s internal
  '*.cluster.local',           // K8s DNS
];
```

---

## Resumo de Seguranca

| Ameaca | Mitigacao |
|--------|-----------|
| Acesso a rede interna | Bloquear IPs privados |
| Roubo de credenciais cloud | Bloquear metadata endpoints |
| Scan de portas internas | Timeout curto (10s) |
| Open redirect abuse | Nao seguir redirects |
| DNS rebinding | Resolver e revalidar IP |
| MITM | Verificar certificado SSL |
| Exfiltracao de dados | Log completo de tentativas |

---

## Beneficios

1. **Defense in Depth**: Validacao em frontend e backend
2. **Cloud-Aware**: Protege contra metadata APIs de AWS/GCP/Azure
3. **IPv6 Ready**: Suporta validacao de enderecos IPv6
4. **Auditabilidade**: Log completo de todas as tentativas
5. **Performance**: Timeout previne hanging requests
6. **Compliance**: Atende requisitos OWASP para SSRF
