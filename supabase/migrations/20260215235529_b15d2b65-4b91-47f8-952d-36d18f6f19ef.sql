
-- Remove duplicate/insecure DELETE policies with OR (org_id IS NULL) pattern
DROP POLICY IF EXISTS "Org admins can delete bcp_plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Org admins can delete incident_playbooks" ON public.incident_playbooks;
