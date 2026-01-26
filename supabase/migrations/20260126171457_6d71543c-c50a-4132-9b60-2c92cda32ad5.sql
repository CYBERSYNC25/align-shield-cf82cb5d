-- ============================================================================
-- Credential Security Hardening Migration
-- Adds columns for key rotation history and credential inactivity tracking
-- ============================================================================

-- 1. Add last_used_at column to integrations table for inactivity tracking
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- 2. Add last_used_at column to integration_oauth_tokens table
ALTER TABLE public.integration_oauth_tokens 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- 3. Create encryption key history table for key rotation support
CREATE TABLE IF NOT EXISTS public.encryption_key_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_version INT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false
);

-- 4. Enable RLS on encryption_key_history (only service_role can access)
ALTER TABLE public.encryption_key_history ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for service_role only access
CREATE POLICY "Only service role can access encryption keys"
  ON public.encryption_key_history
  FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Add index for faster lookups on last_used_at
CREATE INDEX IF NOT EXISTS idx_integrations_last_used_at 
  ON public.integrations(last_used_at);

CREATE INDEX IF NOT EXISTS idx_integration_oauth_tokens_last_used_at 
  ON public.integration_oauth_tokens(last_used_at);

-- 7. Add index for token expiration queries
CREATE INDEX IF NOT EXISTS idx_integration_oauth_tokens_expires_at 
  ON public.integration_oauth_tokens(expires_at);

-- 8. Set default last_used_at for existing connected integrations
UPDATE public.integrations 
SET last_used_at = COALESCE(last_sync_at, updated_at, created_at)
WHERE last_used_at IS NULL AND status = 'connected';

-- 9. Set default last_used_at for existing OAuth tokens
UPDATE public.integration_oauth_tokens 
SET last_used_at = COALESCE(updated_at, created_at)
WHERE last_used_at IS NULL;

-- 10. Insert initial key version record (v1)
INSERT INTO public.encryption_key_history (key_version, key_hash, algorithm, is_active, created_at)
VALUES (1, 'initial-deployment-v1', 'AES-256-GCM', true, now())
ON CONFLICT (key_version) DO NOTHING;