-- ============================================================
-- CACHE STORE: Tabela e funções para caching de dashboard
-- ============================================================

-- 1. Criar tabela de cache
CREATE TABLE public.cache_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID,
  org_id UUID
);

-- 2. Índices para performance
CREATE INDEX idx_cache_store_expires_at ON public.cache_store(expires_at);
CREATE INDEX idx_cache_store_user_id ON public.cache_store(user_id);
CREATE INDEX idx_cache_store_key_pattern ON public.cache_store(key text_pattern_ops);

-- 3. Comentário descritivo
COMMENT ON TABLE public.cache_store IS 'Cache de dados agregados para otimização do dashboard (TTLs: score 5min, issues 2min, resources 10min)';

-- ============================================================
-- FUNÇÕES DE CACHE
-- ============================================================

-- set_cache: Insere ou atualiza entrada de cache
CREATE OR REPLACE FUNCTION public.set_cache(
  p_key TEXT,
  p_value JSONB,
  p_ttl_seconds INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_org_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO cache_store (key, value, expires_at, user_id, org_id, created_at)
  VALUES (
    p_key, 
    p_value, 
    now() + (p_ttl_seconds || ' seconds')::INTERVAL,
    p_user_id,
    p_org_id,
    now()
  )
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    expires_at = EXCLUDED.expires_at,
    created_at = now();
END;
$$;

-- get_cache: Retorna valor se não expirado, NULL caso contrário
CREATE OR REPLACE FUNCTION public.get_cache(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT value INTO v_result
  FROM cache_store
  WHERE key = p_key AND expires_at > now();
  
  RETURN v_result;
END;
$$;

-- invalidate_cache: Remove entradas que correspondem ao pattern (LIKE)
CREATE OR REPLACE FUNCTION public.invalidate_cache(p_key_pattern TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM cache_store 
  WHERE key LIKE p_key_pattern;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- cleanup_expired_cache: Remove entradas expiradas (para cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM cache_store WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================================
-- TRIGGERS DE INVALIDAÇÃO AUTOMÁTICA
-- ============================================================

-- Trigger para integration_collected_data
CREATE OR REPLACE FUNCTION public.invalidate_cache_on_collected_data_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Invalidar caches do usuário
  PERFORM invalidate_cache('collected_resources:' || v_user_id::TEXT || '%');
  PERFORM invalidate_cache('compliance_score:' || v_user_id::TEXT || '%');
  PERFORM invalidate_cache('issues_by_severity:' || v_user_id::TEXT || '%');
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_invalidate_cache_collected_data
AFTER INSERT OR UPDATE OR DELETE ON public.integration_collected_data
FOR EACH ROW EXECUTE FUNCTION public.invalidate_cache_on_collected_data_change();

-- Trigger para compliance_alerts
CREATE OR REPLACE FUNCTION public.invalidate_cache_on_alert_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Invalidar caches de compliance
  PERFORM invalidate_cache('compliance_score:' || v_user_id::TEXT || '%');
  PERFORM invalidate_cache('issues_by_severity:' || v_user_id::TEXT || '%');
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_invalidate_cache_alerts
AFTER INSERT OR UPDATE ON public.compliance_alerts
FOR EACH ROW EXECUTE FUNCTION public.invalidate_cache_on_alert_change();

-- Trigger para integration_status (sync)
CREATE OR REPLACE FUNCTION public.invalidate_cache_on_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando last_sync_at muda, invalidar caches
  IF NEW.last_sync_at IS DISTINCT FROM OLD.last_sync_at THEN
    PERFORM invalidate_cache('collected_resources:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
    PERFORM invalidate_cache('compliance_score:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
    PERFORM invalidate_cache('issues_by_severity:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_invalidate_cache_on_sync
AFTER UPDATE ON public.integration_status
FOR EACH ROW EXECUTE FUNCTION public.invalidate_cache_on_sync();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.cache_store ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler seu próprio cache
CREATE POLICY "Users can read their own cache"
  ON public.cache_store FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Usuários podem inserir cache para si mesmos
CREATE POLICY "Users can insert their own cache"
  ON public.cache_store FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Usuários podem atualizar seu próprio cache
CREATE POLICY "Users can update their own cache"
  ON public.cache_store FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Usuários podem deletar seu próprio cache
CREATE POLICY "Users can delete their own cache"
  ON public.cache_store FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Service role tem acesso total (para triggers)
CREATE POLICY "Service role full access"
  ON public.cache_store FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');