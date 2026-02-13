
# Plano: Remover Dados Mockados da Aba Politicas e Treinamentos

## Problemas Identificados

Todos os 4 componentes principais da aba usam dados 100% hardcoded, ignorando completamente o hook `usePolicies` que ja busca dados reais do banco.

| Componente | Problema |
|------------|----------|
| `PoliciesLibrary.tsx` | Array `policiesData` com 6 politicas fictcias (linhas 38-123). O hook `usePolicies` e importado mas `realPolicies` nunca e usado |
| `TrainingPrograms.tsx` | Array `trainingPrograms` com 4 programas ficticios. Nao existe tabela `trainings` no banco |
| `AttestationTracking.tsx` | Array `attestationCampaigns` com 3 campanhas ficticias, usuarios pendentes inventados. Nao existe tabela `policy_attestations` |
| `PoliciesStats.tsx` | 4 cards com numeros fixos (28 politicas, 94.2% assinatura, 12 treinamentos, 7 pendencias) |

---

## Implementacao

### 1. PoliciesLibrary.tsx
**Antes:** Ignora `realPolicies` do hook e exibe 6 politicas hardcoded
**Depois:** Usar `realPolicies` do hook `usePolicies()` que ja busca do banco. Mapear os campos do banco (`name`, `status`, `category`, `version`, `description`, `owner`, `updated_at`, `next_review`, `tags`) para a UI. Remover o array `policiesData` inteiro. Se nao houver politicas, exibir estado vazio: "Nenhuma politica cadastrada. Crie sua primeira politica."

Mapeamento de campos:
- `title` vira `policy.name`
- `lastUpdated` vira `format(policy.updated_at)`
- `nextReview` vira `format(policy.next_review)`
- `author` vira `policy.owner ?? '—'`
- `frameworks` vira `policy.tags ?? []`
- Campos de assinatura (`signatureRate`, `totalSignatures`) serao removidos (nao existe tabela de attestations)

### 2. TrainingPrograms.tsx
**Antes:** 4 programas hardcoded
**Depois:** Estado vazio com mensagem "Nenhum programa de treinamento cadastrado." e botao "Novo Treinamento" (que ja existe via CreateTrainingModal). Nao ha tabela de treinamentos no banco, entao o componente apenas mostra estado vazio ate que a funcionalidade seja implementada com persistencia.

### 3. AttestationTracking.tsx
**Antes:** 3 campanhas ficticias com usuarios pendentes inventados
**Depois:** Estado vazio com mensagem "Nenhuma campanha de atesto em andamento." Nao ha tabela de attestations no banco. Manter o botao de lembretes mas desabilitado.

### 4. PoliciesStats.tsx
**Antes:** 4 cards com numeros fixos
**Depois:** Importar `usePolicies` e usar `stats` do hook para:
- "Politicas Ativas" = `stats.activePolicies` / `stats.totalPolicies`
- "Em Revisao" = `stats.reviewPolicies`
- "Rascunhos" = `stats.draftPolicies`
- "Revisao Proxima" = `stats.policiesDueSoon`

Remover cards de treinamentos e assinaturas (dados nao existem no banco).

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/policies/PoliciesLibrary.tsx` | Usar `realPolicies` do hook, remover array hardcoded |
| `src/components/policies/TrainingPrograms.tsx` | Estado vazio (sem tabela no banco) |
| `src/components/policies/AttestationTracking.tsx` | Estado vazio (sem tabela no banco) |
| `src/components/policies/PoliciesStats.tsx` | Dados reais do hook `usePolicies` |

---

## Resultado Esperado

1. PoliciesLibrary exibe politicas reais do banco de dados
2. Stats calculados dinamicamente a partir das politicas reais
3. Treinamentos e Atestos mostram estado vazio honesto (sem tabelas no banco)
4. Nenhum numero ficticio exibido na tela
5. Usuario entende que precisa criar dados manualmente
