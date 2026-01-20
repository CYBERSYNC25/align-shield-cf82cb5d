-- =====================================================
-- TRUST CENTER: Tabelas, View e Políticas de Segurança
-- =====================================================

-- 1. Tabela de configurações do Trust Center
CREATE TABLE public.trust_center_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Configurações básicas
  enabled BOOLEAN NOT NULL DEFAULT false,
  company_slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  
  -- Visibilidade de seções
  show_score BOOLEAN NOT NULL DEFAULT true,
  show_frameworks BOOLEAN NOT NULL DEFAULT true,
  show_controls BOOLEAN NOT NULL DEFAULT false,
  show_last_audit BOOLEAN NOT NULL DEFAULT true,
  
  -- Conteúdo personalizado
  custom_message TEXT,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de frameworks públicos do Trust Center
CREATE TABLE public.trust_center_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  framework_id UUID NOT NULL REFERENCES public.frameworks(id) ON DELETE CASCADE,
  
  -- Display customizado
  display_name TEXT,
  
  -- Certificação
  certification_date DATE,
  certificate_url TEXT,
  
  -- Visibilidade
  show_public BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: um framework por user
  UNIQUE(user_id, framework_id)
);

-- 3. View pública que agrega dados seguros
CREATE OR REPLACE VIEW public.trust_center_public_data AS
SELECT 
  s.company_slug,
  s.custom_domain,
  s.logo_url,
  s.primary_color,
  s.custom_message,
  s.seo_title,
  s.seo_description,
  s.show_score,
  s.show_frameworks,
  s.show_controls,
  s.show_last_audit,
  
  -- Score agregado (apenas se show_score = true)
  CASE WHEN s.show_score THEN 
    (SELECT COALESCE(AVG(f.compliance_score), 0)::INTEGER 
     FROM public.frameworks f 
     WHERE f.user_id = s.user_id)
  ELSE NULL END as compliance_score,
  
  -- Frameworks públicos (apenas se show_frameworks = true)
  CASE WHEN s.show_frameworks THEN
    (SELECT jsonb_agg(jsonb_build_object(
      'name', COALESCE(tf.display_name, f.name),
      'certification_date', tf.certification_date,
      'certificate_url', tf.certificate_url,
      'compliance_score', f.compliance_score,
      'passed_controls', f.passed_controls,
      'total_controls', f.total_controls
    ))
    FROM public.trust_center_frameworks tf
    JOIN public.frameworks f ON f.id = tf.framework_id
    WHERE tf.user_id = s.user_id AND tf.show_public = true)
  ELSE NULL END as public_frameworks,
  
  -- Contagem de controles (apenas se show_controls = true)
  CASE WHEN s.show_controls THEN
    (SELECT jsonb_build_object(
      'total', COUNT(*),
      'passing', COUNT(*) FILTER (WHERE status = 'implemented'),
      'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
      'not_started', COUNT(*) FILTER (WHERE status = 'not_implemented')
    )
    FROM public.controls c
    WHERE c.user_id = s.user_id)
  ELSE NULL END as controls_summary,
  
  -- Última auditoria (apenas se show_last_audit = true)
  CASE WHEN s.show_last_audit THEN
    (SELECT jsonb_build_object(
      'framework', a.framework,
      'status', a.status,
      'end_date', a.end_date,
      'auditor', a.auditor
    )
    FROM public.audits a
    WHERE a.user_id = s.user_id
    ORDER BY a.end_date DESC NULLS LAST
    LIMIT 1)
  ELSE NULL END as last_audit,
  
  -- Timestamp de atualização
  s.updated_at as last_updated

FROM public.trust_center_settings s
WHERE s.enabled = true;

-- 4. Habilitar RLS nas tabelas
ALTER TABLE public.trust_center_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_center_frameworks ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para trust_center_settings
CREATE POLICY "Users can manage their own trust center settings"
  ON public.trust_center_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view enabled trust centers"
  ON public.trust_center_settings FOR SELECT
  USING (enabled = true);

-- 6. Políticas RLS para trust_center_frameworks
CREATE POLICY "Users can manage their own trust center frameworks"
  ON public.trust_center_frameworks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view public frameworks"
  ON public.trust_center_frameworks FOR SELECT
  USING (show_public = true);

-- 7. Função de acesso seguro para anônimos
CREATE OR REPLACE FUNCTION public.get_trust_center_by_slug(p_slug TEXT)
RETURNS TABLE (
  company_slug TEXT,
  custom_domain TEXT,
  logo_url TEXT,
  primary_color TEXT,
  custom_message TEXT,
  seo_title TEXT,
  seo_description TEXT,
  show_score BOOLEAN,
  show_frameworks BOOLEAN,
  show_controls BOOLEAN,
  show_last_audit BOOLEAN,
  compliance_score INTEGER,
  public_frameworks JSONB,
  controls_summary JSONB,
  last_audit JSONB,
  last_updated TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM trust_center_public_data 
  WHERE company_slug = p_slug;
$$;

-- Grant para anon role
GRANT EXECUTE ON FUNCTION public.get_trust_center_by_slug(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_trust_center_by_slug(TEXT) TO authenticated;

-- 8. Triggers para updated_at
CREATE TRIGGER update_trust_center_settings_updated_at
  BEFORE UPDATE ON public.trust_center_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trust_center_frameworks_updated_at
  BEFORE UPDATE ON public.trust_center_frameworks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Índices para performance
CREATE INDEX idx_trust_center_settings_slug 
  ON public.trust_center_settings(company_slug) 
  WHERE enabled = true;

CREATE INDEX idx_trust_center_settings_domain 
  ON public.trust_center_settings(custom_domain) 
  WHERE custom_domain IS NOT NULL;

CREATE INDEX idx_trust_center_settings_user 
  ON public.trust_center_settings(user_id);

CREATE INDEX idx_trust_center_frameworks_user 
  ON public.trust_center_frameworks(user_id);

CREATE INDEX idx_trust_center_frameworks_public 
  ON public.trust_center_frameworks(user_id, framework_id) 
  WHERE show_public = true;