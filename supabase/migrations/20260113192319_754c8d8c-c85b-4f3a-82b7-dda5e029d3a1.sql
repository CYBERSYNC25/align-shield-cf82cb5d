-- Fix 1: Add SET search_path = public to create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info'::text,
  p_priority text DEFAULT 'normal'::text,
  p_action_url text DEFAULT NULL::text,
  p_action_label text DEFAULT NULL::text,
  p_related_table text DEFAULT NULL::text,
  p_related_id uuid DEFAULT NULL::uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, priority, action_url, 
    action_label, related_table, related_id, metadata, expires_at
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority, p_action_url,
    p_action_label, p_related_table, p_related_id, p_metadata, p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Fix 2: Add SET search_path = public to update_remediation_tickets_updated_at function
CREATE OR REPLACE FUNCTION public.update_remediation_tickets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix 3: Replace overly permissive RLS policies with proper user validation

-- Fix compliance_alerts INSERT policy to require service role context or proper user
DROP POLICY IF EXISTS "System can insert compliance alerts" ON public.compliance_alerts;
CREATE POLICY "Service or user can insert compliance alerts" 
ON public.compliance_alerts 
FOR INSERT 
WITH CHECK (
  -- Allow if user_id matches authenticated user
  (auth.uid() = user_id) OR
  -- Allow service role (edge functions) - they must set user_id explicitly
  (auth.role() = 'service_role')
);

-- Fix compliance_check_history INSERT policy
DROP POLICY IF EXISTS "System can insert compliance check history" ON public.compliance_check_history;
CREATE POLICY "Service or user can insert compliance check history" 
ON public.compliance_check_history 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR
  (auth.role() = 'service_role')
);

-- Fix control_tests - keep system insert but add role check
DROP POLICY IF EXISTS "System can create control tests" ON public.control_tests;
CREATE POLICY "Authorized users can create control tests" 
ON public.control_tests 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'compliance_officer'::app_role) OR
  (auth.role() = 'service_role')
);

-- Fix integration_webhooks INSERT policy
DROP POLICY IF EXISTS "System can insert webhooks" ON public.integration_webhooks;
CREATE POLICY "Service role can insert webhooks" 
ON public.integration_webhooks 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR
  (auth.role() = 'service_role')
);

-- Fix integration_webhooks UPDATE policy  
DROP POLICY IF EXISTS "System can update webhooks" ON public.integration_webhooks;
CREATE POLICY "Service role can update webhooks" 
ON public.integration_webhooks 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR
  (auth.role() = 'service_role')
);

-- Fix integration_status - allow service role or owner
DROP POLICY IF EXISTS "System can manage integration status" ON public.integration_status;

CREATE POLICY "Service or owner can manage integration status" 
ON public.integration_status 
FOR ALL 
USING (
  (auth.uid() = user_id) OR
  (auth.role() = 'service_role')
)
WITH CHECK (
  (auth.uid() = user_id) OR
  (auth.role() = 'service_role')
);