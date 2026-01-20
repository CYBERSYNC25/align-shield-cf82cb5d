-- =====================================================
-- Custom Compliance Tests Migration
-- =====================================================

-- 1. ENUM: condition_operator
CREATE TYPE condition_operator AS ENUM (
  'equals',
  'not_equals', 
  'greater_than',
  'less_than',
  'greater_than_or_equals',
  'less_than_or_equals',
  'contains',
  'not_contains',
  'regex_match',
  'is_empty',
  'is_not_empty',
  'in_array',
  'not_in_array',
  'starts_with',
  'ends_with'
);

-- 2. TABELA: custom_compliance_tests
CREATE TABLE public.custom_compliance_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Identificação do teste
  test_name TEXT NOT NULL,
  test_description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' 
    CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  
  -- Escopo do teste
  integration_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  
  -- Configuração
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Lógica do teste (estrutura JSONB)
  test_logic JSONB NOT NULL DEFAULT '{
    "conditions": [],
    "logic": "AND",
    "nested": []
  }'::jsonb,
  
  -- SLA
  sla_hours INTEGER DEFAULT 168,
  
  -- Metadados de execução
  created_by TEXT,
  last_run_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  avg_execution_time_ms NUMERIC(10, 2) DEFAULT 0,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_test_name_per_user UNIQUE (user_id, test_name)
);

-- Índices para performance
CREATE INDEX idx_custom_tests_user_id ON public.custom_compliance_tests(user_id);
CREATE INDEX idx_custom_tests_integration ON public.custom_compliance_tests(integration_name);
CREATE INDEX idx_custom_tests_enabled ON public.custom_compliance_tests(enabled) WHERE enabled = true;
CREATE INDEX idx_custom_tests_resource ON public.custom_compliance_tests(integration_name, resource_type);

-- 3. TABELA: custom_test_results
CREATE TABLE public.custom_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.custom_compliance_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'error', 'skipped')),
  affected_resources_count INTEGER DEFAULT 0,
  
  -- Performance
  execution_time_ms INTEGER,
  
  -- Detalhes
  error_message TEXT,
  result_details JSONB DEFAULT '{
    "resources_checked": [],
    "failing_resources": [],
    "passing_resources": [],
    "conditions_evaluated": []
  }'::jsonb,
  
  -- Metadata
  triggered_by TEXT DEFAULT 'manual',
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas
CREATE INDEX idx_test_results_test_id ON public.custom_test_results(test_id);
CREATE INDEX idx_test_results_user_id ON public.custom_test_results(user_id);
CREATE INDEX idx_test_results_executed_at ON public.custom_test_results(executed_at DESC);
CREATE INDEX idx_test_results_status ON public.custom_test_results(status);

-- 4. RLS POLICIES
ALTER TABLE public.custom_compliance_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_test_results ENABLE ROW LEVEL SECURITY;

-- Policies para custom_compliance_tests
CREATE POLICY "Users can view own custom tests"
  ON public.custom_compliance_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom tests"
  ON public.custom_compliance_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom tests"
  ON public.custom_compliance_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom tests"
  ON public.custom_compliance_tests FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para custom_test_results
CREATE POLICY "Users can view own test results"
  ON public.custom_test_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results"
  ON public.custom_test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role pode inserir resultados (para execução automática)
CREATE POLICY "Service role can insert test results"
  ON public.custom_test_results FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 5. FUNÇÃO: Atualizar métricas de execução
CREATE OR REPLACE FUNCTION public.update_custom_test_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.custom_compliance_tests
  SET 
    last_run_at = NEW.executed_at,
    execution_count = execution_count + 1,
    avg_execution_time_ms = (
      (avg_execution_time_ms * execution_count + COALESCE(NEW.execution_time_ms, 0)) 
      / (execution_count + 1)
    ),
    last_error = CASE WHEN NEW.status = 'error' THEN NEW.error_message ELSE NULL END,
    updated_at = now()
  WHERE id = NEW.test_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar métricas automaticamente
CREATE TRIGGER trigger_update_test_metrics
  AFTER INSERT ON public.custom_test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_test_metrics();

-- 6. Trigger para updated_at
CREATE TRIGGER update_custom_tests_updated_at
  BEFORE UPDATE ON public.custom_compliance_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();