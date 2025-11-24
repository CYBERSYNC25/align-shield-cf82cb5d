-- Create device_logs table for APOC monitoring
CREATE TABLE IF NOT EXISTS public.device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  router_name TEXT NOT NULL,
  cpu_usage INTEGER NOT NULL,
  version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries on created_at and device_id
CREATE INDEX idx_device_logs_created_at ON public.device_logs(created_at DESC);
CREATE INDEX idx_device_logs_device_id ON public.device_logs(device_id);

-- Enable Row Level Security
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

-- Create public read policy for monitoring dashboard
CREATE POLICY "Anyone can view device logs"
  ON public.device_logs
  FOR SELECT
  USING (true);

-- Create public insert policy for agent ingestion
CREATE POLICY "Anyone can insert device logs"
  ON public.device_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.device_logs IS 'Stores real-time device monitoring metrics from APOC agents';