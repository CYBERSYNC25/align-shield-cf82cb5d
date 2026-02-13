
# Plano: Remover Dados Mockados da Aba Controles e Frameworks

## Problemas Identificados

### 1. GapAssessment.tsx - Dados 100% hardcoded
O componente inteiro exibe 3 gaps ficticios com dados inventados (CC6.1, A.5.8, LGPD.Art.46), equipes falsas ("DevOps Team", "Security Team", "Legal Team"), datas de 2024, e um resumo com numeros fixos (2 gaps criticos, 45 dias).

**Correcao:** Derivar gaps reais a partir dos controles do banco com status `failed` ou `pending`. Calcular o resumo dinamicamente. Se nao houver gaps, exibir estado vazio.

### 2. FrameworkDetails.tsx (Analytics) - Math.random
O grafico de barras gera `controls` e `completed` com `Math.random()`, mostrando dados completamente aleatorios a cada render.

**Correcao:** Usar dados reais do hook `useFrameworks` -- contar controles totais e controles com status `passed` por framework.

### 3. ControlsMatrix.tsx - Campos hardcoded
Todos os controles recebem `automationStatus: 'manual'` e `riskLevel: 'medium'` fixos, independente dos dados reais.

**Correcao:** Usar `'manual'` como valor padrao mas exibir de forma mais honesta (sem destaque de badge para campos sem informacao real). Para riskLevel, derivar do status do controle ou omitir se nao disponivel.

### 4. FrameworksOverview.tsx - Campos fixos
`automatedControls` sempre 0 e `lastVerification` sempre "---".

**Correcao:** Remover exibicao de "controles automatizados" (informacao nao disponivel no banco) ou mostrar "N/A". Para `lastVerification`, buscar a data `last_verified` mais recente entre os controles do framework.

---

## Implementacao Detalhada

### Arquivo 1: `src/components/controls/GapAssessment.tsx`
- Remover array `gapData` hardcoded (linhas 7-59)
- Importar `useFrameworks` para buscar controles reais
- Gerar gaps a partir de controles com status `failed` ou `pending`
- Calcular resumo (gaps criticos, medios, equipes) dinamicamente
- Exibir estado vazio quando nao houver gaps: "Nenhum gap identificado. Todos os controles estao em conformidade."
- Atualizar exportacao de relatorio para usar dados dinamicos

### Arquivo 2: `src/components/analytics/FrameworkDetails.tsx`
- Remover `Math.random()` das linhas 14-15
- Contar controles totais por framework: `controls.filter(c => c.framework_id === f.id).length`
- Contar controles concluidos (status `passed`): `controls.filter(c => c.framework_id === f.id && c.status === 'passed').length`
- Se nao houver frameworks, exibir estado vazio

### Arquivo 3: `src/components/controls/ControlsMatrix.tsx`
- Remover `riskLevel: 'medium'` hardcoded -- substituir por logica: se controle `missing` = 'high', se `partial` = 'medium', se `implemented` = 'low'
- Manter `automationStatus: 'manual'` como padrao (nao existe esse campo no banco), mas remover badge de automacao da listagem para evitar confusao

### Arquivo 4: `src/components/controls/FrameworksOverview.tsx`
- `automatedControls`: remover a linha que mostra "0 controles automatizados via Agente/API" (informacao nao existe)
- `lastVerification`: calcular a partir do campo `last_verified` dos controles do framework. Se nenhum tiver, mostrar "Nunca verificado"

---

## Arquivos a Modificar

| Arquivo | Mudanca Principal |
|---------|------------------|
| `src/components/controls/GapAssessment.tsx` | Substituir dados hardcoded por controles reais com gaps |
| `src/components/analytics/FrameworkDetails.tsx` | Substituir Math.random por contagem real de controles |
| `src/components/controls/ControlsMatrix.tsx` | Derivar riskLevel do status do controle |
| `src/components/controls/FrameworksOverview.tsx` | Remover info ficticia de automacao, calcular lastVerification real |

---

## Resultado Esperado

1. Gaps derivados de controles reais com status pendente/falho
2. Grafico de frameworks mostra contagens reais de controles
3. Nivel de risco derivado logicamente do status do controle
4. Sem informacoes ficticias de "controles automatizados"
5. Data de ultima verificacao baseada nos dados reais
6. Estados vazios amigaveis quando nao houver dados
