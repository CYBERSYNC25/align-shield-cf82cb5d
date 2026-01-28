-- =====================================================
-- Fix: Corrigir dados de organização para multi-tenancy
-- =====================================================

-- 1. Criar organização padrão se não existir nenhuma
INSERT INTO public.organizations (id, name, slug, plan)
SELECT 
  gen_random_uuid(),
  'Organização Principal',
  'org-principal',
  'pro'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations LIMIT 1);

-- 2. Associar todos os profiles sem org_id à organização padrão
UPDATE public.profiles
SET 
  org_id = (SELECT id FROM public.organizations ORDER BY created_at ASC LIMIT 1),
  role_in_org = COALESCE(role_in_org, 'admin')
WHERE org_id IS NULL;

-- 3. Associar todos os user_roles sem org_id à organização padrão
UPDATE public.user_roles
SET org_id = (SELECT id FROM public.organizations ORDER BY created_at ASC LIMIT 1)
WHERE org_id IS NULL;

-- 4. Remover política legada conflitante (se existir)
DROP POLICY IF EXISTS "Org members can view org roles" ON public.user_roles;

-- 5. Adicionar política de fallback para usuários verem suas próprias roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());