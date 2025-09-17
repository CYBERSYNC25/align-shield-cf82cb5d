-- Create tables for incident management and BCP functionality

-- Create incident_playbooks table
CREATE TABLE public.incident_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  estimated_time TEXT,
  steps INTEGER DEFAULT 0,
  roles TEXT[],
  triggers TEXT[],
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bcp_plans table
CREATE TABLE public.bcp_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('tested', 'updated', 'scheduled', 'expired')),
  rto TEXT, -- Recovery Time Objective
  rpo TEXT, -- Recovery Point Objective
  coverage INTEGER DEFAULT 0,
  systems TEXT[],
  contact_person TEXT,
  last_tested DATE,
  next_test DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.incident_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bcp_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for incident_playbooks (allow all authenticated users to read/write)
CREATE POLICY "Allow authenticated users to view incident playbooks" 
ON public.incident_playbooks 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to create incident playbooks" 
ON public.incident_playbooks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update incident playbooks" 
ON public.incident_playbooks 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete incident playbooks" 
ON public.incident_playbooks 
FOR DELETE 
USING (true);

-- Create policies for bcp_plans (allow all authenticated users to read/write)
CREATE POLICY "Allow authenticated users to view bcp plans" 
ON public.bcp_plans 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to create bcp plans" 
ON public.bcp_plans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bcp plans" 
ON public.bcp_plans 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete bcp plans" 
ON public.bcp_plans 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_incident_playbooks_updated_at
  BEFORE UPDATE ON public.incident_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bcp_plans_updated_at
  BEFORE UPDATE ON public.bcp_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for incident_playbooks
INSERT INTO public.incident_playbooks (name, description, category, severity, estimated_time, steps, roles, triggers, usage_count, last_used) VALUES
('Security Incident Response', 'Comprehensive response protocol for security breaches and attacks', 'Security', 'critical', '2-4h', 8, ARRAY['Security Admin', 'CISO', 'Legal Team'], ARRAY['Malware detection', 'Unauthorized access', 'Data breach alerts'], 3, '2025-01-15 14:30:00'),
('Infrastructure Outage Management', 'Protocol for managing critical infrastructure failures', 'Infrastructure', 'high', '1-2h', 6, ARRAY['DevOps Engineer', 'Infrastructure Team'], ARRAY['Server down alerts', 'Network connectivity issues', 'Database failures'], 1, '2025-01-10 09:15:00'),
('Performance Degradation Response', 'Steps to identify and resolve performance issues', 'Performance', 'medium', '30min-1h', 4, ARRAY['Performance Engineer', 'Development Team'], ARRAY['High response times', 'CPU/Memory alerts', 'Database slow queries'], 5, '2025-01-12 16:45:00'),
('Data Protection Incident', 'Response protocol for data protection and privacy incidents', 'Data Protection', 'critical', '1-3h', 7, ARRAY['Privacy Officer', 'Legal Team', 'Security Admin'], ARRAY['Privacy violation reports', 'GDPR breach indicators', 'Unauthorized data access'], 2, '2025-01-08 11:20:00');

-- Insert sample data for bcp_plans
INSERT INTO public.bcp_plans (name, description, status, rto, rpo, coverage, systems, contact_person, last_tested, next_test) VALUES
('IT Infrastructure Recovery', 'Complete recovery plan for IT infrastructure including servers, networks and databases', 'tested', '4h', '1h', 95, ARRAY['Servers', 'Network', 'Databases', 'Storage'], 'João Silva - IT Manager', '2024-12-15', '2025-03-15'),
('Data Center Failover', 'Primary data center failure recovery procedures', 'scheduled', '2h', '30min', 90, ARRAY['Primary DC', 'Backup DC', 'Network Links'], 'Maria Santos - Operations', '2024-11-20', '2025-02-20'),
('Application Services Recovery', 'Recovery procedures for critical business applications', 'updated', '1h', '15min', 88, ARRAY['Web Apps', 'APIs', 'Databases'], 'Pedro Costa - Dev Lead', '2024-12-01', '2025-03-01'),
('Communication Systems BCP', 'Backup communication channels and emergency notifications', 'tested', '30min', '5min', 92, ARRAY['Email', 'Phone Systems', 'Chat'], 'Ana Oliveira - Communications', '2024-12-10', '2025-02-10');