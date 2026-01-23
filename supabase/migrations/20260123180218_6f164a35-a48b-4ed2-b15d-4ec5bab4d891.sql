-- Drop política duplicada e recriar
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Permitir que usuários insiram seu próprio role inicial (viewer)
DROP POLICY IF EXISTS "Users can insert their own initial role" ON public.user_roles;
CREATE POLICY "Users can insert their own initial role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND role = 'viewer'::app_role
    AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())
  );

-- Permitir service_role inserir roles
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
CREATE POLICY "Service role can manage roles"
  ON public.user_roles FOR ALL
  USING (auth.role() = 'service_role');

-- Adicionar política org_id para user_roles
DROP POLICY IF EXISTS "Org members can view org roles" ON public.user_roles;
CREATE POLICY "Org members can view org roles"
  ON public.user_roles FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR org_id IS NULL);