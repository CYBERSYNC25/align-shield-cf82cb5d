-- Remove the last remaining permissive policy
DROP POLICY IF EXISTS "Service role can insert check history" ON public.compliance_check_history;