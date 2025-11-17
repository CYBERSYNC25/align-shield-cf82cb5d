-- Create table for webhook logs
CREATE TABLE IF NOT EXISTS public.integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_integration_webhooks_integration ON public.integration_webhooks(integration_name);
CREATE INDEX idx_integration_webhooks_status ON public.integration_webhooks(status);
CREATE INDEX idx_integration_webhooks_created_at ON public.integration_webhooks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view webhooks
CREATE POLICY "Authenticated users can view webhooks"
  ON public.integration_webhooks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy for system to insert webhooks
CREATE POLICY "System can insert webhooks"
  ON public.integration_webhooks
  FOR INSERT
  WITH CHECK (true);

-- Policy for system to update webhooks
CREATE POLICY "System can update webhooks"
  ON public.integration_webhooks
  FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integration_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_integration_webhooks_timestamp
  BEFORE UPDATE ON public.integration_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_webhooks_updated_at();

-- Add table to realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_webhooks;

-- Set replica identity for realtime updates
ALTER TABLE public.integration_webhooks REPLICA IDENTITY FULL;

-- Create table for integration status monitoring
CREATE TABLE IF NOT EXISTS public.integration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'healthy',
  last_sync_at TIMESTAMPTZ,
  last_webhook_at TIMESTAMPTZ,
  total_webhooks INTEGER DEFAULT 0,
  failed_webhooks INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for integration_status
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view status
CREATE POLICY "Authenticated users can view integration status"
  ON public.integration_status
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy for system to upsert status
CREATE POLICY "System can manage integration status"
  ON public.integration_status
  FOR ALL
  USING (true);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_status;
ALTER TABLE public.integration_status REPLICA IDENTITY FULL;