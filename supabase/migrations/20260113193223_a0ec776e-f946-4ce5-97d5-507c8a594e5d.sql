-- Remove duplicate/old permissive policies that were not dropped

-- compliance_alerts: Remove old "Service role can insert alerts" policy with WITH CHECK (true)
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.compliance_alerts;

-- Check for and remove similar old policies on compliance_check_history
DROP POLICY IF EXISTS "Service role can insert history" ON public.compliance_check_history;