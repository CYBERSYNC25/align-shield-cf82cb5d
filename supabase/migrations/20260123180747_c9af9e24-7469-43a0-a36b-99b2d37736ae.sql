-- =====================================================
-- JOB QUEUE SYSTEM
-- Tabela para processamento assíncrono de jobs
-- =====================================================

-- Tabela principal de jobs
CREATE TABLE public.job_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Job definition
  job_type TEXT NOT NULL CHECK (job_type IN (
    'sync_integration', 
    'run_compliance_check', 
    'generate_report',
    'send_notification',
    'cleanup_data'
  )),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 
    'processing', 
    'completed', 
    'failed',
    'cancelled'
  )),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  
  -- Retry logic
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  result JSONB,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Comentário descritivo
COMMENT ON TABLE public.job_queue IS 'Sistema de fila de jobs para processamento assíncrono';

-- Indexes para processamento eficiente
CREATE INDEX job_queue_pending_idx ON public.job_queue(priority DESC, scheduled_for ASC) 
  WHERE status = 'pending';
CREATE INDEX job_queue_processing_idx ON public.job_queue(started_at) 
  WHERE status = 'processing';
CREATE INDEX job_queue_org_id_idx ON public.job_queue(org_id);
CREATE INDEX job_queue_user_id_idx ON public.job_queue(user_id);
CREATE INDEX job_queue_job_type_idx ON public.job_queue(job_type);
CREATE INDEX job_queue_status_idx ON public.job_queue(status);
CREATE INDEX job_queue_created_at_idx ON public.job_queue(created_at DESC);

-- RLS
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org jobs"
  ON public.job_queue FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can create jobs for their org"
  ON public.job_queue FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can cancel their own pending jobs"
  ON public.job_queue FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Service role can manage all jobs"
  ON public.job_queue FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Função para calcular próximo retry com exponential backoff
CREATE OR REPLACE FUNCTION public.calculate_next_retry(
  p_attempts INTEGER,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  delay_seconds INTEGER;
BEGIN
  IF p_attempts >= p_max_attempts THEN
    RETURN NULL;
  END IF;
  
  -- Exponential backoff: 60s, 300s (5min), 900s (15min)
  delay_seconds := POWER(5, p_attempts) * 60;
  RETURN now() + (delay_seconds || ' seconds')::interval;
END;
$$;

COMMENT ON FUNCTION public.calculate_next_retry IS 'Calcula timestamp do próximo retry com exponential backoff';

-- Função para criar job na fila (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION public.enqueue_job(
  p_job_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_priority INTEGER DEFAULT 3,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job_id UUID;
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Obter org_id do usuário
  SELECT org_id INTO v_org_id 
  FROM profiles 
  WHERE user_id = v_user_id;
  
  -- Validar job_type
  IF p_job_type NOT IN ('sync_integration', 'run_compliance_check', 'generate_report', 'send_notification', 'cleanup_data') THEN
    RAISE EXCEPTION 'Invalid job_type: %', p_job_type;
  END IF;
  
  -- Validar priority
  IF p_priority < 1 OR p_priority > 5 THEN
    RAISE EXCEPTION 'Priority must be between 1 and 5';
  END IF;
  
  INSERT INTO job_queue (org_id, user_id, job_type, payload, priority, scheduled_for, metadata)
  VALUES (v_org_id, v_user_id, p_job_type, p_payload, p_priority, p_scheduled_for, p_metadata)
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

COMMENT ON FUNCTION public.enqueue_job IS 'Adiciona um job à fila de processamento';

-- Função para obter próximos jobs a processar (usada pela Edge Function)
CREATE OR REPLACE FUNCTION public.claim_pending_jobs(
  p_limit INTEGER DEFAULT 5
)
RETURNS SETOF public.job_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  UPDATE job_queue
  SET 
    status = 'processing',
    started_at = now(),
    attempts = attempts + 1
  WHERE id IN (
    SELECT id 
    FROM job_queue
    WHERE status = 'pending' 
      AND scheduled_for <= now()
    ORDER BY priority DESC, created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.claim_pending_jobs IS 'Obtém e marca jobs pendentes para processamento (concurrency-safe)';

-- Função para marcar job como concluído
CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE job_queue
  SET 
    status = 'completed',
    result = p_result,
    completed_at = now()
  WHERE id = p_job_id AND status = 'processing';
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.complete_job IS 'Marca um job como concluído com sucesso';

-- Função para marcar job como falho (com retry automático se aplicável)
CREATE OR REPLACE FUNCTION public.fail_job(
  p_job_id UUID,
  p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job RECORD;
  v_next_retry TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_job FROM job_queue WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular próximo retry
  v_next_retry := calculate_next_retry(v_job.attempts, v_job.max_attempts);
  
  IF v_next_retry IS NOT NULL THEN
    -- Ainda tem retries disponíveis
    UPDATE job_queue
    SET 
      status = 'pending',
      error_message = p_error_message,
      last_error_at = now(),
      scheduled_for = v_next_retry
    WHERE id = p_job_id;
  ELSE
    -- Esgotou tentativas
    UPDATE job_queue
    SET 
      status = 'failed',
      error_message = p_error_message,
      last_error_at = now(),
      completed_at = now()
    WHERE id = p_job_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.fail_job IS 'Marca job como falho com retry automático se ainda houver tentativas';

-- Função para resetar jobs stuck (processing por mais de 15min)
CREATE OR REPLACE FUNCTION public.reset_stuck_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH stuck_jobs AS (
    UPDATE job_queue
    SET 
      status = 'pending',
      error_message = 'Job timeout - reset for retry',
      last_error_at = now(),
      scheduled_for = now() + interval '1 minute'
    WHERE status = 'processing'
      AND started_at < now() - interval '15 minutes'
      AND attempts < max_attempts
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM stuck_jobs;
  
  -- Marcar como failed os que excederam tentativas
  UPDATE job_queue
  SET 
    status = 'failed',
    error_message = 'Job timeout - max attempts exceeded',
    completed_at = now()
  WHERE status = 'processing'
    AND started_at < now() - interval '15 minutes'
    AND attempts >= max_attempts;
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.reset_stuck_jobs IS 'Reseta jobs que estão stuck em processing por mais de 15 minutos';