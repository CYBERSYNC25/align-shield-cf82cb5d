-- =====================================================
-- RLS HARDENING MIGRATION - FASE 1: CRITICAL FIXES
-- =====================================================

-- =====================================================
-- PARTE 1: Criar VIEWs seguras para tabelas sensíveis
-- =====================================================

-- VIEW segura para integrations (omite configuration com credenciais)
CREATE OR REPLACE VIEW public.integrations_safe 
WITH (security_invoker = true) AS
SELECT 
  id, user_id, provider, name, status, 
  last_sync_at, created_at, updated_at, org_id, last_used_at
FROM public.integrations;

GRANT SELECT ON public.integrations_safe TO authenticated;

-- VIEW segura para integration_oauth_tokens (omite tokens)
CREATE OR REPLACE VIEW public.integration_oauth_tokens_safe 
WITH (security_invoker = true) AS
SELECT 
  id, user_id, integration_name, token_type, 
  expires_at, scope, created_at, updated_at, org_id, last_used_at
FROM public.integration_oauth_tokens;

GRANT SELECT ON public.integration_oauth_tokens_safe TO authenticated;

-- =====================================================
-- PARTE 2: Drop políticas vulneráveis e criar corrigidas
-- =====================================================

-- === INTEGRATIONS ===
DROP POLICY IF EXISTS "Org members can view integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integrations;

-- Bloquear SELECT direto - apenas service_role pode acessar
CREATE POLICY "Only service role can SELECT integrations"
  ON public.integrations FOR SELECT
  USING (auth.role() = 'service_role');

-- INSERT/UPDATE/DELETE continuam restritos por org
DROP POLICY IF EXISTS "Org members can insert integrations" ON public.integrations;
CREATE POLICY "Org members can insert integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members can update integrations" ON public.integrations;
CREATE POLICY "Org members can update integrations"
  ON public.integrations FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members can delete integrations" ON public.integrations;
CREATE POLICY "Org members can delete integrations"
  ON public.integrations FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === INTEGRATION_OAUTH_TOKENS ===
DROP POLICY IF EXISTS "Org members can view integration_oauth_tokens" ON public.integration_oauth_tokens;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.integration_oauth_tokens;

-- Bloquear SELECT direto - apenas service_role pode acessar tokens
CREATE POLICY "Only service role can SELECT oauth tokens"
  ON public.integration_oauth_tokens FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Org members can insert integration_oauth_tokens" ON public.integration_oauth_tokens;
CREATE POLICY "Org members can insert integration_oauth_tokens"
  ON public.integration_oauth_tokens FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members can update integration_oauth_tokens" ON public.integration_oauth_tokens;
CREATE POLICY "Org members can update integration_oauth_tokens"
  ON public.integration_oauth_tokens FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members can delete integration_oauth_tokens" ON public.integration_oauth_tokens;
CREATE POLICY "Org members can delete integration_oauth_tokens"
  ON public.integration_oauth_tokens FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === API_KEYS - Adicionar org_id check ===
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;

CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

-- === CONTROL_TESTS - Remover USING(true) ===
DROP POLICY IF EXISTS "Users can view control tests" ON public.control_tests;

CREATE POLICY "Org members can view control tests"
  ON public.control_tests FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

-- =====================================================
-- PARTE 3: Corrigir tabelas com OR (org_id IS NULL)
-- =====================================================

-- === RISKS ===
DROP POLICY IF EXISTS "Org members can view risks" ON public.risks;
DROP POLICY IF EXISTS "Org members can insert risks" ON public.risks;
DROP POLICY IF EXISTS "Org members can update risks" ON public.risks;
DROP POLICY IF EXISTS "Org members can delete risks" ON public.risks;

CREATE POLICY "Org members can view risks"
  ON public.risks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert risks"
  ON public.risks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update risks"
  ON public.risks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete risks"
  ON public.risks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === INCIDENTS ===
DROP POLICY IF EXISTS "Org members can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Org members can insert incidents" ON public.incidents;
DROP POLICY IF EXISTS "Org members can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Org members can delete incidents" ON public.incidents;

CREATE POLICY "Org members can view incidents"
  ON public.incidents FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update incidents"
  ON public.incidents FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete incidents"
  ON public.incidents FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === AUDITS ===
DROP POLICY IF EXISTS "Org members can view audits" ON public.audits;
DROP POLICY IF EXISTS "Org members can insert audits" ON public.audits;
DROP POLICY IF EXISTS "Org members can update audits" ON public.audits;
DROP POLICY IF EXISTS "Org members can delete audits" ON public.audits;

CREATE POLICY "Org members can view audits"
  ON public.audits FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert audits"
  ON public.audits FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update audits"
  ON public.audits FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete audits"
  ON public.audits FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === FRAMEWORKS ===
DROP POLICY IF EXISTS "Org members can view frameworks" ON public.frameworks;
DROP POLICY IF EXISTS "Org members can insert frameworks" ON public.frameworks;
DROP POLICY IF EXISTS "Org members can update frameworks" ON public.frameworks;
DROP POLICY IF EXISTS "Org members can delete frameworks" ON public.frameworks;

CREATE POLICY "Org members can view frameworks"
  ON public.frameworks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert frameworks"
  ON public.frameworks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update frameworks"
  ON public.frameworks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete frameworks"
  ON public.frameworks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === CONTROLS ===
DROP POLICY IF EXISTS "Org members can view controls" ON public.controls;
DROP POLICY IF EXISTS "Org members can insert controls" ON public.controls;
DROP POLICY IF EXISTS "Org members can update controls" ON public.controls;
DROP POLICY IF EXISTS "Org members can delete controls" ON public.controls;

CREATE POLICY "Org members can view controls"
  ON public.controls FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert controls"
  ON public.controls FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update controls"
  ON public.controls FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete controls"
  ON public.controls FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === POLICIES (table name) ===
DROP POLICY IF EXISTS "Org members can view policies" ON public.policies;
DROP POLICY IF EXISTS "Org members can insert policies" ON public.policies;
DROP POLICY IF EXISTS "Org members can update policies" ON public.policies;
DROP POLICY IF EXISTS "Org members can delete policies" ON public.policies;

CREATE POLICY "Org members can view policies"
  ON public.policies FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert policies"
  ON public.policies FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update policies"
  ON public.policies FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete policies"
  ON public.policies FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === EVIDENCE ===
DROP POLICY IF EXISTS "Org members can view evidence" ON public.evidence;
DROP POLICY IF EXISTS "Org members can insert evidence" ON public.evidence;
DROP POLICY IF EXISTS "Org members can update evidence" ON public.evidence;
DROP POLICY IF EXISTS "Org members can delete evidence" ON public.evidence;

CREATE POLICY "Org members can view evidence"
  ON public.evidence FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update evidence"
  ON public.evidence FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete evidence"
  ON public.evidence FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === VENDORS ===
DROP POLICY IF EXISTS "Org members can view vendors" ON public.vendors;
DROP POLICY IF EXISTS "Org members can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Org members can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Org members can delete vendors" ON public.vendors;

CREATE POLICY "Org members can view vendors"
  ON public.vendors FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update vendors"
  ON public.vendors FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete vendors"
  ON public.vendors FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === ANSWER_LIBRARY ===
DROP POLICY IF EXISTS "Org members can view answer_library" ON public.answer_library;
DROP POLICY IF EXISTS "Org members can insert answer_library" ON public.answer_library;
DROP POLICY IF EXISTS "Org members can update answer_library" ON public.answer_library;
DROP POLICY IF EXISTS "Org members can delete answer_library" ON public.answer_library;

CREATE POLICY "Org members can view answer_library"
  ON public.answer_library FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert answer_library"
  ON public.answer_library FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update answer_library"
  ON public.answer_library FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete answer_library"
  ON public.answer_library FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === AUDITOR_ACCESS_TOKENS ===
DROP POLICY IF EXISTS "Org members can view auditor_access_tokens" ON public.auditor_access_tokens;
DROP POLICY IF EXISTS "Org members can insert auditor_access_tokens" ON public.auditor_access_tokens;
DROP POLICY IF EXISTS "Org members can update auditor_access_tokens" ON public.auditor_access_tokens;
DROP POLICY IF EXISTS "Org members can delete auditor_access_tokens" ON public.auditor_access_tokens;

CREATE POLICY "Org members can view auditor_access_tokens"
  ON public.auditor_access_tokens FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert auditor_access_tokens"
  ON public.auditor_access_tokens FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update auditor_access_tokens"
  ON public.auditor_access_tokens FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete auditor_access_tokens"
  ON public.auditor_access_tokens FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === BCP_PLANS ===
DROP POLICY IF EXISTS "Org members can view bcp_plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Org members can insert bcp_plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Org members can update bcp_plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Org members can delete bcp_plans" ON public.bcp_plans;

CREATE POLICY "Org members can view bcp_plans"
  ON public.bcp_plans FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert bcp_plans"
  ON public.bcp_plans FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update bcp_plans"
  ON public.bcp_plans FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete bcp_plans"
  ON public.bcp_plans FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === COMPLIANCE_ALERTS ===
DROP POLICY IF EXISTS "Org members can view compliance_alerts" ON public.compliance_alerts;
DROP POLICY IF EXISTS "Org members can insert compliance_alerts" ON public.compliance_alerts;
DROP POLICY IF EXISTS "Org members can update compliance_alerts" ON public.compliance_alerts;
DROP POLICY IF EXISTS "Org members can delete compliance_alerts" ON public.compliance_alerts;

CREATE POLICY "Org members can view compliance_alerts"
  ON public.compliance_alerts FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert compliance_alerts"
  ON public.compliance_alerts FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update compliance_alerts"
  ON public.compliance_alerts FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete compliance_alerts"
  ON public.compliance_alerts FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === CUSTOM_COMPLIANCE_TESTS ===
DROP POLICY IF EXISTS "Org members can view custom_compliance_tests" ON public.custom_compliance_tests;
DROP POLICY IF EXISTS "Org members can insert custom_compliance_tests" ON public.custom_compliance_tests;
DROP POLICY IF EXISTS "Org members can update custom_compliance_tests" ON public.custom_compliance_tests;
DROP POLICY IF EXISTS "Org members can delete custom_compliance_tests" ON public.custom_compliance_tests;

CREATE POLICY "Org members can view custom_compliance_tests"
  ON public.custom_compliance_tests FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert custom_compliance_tests"
  ON public.custom_compliance_tests FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update custom_compliance_tests"
  ON public.custom_compliance_tests FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete custom_compliance_tests"
  ON public.custom_compliance_tests FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === INCIDENT_PLAYBOOKS ===
DROP POLICY IF EXISTS "Org members can view incident_playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Org members can insert incident_playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Org members can update incident_playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Org members can delete incident_playbooks" ON public.incident_playbooks;

CREATE POLICY "Org members can view incident_playbooks"
  ON public.incident_playbooks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert incident_playbooks"
  ON public.incident_playbooks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update incident_playbooks"
  ON public.incident_playbooks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete incident_playbooks"
  ON public.incident_playbooks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === INTEGRATION_COLLECTED_DATA ===
DROP POLICY IF EXISTS "Org members can view integration_collected_data" ON public.integration_collected_data;
DROP POLICY IF EXISTS "Org members can insert integration_collected_data" ON public.integration_collected_data;
DROP POLICY IF EXISTS "Org members can update integration_collected_data" ON public.integration_collected_data;
DROP POLICY IF EXISTS "Org members can delete integration_collected_data" ON public.integration_collected_data;

CREATE POLICY "Org members can view integration_collected_data"
  ON public.integration_collected_data FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert integration_collected_data"
  ON public.integration_collected_data FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update integration_collected_data"
  ON public.integration_collected_data FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete integration_collected_data"
  ON public.integration_collected_data FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === INTEGRATION_STATUS ===
DROP POLICY IF EXISTS "Org members can view integration_status" ON public.integration_status;
DROP POLICY IF EXISTS "Org members can insert integration_status" ON public.integration_status;
DROP POLICY IF EXISTS "Org members can update integration_status" ON public.integration_status;
DROP POLICY IF EXISTS "Org members can delete integration_status" ON public.integration_status;

CREATE POLICY "Org members can view integration_status"
  ON public.integration_status FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert integration_status"
  ON public.integration_status FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update integration_status"
  ON public.integration_status FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete integration_status"
  ON public.integration_status FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === NOTIFICATIONS ===
DROP POLICY IF EXISTS "Org members can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Org members can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Org members can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Org members can delete notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

-- === RISK_ACCEPTANCES ===
DROP POLICY IF EXISTS "Org members can view risk_acceptances" ON public.risk_acceptances;
DROP POLICY IF EXISTS "Org members can insert risk_acceptances" ON public.risk_acceptances;
DROP POLICY IF EXISTS "Org members can update risk_acceptances" ON public.risk_acceptances;
DROP POLICY IF EXISTS "Org members can delete risk_acceptances" ON public.risk_acceptances;

CREATE POLICY "Org members can view risk_acceptances"
  ON public.risk_acceptances FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert risk_acceptances"
  ON public.risk_acceptances FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update risk_acceptances"
  ON public.risk_acceptances FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete risk_acceptances"
  ON public.risk_acceptances FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === SECURITY_QUESTIONNAIRES ===
DROP POLICY IF EXISTS "Org members can view security_questionnaires" ON public.security_questionnaires;
DROP POLICY IF EXISTS "Org members can insert security_questionnaires" ON public.security_questionnaires;
DROP POLICY IF EXISTS "Org members can update security_questionnaires" ON public.security_questionnaires;
DROP POLICY IF EXISTS "Org members can delete security_questionnaires" ON public.security_questionnaires;

CREATE POLICY "Org members can view security_questionnaires"
  ON public.security_questionnaires FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert security_questionnaires"
  ON public.security_questionnaires FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update security_questionnaires"
  ON public.security_questionnaires FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete security_questionnaires"
  ON public.security_questionnaires FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === SYSTEM_LOGS ===
DROP POLICY IF EXISTS "Org members can view system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins can view system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "Service role can insert system_logs" ON public.system_logs;

CREATE POLICY "Admins can view org system_logs"
  ON public.system_logs FOR SELECT
  USING (
    org_id = get_user_org_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Service role can insert system_logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR org_id = get_user_org_id(auth.uid()));

-- === TASKS ===
DROP POLICY IF EXISTS "Org members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Org members can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Org members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Org members can delete tasks" ON public.tasks;

CREATE POLICY "Org members can view tasks"
  ON public.tasks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update tasks"
  ON public.tasks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete tasks"
  ON public.tasks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === TRUST_CENTER_SETTINGS ===
DROP POLICY IF EXISTS "Org members can view trust_center_settings" ON public.trust_center_settings;
DROP POLICY IF EXISTS "Org members can insert trust_center_settings" ON public.trust_center_settings;
DROP POLICY IF EXISTS "Org members can update trust_center_settings" ON public.trust_center_settings;
DROP POLICY IF EXISTS "Org members can delete trust_center_settings" ON public.trust_center_settings;

CREATE POLICY "Org members can view trust_center_settings"
  ON public.trust_center_settings FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert trust_center_settings"
  ON public.trust_center_settings FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update trust_center_settings"
  ON public.trust_center_settings FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete trust_center_settings"
  ON public.trust_center_settings FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Org members can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;

CREATE POLICY "Org members can view org user_roles"
  ON public.user_roles FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins can insert user_roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    org_id = get_user_org_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

CREATE POLICY "Admins can update user_roles"
  ON public.user_roles FOR UPDATE
  USING (
    org_id = get_user_org_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

CREATE POLICY "Admins can delete user_roles"
  ON public.user_roles FOR DELETE
  USING (
    org_id = get_user_org_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
  );

-- =====================================================
-- PARTE 4: Corrigir profiles com org_id isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Org members can view profiles" ON public.profiles;

CREATE POLICY "Users can view org profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id 
    OR org_id = get_user_org_id(auth.uid())
    OR has_role(auth.uid(), 'master_admin')
  );

-- =====================================================
-- PARTE 5: Função de Teste de Penetração RLS
-- =====================================================

CREATE OR REPLACE FUNCTION public.test_rls_bypass(test_org_id uuid)
RETURNS TABLE(
  table_name text,
  rows_visible bigint,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_org uuid;
BEGIN
  current_user_org := get_user_org_id(auth.uid());
  
  -- Verificar que o org de teste é DIFERENTE do usuário atual
  IF test_org_id = current_user_org THEN
    RAISE EXCEPTION 'Use um org_id diferente do seu para testar isolamento';
  END IF;
  
  -- Testar tabelas críticas
  RETURN QUERY
  SELECT 'risks'::text,
    (SELECT COUNT(*) FROM risks WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM risks WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'incidents'::text,
    (SELECT COUNT(*) FROM incidents WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM incidents WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'controls'::text,
    (SELECT COUNT(*) FROM controls WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM controls WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'frameworks'::text,
    (SELECT COUNT(*) FROM frameworks WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM frameworks WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'policies'::text,
    (SELECT COUNT(*) FROM policies WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM policies WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'vendors'::text,
    (SELECT COUNT(*) FROM vendors WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM vendors WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'api_keys'::text,
    (SELECT COUNT(*) FROM api_keys WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM api_keys WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'integrations_safe'::text,
    (SELECT COUNT(*) FROM integrations_safe WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM integrations_safe WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'audits'::text,
    (SELECT COUNT(*) FROM audits WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM audits WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'evidence'::text,
    (SELECT COUNT(*) FROM evidence WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM evidence WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'tasks'::text,
    (SELECT COUNT(*) FROM tasks WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM tasks WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'notifications'::text,
    (SELECT COUNT(*) FROM notifications WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM notifications WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'compliance_alerts'::text,
    (SELECT COUNT(*) FROM compliance_alerts WHERE org_id = test_org_id)::bigint,
    CASE WHEN (SELECT COUNT(*) FROM compliance_alerts WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
END;
$$;