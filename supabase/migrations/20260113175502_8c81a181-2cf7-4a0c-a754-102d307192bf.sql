-- Create compliance_alerts table for drift detection
CREATE TABLE public.compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_id TEXT NOT NULL,
  rule_title TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  severity TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  affected_resources INTEGER DEFAULT 0,
  affected_items JSONB DEFAULT '[]'::jsonb,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create system_audit_logs table for immutable audit trail
CREATE TABLE public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create compliance_check_history table for verification history
CREATE TABLE public.compliance_check_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  check_type TEXT NOT NULL DEFAULT 'scheduled',
  total_rules_checked INTEGER DEFAULT 0,
  passing_count INTEGER DEFAULT 0,
  failing_count INTEGER DEFAULT 0,
  risk_accepted_count INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  integrations_checked JSONB DEFAULT '[]'::jsonb,
  rules_results JSONB DEFAULT '[]'::jsonb,
  drift_detected BOOLEAN DEFAULT false,
  drift_details JSONB DEFAULT '[]'::jsonb,
  triggered_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_check_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_alerts
CREATE POLICY "Users can view their own compliance alerts"
ON public.compliance_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts to acknowledge"
ON public.compliance_alerts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts"
ON public.compliance_alerts
FOR INSERT
WITH CHECK (true);

-- RLS Policies for system_audit_logs (immutable - no UPDATE/DELETE)
CREATE POLICY "Admins and auditors can view audit logs"
ON public.system_audit_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin') OR 
  public.has_role(auth.uid(), 'auditor') OR
  auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.system_audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for compliance_check_history
CREATE POLICY "Users can view their own check history"
ON public.compliance_check_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins and auditors can view all check history"
ON public.compliance_check_history
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin') OR 
  public.has_role(auth.uid(), 'auditor')
);

CREATE POLICY "Service role can insert check history"
ON public.compliance_check_history
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_compliance_alerts_user_id ON public.compliance_alerts(user_id);
CREATE INDEX idx_compliance_alerts_acknowledged ON public.compliance_alerts(acknowledged);
CREATE INDEX idx_compliance_alerts_triggered_at ON public.compliance_alerts(triggered_at DESC);
CREATE INDEX idx_system_audit_logs_user_id ON public.system_audit_logs(user_id);
CREATE INDEX idx_system_audit_logs_action_type ON public.system_audit_logs(action_type);
CREATE INDEX idx_system_audit_logs_created_at ON public.system_audit_logs(created_at DESC);
CREATE INDEX idx_compliance_check_history_user_id ON public.compliance_check_history(user_id);
CREATE INDEX idx_compliance_check_history_created_at ON public.compliance_check_history(created_at DESC);