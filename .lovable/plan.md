
# Plano: Corrigir Erros de Build + Criar Funcionalidade de Limpeza de Dados

## Parte 1: Corrigir Erros de Build (Pre-existentes)

Existem varios erros de build que precisam ser corrigidos antes de implementar a funcionalidade de limpeza.

### 1.1 Corrigir `security-middleware.ts` (Deno parse error)

O tipo union na interface nao e suportado como `interface`. Trocar para `type`:

```typescript
// De:
export interface SecurityValidationResult {
  valid: true; ip: string;
} | { valid: false; response: Response; reason: string; }

// Para:
export type SecurityValidationResult = {
  valid: true; ip: string;
} | { valid: false; response: Response; reason: string; }
```

### 1.2 Corrigir `useAccess.tsx` (tabela `access_campaigns` nao existe nos types)

As chamadas `.from('access_campaigns')` nao compilam porque a tabela nao esta nos types gerados. Solucao: usar cast `as any` ou criar a tabela via migration.

### 1.3 Corrigir `useAdvancedAnalytics.tsx` (tipo IntegrationHealthPoint)

Linha 312 - corrigir casts de tipo no sort e retorno.

### 1.4 Corrigir `useIncidents.tsx` (IncidentPlaybook e BCPPlan types)

Linhas 159, 170, 174 - os tipos do banco nao batem com as interfaces frontend. Solucao: mapear campos snake_case para camelCase.

### 1.5 Corrigir `useReports.tsx` (tabelas `reports` e `scheduled_reports`)

Similar ao useAccess - tabelas nao existem nos types. Usar cast.

### 1.6 Corrigir `useRisks.tsx` (Risk, Vendor, RiskAssessment types)

Linhas 118, 130, 142 - campos snake_case do banco vs camelCase das interfaces. Adicionar mapeamento.

---

## Parte 2: Criar Funcionalidade "Limpar Dados"

### Dados atuais no banco:
| Tabela | Registros |
|--------|-----------|
| frameworks | 3 |
| controls | 62 |
| policies | 16 |
| notifications | 14 |
| tasks | 7 |
| bcp_plans | 4 |
| incident_playbooks | 4 |
| evidence | 1 |

### 2.1 Criar Edge Function `purge-user-data`

Nova Edge Function que limpa dados do usuario autenticado, com opcoes seletivas:

- **Modo "tudo"**: Limpa todas as tabelas de dados do usuario
- **Modo seletivo**: Permite escolher categorias (riscos, incidentes, tarefas, frameworks, etc.)

Tabelas a limpar (respeitando ordem de dependencias/FKs):
1. `compliance_alerts`
2. `integration_collected_data`, `integration_evidence_mapping`
3. `risk_assessments`, `risk_acceptances`
4. `risks`, `vendors`
5. `incidents`, `incident_playbooks`, `bcp_plans`
6. `tasks`, `evidence`
7. `control_assignments`, `control_tests`, `custom_compliance_tests`, `custom_test_results`
8. `controls` (se solicitado)
9. `frameworks` (se solicitado)
10. `policies`
11. `reports`, `scheduled_reports`
12. `notifications`
13. `audits`, `audit_logs`
14. `system_audit_logs`, `system_logs`
15. `compliance_check_history`

A funcao usara service role para garantir que todas as delecoes funcionem, mas validara que o usuario so apaga seus proprios dados (filtrando por `user_id` e `org_id`).

### 2.2 Criar componente `PurgeDatabaseCard`

Novo card em Configuracoes (ao lado do SeedDatabaseCard) com:
- Checkboxes para selecionar categorias de dados
- Contagem de registros por categoria (preview)
- Confirmacao com digitacao ("LIMPAR" para confirmar)
- Botao destrutivo com loading state
- Feedback de resultado (quantos registros removidos)

### 2.3 Adicionar na pagina Settings

Inserir o novo card na tab de "Dados" junto com o SeedDatabaseCard existente.

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/_shared/security-middleware.ts` | Modificar | Fix tipo union (interface -> type) |
| `src/hooks/useAccess.tsx` | Modificar | Fix tipo tabela com cast |
| `src/hooks/useAdvancedAnalytics.tsx` | Modificar | Fix casts de tipo |
| `src/hooks/useIncidents.tsx` | Modificar | Fix mapeamento snake_case |
| `src/hooks/useReports.tsx` | Modificar | Fix tipo tabela com cast |
| `src/hooks/useRisks.tsx` | Modificar | Fix mapeamento snake_case |
| `supabase/functions/purge-user-data/index.ts` | Criar | Edge Function de limpeza |
| `src/components/settings/PurgeDatabaseCard.tsx` | Criar | UI de limpeza seletiva |
| `src/pages/Settings.tsx` | Modificar | Adicionar PurgeDatabaseCard |

---

## Resultado Esperado

1. Build sem erros
2. Novo card "Limpar Dados" em Configuracoes
3. Usuario pode selecionar quais categorias limpar
4. Confirmacao segura antes de deletar
5. Feedback claro do que foi removido
6. Frameworks e controles podem ser preservados ou removidos (escolha do usuario)
