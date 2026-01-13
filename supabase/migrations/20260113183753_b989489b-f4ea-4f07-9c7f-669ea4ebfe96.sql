-- =============================================
-- PHASE 1: CRITICAL INFRASTRUCTURE MIGRATION
-- =============================================

-- 1.1: Enable pg_net for HTTP calls (needed for cron)
-- Note: pg_cron needs to be enabled in Supabase Dashboard > Extensions

-- 1.3: Add approval workflow fields to risk_acceptances
ALTER TABLE public.risk_acceptances 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;

-- Create risk approval policies table
CREATE TABLE IF NOT EXISTS public.risk_approval_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  min_severity TEXT NOT NULL DEFAULT 'critical',
  approver_roles TEXT[] DEFAULT ARRAY['master_admin', 'admin'],
  max_auto_approve_duration TEXT DEFAULT '3_months',
  require_approval_for_permanent BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risk_approval_policies ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk_approval_policies
CREATE POLICY "Users can view their own approval policies"
  ON public.risk_approval_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage approval policies"
  ON public.risk_approval_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'master_admin')
    )
  );

-- 2.1: Create auditor access tokens table for secure portal links
CREATE TABLE IF NOT EXISTS public.auditor_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  auditor_email TEXT,
  auditor_name TEXT,
  company_name TEXT,
  audit_type TEXT,
  permissions JSONB DEFAULT '{"view_evidence": true, "view_inventory": true, "view_history": true}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auditor_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for auditor_access_tokens
CREATE POLICY "Users can view their own tokens"
  ON public.auditor_access_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens"
  ON public.auditor_access_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.auditor_access_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON public.auditor_access_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_auditor_tokens_token ON public.auditor_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auditor_tokens_user ON public.auditor_access_tokens(user_id);

-- Index for risk acceptances approval status
CREATE INDEX IF NOT EXISTS idx_risk_acceptances_approval ON public.risk_acceptances(approval_status);

-- Update updated_at trigger for approval policies
CREATE TRIGGER update_risk_approval_policies_updated_at
  BEFORE UPDATE ON public.risk_approval_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();