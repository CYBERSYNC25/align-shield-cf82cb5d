
-- Platform admins table
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin groups
CREATE TABLE IF NOT EXISTS platform_admin_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin-group membership
CREATE TABLE IF NOT EXISTS platform_admin_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES platform_admins(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES platform_admin_groups(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admin_id, group_id)
);

-- Extend organizations with business fields
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS monthly_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Enable RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin_group_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = _user_id AND is_active = true
  );
$$;

-- RLS policies for platform_admins
CREATE POLICY "pa_select" ON platform_admins FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "pa_insert" ON platform_admins FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "pa_update" ON platform_admins FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "pa_delete" ON platform_admins FOR DELETE TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- RLS policies for platform_admin_groups
CREATE POLICY "pag_select" ON platform_admin_groups FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "pag_insert" ON platform_admin_groups FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "pag_update" ON platform_admin_groups FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "pag_delete" ON platform_admin_groups FOR DELETE TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- RLS policies for platform_admin_group_members
CREATE POLICY "pagm_select" ON platform_admin_group_members FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "pagm_insert" ON platform_admin_group_members FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "pagm_update" ON platform_admin_group_members FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "pagm_delete" ON platform_admin_group_members FOR DELETE TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to view ALL organizations (cross-tenant)
CREATE POLICY "pa_view_all_orgs" ON organizations FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to update ALL organizations
CREATE POLICY "pa_update_all_orgs" ON organizations FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to view ALL profiles (cross-tenant)
CREATE POLICY "pa_view_all_profiles" ON profiles FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Insert the existing admin as platform admin
INSERT INTO platform_admins (user_id, name, email)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', email), email
FROM auth.users
WHERE email = 'admin@apoc.com.br'
ON CONFLICT (user_id) DO NOTHING;

-- Create default admin group
INSERT INTO platform_admin_groups (name, description, permissions)
VALUES ('Super Admin', 'Acesso total à plataforma multi-tenant', ARRAY['all'])
ON CONFLICT (name) DO NOTHING;

-- Add admin to default group
INSERT INTO platform_admin_group_members (admin_id, group_id)
SELECT pa.id, pag.id
FROM platform_admins pa, platform_admin_groups pag
WHERE pa.email = 'admin@apoc.com.br' AND pag.name = 'Super Admin'
ON CONFLICT (admin_id, group_id) DO NOTHING;
