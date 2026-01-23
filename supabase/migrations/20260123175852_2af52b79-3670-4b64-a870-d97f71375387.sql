-- =============================================================================
-- MULTI-TENANCY MIGRATION - FASE 1: Criar tabela organizations
-- =============================================================================

-- Tabela de organizações
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MULTI-TENANCY MIGRATION - FASE 2: Atualizar profiles
-- =============================================================================

-- Adicionar colunas de organização em profiles
ALTER TABLE public.profiles 
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN role_in_org TEXT DEFAULT 'member' CHECK (role_in_org IN ('admin', 'member', 'viewer'));

CREATE INDEX profiles_org_id_idx ON public.profiles(org_id);

-- =============================================================================
-- MULTI-TENANCY MIGRATION - FASE 3: Função helper get_user_org_id
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- =============================================================================
-- MULTI-TENANCY MIGRATION - FASE 4: Adicionar org_id em todas as tabelas
-- =============================================================================

-- access_anomalies
ALTER TABLE public.access_anomalies ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX access_anomalies_org_id_idx ON public.access_anomalies(org_id);

-- answer_library
ALTER TABLE public.answer_library ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX answer_library_org_id_idx ON public.answer_library(org_id);

-- audit_logs
ALTER TABLE public.audit_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX audit_logs_org_id_idx ON public.audit_logs(org_id);

-- auditor_access_tokens
ALTER TABLE public.auditor_access_tokens ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX auditor_access_tokens_org_id_idx ON public.auditor_access_tokens(org_id);

-- audits
ALTER TABLE public.audits ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX audits_org_id_idx ON public.audits(org_id);

-- bcp_plans
ALTER TABLE public.bcp_plans ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX bcp_plans_org_id_idx ON public.bcp_plans(org_id);

-- compliance_alerts
ALTER TABLE public.compliance_alerts ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX compliance_alerts_org_id_idx ON public.compliance_alerts(org_id);

-- compliance_check_history
ALTER TABLE public.compliance_check_history ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX compliance_check_history_org_id_idx ON public.compliance_check_history(org_id);

-- control_assignments
ALTER TABLE public.control_assignments ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX control_assignments_org_id_idx ON public.control_assignments(org_id);

-- control_tests
ALTER TABLE public.control_tests ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX control_tests_org_id_idx ON public.control_tests(org_id);

-- controls
ALTER TABLE public.controls ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX controls_org_id_idx ON public.controls(org_id);

-- custom_compliance_tests
ALTER TABLE public.custom_compliance_tests ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX custom_compliance_tests_org_id_idx ON public.custom_compliance_tests(org_id);

-- custom_test_results
ALTER TABLE public.custom_test_results ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX custom_test_results_org_id_idx ON public.custom_test_results(org_id);

-- device_logs
ALTER TABLE public.device_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX device_logs_org_id_idx ON public.device_logs(org_id);

-- evidence
ALTER TABLE public.evidence ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX evidence_org_id_idx ON public.evidence(org_id);

-- frameworks
ALTER TABLE public.frameworks ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX frameworks_org_id_idx ON public.frameworks(org_id);

-- incident_playbooks
ALTER TABLE public.incident_playbooks ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX incident_playbooks_org_id_idx ON public.incident_playbooks(org_id);

-- incidents
ALTER TABLE public.incidents ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX incidents_org_id_idx ON public.incidents(org_id);

-- integration_collected_data
ALTER TABLE public.integration_collected_data ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX integration_collected_data_org_id_idx ON public.integration_collected_data(org_id);

-- integration_evidence_mapping
ALTER TABLE public.integration_evidence_mapping ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX integration_evidence_mapping_org_id_idx ON public.integration_evidence_mapping(org_id);

-- integration_oauth_tokens
ALTER TABLE public.integration_oauth_tokens ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX integration_oauth_tokens_org_id_idx ON public.integration_oauth_tokens(org_id);

-- integration_status
ALTER TABLE public.integration_status ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX integration_status_org_id_idx ON public.integration_status(org_id);

-- integration_webhooks
ALTER TABLE public.integration_webhooks ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX integration_webhooks_org_id_idx ON public.integration_webhooks(org_id);

-- integrations
ALTER TABLE public.integrations ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX integrations_org_id_idx ON public.integrations(org_id);

-- notifications
ALTER TABLE public.notifications ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX notifications_org_id_idx ON public.notifications(org_id);

-- object_permissions
ALTER TABLE public.object_permissions ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX object_permissions_org_id_idx ON public.object_permissions(org_id);

-- policies
ALTER TABLE public.policies ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX policies_org_id_idx ON public.policies(org_id);

-- questionnaire_templates
ALTER TABLE public.questionnaire_templates ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX questionnaire_templates_org_id_idx ON public.questionnaire_templates(org_id);

-- remediation_tickets
ALTER TABLE public.remediation_tickets ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX remediation_tickets_org_id_idx ON public.remediation_tickets(org_id);

-- security_questionnaires
ALTER TABLE public.security_questionnaires ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX security_questionnaires_org_id_idx ON public.security_questionnaires(org_id);

-- system_audit_logs
ALTER TABLE public.system_audit_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX system_audit_logs_org_id_idx ON public.system_audit_logs(org_id);

-- tasks
ALTER TABLE public.tasks ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX tasks_org_id_idx ON public.tasks(org_id);

-- trust_center_frameworks
ALTER TABLE public.trust_center_frameworks ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX trust_center_frameworks_org_id_idx ON public.trust_center_frameworks(org_id);

-- trust_center_settings
ALTER TABLE public.trust_center_settings ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX trust_center_settings_org_id_idx ON public.trust_center_settings(org_id);

-- user_invites
ALTER TABLE public.user_invites ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX user_invites_org_id_idx ON public.user_invites(org_id);

-- user_roles
ALTER TABLE public.user_roles ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX user_roles_org_id_idx ON public.user_roles(org_id);

-- vendors
ALTER TABLE public.vendors ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX vendors_org_id_idx ON public.vendors(org_id);

-- risks
ALTER TABLE public.risks ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX risks_org_id_idx ON public.risks(org_id);

-- risk_acceptances
ALTER TABLE public.risk_acceptances ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX risk_acceptances_org_id_idx ON public.risk_acceptances(org_id);

-- risk_approval_policies
ALTER TABLE public.risk_approval_policies ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX risk_approval_policies_org_id_idx ON public.risk_approval_policies(org_id);

-- risk_assessments
ALTER TABLE public.risk_assessments ADD COLUMN org_id UUID REFERENCES public.organizations(id);
CREATE INDEX risk_assessments_org_id_idx ON public.risk_assessments(org_id);

-- =============================================================================
-- MULTI-TENANCY MIGRATION - FASE 5: Políticas RLS para organizations
-- =============================================================================

-- Members can view their organization
CREATE POLICY "Members can view their organization"
  ON public.organizations FOR SELECT
  USING (id = get_user_org_id(auth.uid()));

-- Org admins can update organization
CREATE POLICY "Org admins can update organization"
  ON public.organizations FOR UPDATE
  USING (
    id = get_user_org_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role_in_org = 'admin'
    )
  );

-- Service role can insert organizations
CREATE POLICY "Service role can insert organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- =============================================================================
-- MULTI-TENANCY MIGRATION - FASE 6: Atualizar políticas RLS existentes
-- =============================================================================

-- FRAMEWORKS
DROP POLICY IF EXISTS "Users can manage their own frameworks" ON public.frameworks;
CREATE POLICY "Org members can view frameworks"
  ON public.frameworks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert frameworks"
  ON public.frameworks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update frameworks"
  ON public.frameworks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete frameworks"
  ON public.frameworks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- CONTROLS
DROP POLICY IF EXISTS "Users can manage their own controls" ON public.controls;
CREATE POLICY "Org members can view controls"
  ON public.controls FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert controls"
  ON public.controls FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update controls"
  ON public.controls FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete controls"
  ON public.controls FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- AUDITS
DROP POLICY IF EXISTS "Users can manage their own audits" ON public.audits;
CREATE POLICY "Org members can view audits"
  ON public.audits FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert audits"
  ON public.audits FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update audits"
  ON public.audits FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete audits"
  ON public.audits FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- EVIDENCE
DROP POLICY IF EXISTS "Users can manage their own evidence" ON public.evidence;
CREATE POLICY "Org members can view evidence"
  ON public.evidence FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update evidence"
  ON public.evidence FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete evidence"
  ON public.evidence FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- POLICIES
DROP POLICY IF EXISTS "Users can manage their own policies" ON public.policies;
CREATE POLICY "Org members can view policies"
  ON public.policies FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert policies"
  ON public.policies FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update policies"
  ON public.policies FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete policies"
  ON public.policies FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- INTEGRATIONS
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
CREATE POLICY "Org members can view integrations"
  ON public.integrations FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update integrations"
  ON public.integrations FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete integrations"
  ON public.integrations FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- INTEGRATION_COLLECTED_DATA
DROP POLICY IF EXISTS "Users can view own collected data" ON public.integration_collected_data;
DROP POLICY IF EXISTS "Users can insert own collected data" ON public.integration_collected_data;
DROP POLICY IF EXISTS "Users can update own collected data" ON public.integration_collected_data;
DROP POLICY IF EXISTS "Users can delete own collected data" ON public.integration_collected_data;
CREATE POLICY "Org members can view collected data"
  ON public.integration_collected_data FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert collected data"
  ON public.integration_collected_data FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update collected data"
  ON public.integration_collected_data FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can delete collected data"
  ON public.integration_collected_data FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- RISKS
DROP POLICY IF EXISTS "Users can view their own risks" ON public.risks;
DROP POLICY IF EXISTS "Users can create their own risks" ON public.risks;
DROP POLICY IF EXISTS "Users can update their own risks" ON public.risks;
DROP POLICY IF EXISTS "Users can delete their own risks" ON public.risks;
CREATE POLICY "Org members can view risks"
  ON public.risks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert risks"
  ON public.risks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update risks"
  ON public.risks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete risks"
  ON public.risks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- VENDORS
DROP POLICY IF EXISTS "Users can view their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can create their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can update their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete their own vendors" ON public.vendors;
CREATE POLICY "Org members can view vendors"
  ON public.vendors FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update vendors"
  ON public.vendors FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete vendors"
  ON public.vendors FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- INCIDENTS
DROP POLICY IF EXISTS "Users can view their own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can create their own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can update their own incidents" ON public.incidents;
CREATE POLICY "Org members can view incidents"
  ON public.incidents FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update incidents"
  ON public.incidents FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- BCP_PLANS
DROP POLICY IF EXISTS "Users can manage their own BCP plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Admins and compliance officers can view all BCP plans" ON public.bcp_plans;
CREATE POLICY "Org members can view bcp_plans"
  ON public.bcp_plans FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert bcp_plans"
  ON public.bcp_plans FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update bcp_plans"
  ON public.bcp_plans FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete bcp_plans"
  ON public.bcp_plans FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- INCIDENT_PLAYBOOKS
DROP POLICY IF EXISTS "Users can manage their own incident playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Admins and auditors can view all playbooks" ON public.incident_playbooks;
CREATE POLICY "Org members can view incident_playbooks"
  ON public.incident_playbooks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert incident_playbooks"
  ON public.incident_playbooks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update incident_playbooks"
  ON public.incident_playbooks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete incident_playbooks"
  ON public.incident_playbooks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- TASKS
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Org members can view tasks"
  ON public.tasks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update tasks"
  ON public.tasks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can delete tasks"
  ON public.tasks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for themselves" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Org members can view notifications"
  ON public.notifications FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Org members can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- COMPLIANCE_ALERTS
DROP POLICY IF EXISTS "Users can view their own compliance alerts" ON public.compliance_alerts;
DROP POLICY IF EXISTS "Service or user can insert compliance alerts" ON public.compliance_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts to acknowledge" ON public.compliance_alerts;
CREATE POLICY "Org members can view compliance_alerts"
  ON public.compliance_alerts FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org or service can insert compliance_alerts"
  ON public.compliance_alerts FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL OR auth.role() = 'service_role');
CREATE POLICY "Org members can update compliance_alerts"
  ON public.compliance_alerts FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- SECURITY_QUESTIONNAIRES
DROP POLICY IF EXISTS "Users can view own questionnaires" ON public.security_questionnaires;
DROP POLICY IF EXISTS "Users can create own questionnaires" ON public.security_questionnaires;
DROP POLICY IF EXISTS "Users can update own questionnaires" ON public.security_questionnaires;
DROP POLICY IF EXISTS "Users can delete own questionnaires" ON public.security_questionnaires;
CREATE POLICY "Org members can view security_questionnaires"
  ON public.security_questionnaires FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert security_questionnaires"
  ON public.security_questionnaires FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update security_questionnaires"
  ON public.security_questionnaires FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete security_questionnaires"
  ON public.security_questionnaires FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- ANSWER_LIBRARY
DROP POLICY IF EXISTS "Users can view own answer library" ON public.answer_library;
DROP POLICY IF EXISTS "Users can create own answers" ON public.answer_library;
DROP POLICY IF EXISTS "Users can update own answers" ON public.answer_library;
DROP POLICY IF EXISTS "Users can delete own answers" ON public.answer_library;
CREATE POLICY "Org members can view answer_library"
  ON public.answer_library FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert answer_library"
  ON public.answer_library FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update answer_library"
  ON public.answer_library FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete answer_library"
  ON public.answer_library FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- CUSTOM_COMPLIANCE_TESTS
DROP POLICY IF EXISTS "Users can view own custom tests" ON public.custom_compliance_tests;
DROP POLICY IF EXISTS "Users can create own custom tests" ON public.custom_compliance_tests;
DROP POLICY IF EXISTS "Users can update own custom tests" ON public.custom_compliance_tests;
DROP POLICY IF EXISTS "Users can delete own custom tests" ON public.custom_compliance_tests;
CREATE POLICY "Org members can view custom_compliance_tests"
  ON public.custom_compliance_tests FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert custom_compliance_tests"
  ON public.custom_compliance_tests FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update custom_compliance_tests"
  ON public.custom_compliance_tests FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete custom_compliance_tests"
  ON public.custom_compliance_tests FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- AUDITOR_ACCESS_TOKENS
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.auditor_access_tokens;
DROP POLICY IF EXISTS "Users can create their own tokens" ON public.auditor_access_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.auditor_access_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.auditor_access_tokens;
CREATE POLICY "Org members can view auditor_access_tokens"
  ON public.auditor_access_tokens FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert auditor_access_tokens"
  ON public.auditor_access_tokens FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update auditor_access_tokens"
  ON public.auditor_access_tokens FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org admins can delete auditor_access_tokens"
  ON public.auditor_access_tokens FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- TRUST_CENTER_SETTINGS
DROP POLICY IF EXISTS "Users can view their own trust center settings" ON public.trust_center_settings;
DROP POLICY IF EXISTS "Users can insert their own trust center settings" ON public.trust_center_settings;
DROP POLICY IF EXISTS "Users can update their own trust center settings" ON public.trust_center_settings;
CREATE POLICY "Org members can view trust_center_settings"
  ON public.trust_center_settings FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert trust_center_settings"
  ON public.trust_center_settings FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update trust_center_settings"
  ON public.trust_center_settings FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- INTEGRATION_OAUTH_TOKENS
DROP POLICY IF EXISTS "Users can view their own OAuth tokens" ON public.integration_oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own OAuth tokens" ON public.integration_oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own OAuth tokens" ON public.integration_oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own OAuth tokens" ON public.integration_oauth_tokens;
CREATE POLICY "Org members can view integration_oauth_tokens"
  ON public.integration_oauth_tokens FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert integration_oauth_tokens"
  ON public.integration_oauth_tokens FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update integration_oauth_tokens"
  ON public.integration_oauth_tokens FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can delete integration_oauth_tokens"
  ON public.integration_oauth_tokens FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- INTEGRATION_STATUS
DROP POLICY IF EXISTS "Users can view their own integration status or admins see all" ON public.integration_status;
DROP POLICY IF EXISTS "Service or owner can manage integration status" ON public.integration_status;
CREATE POLICY "Org members can view integration_status"
  ON public.integration_status FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org or service can manage integration_status"
  ON public.integration_status FOR ALL
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL OR auth.role() = 'service_role');

-- RISK_ACCEPTANCES
DROP POLICY IF EXISTS "Users can view own risk acceptances" ON public.risk_acceptances;
DROP POLICY IF EXISTS "Users can create risk acceptances" ON public.risk_acceptances;
DROP POLICY IF EXISTS "Approvers can update risk acceptances" ON public.risk_acceptances;
CREATE POLICY "Org members can view risk_acceptances"
  ON public.risk_acceptances FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can insert risk_acceptances"
  ON public.risk_acceptances FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
CREATE POLICY "Org members can update risk_acceptances"
  ON public.risk_acceptances FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- =============================================================================
-- MULTI-TENANCY MIGRATION - FASE 7: Função para criar organização automaticamente
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id UUID;
  org_slug TEXT;
BEGIN
  -- Gerar slug único baseado no email
  org_slug := 'org-' || substr(md5(NEW.email || now()::text), 1, 8);
  
  -- Criar organização para o novo usuário
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'organization', 'Minha Organização'),
    org_slug
  )
  RETURNING id INTO new_org_id;
  
  -- Atualizar o profile com org_id e role_in_org = admin
  UPDATE public.profiles
  SET org_id = new_org_id, role_in_org = 'admin'
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger para criar organização automaticamente após profile ser criado
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_organization();