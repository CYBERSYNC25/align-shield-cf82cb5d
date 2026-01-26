-- API Keys table for developer authentication
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read']::TEXT[],
  rate_limit_tier TEXT DEFAULT 'free' CHECK (rate_limit_tier IN ('free', 'pro', 'enterprise')),
  requests_today INTEGER DEFAULT 0,
  requests_this_minute INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  last_minute_reset TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for API key lookups
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can manage their own API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Function to validate API key and check rate limits
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_hash TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  api_key_id UUID,
  org_id UUID,
  user_id UUID,
  scopes TEXT[],
  rate_limit_tier TEXT,
  rate_limit_exceeded BOOLEAN,
  requests_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key RECORD;
  v_limit INTEGER;
  v_current_minute TIMESTAMPTZ;
BEGIN
  v_current_minute := date_trunc('minute', now());
  
  -- Find the API key
  SELECT * INTO v_key
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash
    AND ak.is_revoked = false
    AND (ak.expires_at IS NULL OR ak.expires_at > now());
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT[], NULL::TEXT, false, 0;
    RETURN;
  END IF;
  
  -- Determine rate limit based on tier
  v_limit := CASE v_key.rate_limit_tier
    WHEN 'free' THEN 100
    WHEN 'pro' THEN 1000
    WHEN 'enterprise' THEN 999999
    ELSE 100
  END;
  
  -- Reset minute counter if new minute
  IF v_key.last_minute_reset IS NULL OR v_key.last_minute_reset < v_current_minute THEN
    UPDATE api_keys 
    SET requests_this_minute = 1, 
        last_minute_reset = v_current_minute,
        last_request_at = now(),
        requests_today = requests_today + 1
    WHERE id = v_key.id;
    
    RETURN QUERY SELECT 
      true, 
      v_key.id, 
      v_key.org_id, 
      v_key.user_id, 
      v_key.scopes, 
      v_key.rate_limit_tier,
      false,
      v_limit - 1;
    RETURN;
  END IF;
  
  -- Check if rate limit exceeded
  IF v_key.requests_this_minute >= v_limit THEN
    RETURN QUERY SELECT 
      true, 
      v_key.id, 
      v_key.org_id, 
      v_key.user_id, 
      v_key.scopes, 
      v_key.rate_limit_tier,
      true,
      0;
    RETURN;
  END IF;
  
  -- Increment counter
  UPDATE api_keys 
  SET requests_this_minute = requests_this_minute + 1,
      last_request_at = now(),
      requests_today = requests_today + 1
  WHERE id = v_key.id;
  
  RETURN QUERY SELECT 
    true, 
    v_key.id, 
    v_key.org_id, 
    v_key.user_id, 
    v_key.scopes, 
    v_key.rate_limit_tier,
    false,
    v_limit - v_key.requests_this_minute - 1;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();