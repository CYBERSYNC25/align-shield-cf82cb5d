-- =====================================================
-- SECURITY AUDIT FIX: Login Rate Limiting & Account Lockout
-- =====================================================

-- Table to track login attempts for rate limiting and account lockout
CREATE TABLE public.auth_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  success BOOLEAN DEFAULT false NOT NULL,
  failure_reason TEXT
);

-- Index for efficient queries on email and time
CREATE INDEX idx_login_attempts_email_time 
  ON public.auth_login_attempts(email, attempted_at DESC);

-- Index for cleanup operations
CREATE INDEX idx_login_attempts_attempted_at 
  ON public.auth_login_attempts(attempted_at);

-- Enable RLS
ALTER TABLE public.auth_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert (from edge functions or triggers)
CREATE POLICY "Service role can insert login attempts"
  ON public.auth_login_attempts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service_role and admins can view login attempts
CREATE POLICY "Service role and admins can view login attempts"
  ON public.auth_login_attempts
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'master_admin')
  );

-- Anon users can insert their own login attempts (for frontend tracking)
CREATE POLICY "Anon users can record login attempts"
  ON public.auth_login_attempts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to check if login attempt is allowed
-- Returns: allowed (bool), attempts_remaining (int), locked_until (timestamptz)
CREATE OR REPLACE FUNCTION public.can_attempt_login(p_email TEXT)
RETURNS TABLE(allowed BOOLEAN, attempts_remaining INT, locked_until TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures INT;
  last_failure TIMESTAMPTZ;
  lockout_period INTERVAL := '15 minutes';
  max_attempts INT := 5;
BEGIN
  -- Count recent failed attempts
  SELECT COUNT(*), MAX(attempted_at) 
  INTO recent_failures, last_failure
  FROM auth_login_attempts
  WHERE email = LOWER(TRIM(p_email))
    AND success = false
    AND attempted_at > now() - lockout_period;
  
  -- Check if locked out
  IF recent_failures >= max_attempts THEN
    RETURN QUERY SELECT 
      false::BOOLEAN, 
      0::INT, 
      (last_failure + lockout_period)::TIMESTAMPTZ;
  ELSE
    RETURN QUERY SELECT 
      true::BOOLEAN, 
      (max_attempts - recent_failures)::INT, 
      NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- Function to record a login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO auth_login_attempts (email, success, ip_address, user_agent, failure_reason)
  VALUES (LOWER(TRIM(p_email)), p_success, p_ip_address, p_user_agent, p_failure_reason);
END;
$$;

-- Function to cleanup old login attempts (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts(p_days_to_keep INT DEFAULT 30)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM auth_login_attempts
  WHERE attempted_at < now() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.can_attempt_login(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO anon, authenticated;