-- First, delete duplicate integrations keeping only the most recent one per user/provider
DELETE FROM public.integrations a
USING public.integrations b
WHERE a.user_id = b.user_id 
  AND a.provider = b.provider 
  AND a.created_at < b.created_at;

-- Now add the UNIQUE constraint
ALTER TABLE public.integrations 
ADD CONSTRAINT integrations_user_provider_unique UNIQUE (user_id, provider);

-- Add index for faster lookups on integration_collected_data
CREATE INDEX IF NOT EXISTS idx_integration_collected_data_lookup 
ON public.integration_collected_data (user_id, integration_name, resource_type);

-- Remove duplicate constraint if exists
ALTER TABLE public.integration_collected_data 
DROP CONSTRAINT IF EXISTS integration_collected_data_user_id_integration_name_resourc_key;