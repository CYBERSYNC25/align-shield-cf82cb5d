
## Plano: Sistema de Notificações Proativas com Alertas Configuráveis

### Objetivo
Implementar um sistema robusto de notificações proativas com configurações por canal (email, in-app, Slack), webhooks outbound para integrações externas, e digest diário/semanal por email.

---

### Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONFIGURAÇÕES DE NOTIFICAÇÃO                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /settings/notifications                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Canais: [x] Email  [x] In-App  [ ] Slack                             │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ Alertas Proativos:                                                   │   │
│  │ ├── [x] Issue Crítico Detectado          → Email + In-App + Slack   │   │
│  │ ├── [x] Score caiu mais de X% em 24h     → Email + In-App           │   │
│  │ ├── [x] SLA próximo do vencimento (24h)  → Email + In-App           │   │
│  │ ├── [x] Sincronização falhou             → In-App                   │   │
│  │ ├── [x] Novo usuário na organização      → Email                    │   │
│  │ └── [x] Relatório semanal                → Email                    │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ Digest:                                                              │   │
│  │ ├── [x] Diário  - 08:00                                              │   │
│  │ └── [x] Semanal - Segunda 08:00                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  /settings/webhooks                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Outbound Webhooks                                                    │   │
│  │ ├── https://hooks.slack.com/services/... [Ativo]                     │   │
│  │ ├── https://api.pagerduty.com/webhooks   [Ativo]                     │   │
│  │ └── + Novo Webhook                                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ DATABASE                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  notification_settings (preferências por org)                               │
│  ├── channels_enabled: { email: true, inApp: true, slack: false }          │
│  ├── alerts_config: { critical_issue: [...], score_drop: [...], ... }      │
│  ├── digest_enabled: { daily: true, weekly: true }                         │
│  └── digest_time: "08:00"                                                   │
│                                                                             │
│  outbound_webhooks (webhooks de saída)                                      │
│  ├── url, secret_hash, events, enabled, last_triggered_at                  │
│  └── delivery_logs: status, response, attempts                             │
│                                                                             │
│  outbound_webhook_logs (histórico de entregas)                              │
│  └── webhook_id, event, payload, status, response, created_at              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ EDGE FUNCTIONS                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  send-notification (dispatcher central)                                     │
│  ├── Verifica preferências do usuário/org                                  │
│  ├── Envia por canais habilitados (email, in-app, Slack)                   │
│  └── Dispara outbound webhooks configurados                                │
│                                                                             │
│  send-digest-email (cron diário/semanal)                                   │
│  └── Gera resumo de issues, score, eventos das últimas 24h/7d             │
│                                                                             │
│  send-outbound-webhook (dispatcher de webhooks)                            │
│  └── Envia payload para URLs configuradas com retry                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Migração de Banco de Dados

Criar tabelas para persistir configurações e webhooks outbound:

**Tabela `notification_settings`:**
```sql
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Canais habilitados
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  
  -- Configuração por tipo de alerta
  alert_critical_issue JSONB DEFAULT '{"email": true, "in_app": true, "slack": true}'::JSONB,
  alert_score_drop JSONB DEFAULT '{"email": true, "in_app": true, "slack": false}'::JSONB,
  alert_score_drop_threshold INTEGER DEFAULT 10,
  alert_sla_expiring JSONB DEFAULT '{"email": true, "in_app": true, "slack": false}'::JSONB,
  alert_sync_failed JSONB DEFAULT '{"email": false, "in_app": true, "slack": false}'::JSONB,
  alert_new_user JSONB DEFAULT '{"email": true, "in_app": false, "slack": false}'::JSONB,
  alert_weekly_report JSONB DEFAULT '{"email": true, "in_app": false, "slack": false}'::JSONB,
  
  -- Digest settings
  digest_daily_enabled BOOLEAN DEFAULT false,
  digest_weekly_enabled BOOLEAN DEFAULT true,
  digest_time TIME DEFAULT '08:00:00',
  digest_day_of_week INTEGER DEFAULT 1, -- 1 = Segunda
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(org_id, user_id)
);

-- Índices
CREATE INDEX idx_notification_settings_org ON notification_settings(org_id);
CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);
```

**Tabela `outbound_webhooks`:**
```sql
CREATE TABLE public.outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- Para assinatura HMAC
  
  -- Eventos que disparam este webhook
  events TEXT[] DEFAULT ARRAY[
    'critical_issue', 'score_drop', 'sla_expiring', 
    'sync_failed', 'new_user', 'issue_remediated'
  ],
  
  -- Headers customizados
  custom_headers JSONB DEFAULT '{}',
  
  -- Estado
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_outbound_webhooks_org ON outbound_webhooks(org_id);
CREATE INDEX idx_outbound_webhooks_enabled ON outbound_webhooks(enabled) WHERE enabled = true;
```

**Tabela `outbound_webhook_logs`:**
```sql
CREATE TABLE public.outbound_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES outbound_webhooks(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_outbound_webhook_logs_webhook ON outbound_webhook_logs(webhook_id);
CREATE INDEX idx_outbound_webhook_logs_status ON outbound_webhook_logs(status) WHERE status = 'pending';
```

**RLS Policies:**
```sql
-- notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification settings"
  ON notification_settings FOR ALL
  USING (org_id = get_user_org_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));

-- outbound_webhooks  
ALTER TABLE outbound_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhooks"
  ON outbound_webhooks FOR ALL
  USING (
    org_id = get_user_org_id(auth.uid()) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

-- outbound_webhook_logs
ALTER TABLE outbound_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
  ON outbound_webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outbound_webhooks ow
      WHERE ow.id = outbound_webhook_logs.webhook_id
      AND ow.org_id = get_user_org_id(auth.uid())
    ) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );
```

---

### Fase 2: Hook useNotificationSettings

Criar hook para gerenciar preferências de notificação:

**Arquivo:** `src/hooks/useNotificationSettings.tsx`

```typescript
interface NotificationSettings {
  id: string;
  org_id: string;
  user_id?: string;
  
  // Canais
  email_enabled: boolean;
  in_app_enabled: boolean;
  slack_enabled: boolean;
  slack_webhook_url?: string;
  
  // Alertas por tipo
  alert_critical_issue: ChannelConfig;
  alert_score_drop: ChannelConfig;
  alert_score_drop_threshold: number;
  alert_sla_expiring: ChannelConfig;
  alert_sync_failed: ChannelConfig;
  alert_new_user: ChannelConfig;
  alert_weekly_report: ChannelConfig;
  
  // Digest
  digest_daily_enabled: boolean;
  digest_weekly_enabled: boolean;
  digest_time: string;
  digest_day_of_week: number;
}

interface ChannelConfig {
  email: boolean;
  in_app: boolean;
  slack: boolean;
}

export function useNotificationSettings() {
  // Fetch settings
  // Update settings mutation
  // Test Slack webhook
  // Return loading, error, settings, updateSettings
}
```

---

### Fase 3: Hook useOutboundWebhooks

Criar hook para gerenciar webhooks de saída:

**Arquivo:** `src/hooks/useOutboundWebhooks.tsx`

```typescript
interface OutboundWebhook {
  id: string;
  org_id: string;
  name: string;
  url: string;
  events: string[];
  custom_headers: Record<string, string>;
  enabled: boolean;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
}

export function useOutboundWebhooks() {
  // CRUD para webhooks
  // Test webhook
  // Get webhook logs
  // Retry failed webhook
}
```

---

### Fase 4: Componentes de UI

**4.1 NotificationSettingsPanel**

**Arquivo:** `src/components/settings/NotificationSettingsPanel.tsx`

Interface completa para configurar:
- Canais globais (Email, In-App, Slack com URL)
- Cada tipo de alerta com seleção de canais
- Threshold de score drop
- Configurações de digest (diário/semanal, horário)

**4.2 OutboundWebhooksManager**

**Arquivo:** `src/components/settings/OutboundWebhooksManager.tsx`

- Lista de webhooks configurados
- Criar/Editar webhook (URL, nome, secret, eventos)
- Toggle ativo/inativo
- Testar webhook
- Ver histórico de entregas
- Retry de webhooks falhos

---

### Fase 5: Edge Functions

**5.1 send-notification (Dispatcher Central)**

**Arquivo:** `supabase/functions/send-notification/index.ts`

```typescript
interface NotificationPayload {
  org_id: string;
  user_ids?: string[]; // Se vazio, notifica todos da org
  type: 'critical_issue' | 'score_drop' | 'sla_expiring' | 'sync_failed' | 'new_user' | 'weekly_report';
  title: string;
  message: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

// Fluxo:
// 1. Buscar notification_settings da org/user
// 2. Para cada canal habilitado para este tipo:
//    - Email: chamar send-notification-email
//    - In-App: inserir em notifications table
//    - Slack: POST para slack_webhook_url
// 3. Disparar outbound webhooks configurados
```

**5.2 send-digest-email**

**Arquivo:** `supabase/functions/send-digest-email/index.ts`

```typescript
// Invocado por cron diário às 08:00
// 1. Buscar orgs com digest habilitado
// 2. Para cada org:
//    a. Agregar issues das últimas 24h (diário) ou 7d (semanal)
//    b. Calcular score atual vs anterior
//    c. Listar eventos importantes
//    d. Gerar HTML do digest
//    e. Enviar email para usuários da org
```

**Template do Digest:**
```html
<h1>📊 Resumo de Compliance - [Período]</h1>

<div class="score-section">
  <h2>Compliance Score</h2>
  <p>Atual: 87% (↓3% vs anterior)</p>
</div>

<div class="issues-section">
  <h2>Issues Detectados</h2>
  <ul>
    <li>🔴 3 Críticos</li>
    <li>🟠 5 Altos</li>
    <li>🟡 8 Médios</li>
  </ul>
</div>

<div class="events-section">
  <h2>Eventos Importantes</h2>
  <ul>
    <li>GitHub: 2 repositórios públicos detectados</li>
    <li>AWS: S3 bucket público remediado</li>
    <li>Slack: Admin sem MFA resolvido</li>
  </ul>
</div>
```

**5.3 send-outbound-webhook**

**Arquivo:** `supabase/functions/send-outbound-webhook/index.ts`

```typescript
interface OutboundPayload {
  webhook_id: string;
  event_type: string;
  data: Record<string, unknown>;
}

// Fluxo:
// 1. Buscar webhook por ID
// 2. Verificar se evento está na lista de eventos
// 3. Gerar assinatura HMAC se secret configurado
// 4. POST para URL com retry (3x com backoff)
// 5. Logar resultado em outbound_webhook_logs
// 6. Atualizar contadores success/failure
```

---

### Fase 6: Integração nas Rotas

Adicionar novas rotas em App.tsx:

```typescript
<Route path="/settings/notifications" element={
  <ProtectedRoute>
    <NotificationSettings />
  </ProtectedRoute>
} />
<Route path="/settings/webhooks" element={
  <ProtectedRoute>
    <WebhooksSettings />
  </ProtectedRoute>
} />
```

Ou criar como tabs dentro de Settings.tsx.

---

### Fase 7: Triggers de Alertas Proativos

Integrar disparos de notificação em pontos-chave:

| Evento | Local de Disparo | Tipo de Alerta |
|--------|------------------|----------------|
| Issue Crítico Detectado | `check-compliance-drift` | `critical_issue` |
| Score caiu X% | `check-compliance-drift` (comparar histórico) | `score_drop` |
| SLA próximo (24h) | Cron job ou `check-compliance-drift` | `sla_expiring` |
| Sync falhou | `sync-integration-data` catch block | `sync_failed` |
| Novo usuário | Trigger on `profiles` INSERT | `new_user` |
| Relatório semanal | Cron semanal | `weekly_report` |

---

### Estrutura de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx_notification_settings.sql` | Criar | Tabelas e RLS |
| `src/hooks/useNotificationSettings.tsx` | Criar | Hook de preferências |
| `src/hooks/useOutboundWebhooks.tsx` | Criar | Hook de webhooks outbound |
| `src/components/settings/NotificationSettingsPanel.tsx` | Criar | UI de configuração de alertas |
| `src/components/settings/OutboundWebhooksManager.tsx` | Criar | UI de gerenciamento de webhooks |
| `src/pages/Settings.tsx` | Modificar | Substituir tab Notificações com novo componente |
| `supabase/functions/send-notification/index.ts` | Criar | Dispatcher central |
| `supabase/functions/send-digest-email/index.ts` | Criar | Gerador de digest |
| `supabase/functions/send-outbound-webhook/index.ts` | Criar | Envio de webhooks |
| `supabase/functions/check-compliance-drift/index.ts` | Modificar | Integrar alertas proativos |
| `src/App.tsx` | Modificar | Adicionar rotas (opcional) |

---

### Eventos de Alerta Detalhados

| Alerta | Trigger | Dados no Payload |
|--------|---------|------------------|
| `critical_issue` | Novo issue com severity = critical | issue_id, rule_id, integration, description |
| `score_drop` | Score atual < Score anterior - threshold | current_score, previous_score, drop_percentage |
| `sla_expiring` | SLA deadline < now + 24h | issue_id, rule_id, deadline, hours_remaining |
| `sync_failed` | Erro em sync-integration-data | integration_name, error_message, last_success |
| `new_user` | INSERT em profiles | user_email, user_name, role |
| `weekly_report` | Cron semanal | score, issues_summary, remediations_count |

---

### Payload de Webhook Outbound

```json
{
  "event": "critical_issue",
  "timestamp": "2026-01-26T10:00:00.000Z",
  "org_id": "uuid",
  "data": {
    "issue_id": "uuid",
    "rule_id": "github-public-repo",
    "severity": "critical",
    "integration": "github",
    "title": "Repositório público detectado",
    "description": "O repositório 'my-app' foi tornado público",
    "resource": {
      "type": "repository",
      "id": "12345",
      "name": "my-app"
    }
  },
  "signature": "sha256=..." // Se secret configurado
}
```

---

### Considerações Técnicas

| Aspecto | Implementação |
|---------|---------------|
| **Rate Limiting** | Slack tem limite de 1 msg/seg, implementar queue |
| **Retry Logic** | 3 tentativas com backoff exponencial (1min, 5min, 15min) |
| **Deduplicação** | Evitar alertas duplicados em janela de 5 minutos |
| **Validação Slack** | Testar URL antes de salvar, verificar formato |
| **Segurança** | Secrets de webhook hashados, HMAC para assinatura |
| **Digest** | Cron job diário/semanal via pg_cron |
| **Performance** | Processar alertas em batch, não bloquear operações principais |

---

### Ordem de Implementação

1. Criar migração com tabelas `notification_settings`, `outbound_webhooks`, `outbound_webhook_logs`
2. Criar hook `useNotificationSettings`
3. Criar hook `useOutboundWebhooks`
4. Criar componente `NotificationSettingsPanel`
5. Criar componente `OutboundWebhooksManager`
6. Atualizar Settings.tsx com novos componentes
7. Criar Edge Function `send-notification`
8. Criar Edge Function `send-outbound-webhook`
9. Criar Edge Function `send-digest-email`
10. Integrar alertas em `check-compliance-drift`
11. Configurar cron jobs para digests
12. Testar fluxo completo

---

### Dependências Externas

| Serviço | Uso | Secret Necessário |
|---------|-----|-------------------|
| Resend | Envio de emails | `RESEND_API_KEY` (já configurado) |
| Slack | Webhook para alertas | URL configurável por usuário |
| pg_cron | Agendamento de digests | Extensão do Supabase |

