-- Add SLA tracking fields to compliance_alerts table
ALTER TABLE public.compliance_alerts 
ADD COLUMN IF NOT EXISTS remediation_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_hours INTEGER,
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overdue_notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS external_ticket_id TEXT,
ADD COLUMN IF NOT EXISTS external_ticket_url TEXT,
ADD COLUMN IF NOT EXISTS resolved_by TEXT,
ADD COLUMN IF NOT EXISTS time_to_resolve_hours INTEGER;

-- Create remediation_tickets table to track external tickets
CREATE TABLE IF NOT EXISTS public.remediation_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_id UUID REFERENCES public.compliance_alerts(id) ON DELETE SET NULL,
  rule_id TEXT NOT NULL,
  external_system TEXT NOT NULL,
  external_ticket_id TEXT NOT NULL,
  external_ticket_url TEXT,
  ticket_title TEXT NOT NULL,
  ticket_status TEXT DEFAULT 'open',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on remediation_tickets
ALTER TABLE public.remediation_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for remediation_tickets
CREATE POLICY "Users can view their own tickets"
  ON public.remediation_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.remediation_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON public.remediation_tickets FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_deadline ON public.compliance_alerts(remediation_deadline) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_overdue ON public.compliance_alerts(is_overdue) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_remediation_tickets_user ON public.remediation_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_remediation_tickets_alert ON public.remediation_tickets(alert_id);

-- Create function to update updated_at on remediation_tickets
CREATE OR REPLACE FUNCTION public.update_remediation_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_remediation_tickets_updated_at ON public.remediation_tickets;
CREATE TRIGGER update_remediation_tickets_updated_at
  BEFORE UPDATE ON public.remediation_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_remediation_tickets_updated_at();