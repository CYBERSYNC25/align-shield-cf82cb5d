-- Tabela de configurações MFA por usuário
CREATE TABLE public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  backup_codes_encrypted TEXT,
  backup_codes_used INTEGER DEFAULT 0,
  enabled_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  recovery_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_mfa_user ON public.user_mfa_settings(user_id);
CREATE INDEX idx_mfa_enabled ON public.user_mfa_settings(enabled_at) WHERE enabled_at IS NOT NULL;

-- RLS
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Service role only (Edge Functions) - para gerenciar secrets
CREATE POLICY "Service role manages MFA"
  ON public.user_mfa_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can check if they have MFA enabled (read-only, não vê secret)
CREATE POLICY "Users can check own MFA status"
  ON public.user_mfa_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função helper: Verificar se usuário tem MFA habilitado
CREATE OR REPLACE FUNCTION public.user_has_mfa_enabled(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = _user_id
    AND enabled_at IS NOT NULL
  )
$$;

-- Função helper: Verificar se role requer MFA
CREATE OR REPLACE FUNCTION public.role_requires_mfa(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'master_admin')
  )
$$;