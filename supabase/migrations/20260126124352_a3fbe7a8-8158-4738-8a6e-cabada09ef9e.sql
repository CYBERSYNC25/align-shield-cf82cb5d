-- 1. Criar função SECURITY DEFINER para verificar ownership
CREATE OR REPLACE FUNCTION public.is_object_owner(
  _user_id UUID,
  _object_type TEXT,
  _object_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.object_permissions
    WHERE user_id = _user_id
      AND object_type = _object_type
      AND object_id = _object_id
      AND permission_level = 'owner'
  )
$$;

-- 2. Remover política problemática
DROP POLICY IF EXISTS "Owners can manage object permissions" ON public.object_permissions;

-- 3. Recriar política usando a função SECURITY DEFINER
CREATE POLICY "Owners can manage object permissions"
  ON public.object_permissions
  FOR ALL
  TO authenticated
  USING (
    public.is_object_owner(auth.uid(), object_type, object_id)
  )
  WITH CHECK (
    public.is_object_owner(auth.uid(), object_type, object_id)
  );