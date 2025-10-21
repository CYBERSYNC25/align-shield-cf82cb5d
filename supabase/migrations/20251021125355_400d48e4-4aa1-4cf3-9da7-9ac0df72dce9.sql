-- Create access_anomalies table if not exists
CREATE TABLE IF NOT EXISTS public.access_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  system_name TEXT NOT NULL,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('excessive_privileges', 'unused_access', 'suspicious_activity', 'policy_violation')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.access_anomalies ENABLE ROW LEVEL SECURITY;

-- Create policies for access_anomalies
CREATE POLICY "Users can view all anomalies" 
ON public.access_anomalies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and compliance officers can insert anomalies" 
ON public.access_anomalies 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'compliance_officer'::app_role)
);

CREATE POLICY "Admin and compliance officers can update anomalies" 
ON public.access_anomalies 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'compliance_officer'::app_role)
);

CREATE POLICY "Admin can delete anomalies" 
ON public.access_anomalies 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_access_anomalies_updated_at
BEFORE UPDATE ON public.access_anomalies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_access_anomalies_status ON public.access_anomalies(status);
CREATE INDEX idx_access_anomalies_severity ON public.access_anomalies(severity);
CREATE INDEX idx_access_anomalies_detected_at ON public.access_anomalies(detected_at DESC);