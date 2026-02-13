
# Plano: Implementar Hierarquia de Permissoes Funcional

## Problema Atual

O sistema nao respeita hierarquia ao criar/convidar usuarios ou atribuir roles:

1. **Invite Modal** -- so lista 4 roles (admin, viewer, auditor, compliance_officer), faltam editor, view_only_admin, master_ti, master_governance
2. **Edge Function `invite-user`** -- so valida as mesmas 4 roles no backend
3. **Sem enforcement hierarquico** -- um admin pode atribuir `master_admin` a qualquer usuario, e nao ha verificacao impedindo escalacao de privilegios
4. **`UserRolesManagement.tsx`** -- mostra TODAS as roles no dropdown sem filtrar pelo nivel do usuario atual

---

## Hierarquia Definida (da mais alta para a mais baixa)

```text
Nivel 5: master_admin         (pode criar/atribuir TODAS as roles abaixo)
Nivel 4: admin                (pode criar/atribuir ate nivel 3)
Nivel 3: editor, compliance_officer, master_ti, master_governance
Nivel 2: view_only_admin, auditor
Nivel 1: viewer               (nao pode criar/atribuir ninguem)
```

**Regra:** Um usuario so pode atribuir roles de nivel INFERIOR ao seu nivel mais alto.

---

## Arquivos a Modificar

### 1. `src/hooks/useUserRoles.tsx` -- Adicionar hierarquia como constante

- Criar constante `ROLE_HIERARCHY` com nivel numerico para cada role
- Criar funcao `getAssignableRoles()` que retorna as roles que o usuario atual pode atribuir
- Logica: retornar todas as roles cujo nivel e MENOR que o nivel mais alto do usuario

### 2. `src/components/settings/UserInviteModal.tsx` -- Respeitar hierarquia

- Importar `useUserRoles` e `getAssignableRoles`
- Substituir `roleLabels` estatico pelas roles permitidas do usuario atual
- Incluir TODAS as 9 roles no mapeamento de labels/descricoes
- Filtrar o dropdown para mostrar apenas roles que o usuario pode atribuir

### 3. `src/components/settings/UserRolesManagement.tsx` -- Filtrar dropdown

- Usar `getAssignableRoles()` para filtrar o `<Select>` de atribuicao
- Esconder botao de remocao de role se a role alvo e superior ao usuario atual
- Admin nao pode remover role de master_admin, por exemplo

### 4. `supabase/functions/invite-user/index.ts` -- Validar hierarquia no backend

- Expandir `validRoles` para incluir todas as 9 roles do enum
- Adicionar verificacao hierarquica: buscar role do usuario que convida e validar que a role do convite e inferior
- Rejeitar tentativas de escalacao de privilegios com erro 403

---

## Detalhes Tecnicos

### Constante de Hierarquia (useUserRoles.tsx)

```typescript
const ROLE_HIERARCHY: Record<AppRole, number> = {
  master_admin: 5,
  admin: 4,
  editor: 3,
  compliance_officer: 3,
  master_ti: 3,
  master_governance: 3,
  view_only_admin: 2,
  auditor: 2,
  viewer: 1,
};
```

### Funcao `getAssignableRoles` (useUserRoles.tsx)

Calcula o nivel mais alto do usuario atual e retorna todas as roles com nivel inferior. Se o usuario e `admin` (nivel 4), pode atribuir: editor, compliance_officer, master_ti, master_governance, view_only_admin, auditor, viewer. Se e `master_admin` (nivel 5), pode atribuir TODAS incluindo admin.

### Validacao Backend (invite-user edge function)

Antes de criar o convite, buscar a role mais alta do usuario autenticado e comparar com a role solicitada. Se `ROLE_HIERARCHY[requestedRole] >= ROLE_HIERARCHY[callerHighestRole]`, retornar erro 403: "Voce nao pode atribuir uma role igual ou superior a sua".

### Roles completas no Invite Modal

Adicionar labels e descricoes para todas as 9 roles:
- master_admin: "Master Admin -- Acesso total a plataforma"
- admin: "Administrador -- Gerencia usuarios e recursos"
- editor: "Editor -- Edita recursos, sem gerenciar usuarios"
- compliance_officer: "Compliance Officer -- Gerencia compliance"
- master_ti: "Master TI -- Acesso especial para TI"
- master_governance: "Master Governanca -- Acesso especial para Governanca"
- view_only_admin: "Admin Somente Leitura -- Ve tudo, edita nada"
- auditor: "Auditor -- Acesso de leitura para auditoria"
- viewer: "Visualizador -- Acesso basico restrito"

---

## Resultado Esperado

1. Cada usuario so ve no dropdown as roles que pode atribuir (inferiores a sua)
2. Backend rejeita tentativas de escalacao de privilegios
3. Viewer nao ve opcao de convidar/atribuir (ja implementado)
4. Todas as 9 roles disponiveis no sistema estao mapeadas e utilizaveis
5. Botoes de remocao de role so aparecem para roles que o usuario tem permissao de gerenciar
