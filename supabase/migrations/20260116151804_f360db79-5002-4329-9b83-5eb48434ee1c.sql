-- =====================================================
-- APOC 2-Layer Role System (Vanta Model)
-- =====================================================

-- 1. Add new org-level roles to existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'view_only_admin';

-- 2. Create object_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.object_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL CHECK (object_type IN ('control', 'risk', 'policy', 'framework', 'audit')),
  object_id UUID NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('owner', 'reviewer', 'viewer')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, object_type, object_id)
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_object_permissions_user ON public.object_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_object_permissions_object ON public.object_permissions(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_object_permissions_level ON public.object_permissions(permission_level);

-- 4. Enable RLS
ALTER TABLE public.object_permissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Admins can manage all permissions
CREATE POLICY "Admins can manage all permissions"
ON public.object_permissions
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'master_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'master_admin'::app_role)
);

-- Users can view their own permissions
CREATE POLICY "Users can view their permissions"
ON public.object_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owners of an object can manage permissions for that object
CREATE POLICY "Owners can manage object permissions"
ON public.object_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.object_permissions op
    WHERE op.user_id = auth.uid()
    AND op.object_type = object_permissions.object_type
    AND op.object_id = object_permissions.object_id
    AND op.permission_level = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.object_permissions op
    WHERE op.user_id = auth.uid()
    AND op.object_type = object_permissions.object_type
    AND op.object_id = object_permissions.object_id
    AND op.permission_level = 'owner'
  )
);

-- 6. Helper function to check object-level permission
CREATE OR REPLACE FUNCTION public.check_object_permission(
  _user_id UUID,
  _object_type TEXT,
  _object_id UUID,
  _required_level TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_permission TEXT;
  is_admin BOOLEAN;
  is_editor BOOLEAN;
BEGIN
  -- Admins have full access
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'master_admin')
  ) INTO is_admin;
  
  IF is_admin THEN RETURN TRUE; END IF;
  
  -- Editors have edit access (but not owner-level for permission management)
  IF _required_level IN ('viewer', 'reviewer') THEN
    SELECT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = _user_id
      AND role = 'editor'
    ) INTO is_editor;
    
    IF is_editor THEN RETURN TRUE; END IF;
  END IF;
  
  -- Check specific object permission
  SELECT permission_level INTO user_permission
  FROM object_permissions
  WHERE user_id = _user_id
  AND object_type = _object_type
  AND object_id = _object_id
  AND (expires_at IS NULL OR expires_at > now());
  
  IF user_permission IS NULL THEN RETURN FALSE; END IF;
  
  -- Hierarchy: owner > reviewer > viewer
  CASE _required_level
    WHEN 'viewer' THEN RETURN TRUE;
    WHEN 'reviewer' THEN RETURN user_permission IN ('owner', 'reviewer');
    WHEN 'owner' THEN RETURN user_permission = 'owner';
    ELSE RETURN FALSE;
  END CASE;
END;
$$;

-- 7. Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_object_permissions(_user_id UUID)
RETURNS TABLE(
  id UUID,
  object_type TEXT,
  object_id UUID,
  permission_level TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, object_type, object_id, permission_level, expires_at
  FROM public.object_permissions
  WHERE user_id = _user_id
  AND (expires_at IS NULL OR expires_at > now())
$$;

-- 8. Update trigger for updated_at
CREATE TRIGGER update_object_permissions_updated_at
BEFORE UPDATE ON public.object_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();