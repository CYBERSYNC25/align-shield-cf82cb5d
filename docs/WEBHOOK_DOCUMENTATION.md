# Documentação de Webhooks

Sistema completo de webhooks para sincronização em tempo real com integrações externas.

## Índice

1. [Visão Geral](#visão-geral)
2. [Endpoint de Webhook](#endpoint-de-webhook)
3. [Formato de Payload](#formato-de-payload)
4. [Edge Cases e Conflitos](#edge-cases-e-conflitos)
5. [Logs e Monitoramento](#logs-e-monitoramento)
6. [Exemplos de Integração](#exemplos-de-integração)

---

## Visão Geral

O sistema de webhooks permite que integrações externas notifiquem o ComplianceSync sobre eventos em tempo real, garantindo sincronismo automático de dados.

### Arquitetura

```
┌─────────────────┐
│  Integração     │ (Google Workspace, AWS, Azure, etc.)
│  Externa        │
└────────┬────────┘
         │ POST /integration-webhook
         ▼
┌─────────────────┐
│  Edge Function  │ (Validação, Armazenamento)
│  Supabase       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │ (integration_webhooks, integration_status)
│  + Realtime     │
└────────┬────────┘
         │ Postgres Changes
         ▼
┌─────────────────┐
│  Frontend       │ (Painel de Monitoramento)
│  React Hook     │
└─────────────────┘
```

### Fluxo de Processamento

1. **Recebimento**: Webhook é recebido pela Edge Function
2. **Validação**: Assinatura e payload são validados
3. **Armazenamento**: Evento é armazenado no banco de dados
4. **Processamento**: Dados são processados e entidades internas atualizadas
5. **Notificação**: Usuários são notificados via Supabase Realtime

---

## Endpoint de Webhook

### URL

```
POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook
```

### Autenticação

O endpoint é **público** mas valida assinaturas de webhook quando fornecidas.

### Headers

```
Content-Type: application/json
X-Webhook-Signature: <signature> (opcional, mas recomendado)
```

---

## Formato de Payload

### Request Body

```json
{
  "integration": "google_workspace" | "aws" | "azure" | "okta",
  "event_type": "user.created" | "user.updated" | "user.deleted" | "resource.changed",
  "payload": {
    // Dados específicos do evento
  },
  "signature": "webhook_signature_for_validation",
  "idempotency_key": "unique_event_id" (opcional)
}
```

### Response - Sucesso

```json
{
  "success": true,
  "webhook_id": "uuid-do-webhook",
  "message": "Webhook received and queued for processing"
}
```

### Response - Erro

```json
{
  "success": false,
  "error": "Descrição do erro",
  "code": "INVALID_SIGNATURE" | "MISSING_FIELDS" | "PROCESSING_ERROR"
}
```

---

## Edge Cases e Conflitos

### 1. Webhooks Duplicados

**Problema**: Mesma evento enviado múltiplas vezes

**Solução**: Usar `idempotency_key` para detectar duplicatas

```json
{
  "integration": "google_workspace",
  "event_type": "user.created",
  "idempotency_key": "google-workspace-user-123-created-20241117",
  "payload": { ... }
}
```

Se um webhook com o mesmo `idempotency_key` já foi processado, retorna o ID existente sem reprocessar.

---

### 2. Updates Simultâneos

**Problema**: Dois webhooks atualizando o mesmo recurso simultaneamente

**Solução**: Usa `upsert` com `ignoreDuplicates: false` para sempre aplicar a atualização mais recente

```typescript
await supabase
  .from('profiles')
  .upsert({
    user_id: user.id,
    display_name: user.name,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id',
    ignoreDuplicates: false // Sempre atualiza com dados mais recentes
  });
```

**Timestamp de Decisão**: O webhook com `created_at` mais recente prevalece.

---

### 3. Falhas de Processamento

**Problema**: Erro ao processar webhook

**Solução**: Sistema automático de retry com backoff exponencial

```typescript
// Retry até 3 vezes
// Backoff: 2^tentativa segundos (2s, 4s, 8s)

if (retryCount < 3) {
  const backoffMs = Math.pow(2, retryCount) * 1000;
  setTimeout(() => processWebhook(webhookId), backoffMs);
}
```

Após 3 tentativas, o webhook é marcado como `failed` e requer intervenção manual.

---

### 4. Rate Limiting

**Problema**: Muitos webhooks em curto período

**Solução**: Implementado no banco com controle de frequência

```typescript
// Verifica últimos webhooks da integração
const recentWebhooks = await supabase
  .from('integration_webhooks')
  .select('created_at')
  .eq('integration_name', integration)
  .gte('created_at', oneMinuteAgo)
  .count();

if (recentWebhooks > RATE_LIMIT) {
  return { error: 'Rate limit exceeded' };
}
```

---

### 5. Conflito de Dados

**Problema**: Dados do webhook conflitam com dados locais

**Solução**: Estratégia de resolução baseada em timestamp

```typescript
// Verifica se dados locais são mais recentes
const { data: existing } = await supabase
  .from('profiles')
  .select('updated_at')
  .eq('user_id', userId)
  .single();

const webhookTimestamp = new Date(webhook.payload.updated_at);
const existingTimestamp = new Date(existing.updated_at);

// Só atualiza se webhook é mais recente
if (webhookTimestamp > existingTimestamp) {
  await updateProfile(webhook.payload);
}
```

---

## Logs e Monitoramento

### Tabelas de Monitoramento

#### 1. `integration_webhooks`

Armazena todos os webhooks recebidos.

```sql
CREATE TABLE integration_webhooks (
  id UUID PRIMARY KEY,
  integration_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Status**:
- `pending`: Aguardando processamento
- `processed`: Processado com sucesso
- `failed`: Falhou após 3 tentativas

#### 2. `integration_status`

Monitora a saúde de cada integração.

```sql
CREATE TABLE integration_status (
  id UUID PRIMARY KEY,
  integration_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'healthy',
  last_sync_at TIMESTAMPTZ,
  last_webhook_at TIMESTAMPTZ,
  total_webhooks INTEGER DEFAULT 0,
  failed_webhooks INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}'
);
```

**Status**:
- `healthy`: Score >= 90%
- `degraded`: Score 70-89%
- `unhealthy`: Score < 70%

**Health Score**: Calculado como `((total - failed) / total) * 100`

---

### Monitoramento em Tempo Real

Use o hook `useWebhookMonitor` para monitorar em tempo real:

```typescript
import { useWebhookMonitor } from '@/hooks/useWebhookMonitor';

const MyComponent = () => {
  const { 
    webhooks, 
    integrationStatus, 
    getFailedWebhooks,
    retryWebhook 
  } = useWebhookMonitor();

  // Webhooks são atualizados automaticamente via Supabase Realtime
  useEffect(() => {
    console.log('Webhooks atualizados:', webhooks);
  }, [webhooks]);

  return (
    <div>
      {getFailedWebhooks().map(webhook => (
        <div key={webhook.id}>
          <p>{webhook.error_message}</p>
          <button onClick={() => retryWebhook(webhook.id)}>
            Retentar
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## Exemplos de Integração

### Google Workspace - User Created

```bash
curl -X POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "integration": "google_workspace",
    "event_type": "user.created",
    "idempotency_key": "gw-user-123-created",
    "payload": {
      "user": {
        "id": "user-123",
        "primaryEmail": "john.doe@example.com",
        "name": {
          "fullName": "John Doe",
          "givenName": "John",
          "familyName": "Doe"
        },
        "isAdmin": false,
        "orgUnitPath": "/Engineering",
        "creationTime": "2024-11-17T10:00:00Z"
      }
    }
  }'
```

**Processamento**:
1. Cria/atualiza perfil do usuário na tabela `profiles`
2. Registra evento na tabela `audit_logs`
3. Atualiza `integration_status` para Google Workspace

---

### AWS SNS - S3 Bucket Change

```bash
curl -X POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=..." \
  -d '{
    "integration": "aws",
    "event_type": "s3.bucket.encryption_changed",
    "idempotency_key": "aws-s3-bucket123-enc",
    "signature": "calculated_signature",
    "payload": {
      "bucket": {
        "name": "my-secure-bucket",
        "encryption": "AES256",
        "region": "us-east-1"
      },
      "timestamp": "2024-11-17T10:00:00Z"
    }
  }'
```

---

### Azure - Resource Group Updated

```bash
curl -X POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "integration": "azure",
    "event_type": "resource_group.updated",
    "payload": {
      "resource_group": {
        "id": "/subscriptions/xxx/resourceGroups/rg1",
        "name": "rg1",
        "location": "eastus",
        "tags": {
          "environment": "production"
        }
      }
    }
  }'
```

---

### Okta - User Status Changed

```bash
curl -X POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "integration": "okta",
    "event_type": "user.lifecycle.suspend",
    "idempotency_key": "okta-user-456-suspend",
    "payload": {
      "user": {
        "id": "00u1234",
        "status": "SUSPENDED",
        "profile": {
          "email": "user@example.com",
          "firstName": "Jane",
          "lastName": "Smith"
        }
      },
      "eventTime": "2024-11-17T10:00:00Z"
    }
  }'
```

---

## Debugging e Troubleshooting

### Ver Logs de Processamento

```sql
-- Webhooks com erro
SELECT * FROM integration_webhooks 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- Webhooks de uma integração específica
SELECT * FROM integration_webhooks 
WHERE integration_name = 'google_workspace'
ORDER BY created_at DESC 
LIMIT 50;

-- Status de saúde das integrações
SELECT * FROM integration_status 
ORDER BY health_score ASC;
```

### Reprocessar Webhook Manualmente

```sql
UPDATE integration_webhooks 
SET status = 'pending', retry_count = 0 
WHERE id = 'webhook-id';
```

### Verificar Eventos em Tempo Real

```typescript
// Logs no console do navegador
const channel = supabase
  .channel('webhook-debug')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'integration_webhooks' },
    (payload) => console.log('Webhook event:', payload)
  )
  .subscribe();
```

---

## Próximos Passos

1. Implementar validação de assinaturas específicas para cada integração
2. Adicionar webhook para Microsoft 365, Slack e GitHub
3. Criar dashboard de métricas e analytics
4. Implementar alertas automáticos por email/Slack
5. Adicionar suporte para webhooks com retry customizado
