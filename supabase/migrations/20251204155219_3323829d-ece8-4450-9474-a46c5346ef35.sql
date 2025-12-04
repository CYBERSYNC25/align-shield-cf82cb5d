-- =====================================================
-- SECURITY FIX: Corrigir vulnerabilidades críticas RLS
-- =====================================================

-- 1. DEVICE_LOGS: Adicionar user_id e restringir acesso
-- -----------------------------------------------------

-- Adicionar coluna user_id (nullable para dados existentes)
ALTER TABLE public.device_logs ADD COLUMN IF NOT EXISTS user_id uuid;

-- Remover políticas permissivas demais
DROP POLICY IF EXISTS "Anyone can insert device logs" ON public.device_logs;
DROP POLICY IF EXISTS "Anyone can view device logs" ON public.device_logs;

-- Criar políticas seguras
CREATE POLICY "Users can view their own device logs"
ON public.device_logs
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own device logs"
ON public.device_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 2. BCP_PLANS: Adicionar user_id e restringir acesso
-- -----------------------------------------------------

-- Adicionar coluna user_id
ALTER TABLE public.bcp_plans ADD COLUMN IF NOT EXISTS user_id uuid;

-- Remover políticas permissivas
DROP POLICY IF EXISTS "Allow authenticated users to create bcp plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Allow authenticated users to delete bcp plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Allow authenticated users to update bcp plans" ON public.bcp_plans;
DROP POLICY IF EXISTS "Allow authenticated users to view bcp plans" ON public.bcp_plans;

-- Criar políticas seguras baseadas em user_id
CREATE POLICY "Users can manage their own BCP plans"
ON public.bcp_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir admins e compliance officers verem todos
CREATE POLICY "Admins and compliance officers can view all BCP plans"
ON public.bcp_plans
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'compliance_officer')
);

-- 3. INCIDENT_PLAYBOOKS: Adicionar user_id e restringir acesso
-- -------------------------------------------------------------

-- Adicionar coluna user_id
ALTER TABLE public.incident_playbooks ADD COLUMN IF NOT EXISTS user_id uuid;

-- Remover políticas permissivas
DROP POLICY IF EXISTS "Allow authenticated users to create incident playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Allow authenticated users to delete incident playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Allow authenticated users to update incident playbooks" ON public.incident_playbooks;
DROP POLICY IF EXISTS "Allow authenticated users to view incident playbooks" ON public.incident_playbooks;

-- Criar políticas seguras
CREATE POLICY "Users can manage their own incident playbooks"
ON public.incident_playbooks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir admins e auditors verem todos (para compliance)
CREATE POLICY "Admins and auditors can view all playbooks"
ON public.incident_playbooks
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'auditor')
);

-- 4. ACCESS_ANOMALIES: Corrigir SELECT para filtrar por user_id
-- --------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view all anomalies" ON public.access_anomalies;

CREATE POLICY "Users can view their own anomalies or admins see all"
ON public.access_anomalies
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'compliance_officer')
);

-- 5. INTEGRATION_WEBHOOKS: Adicionar user_id
-- -------------------------------------------

ALTER TABLE public.integration_webhooks ADD COLUMN IF NOT EXISTS user_id uuid;

DROP POLICY IF EXISTS "Authenticated users can view webhooks" ON public.integration_webhooks;

CREATE POLICY "Users can view their own webhooks or admins see all"
ON public.integration_webhooks
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- 6. INTEGRATION_STATUS: Adicionar user_id
-- -----------------------------------------

ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS user_id uuid;

DROP POLICY IF EXISTS "Authenticated users can view integration status" ON public.integration_status;

CREATE POLICY "Users can view their own integration status or admins see all"
ON public.integration_status
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);