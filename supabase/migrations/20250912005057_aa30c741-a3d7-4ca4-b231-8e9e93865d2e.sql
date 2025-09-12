-- Criar tabela de fornecedores (vendors)
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  criticality TEXT NOT NULL CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  contract_value TEXT,
  last_assessment DATE,
  next_assessment DATE,
  compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'expired')),
  certifications TEXT[],
  pending_actions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de riscos
CREATE TABLE public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  probability TEXT NOT NULL CHECK (probability IN ('low', 'medium', 'high')),
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high', 'critical')),
  owner TEXT NOT NULL,
  owner_role TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'accepted', 'transferred')),
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  last_review DATE,
  next_review DATE,
  controls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de avaliações de risco
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'in_progress', 'completed', 'overdue')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  sent_date DATE,
  due_date DATE,
  completed_questions INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  risk_flags INTEGER DEFAULT 0,
  contact_person TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de controles
CREATE TABLE public.controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  framework_id UUID REFERENCES public.frameworks(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('passed', 'failed', 'pending', 'na')),
  evidence_count INTEGER DEFAULT 0,
  owner TEXT,
  last_verified DATE,
  next_review DATE,
  findings TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(framework_id, code)
);

-- Criar tabela de políticas
CREATE TABLE public.policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published', 'archived')),
  owner TEXT,
  approver TEXT,
  effective_date DATE,
  review_date DATE,
  next_review DATE,
  tags TEXT[],
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para vendors
CREATE POLICY "Users can manage their own vendors" 
ON public.vendors 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Criar políticas RLS para risks
CREATE POLICY "Users can manage their own risks" 
ON public.risks 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Criar políticas RLS para risk_assessments
CREATE POLICY "Users can manage their own risk assessments" 
ON public.risk_assessments 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Criar políticas RLS para controls
CREATE POLICY "Users can manage their own controls" 
ON public.controls 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Criar políticas RLS para policies
CREATE POLICY "Users can manage their own policies" 
ON public.policies 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Criar triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at
  BEFORE UPDATE ON public.risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_controls_updated_at
  BEFORE UPDATE ON public.controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campos ausentes na tabela frameworks existente
ALTER TABLE public.frameworks ADD COLUMN IF NOT EXISTS compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100);
ALTER TABLE public.frameworks ADD COLUMN IF NOT EXISTS total_controls INTEGER DEFAULT 0;
ALTER TABLE public.frameworks ADD COLUMN IF NOT EXISTS passed_controls INTEGER DEFAULT 0;