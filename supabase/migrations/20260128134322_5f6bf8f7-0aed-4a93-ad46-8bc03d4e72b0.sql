-- Tabela para tracking de sessões ativas
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Token tracking (para invalidação)
  session_token_hash TEXT,
  
  -- Device info
  device_info TEXT NOT NULL DEFAULT 'Unknown Device',
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  device_type TEXT DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  
  -- Geolocation
  ip_address TEXT,
  city TEXT,
  country TEXT,
  country_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  
  -- Status
  is_current BOOLEAN DEFAULT false,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT CHECK (revoked_reason IN ('manual', 'timeout', 'new_device', 'security', 'logout', 'limit_exceeded'))
);

-- Índices para performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, revoked, expires_at) WHERE revoked = false;
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token_hash) WHERE session_token_hash IS NOT NULL;
CREATE INDEX idx_user_sessions_cleanup ON public.user_sessions(expires_at) WHERE revoked = false;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own sessions"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access"
  ON public.user_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Função: Criar nova sessão (com limite de 5)
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id UUID,
  p_device_info TEXT DEFAULT 'Unknown Device',
  p_browser TEXT DEFAULT NULL,
  p_browser_version TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_os_version TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'desktop',
  p_ip_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL,
  p_session_token_hash TEXT DEFAULT NULL
)
RETURNS TABLE(
  session_id UUID,
  is_new_device BOOLEAN,
  is_new_country BOOLEAN,
  revoked_session_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_org_id UUID;
  v_is_new_device BOOLEAN := false;
  v_is_new_country BOOLEAN := false;
  v_revoked_session_id UUID := NULL;
  v_active_count INTEGER;
  v_existing_device INTEGER;
  v_existing_country INTEGER;
BEGIN
  -- Get user's org_id
  SELECT org_id INTO v_org_id FROM profiles WHERE user_id = p_user_id LIMIT 1;
  
  -- Check if this device is new (by device_info + browser + os)
  SELECT COUNT(*) INTO v_existing_device
  FROM user_sessions
  WHERE user_id = p_user_id
    AND device_info = p_device_info
    AND COALESCE(browser, '') = COALESCE(p_browser, '')
    AND COALESCE(os, '') = COALESCE(p_os, '');
  
  v_is_new_device := (v_existing_device = 0);
  
  -- Check if this country is new
  IF p_country_code IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing_country
    FROM user_sessions
    WHERE user_id = p_user_id
      AND country_code = p_country_code
      AND created_at > now() - interval '90 days';
    
    v_is_new_country := (v_existing_country = 0);
  END IF;
  
  -- Count active sessions
  SELECT COUNT(*) INTO v_active_count
  FROM user_sessions
  WHERE user_id = p_user_id
    AND revoked = false
    AND expires_at > now();
  
  -- If at limit (5), revoke oldest session
  IF v_active_count >= 5 THEN
    SELECT id INTO v_revoked_session_id
    FROM user_sessions
    WHERE user_id = p_user_id
      AND revoked = false
      AND expires_at > now()
    ORDER BY last_active_at ASC
    LIMIT 1;
    
    UPDATE user_sessions
    SET revoked = true,
        revoked_at = now(),
        revoked_reason = 'limit_exceeded'
    WHERE id = v_revoked_session_id;
  END IF;
  
  -- Mark all other sessions as not current
  UPDATE user_sessions
  SET is_current = false
  WHERE user_id = p_user_id;
  
  -- Create new session
  INSERT INTO user_sessions (
    user_id, org_id, device_info, browser, browser_version, 
    os, os_version, device_type, ip_address, city, country, 
    country_code, session_token_hash, is_current
  ) VALUES (
    p_user_id, v_org_id, p_device_info, p_browser, p_browser_version,
    p_os, p_os_version, p_device_type, p_ip_address, p_city, p_country,
    p_country_code, p_session_token_hash, true
  )
  RETURNING id INTO v_session_id;
  
  RETURN QUERY SELECT v_session_id, v_is_new_device, v_is_new_country, v_revoked_session_id;
END;
$$;

-- Função: Atualizar atividade da sessão
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE user_sessions
  SET last_active_at = now()
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND revoked = false
    AND expires_at > now();
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Função: Revogar sessão específica
CREATE OR REPLACE FUNCTION public.revoke_session(
  p_session_id UUID,
  p_reason TEXT DEFAULT 'manual'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_sessions
  SET revoked = true,
      revoked_at = now(),
      revoked_reason = p_reason
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND revoked = false;
  
  RETURN FOUND;
END;
$$;

-- Função: Revogar todas as outras sessões
CREATE OR REPLACE FUNCTION public.revoke_all_other_sessions(p_current_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET revoked = true,
      revoked_at = now(),
      revoked_reason = 'manual'
  WHERE user_id = auth.uid()
    AND id != p_current_session_id
    AND revoked = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Função: Obter sessões ativas do usuário
CREATE OR REPLACE FUNCTION public.get_user_active_sessions(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  device_info TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  device_type TEXT,
  ip_address TEXT,
  city TEXT,
  country TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  is_current BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.id, us.device_info, us.browser, us.browser_version, 
    us.os, us.device_type, us.ip_address, us.city, us.country, 
    us.country_code, us.created_at, us.last_active_at, us.is_current
  FROM user_sessions us
  WHERE us.user_id = COALESCE(p_user_id, auth.uid())
    AND us.revoked = false
    AND us.expires_at > now()
  ORDER BY us.is_current DESC, us.last_active_at DESC;
$$;

-- Função: Cleanup de sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Marcar como revogadas as sessões expiradas
  UPDATE user_sessions
  SET revoked = true,
      revoked_at = now(),
      revoked_reason = 'timeout'
  WHERE revoked = false
    AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Deletar sessões antigas (mais de 90 dias)
  DELETE FROM user_sessions
  WHERE revoked = true
    AND revoked_at < now() - interval '90 days';
  
  RETURN v_count;
END;
$$;

-- Função: Verificar se sessão está ativa
CREATE OR REPLACE FUNCTION public.is_session_active(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_sessions
    WHERE id = p_session_id
      AND revoked = false
      AND expires_at > now()
      AND last_active_at > now() - interval '30 minutes'
  );
$$;

-- Função: Contar sessões ativas do usuário
CREATE OR REPLACE FUNCTION public.count_user_active_sessions(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_sessions
  WHERE user_id = COALESCE(p_user_id, auth.uid())
    AND revoked = false
    AND expires_at > now();
$$;