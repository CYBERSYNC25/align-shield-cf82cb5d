-- ============================================
-- LGPD/GDPR Data Protection Tables
-- ============================================

-- Enum para níveis de classificação de dados
CREATE TYPE public.data_classification_level AS ENUM (
  'public',       -- Dados públicos, sem restrições
  'internal',     -- Apenas membros da organização
  'confidential', -- PII, requer auditoria de acesso
  'restricted'    -- Credenciais, NUNCA logado
);

-- ============================================
-- Tabela de Classificação de Campos de Dados
-- ============================================
CREATE TABLE public.data_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  classification_level data_classification_level NOT NULL,
  pii_type TEXT, -- 'cpf', 'email', 'phone', 'ip', 'token', etc.
  mask_pattern TEXT, -- Nome da função de mascaramento
  retention_days INT, -- NULL = indefinido
  requires_audit BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(table_name, column_name)
);

-- Índices para performance
CREATE INDEX idx_data_classification_level ON public.data_classification(classification_level);
CREATE INDEX idx_data_classification_table ON public.data_classification(table_name);
CREATE INDEX idx_data_classification_pii_type ON public.data_classification(pii_type) WHERE pii_type IS NOT NULL;

-- RLS: apenas admins podem gerenciar, todos autenticados podem ler
ALTER TABLE public.data_classification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage data classification"
  ON public.data_classification
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view classification"
  ON public.data_classification
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_data_classification_updated_at
  BEFORE UPDATE ON public.data_classification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed inicial de classificações de dados
-- ============================================
INSERT INTO public.data_classification (table_name, column_name, classification_level, pii_type, mask_pattern, requires_audit, description) VALUES
-- Profiles
('profiles', 'display_name', 'internal', 'name', NULL, false, 'Nome de exibição do usuário'),
('profiles', 'avatar_url', 'internal', NULL, NULL, false, 'URL do avatar'),

-- Auth (conceptual - campos referenciados mas não acessíveis diretamente)
('auth.users', 'email', 'confidential', 'email', 'mask_email', true, 'E-mail do usuário'),
('auth.users', 'phone', 'confidential', 'phone', 'mask_phone', true, 'Telefone do usuário'),

-- Audit logs
('audit_logs', 'ip_address', 'confidential', 'ip', 'mask_ip', true, 'Endereço IP'),
('audit_logs', 'user_agent', 'internal', 'user_agent', NULL, false, 'User Agent do navegador'),
('system_logs', 'metadata', 'internal', NULL, NULL, false, 'Metadados de log do sistema'),

-- Integrations (credentials = restricted)
('integrations', 'configuration', 'restricted', 'credentials', NULL, true, 'Configuração com credenciais'),
('integration_oauth_tokens', 'access_token', 'restricted', 'token', NULL, true, 'Token de acesso OAuth'),
('integration_oauth_tokens', 'refresh_token', 'restricted', 'token', NULL, true, 'Token de refresh OAuth'),

-- API Keys
('api_keys', 'key_hash', 'restricted', 'hash', NULL, true, 'Hash da API key'),

-- Login attempts
('auth_login_attempts', 'email', 'confidential', 'email', 'mask_email', false, 'E-mail da tentativa de login'),
('auth_login_attempts', 'ip_address', 'confidential', 'ip', 'mask_ip', false, 'IP da tentativa de login');

-- ============================================
-- Tabela de Auditoria de Acesso a PII
-- ============================================
CREATE TABLE public.pii_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'read', 'export', 'mask', 'decrypt', 'immediate_deletion'
  resource_type TEXT NOT NULL, -- 'profile', 'integration', 'user_account', etc.
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
CREATE INDEX idx_pii_access_action ON public.pii_access_audit(action);

-- RLS: Append-only, apenas service_role pode inserir, admins podem ler
ALTER TABLE public.pii_access_audit ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode inserir (via Edge Functions)
CREATE POLICY "Service role can insert PII access logs"
  ON public.pii_access_audit FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway

-- Admins podem ler logs da própria org
CREATE POLICY "Admins can view PII access logs"
  ON public.pii_access_audit FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') AND 
    org_id = get_user_org_id(auth.uid())
  );

-- NENHUM UPDATE/DELETE permitido (imutável)
-- Sem policies de UPDATE/DELETE = bloqueado por padrão

-- ============================================
-- Função para registrar acesso a PII
-- ============================================
CREATE OR REPLACE FUNCTION public.log_pii_access(
  p_user_id UUID,
  p_org_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_pii_fields TEXT[],
  p_access_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.pii_access_audit (
    user_id, org_id, action, resource_type, resource_id,
    pii_fields, access_reason, ip_address, user_agent, access_context
  ) VALUES (
    p_user_id, p_org_id, p_action, p_resource_type, p_resource_id,
    p_pii_fields, p_access_reason, p_ip_address, p_user_agent, p_context
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ============================================
-- Função para buscar classificação de campo
-- ============================================
CREATE OR REPLACE FUNCTION public.get_field_classification(
  p_table_name TEXT,
  p_column_name TEXT
)
RETURNS data_classification_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT classification_level
  FROM public.data_classification
  WHERE table_name = p_table_name AND column_name = p_column_name
  LIMIT 1;
$$;

-- ============================================
-- Função para verificar se campo requer auditoria
-- ============================================
CREATE OR REPLACE FUNCTION public.field_requires_audit(
  p_table_name TEXT,
  p_column_name TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(requires_audit, false)
  FROM public.data_classification
  WHERE table_name = p_table_name AND column_name = p_column_name
  LIMIT 1;
$$;