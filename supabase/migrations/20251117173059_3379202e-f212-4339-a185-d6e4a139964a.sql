-- Fix search_path security warning for the trigger function
CREATE OR REPLACE FUNCTION update_integration_webhooks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;