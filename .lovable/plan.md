
# Plano: Remover Dados Mockados da Aba Riscos e Fornecedores

## Análise Detalhada dos Mocks Identificados

### Componentes com Dados Mockados (100% hardcoded):

| Componente | Problema | Impacto |
|---|---|---|
| `RiskAssessments.tsx` | Array `activeAssessments` com 4 avaliações fictícias (CloudSecure, DataProtect, Analytics Corp, TechSupport Pro) - **linhas 122-175** | Tela inteira de avaliações ativas é fictícia |
| `RiskAssessments.tsx` | Array `assessmentTemplates` duplicado (aparece 2x no código) - **linhas 87-120 e 332-364** | Templates são modelos padrão (legítimos, similar a UseTemplateModal), mas aparecem hardcoded |

### Componentes com Dados Reais (já corrigidos):

- ✅ `RiskStats.tsx` - Usa `stats` do hook `useRisks()` 
- ✅ `RiskMatrix.tsx` - Constrói matriz a partir de `risks` reais do hook
- ✅ `RiskRegistry.tsx` - Exibe `risks` do hook `useRisks()`
- ✅ `CreateRiskModal.tsx` - Cria riscos via `createRisk()` do hook
- ✅ `EditRiskModal.tsx` - Edita riscos via `updateRisk()` do hook
- ✅ `VendorTable.tsx` - Exibe `vendors` do hook `useRisks()`
- ✅ `CreateVendorModal.tsx` - Já corrigido na iteração anterior
- ✅ `ViewAssessmentModal.tsx` - Já corrigido na iteração anterior

---

## Implementação

### 1. RiskAssessments.tsx - Remover `activeAssessments` Hardcoded

**Problema:** 
- Linhas 122-175 contêm array `activeAssessments` com 4 avaliações fictícias totalmente inventadas
- O componente exibe `assessments` do hook `useRisks()` mas ignora `activeAssessments` hardcoded

**Solução:**
- Remover completamente o array `activeAssessments` (linhas 122-175)
- Usar `assessments` do hook que já é fetched via `useRisks()`
- Se nenhuma avaliação, mostrar estado vazio: "Nenhuma avaliação de risco enviada. Crie uma nova avaliação para começar."

**Mapeamento de Campos (se necessário):**
Verificar se `assessments` do hook já possui os campos esperados (vendor, template, status, progress, etc.). Se não, o hook pode precisar de ajuste.

---

### 2. RiskAssessments.tsx - Templates (Avaliar Legitimidade)

**Análise:**
- Os 4 templates (SOC 2, LGPD, Financial, General Onboarding) aparecem 2x no código:
  - Uma vez como `assessmentTemplates` (linhas 87-120)
  - Outra dentro do TabsContent (linhas 332-364)
  
**Decisão:**
Estes templates são **modelos padrão da indústria** (como em `UseTemplateModal.tsx`), mas deveriam ser:
1. **Definidos uma única vez** (remover duplicação)
2. **Derivados do banco se houver tabela de templates**, OU
3. **Mantidos como dados estáticos** de referência com badge clara ("Modelo padrão")

**Implementação:**
- Consolidar `assessmentTemplates` em uma única declaração
- Mover para uma constant ou hook reutilizável
- Manter em `TabsContent value="templates"` para exibição

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/risk/RiskAssessments.tsx` | Remover `activeAssessments` hardcoded (linhas 122-175). Usar `assessments` do hook. Consolidar `assessmentTemplates` (remover duplicação) |

---

## Resultado Esperado

1. ✅ Avaliações ativas exibem dados reais do banco (via `useRisks().assessments`)
2. ✅ Se nenhuma avaliação, mensagem clara "Nenhuma avaliação enviada"
3. ✅ Templates consolidados e exibidos 1x (sem duplicação)
4. ✅ Nenhum número fictício de avaliações exibido
5. ✅ Aba de Riscos e Fornecedores 100% baseada em dados reais

---

## Nota Técnica

O hook `useRisks()` retorna:
- `risks` - lista de riscos
- `vendors` - lista de fornecedores
- `assessments` - lista de avaliações de risco (precisa validar se este campo existe)

Se `assessments` não existir no hook, será necessário ajustá-lo para buscar avaliações do banco (potencialmente tabela `risk_assessments` ou similar).

