
-- Fix: pii_access_audit - restrict INSERT to service_role only (not public)
DROP POLICY IF EXISTS "Service role can insert PII access logs" ON public.pii_access_audit;
CREATE POLICY "Service role can insert PII access logs"
  ON public.pii_access_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Fix: suspicious_activity_logs - restrict INSERT to service_role only (not public)  
DROP POLICY IF EXISTS "Service role can insert suspicious logs" ON public.suspicious_activity_logs;
CREATE POLICY "Service role can insert suspicious logs"
  ON public.suspicious_activity_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
