-- Tabela para armazenar recursos coletados das integrações
CREATE TABLE IF NOT EXISTS integration_collected_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_data JSONB NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, integration_name, resource_type, resource_id)
);

ALTER TABLE integration_collected_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collected data" ON integration_collected_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collected data" ON integration_collected_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collected data" ON integration_collected_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collected data" ON integration_collected_data
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_collected_data_user ON integration_collected_data(user_id);
CREATE INDEX idx_collected_data_integration ON integration_collected_data(integration_name);
CREATE INDEX idx_collected_data_type ON integration_collected_data(resource_type);
CREATE INDEX idx_collected_data_lookup ON integration_collected_data(user_id, integration_name, resource_type);

-- Adicionar constraint única para integration_status (user + integration)
ALTER TABLE integration_status DROP CONSTRAINT IF EXISTS integration_status_user_integration_unique;
ALTER TABLE integration_status ADD CONSTRAINT integration_status_user_integration_unique UNIQUE (user_id, integration_name);