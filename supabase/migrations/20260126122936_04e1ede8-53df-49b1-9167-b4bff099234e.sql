-- Tabela notification_settings
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
  digest_day_of_week INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(org_id, user_id)
);

-- Índices para notification_settings
CREATE INDEX idx_notification_settings_org ON notification_settings(org_id);
CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);

-- Tabela outbound_webhooks
CREATE TABLE public.outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  
  events TEXT[] DEFAULT ARRAY[
    'critical_issue', 'score_drop', 'sla_expiring', 
    'sync_failed', 'new_user', 'issue_remediated'
  ],
  
  custom_headers JSONB DEFAULT '{}',
  
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para outbound_webhooks
CREATE INDEX idx_outbound_webhooks_org ON outbound_webhooks(org_id);
CREATE INDEX idx_outbound_webhooks_enabled ON outbound_webhooks(enabled) WHERE enabled = true;

-- Tabela outbound_webhook_logs
CREATE TABLE public.outbound_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES outbound_webhooks(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending',
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Índices para outbound_webhook_logs
CREATE INDEX idx_outbound_webhook_logs_webhook ON outbound_webhook_logs(webhook_id);
CREATE INDEX idx_outbound_webhook_logs_status ON outbound_webhook_logs(status) WHERE status = 'pending';

-- RLS para notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Users can delete own notification settings"
  ON notification_settings FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));

-- RLS para outbound_webhooks
ALTER TABLE outbound_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhooks"
  ON outbound_webhooks FOR SELECT
  USING (
    org_id = get_user_org_id(auth.uid()) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

CREATE POLICY "Admins can insert webhooks"
  ON outbound_webhooks FOR INSERT
  WITH CHECK (
    org_id = get_user_org_id(auth.uid()) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

CREATE POLICY "Admins can update webhooks"
  ON outbound_webhooks FOR UPDATE
  USING (
    org_id = get_user_org_id(auth.uid()) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

CREATE POLICY "Admins can delete webhooks"
  ON outbound_webhooks FOR DELETE
  USING (
    org_id = get_user_org_id(auth.uid()) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

-- RLS para outbound_webhook_logs
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

-- Trigger para updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outbound_webhooks_updated_at
  BEFORE UPDATE ON outbound_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();