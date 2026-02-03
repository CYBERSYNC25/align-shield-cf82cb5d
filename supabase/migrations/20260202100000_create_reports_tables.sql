-- =============================================================================
-- Tabelas de Relatórios (reports e scheduled_reports)
-- =============================================================================

-- reports: relatórios customizados e templates
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  format TEXT NOT NULL,
  framework TEXT,
  readiness INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready',
  last_generated TEXT,
  size TEXT,
  pages INTEGER NOT NULL DEFAULT 0,
  sections TEXT[] DEFAULT '{}',
  audience TEXT,
  metrics TEXT[] DEFAULT '{}',
  filters JSONB,
  recipients TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX reports_org_id_idx ON public.reports(org_id);
CREATE INDEX reports_user_id_idx ON public.reports(user_id);
CREATE INDEX reports_created_at_idx ON public.reports(created_at DESC);

COMMENT ON TABLE public.reports IS 'Relatórios de compliance criados pelos usuários';

-- scheduled_reports: agendamento de envio de relatórios
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL,
  next_run TIMESTAMP WITH TIME ZONE,
  last_run TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  format TEXT NOT NULL,
  recipients JSONB DEFAULT '[]'::jsonb,
  delivery_method TEXT NOT NULL DEFAULT 'email',
  success_rate INTEGER NOT NULL DEFAULT 100,
  last_status TEXT DEFAULT 'success',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX scheduled_reports_org_id_idx ON public.scheduled_reports(org_id);
CREATE INDEX scheduled_reports_user_id_idx ON public.scheduled_reports(user_id);

COMMENT ON TABLE public.scheduled_reports IS 'Agendamento de envio de relatórios por e-mail ou link';

-- Trigger updated_at (usa função existente no projeto)
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS - reports
-- =============================================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view reports"
  ON public.reports FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

CREATE POLICY "Org members can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

CREATE POLICY "Org members can update reports"
  ON public.reports FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

CREATE POLICY "Org members can delete reports"
  ON public.reports FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

-- =============================================================================
-- RLS - scheduled_reports
-- =============================================================================
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view scheduled_reports"
  ON public.scheduled_reports FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

CREATE POLICY "Org members can insert scheduled_reports"
  ON public.scheduled_reports FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

CREATE POLICY "Org members can update scheduled_reports"
  ON public.scheduled_reports FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);

CREATE POLICY "Org members can delete scheduled_reports"
  ON public.scheduled_reports FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);
