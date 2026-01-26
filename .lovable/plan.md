

## Correção: Recursão Infinita na Tabela object_permissions

### Problema Identificado
A política RLS **"Owners can manage object permissions"** está causando um loop infinito porque ela consulta a própria tabela `object_permissions` para verificar se o usuário é owner, o que aciona as políticas RLS novamente.

Isso está impedindo o carregamento do Dashboard porque:
1. O `ProtectedRoute` usa o hook `useUserRoles`
2. O hook tenta carregar permissões da tabela `object_permissions`
3. A query falha com erro de recursão
4. O loading fica preso eternamente, mostrando apenas o spinner

---

### Solução: Usar Função SECURITY DEFINER

Criar uma função que verifica ownership **sem ativar RLS**, seguindo o mesmo padrão já usado para `has_role` e `get_user_org_id`.

---

### Migração SQL Necessária

```sql
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
```

---

### Por que isso funciona?

| Abordagem | Comportamento |
|-----------|---------------|
| Subconsulta direta na política | Aciona RLS → recursão infinita |
| Função SECURITY DEFINER | Executa com privilégios do owner da função, **ignorando RLS** |

A função `is_object_owner` consulta a tabela `object_permissions` com os privilégios do criador da função (superuser), **bypassando as políticas RLS** e quebrando o ciclo de recursão.

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/xxx_fix_object_permissions_recursion.sql` | Criar migração com função e política corrigida |

---

### Resultado Esperado

Após a correção:
- O hook `useUserRoles` carregará as permissões corretamente
- O `ProtectedRoute` sairá do estado de loading
- O Dashboard abrirá normalmente
- A funcionalidade de ownership continuará funcionando

