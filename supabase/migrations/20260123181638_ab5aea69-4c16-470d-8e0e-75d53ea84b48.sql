-- ============================================
-- SYSTEM LOGS TABLE - Centralized Error Tracking
-- ============================================

-- Table for storing technical logs and errors
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID,
  
  -- Log classification
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  source TEXT NOT NULL CHECK (source IN ('frontend', 'edge_function', 'webhook', 'scheduled_job', 'database')),
  
  -- Content
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  stack_trace TEXT,
  
  -- Context
  function_name TEXT,
  component_name TEXT,
  request_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary indexes for filtering
CREATE INDEX system_logs_org_id_idx ON public.system_logs(org_id);
CREATE INDEX system_logs_level_idx ON public.system_logs(level);
CREATE INDEX system_logs_source_idx ON public.system_logs(source);
CREATE INDEX system_logs_created_at_idx ON public.system_logs(created_at DESC);
CREATE INDEX system_logs_user_id_idx ON public.system_logs(user_id);

-- Composite index for common admin queries (org + level + time)
CREATE INDEX system_logs_org_level_created_idx 
  ON public.system_logs(org_id, level, created_at DESC);

-- Index for searching in message
CREATE INDEX system_logs_message_idx ON public.system_logs USING gin(to_tsvector('english', message));

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view logs for their organization
CREATE POLICY "Admins can view org logs"
  ON public.system_logs FOR SELECT
  USING (
    (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL)
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

-- Service role can insert logs (for Edge Functions)
CREATE POLICY "Service role can insert logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can insert logs (via Edge Function that validates)
CREATE POLICY "Authenticated users can insert logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE policies - logs are immutable

-- ============================================
-- CLEANUP FUNCTION (for scheduled maintenance)
-- ============================================

-- Function to clean up old logs (older than specified days)
CREATE OR REPLACE FUNCTION public.cleanup_old_system_logs(
  p_days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM system_logs
  WHERE created_at < now() - (p_days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Get log statistics
-- ============================================

CREATE OR REPLACE FUNCTION public.get_log_statistics(
  p_org_id UUID DEFAULT NULL,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  level TEXT,
  count BIGINT,
  latest_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.level,
    COUNT(*)::BIGINT as count,
    MAX(sl.created_at) as latest_at
  FROM system_logs sl
  WHERE 
    (p_org_id IS NULL OR sl.org_id = p_org_id)
    AND sl.created_at > now() - (p_hours || ' hours')::interval
  GROUP BY sl.level
  ORDER BY 
    CASE sl.level
      WHEN 'critical' THEN 1
      WHEN 'error' THEN 2
      WHEN 'warn' THEN 3
      WHEN 'info' THEN 4
      WHEN 'debug' THEN 5
    END;
END;
$$;