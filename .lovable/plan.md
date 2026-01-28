
# Plano: Corrigir Erro de Carregamento de Permissões

## Diagnóstico do Problema

O erro "Não foi possível carregar suas permissões" ocorre porque:

1. **Nenhuma organização existe** na tabela `organizations`
2. **Todos os 5 profiles têm `org_id = NULL`**
3. **Todos os 2 user_roles têm `org_id = NULL`**
4. **A política RLS** `"Org members can view org user_roles"` usa:
   ```sql
   org_id = get_user_org_id(auth.uid())
   ```
5. Como `get_user_org_id()` retorna `NULL` (porque profile.org_id é NULL), a comparação `NULL = NULL` sempre retorna **FALSE** em SQL
6. **Resultado**: A query de roles retorna um array vazio, e o hook lança o toast de erro

### Fluxo do Problema

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Fluxo de Erro Atual                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuário faz login                                           │
│           │                                                      │
│           ▼                                                      │
│  2. useUserRoles.tsx chama:                                     │
│     supabase.from('user_roles').select('role').eq('user_id',..) │
│           │                                                      │
│           ▼                                                      │
│  3. RLS Policy "Org members can view org user_roles":           │
│     org_id = get_user_org_id(auth.uid())                        │
│           │                                                      │
│           ▼                                                      │
│  4. get_user_org_id() retorna NULL (profile.org_id = NULL)      │
│           │                                                      │
│           ▼                                                      │
│  5. Comparação: NULL = NULL → FALSE                             │
│           │                                                      │
│           ▼                                                      │
│  6. Query retorna 0 rows (ou erro RLS)                          │
│           │                                                      │
│           ▼                                                      │
│  7. Toast: "Não foi possível carregar suas permissões"          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Análise das Políticas RLS Atuais

### user_roles (conflito de políticas)

| Política | Condição |
|----------|----------|
| `Org members can view org roles` | `(org_id IS NULL)` (legada) |
| `Org members can view org user_roles` | `org_id = get_user_org_id(auth.uid())` |
| `Users and masters can view roles` | `auth.uid() = user_id OR has_role(...)` (authenticated) |

O problema está no conflito entre políticas que esperam `org_id` e dados que não têm `org_id`.

---

## Solução Proposta

A abordagem mais segura é **corrigir os dados** para que o sistema multi-tenant funcione corretamente:

### Fase 1: Criar Organização e Associar Usuários

**Migration SQL para:**
1. Criar uma organização padrão se não existir
2. Atualizar todos os profiles para terem `org_id` da organização padrão
3. Atualizar todos os user_roles para terem `org_id` correto

```sql
-- 1. Criar organização padrão se não existir
INSERT INTO organizations (id, name, slug, plan)
SELECT 
  gen_random_uuid(),
  'Organização Principal',
  'org-principal',
  'professional'
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- 2. Associar todos os profiles à organização
UPDATE profiles
SET org_id = (SELECT id FROM organizations LIMIT 1),
    role_in_org = 'admin'
WHERE org_id IS NULL;

-- 3. Associar todos os user_roles à organização
UPDATE user_roles
SET org_id = (SELECT id FROM organizations LIMIT 1)
WHERE org_id IS NULL;
```

### Fase 2: Melhorar Resiliência do Hook

Modificar `useUserRoles.tsx` para:
1. Não mostrar erro se simplesmente não houver roles
2. Verificar se o problema é RLS vs. ausência de dados
3. Tentar criar organização automaticamente se não existir

```typescript
// Melhorar tratamento de erro
const loadUserRoles = useCallback(async () => {
  if (!user) {
    setLoading(false);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (error) {
      // Verificar se é erro de RLS vs. outro erro
      if (error.code === '42501' || error.message.includes('permission')) {
        logger.warn('RLS blocking role access - checking org setup');
        // Tentar recuperar via verificação de org
        await ensureUserOrganization(user.id);
        // Retry query
      } else {
        throw error;
      }
    }

    // Empty result não é erro - usuário pode simplesmente não ter roles
    setRoles(data?.map(r => r.role as AppRole) ?? []);
  } catch (error) {
    logger.error('Error loading roles', error);
    // Só mostrar toast se for erro real, não ausência de dados
    if (error instanceof Error && !error.message.includes('no rows')) {
      toast({
        title: 'Erro ao carregar permissões',
        description: 'Não foi possível carregar suas permissões',
        variant: 'destructive'
      });
    }
  } finally {
    setLoading(false);
  }
}, [user, toast]);
```

### Fase 3: Corrigir/Consolidar Políticas RLS

Remover política legada e garantir consistência:

```sql
-- Remover política legada conflitante
DROP POLICY IF EXISTS "Org members can view org roles" ON user_roles;

-- Garantir que a política principal funcione mesmo sem org_id (fallback)
CREATE OR REPLACE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Database Migration** | Criar | Criar org, associar profiles/roles |
| `src/hooks/useUserRoles.tsx` | Modificar | Melhorar tratamento de erros |

---

## Passos de Implementação

1. **Criar migration** para corrigir os dados:
   - Criar organização padrão
   - Atualizar profiles.org_id
   - Atualizar user_roles.org_id
   - Adicionar política de fallback

2. **Melhorar hook** para ser mais resiliente:
   - Não mostrar erro quando resultado está vazio
   - Log mais detalhado para debug

3. **Verificar** se o fluxo de cadastro (`handle_new_user_organization`) está funcionando para novos usuários

---

## Dados Atuais

```text
Tabela           | Total | Com org_id | Sem org_id
-----------------|-------|------------|------------
organizations    |   0   |    N/A     |    N/A
profiles         |   5   |     0      |     5
user_roles       |   2   |     0      |     2
```

---

## Resultado Esperado

Após as correções:

1. Organização padrão criada
2. Todos os profiles associados à organização
3. Todos os user_roles associados à organização
4. Query de roles funcionando corretamente
5. Toast de erro não aparece mais
6. Sistema multi-tenant funcionando corretamente
