-- Tabela para IPs bloqueados
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

-- Index simples para lookup rápido (sem predicado com now())
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON public.blocked_ips(expires_at);

-- RLS: apenas admins podem gerenciar
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage blocked IPs" ON public.blocked_ips;
CREATE POLICY "Admins can manage blocked IPs"
  ON public.blocked_ips
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Tabela para logs de atividade suspeita
CREATE TABLE IF NOT EXISTS public.suspicious_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_id UUID,
  activity_type TEXT NOT NULL,
  endpoint TEXT,
  request_count INT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_ip ON public.suspicious_activity_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_type ON public.suspicious_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_created ON public.suspicious_activity_logs(created_at);

-- RLS
ALTER TABLE public.suspicious_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert suspicious logs" ON public.suspicious_activity_logs;
CREATE POLICY "Service role can insert suspicious logs"
  ON public.suspicious_activity_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view suspicious logs" ON public.suspicious_activity_logs;
CREATE POLICY "Admins can view suspicious logs"
  ON public.suspicious_activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Função para verificar IP bloqueado
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
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
    expires_at = GREATEST(blocked_ips.expires_at, now() + (p_duration_hours || ' hours')::interval),
    reason = p_reason
  RETURNING id INTO v_block_id;
  
  RETURN v_block_id;
END;
$$;

-- Função para limpar logs antigos de atividade suspeita
CREATE OR REPLACE FUNCTION public.cleanup_old_suspicious_logs(p_days_to_keep INT DEFAULT 30)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM suspicious_activity_logs
  WHERE created_at < now() - (p_days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Função para limpar IPs bloqueados expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_blocked_ips()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM blocked_ips
  WHERE expires_at IS NOT NULL 
    AND expires_at < now()
    AND is_permanent = false;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;