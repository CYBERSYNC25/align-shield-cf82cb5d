-- Step 2: Create table for user deletion requests with triple authentication
CREATE TABLE IF NOT EXISTS public.user_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,
  target_user_email TEXT NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Approval tracking
  master_admin_approved_by UUID,
  master_admin_approved_at TIMESTAMP WITH TIME ZONE,
  master_ti_approved_by UUID,
  master_ti_approved_at TIMESTAMP WITH TIME ZONE,
  master_governance_approved_by UUID,
  master_governance_approved_at TIMESTAMP WITH TIME ZONE,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  rejection_reason TEXT,
  rejected_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Master users can view all deletion requests
CREATE POLICY "Master users can view all deletion requests"
ON public.user_deletion_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master_admin'::app_role) OR
  has_role(auth.uid(), 'master_ti'::app_role) OR
  has_role(auth.uid(), 'master_governance'::app_role)
);

-- Master admin can create deletion requests
CREATE POLICY "Master admin can create deletion requests"
ON public.user_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'master_admin'::app_role) AND
  auth.uid() = requested_by
);

-- Master users can update requests (approve)
CREATE POLICY "Master users can approve deletion requests"
ON public.user_deletion_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'master_admin'::app_role) OR
  has_role(auth.uid(), 'master_ti'::app_role) OR
  has_role(auth.uid(), 'master_governance'::app_role)
);

-- Create index for better performance
CREATE INDEX idx_deletion_requests_status ON public.user_deletion_requests(status);
CREATE INDEX idx_deletion_requests_target_user ON public.user_deletion_requests(target_user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_deletion_requests_updated_at
BEFORE UPDATE ON public.user_deletion_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;

-- Update RLS policies on user_roles to allow master users to view all
CREATE POLICY "Users and masters can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'master_admin'::app_role) OR
  has_role(auth.uid(), 'master_ti'::app_role) OR
  has_role(auth.uid(), 'master_governance'::app_role)
);

-- Update profiles RLS to allow master users to view all
CREATE POLICY "Users and masters can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'master_admin'::app_role) OR
  has_role(auth.uid(), 'master_ti'::app_role) OR
  has_role(auth.uid(), 'master_governance'::app_role)
);