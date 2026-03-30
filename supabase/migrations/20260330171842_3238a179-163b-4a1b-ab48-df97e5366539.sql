
-- Create platform admin logs table
CREATE TABLE public.platform_admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES platform_admins(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_admin_logs ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view logs
CREATE POLICY "Platform admins can view logs"
  ON public.platform_admin_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Only platform admins can insert logs
CREATE POLICY "Platform admins can insert logs"
  ON public.platform_admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_platform_admin_logs_created_at ON public.platform_admin_logs(created_at DESC);
CREATE INDEX idx_platform_admin_logs_admin_id ON public.platform_admin_logs(admin_id);
CREATE INDEX idx_platform_admin_logs_action ON public.platform_admin_logs(action);
