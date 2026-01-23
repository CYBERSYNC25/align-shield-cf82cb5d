-- Adicionar colunas de onboarding na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Índice para queries de onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
ON public.profiles(onboarding_completed);

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica se o usuário completou o wizard de onboarding';
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Step atual do wizard (0-4)';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Dados coletados durante onboarding (frameworks, integração, scan results)';
COMMENT ON COLUMN public.profiles.onboarding_skipped IS 'Indica se o usuário pulou o onboarding';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Data/hora em que o onboarding foi completado';