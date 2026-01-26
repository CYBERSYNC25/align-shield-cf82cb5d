-- =====================================================
-- Security Fix Migration: Address all "warn" level RLS issues
-- =====================================================

-- 1. FIX: organizations_missing_policies
-- Remove overly permissive INSERT policy and add proper DELETE policy
DROP POLICY IF EXISTS "Service role can insert organizations" ON public.organizations;

CREATE POLICY "Service role can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Master admins can delete organizations"
  ON public.organizations FOR DELETE
  USING (public.has_role(auth.uid(), 'master_admin'));


-- 2. FIX: notifications_overly_permissive
-- Restrict notifications to only the intended recipient (user_id match)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Members can view notifications" ON public.notifications;

CREATE POLICY "Users can only view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);


-- 3. FIX: tasks_table_org_wide_access
-- Restrict tasks visibility to creator, assignee, or admins
DROP POLICY IF EXISTS "Users can view tasks in their org" ON public.tasks;
DROP POLICY IF EXISTS "Members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;

CREATE POLICY "Users can view their own or assigned tasks"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to::uuid OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'master_admin')
  );


-- 4. FIX: policies_table_org_wide_readable
-- Restrict draft policies to authors and approvers only
DROP POLICY IF EXISTS "Users can view policies in their org" ON public.policies;
DROP POLICY IF EXISTS "Members can view policies" ON public.policies;
DROP POLICY IF EXISTS "Users can view their policies" ON public.policies;

CREATE POLICY "Users can view approved policies or their own drafts"
  ON public.policies FOR SELECT
  USING (
    org_id = public.get_user_org_id(auth.uid()) AND (
      status != 'draft' OR 
      auth.uid() = user_id OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'master_admin') OR
      public.has_role(auth.uid(), 'compliance_officer')
    )
  );


-- 5. FIX: frameworks_compliance_scores_exposed
-- Restrict to authenticated organization members only
DROP POLICY IF EXISTS "Anyone can view frameworks" ON public.frameworks;
DROP POLICY IF EXISTS "Public can view frameworks" ON public.frameworks;
DROP POLICY IF EXISTS "Users can view frameworks" ON public.frameworks;
DROP POLICY IF EXISTS "Members can view frameworks" ON public.frameworks;

CREATE POLICY "Org members can view their frameworks"
  ON public.frameworks FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()));


-- 6. FIX: incident_playbooks_public_readable
-- Restrict to security team and authorized personnel only
DROP POLICY IF EXISTS "Anyone can view playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Public can view playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Users can view playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Members can view playbooks" ON public.incident_playbooks;

CREATE POLICY "Authorized users can view incident playbooks"
  ON public.incident_playbooks FOR SELECT
  USING (
    org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'master_admin') OR
      public.has_role(auth.uid(), 'compliance_officer')
    )
  );


-- 7. FIX: bcp_plans_recovery_details_exposed
-- Restrict to business continuity team and management only
DROP POLICY IF EXISTS "Anyone can view BCP plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Public can view BCP plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Users can view BCP plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Members can view BCP plans" ON public.bcp_plans;

CREATE POLICY "Authorized users can view BCP plans"
  ON public.bcp_plans FOR SELECT
  USING (
    org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'master_admin') OR
      public.has_role(auth.uid(), 'compliance_officer')
    )
  );


-- 8. FIX: controls_table_public_readable
-- Restrict to compliance officers, auditors, and management only
DROP POLICY IF EXISTS "Anyone can view controls" ON public.controls;
DROP POLICY IF EXISTS "Public can view controls" ON public.controls;
DROP POLICY IF EXISTS "Users can view controls" ON public.controls;
DROP POLICY IF EXISTS "Members can view controls" ON public.controls;

CREATE POLICY "Authorized users can view controls"
  ON public.controls FOR SELECT
  USING (
    org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'master_admin') OR
      public.has_role(auth.uid(), 'compliance_officer') OR
      public.has_role(auth.uid(), 'auditor')
    )
  );


-- 9. FIX: evidence_table_file_urls_exposed
-- Restrict to auditors and authorized personnel only
DROP POLICY IF EXISTS "Anyone can view evidence" ON public.evidence;
DROP POLICY IF EXISTS "Public can view evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can view evidence" ON public.evidence;
DROP POLICY IF EXISTS "Members can view evidence" ON public.evidence;

CREATE POLICY "Authorized users can view evidence"
  ON public.evidence FOR SELECT
  USING (
    org_id = public.get_user_org_id(auth.uid()) AND (
      auth.uid() = user_id OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'master_admin') OR
      public.has_role(auth.uid(), 'compliance_officer') OR
      public.has_role(auth.uid(), 'auditor')
    )
  );