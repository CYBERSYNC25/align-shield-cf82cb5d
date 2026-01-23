
## Plano: Implementação de Multi-Tenancy Completo

### Objetivo
Transformar o sistema APOC de single-user/multi-user para multi-tenant completo, permitindo que múltiplos usuários de uma mesma organização compartilhem dados e recursos, mantendo isolamento total entre diferentes organizações.

---

### Análise da Situação Atual

| Aspecto | Estado Atual |
|---------|--------------|
| Tabelas com `user_id` | 37 tabelas |
| Tabelas sem `user_id` | 8 tabelas (relações ou views) |
| Coluna `org_id` | Não existe |
| Tabela `organizations` | Não existe |
| RLS | Baseado exclusivamente em `user_id` |
| Contexto de organização | Apenas campo texto `organization` em `profiles` |

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                        MULTI-TENANCY                            │
├─────────────────────────────────────────────────────────────────┤
│  organizations (nova tabela)                                    │
│  ├── id (UUID)                                                  │
│  ├── name                                                       │
│  ├── slug (único)                                               │
│  ├── plan (free/pro/enterprise)                                 │
│  ├── settings (JSONB)                                           │
│  └── created_at                                                 │
├─────────────────────────────────────────────────────────────────┤
│  profiles (atualizada)                                          │
│  ├── org_id → organizations.id                                  │
│  └── role_in_org (admin/member/viewer)                          │
├─────────────────────────────────────────────────────────────────┤
│  Todas as tabelas de dados                                      │
│  └── org_id → organizations.id                                  │
├─────────────────────────────────────────────────────────────────┤
│  RLS Policies                                                   │
│  └── Filtro por get_user_org_id(auth.uid())                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Criar Tabela Organizations

**Migration SQL:**
```sql
-- Tabela de organizações
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX organizations_slug_idx ON public.organizations(slug);

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Política: membros podem ver sua organização
CREATE POLICY "Members can view their organization"
  ON public.organizations FOR SELECT
  USING (id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Política: admins podem atualizar
CREATE POLICY "Org admins can update organization"
  ON public.organizations FOR UPDATE
  USING (id IN (
    SELECT org_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role_in_org = 'admin'
  ));
```

---

### Fase 2: Atualizar Tabela Profiles

```sql
-- Adicionar colunas de organização
ALTER TABLE public.profiles 
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN role_in_org TEXT DEFAULT 'member' 
    CHECK (role_in_org IN ('admin', 'member', 'viewer'));

-- Índice para busca por org_id
CREATE INDEX profiles_org_id_idx ON public.profiles(org_id);
```

---

### Fase 3: Adicionar org_id em Todas as Tabelas

Tabelas que precisam da coluna `org_id`:

| Tabela | Prioridade |
|--------|------------|
| access_anomalies | Alta |
| answer_library | Média |
| audit_logs | Alta |
| auditor_access_tokens | Alta |
| audits | Alta |
| bcp_plans | Média |
| compliance_alerts | Alta |
| compliance_check_history | Alta |
| controls | Alta |
| custom_compliance_tests | Média |
| custom_test_results | Média |
| device_logs | Baixa |
| evidence | Alta |
| frameworks | Alta |
| incident_playbooks | Média |
| incidents | Alta |
| integration_collected_data | Alta |
| integration_oauth_tokens | Alta |
| integration_status | Alta |
| integration_webhooks | Média |
| integrations | Alta |
| notifications | Média |
| object_permissions | Alta |
| policies | Alta |
| remediation_tickets | Alta |
| risk_acceptances | Alta |
| risk_approval_policies | Alta |
| risk_assessments | Alta |
| risks | Alta |
| security_questionnaires | Alta |
| system_audit_logs | Alta |
| tasks | Alta |
| trust_center_frameworks | Alta |
| trust_center_settings | Alta |
| user_roles | Alta |
| vendors | Alta |

**SQL Pattern para cada tabela:**
```sql
ALTER TABLE public.<table_name> 
  ADD COLUMN org_id UUID REFERENCES public.organizations(id);

CREATE INDEX <table_name>_org_id_idx ON public.<table_name>(org_id);
```

---

### Fase 4: Função Helper para Obter org_id do Usuário

```sql
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;
```

---

### Fase 5: Atualizar Políticas RLS

**Padrão de nova política:**
```sql
-- DROP política antiga
DROP POLICY IF EXISTS "<policy_name>" ON public.<table_name>;

-- CREATE nova política com org_id
CREATE POLICY "<policy_name>"
  ON public.<table_name>
  FOR <SELECT|INSERT|UPDATE|DELETE|ALL>
  USING (org_id = get_user_org_id(auth.uid()));
```

Exemplo para tabela `frameworks`:
```sql
DROP POLICY IF EXISTS "Users can manage their own frameworks" ON public.frameworks;

CREATE POLICY "Org members can view frameworks"
  ON public.frameworks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org admins can manage frameworks"
  ON public.frameworks FOR ALL
  USING (
    org_id = get_user_org_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
        AND role_in_org IN ('admin', 'member')
    )
  );
```

---

### Fase 6: Migração de Dados Existentes

```sql
-- 1. Criar organização para cada usuário existente que tem dados
INSERT INTO public.organizations (id, name, slug)
SELECT 
  gen_random_uuid(),
  COALESCE(p.organization, p.display_name, 'Org ' || substr(p.user_id::text, 1, 8)),
  'org-' || substr(p.user_id::text, 1, 8)
FROM public.profiles p
ON CONFLICT (slug) DO NOTHING;

-- 2. Atualizar profiles com org_id
UPDATE public.profiles p
SET org_id = (
  SELECT o.id FROM public.organizations o 
  WHERE o.slug = 'org-' || substr(p.user_id::text, 1, 8)
),
role_in_org = 'admin';

-- 3. Atualizar cada tabela de dados com org_id do user_id correspondente
UPDATE public.frameworks f
SET org_id = (SELECT org_id FROM public.profiles WHERE user_id = f.user_id);

-- (Repetir para todas as tabelas)
```

---

### Fase 7: Atualizar Contexto de Autenticação (Frontend)

**Arquivo:** `src/hooks/useAuth.tsx`

Adicionar `org_id` e `organization` ao contexto:

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  orgId: string | null;        // NOVO
  organization: Organization | null;  // NOVO
  signIn: ...
}
```

**Novo hook:** `src/hooks/useOrganization.tsx`

```typescript
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, any>;
}

export function useOrganization() {
  const { user } = useAuth();
  
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, organizations(*)')
        .eq('user_id', user.id)
        .single();
        
      return profile?.organizations as Organization;
    },
    enabled: !!user?.id,
  });

  return { organization, isLoading };
}
```

---

### Fase 8: Atualizar Types do Supabase

**Arquivo:** `src/integrations/supabase/types.ts`

Adicionar tipo `organizations`:
```typescript
organizations: {
  Row: {
    id: string;
    name: string;
    slug: string;
    plan: 'free' | 'pro' | 'enterprise';
    settings: Json;
    created_at: string;
    updated_at: string;
  };
  Insert: { ... };
  Update: { ... };
}
```

Atualizar todos os tipos de tabela para incluir `org_id`:
```typescript
// Em cada tabela que precisa:
Row: {
  ...
  org_id: string | null;
}
Insert: {
  ...
  org_id?: string | null;
}
```

---

### Fase 9: Atualizar Hooks de Dados

Atualizar todos os hooks para NÃO precisar passar `org_id` manualmente (o RLS cuida do filtro).

Mas para INSERTs, garantir que `org_id` seja incluído:

```typescript
// Exemplo em useFrameworks.tsx
const createFramework = async (data) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  await supabase.from('frameworks').insert({
    ...data,
    user_id: user.id,
    org_id: profile.org_id,  // IMPORTANTE
  });
};
```

---

### Fase 10: Edge Functions

Atualizar Edge Functions para propagar `org_id`:

**Padrão:**
```typescript
// Buscar org_id do usuário autenticado
const { data: profile } = await supabaseClient
  .from('profiles')
  .select('org_id')
  .eq('user_id', user.id)
  .single();

const orgId = profile?.org_id;

// Usar org_id em todas as queries e inserts
```

---

### Resumo de Arquivos a Modificar

| Categoria | Arquivos |
|-----------|----------|
| **Migrations (novo)** | 1 arquivo SQL grande |
| **Types** | `src/integrations/supabase/types.ts` |
| **Auth Context** | `src/hooks/useAuth.tsx` |
| **Novo Hook** | `src/hooks/useOrganization.tsx` |
| **Hooks de Dados** | ~25 hooks para atualizar INSERTs |
| **Edge Functions** | ~30 funções para propagar org_id |
| **Componentes** | `src/pages/Settings.tsx` (gestão de org) |

---

### Ordem de Implementação

1. Migration: Criar tabela `organizations`
2. Migration: Alterar tabela `profiles` (add org_id, role_in_org)
3. Migration: Adicionar `org_id` em todas as tabelas de dados
4. Migration: Criar função `get_user_org_id()`
5. Migration: Atualizar todas as políticas RLS
6. Migration: Migrar dados existentes
7. Frontend: Criar hook `useOrganization`
8. Frontend: Atualizar `useAuth` com contexto de org
9. Frontend: Atualizar hooks de dados para INSERTs
10. Backend: Atualizar Edge Functions
11. Frontend: Criar página de gestão de organização

---

### Considerações de Segurança

- **RLS Obrigatório**: Todas as tabelas DEVEM ter RLS habilitado com filtro por `org_id`
- **Função SECURITY DEFINER**: `get_user_org_id()` usa `search_path = 'public'` para evitar injection
- **Validação de org_id**: Edge Functions devem validar que o `org_id` pertence ao usuário
- **Audit Trail**: `system_audit_logs` deve registrar org_id para rastreabilidade
