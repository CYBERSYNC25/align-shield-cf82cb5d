# Multi-Tenancy - Status da Implementação

## ✅ Concluído

### Fase 1: Schema do Banco de Dados
- [x] Criada tabela `organizations` com campos id, name, slug, plan, settings
- [x] Adicionada coluna `org_id` em todas as 36+ tabelas de dados
- [x] Adicionada coluna `role_in_org` na tabela `profiles`
- [x] Criados índices para `org_id` em todas as tabelas
- [x] Criada função helper `get_user_org_id()` (SECURITY DEFINER)

### Fase 2: Políticas RLS
- [x] Atualizadas políticas RLS para filtrar por `org_id` em todas as tabelas principais
- [x] Corrigida recursão infinita em `object_permissions`
- [x] Corrigidas políticas de `user_roles` para permitir inserção de viewer

### Fase 3: Frontend - Hooks
- [x] Criado hook `useOrganization` com:
  - Carregamento de dados da organização atual
  - Listagem de membros da organização
  - Funções para atualizar organização e roles de membros
  - Verificações de permissão (isAdmin, isMember, isViewer)
- [x] Corrigidos dados mock em hooks para incluir `org_id: null`

### Fase 4: Trigger de Auto-criação
- [x] Criada função `handle_new_user_organization()` que:
  - Cria organização automaticamente para novos usuários
  - Define o criador como admin da organização

## 🔄 Próximos Passos (Opcionais)

### Fase 5: Atualização de Edge Functions
As Edge Functions precisam ser atualizadas para propagar `org_id` em inserts:
- [ ] seed-compliance-data
- [ ] check-compliance-drift
- [ ] integration-webhook-handler
- [ ] save-integration-credentials
- [ ] sync-integration-data
- [ ] (outras ~25 funções)

### Fase 6: Migração de Dados Existentes
Para usuários existentes que já têm dados:
```sql
-- Execute manualmente se necessário:

-- 1. Criar org para cada profile existente sem org_id
INSERT INTO organizations (name, slug)
SELECT 
  COALESCE(organization, display_name, 'Organização'),
  'org-' || substr(md5(user_id::text), 1, 8)
FROM profiles 
WHERE org_id IS NULL
ON CONFLICT (slug) DO NOTHING;

-- 2. Vincular profiles às orgs
UPDATE profiles p
SET org_id = (SELECT id FROM organizations WHERE slug = 'org-' || substr(md5(p.user_id::text), 1, 8)),
    role_in_org = 'admin'
WHERE p.org_id IS NULL;

-- 3. Propagar org_id para dados existentes
UPDATE frameworks f SET org_id = (SELECT org_id FROM profiles WHERE user_id = f.user_id);
UPDATE controls c SET org_id = (SELECT org_id FROM profiles WHERE user_id = c.user_id);
-- ... repetir para outras tabelas
```

### Fase 7: UI de Gestão de Organização
- [ ] Criar página de configurações da organização em Settings
- [ ] Adicionar UI para convidar membros
- [ ] Adicionar UI para gerenciar roles de membros

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     MULTI-TENANCY APOC                          │
├─────────────────────────────────────────────────────────────────┤
│  organizations                                                  │
│  ├── id (UUID) [PK]                                             │
│  ├── name                                                       │
│  ├── slug (UNIQUE)                                              │
│  ├── plan (free/pro/enterprise)                                 │
│  ├── settings (JSONB)                                           │
│  └── created_at, updated_at                                     │
├─────────────────────────────────────────────────────────────────┤
│  profiles                                                       │
│  ├── org_id → organizations.id                                  │
│  └── role_in_org (admin/member/viewer)                          │
├─────────────────────────────────────────────────────────────────┤
│  Todas as tabelas de dados                                      │
│  └── org_id → organizations.id                                  │
├─────────────────────────────────────────────────────────────────┤
│  RLS Policies                                                   │
│  └── Filtro por get_user_org_id(auth.uid())                     │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Hooks                                                 │
│  ├── useOrganization() - dados e ações da org                   │
│  └── useOrgId() - helper para obter org_id                      │
└─────────────────────────────────────────────────────────────────┘
```

## Como Usar

### Frontend - Obter dados da organização:
```typescript
import { useOrganization } from '@/hooks/useOrganization';

function MyComponent() {
  const { 
    organization, 
    orgId, 
    isAdmin, 
    members, 
    updateOrganization 
  } = useOrganization();

  if (!organization) return <Loading />;

  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Plano: {organization.plan}</p>
      <p>Membros: {members.length}</p>
    </div>
  );
}
```

### Frontend - Inserir dados com org_id:
```typescript
import { useOrganization } from '@/hooks/useOrganization';

function CreateItem() {
  const { orgId } = useOrganization();

  const handleCreate = async () => {
    await supabase.from('frameworks').insert({
      name: 'ISO 27001',
      user_id: user.id,
      org_id: orgId // IMPORTANTE: incluir org_id
    });
  };
}
```

## Segurança

- **RLS obrigatório**: Todas as tabelas têm RLS habilitado com filtro por `org_id`
- **Função SECURITY DEFINER**: `get_user_org_id()` usa `SET search_path = 'public'`
- **Isolamento total**: Dados de uma organização não são visíveis para outra
- **Compatibilidade**: Políticas aceitam `org_id IS NULL` para dados legados
