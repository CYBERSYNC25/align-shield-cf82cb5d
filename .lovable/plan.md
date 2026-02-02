
# Plano: Corrigir Erros de Build que Causam Tela Branca

## Diagnóstico

A tela branca é causada por **dois erros de build** que impedem a aplicação de carregar:

### Erro 1: Sintaxe inválida em `security-middleware.ts`

```typescript
// PROBLEMA - Union type como interface (sintaxe incorreta)
export interface SecurityValidationResult {
  valid: true;
  ip: string;
} | {
  valid: false;      // ← Erro: Expected ',', got ';'
  response: Response;
  reason: string;
}
```

**Correção:** Trocar `interface` por `type` (interfaces não suportam union types diretamente).

### Erro 2: Mismatch de tipos em `useIncidents.tsx`

O banco de dados retorna campos em `snake_case`, mas as interfaces TypeScript esperam `camelCase`:

| Banco (snake_case) | Interface (camelCase) |
|--------------------|-----------------------|
| `reported_by` | `reportedAt` |
| `assigned_to` | `assignedTo` |
| `affected_systems` | `affectedSystems` |
| `estimated_time` | `estimatedTime` |
| `last_used` | `lastUsed` |
| `usage_count` | `usageCount` |
| `last_tested` | `lastTested` |
| `next_test` | `nextTest` |

---

## Implementação

### Correção 1: `security-middleware.ts` (linha 86-93)

Alterar de `interface` para `type`:

```typescript
export type SecurityValidationResult = {
  valid: true;
  ip: string;
} | {
  valid: false;
  response: Response;
  reason: string;
};
```

### Correção 2: `useIncidents.tsx`

Criar funções de mapeamento para converter os dados do banco para o formato das interfaces:

```typescript
// Função auxiliar para mapear dados do banco para a interface Incident
function mapIncidentFromDB(dbRow: any): Incident {
  return {
    id: dbRow.id,
    title: dbRow.title,
    description: dbRow.description,
    severity: dbRow.severity,
    status: dbRow.status,
    reportedAt: dbRow.created_at,
    assignedTo: dbRow.assigned_to || '',
    assignedRole: '',
    affectedSystems: dbRow.affected_systems || [],
    impactLevel: 'medium',
    estimatedResolution: '',
    updates: 0,
    watchers: 0,
    playbook: '',
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at,
  };
}

function mapPlaybookFromDB(dbRow: any): IncidentPlaybook {
  return {
    id: dbRow.id,
    name: dbRow.name,
    category: dbRow.category,
    severity: dbRow.severity,
    estimatedTime: dbRow.estimated_time || '',
    lastUsed: dbRow.last_used || '',
    usageCount: dbRow.usage_count || 0,
    steps: dbRow.steps || 0,
    roles: dbRow.roles || [],
    description: dbRow.description || '',
    triggers: dbRow.triggers || [],
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at,
  };
}

function mapBCPPlanFromDB(dbRow: any): BCPPlan {
  return {
    id: dbRow.id,
    name: dbRow.name,
    type: dbRow.status || 'recovery',
    status: dbRow.status || 'scheduled',
    lastTested: dbRow.last_tested || '',
    nextTest: dbRow.next_test || '',
    rto: dbRow.rto || '',
    rpo: dbRow.rpo || '',
    coverage: dbRow.coverage || 0,
    criticalSystems: dbRow.systems || [],
    testResults: '',
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at,
  };
}
```

E atualizar as linhas 254, 266, 278, 281-283 para usar os mappers:

```typescript
// Linha 254
setIncidents((incidentsData || []).map(mapIncidentFromDB));

// Linha 266
setPlaybooks((playbooksData || []).map(mapPlaybookFromDB));

// Linha 278
setBcpPlans((bcpData || []).map(mapBCPPlanFromDB));

// Linhas 281-283
const allIncidents = (incidentsData || []).map(mapIncidentFromDB);
const allBcpPlans = (bcpData || []).map(mapBCPPlanFromDB);
const allPlaybooks = (playbooksData || []).map(mapPlaybookFromDB);
```

---

## Arquivos a Modificar

| Arquivo | Linha(s) | Correção |
|---------|----------|----------|
| `supabase/functions/_shared/security-middleware.ts` | 86-93 | Trocar `interface` por `type` |
| `src/hooks/useIncidents.tsx` | 6-55 (após) | Adicionar funções de mapeamento |
| `src/hooks/useIncidents.tsx` | 254, 266, 278, 281-283 | Usar mappers em vez de cast direto |

---

## Resultado Esperado

Após as correções:
1. O build passa sem erros
2. A aplicação carrega normalmente (não fica em tela branca)
3. Os dados de incidentes, playbooks e planos BCP são exibidos corretamente
