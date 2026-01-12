-- Adicionar constraint UNIQUE para suportar upsert na coleta de dados
ALTER TABLE integration_collected_data 
ADD CONSTRAINT integration_collected_data_unique_resource 
UNIQUE (user_id, integration_name, resource_type, resource_id);

-- Adicionar índices para performance nas buscas
CREATE INDEX IF NOT EXISTS idx_integration_collected_data_user_integration 
ON integration_collected_data (user_id, integration_name);

CREATE INDEX IF NOT EXISTS idx_integration_collected_data_resource_type 
ON integration_collected_data (user_id, resource_type);

CREATE INDEX IF NOT EXISTS idx_integration_collected_data_collected_at 
ON integration_collected_data (collected_at DESC);