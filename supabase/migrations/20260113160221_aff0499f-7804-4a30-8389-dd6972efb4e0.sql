-- Create risk_acceptances table for storing "Accept Risk" decisions
CREATE TABLE public.risk_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identification of the test/rule
  rule_id TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  
  -- Acceptance details
  justification TEXT NOT NULL,
  accepted_by TEXT NOT NULL,
  duration TEXT NOT NULL CHECK (duration IN ('3_months', '6_months', '1_year', 'permanent')),
  expires_at TIMESTAMPTZ,
  
  -- Audit
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, rule_id, resource_id)
);

-- Enable RLS
ALTER TABLE public.risk_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can view their own risk acceptances
CREATE POLICY "Users can view own risk acceptances" ON public.risk_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- Admins and compliance officers can insert
CREATE POLICY "Authorized users can insert risk acceptances" ON public.risk_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update (revoke)
CREATE POLICY "Users can update own risk acceptances" ON public.risk_acceptances
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_risk_acceptances_updated_at
  BEFORE UPDATE ON public.risk_acceptances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();