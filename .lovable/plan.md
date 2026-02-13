
# Plano: Remover Dados Mockados e Preparar para Uso Real

## Resumo da Analise

Foram encontrados **17 arquivos** com dados mockados ou gerados aleatoriamente (Math.random). Abaixo esta o inventario completo e o plano de correcao para cada um.

---

## Inventario de Mocks Encontrados

### Categoria 1: Dados Hardcoded em Componentes (prioridade alta)

| Arquivo | Mock | Impacto |
|---------|------|---------|
| `NotificationRulesManager.tsx` | 5 regras mockadas hardcoded | Tela inteira de regras e ficticia |
| `SendRemindersModal.tsx` | Campanhas e usuarios mockados | Modal de lembretes nao funcional |
| `ViewAssessmentModal.tsx` | Assessment inteiro mockado | Visualizacao de avaliacao ficticia |
| `UseTemplateModal.tsx` | Templates de questionario mockados | Dados de template ficticios |
| `ViewPlaybookModal.tsx` | Steps de playbook mockados | Passos do playbook ficticios |
| `TestDetailsModal.tsx` | Detalhes de teste BCP mockados | Resultados de teste ficticios |
| `BCPReportModal.tsx` | Estatisticas mockadas (totalPlans=12, etc.) | Numeros falsos no relatorio |
| `CustomReports.tsx` | Preview de relatorio mockado | Dados de preview ficticios |

### Categoria 2: Graficos com Math.random (prioridade media)

| Arquivo | Mock | Impacto |
|---------|------|---------|
| `RiskEvolution.tsx` | Evolucao de riscos com Math.random | Grafico com dados aleatorios |
| `ComplianceChart.tsx` | Timeline de compliance com Math.random | Historico de score inventado |
| `ComplianceScoreCard.tsx` | Score anterior com Math.random | Tendencia de score falsa |
| `ComplianceScoreEvolution.tsx` | Fallback com Math.random quando sem dados | Dados sample aleatorios |
| `MTTREvolutionChart.tsx` | Fallback com Math.random quando sem dados | MTTR sample aleatorio |
| `PerformanceKPIs.tsx` | KPIs inteiros com Math.random | Todos os KPIs sao ficticios |
| `RealTimeMetrics.tsx` | Atividades e tarefas com Math.random | Metricas em tempo real falsas |

### Categoria 3: Logica de negocio com valores aleatorios (prioridade media)

| Arquivo | Mock | Impacto |
|---------|------|---------|
| `CreateVendorModal.tsx` | complianceScore e pendingActions aleatorios | Vendor criado com score falso |
| `FirstScanStep.tsx` | Resultado do primeiro scan simulado | Onboarding com resultados inventados |

### Categoria 4: Usos legitimos de Math.random (NAO alterar)

| Arquivo | Uso | Motivo para manter |
|---------|-----|-------------------|
| `password-security.ts` | Geracao de senhas | Funcionalidade real |
| `custom-test-schemas.ts` | Geracao de IDs unicos | Funcionalidade real |
| `EvidenceUploader.tsx` | ID unico para upload + barra de progresso | Funcionalidade real |
| `sidebar.tsx` | Largura do skeleton loader | UI placeholder |
| `AuditorAccess.tsx` | Contagem no log de download | Detalhe menor |

---

## Implementacao

### 1. NotificationRulesManager.tsx
**Antes:** 5 regras mockadas hardcoded no estado inicial
**Depois:** Estado inicial vazio `[]` + mensagem "Nenhuma regra de notificacao configurada. Crie sua primeira regra."

### 2. SendRemindersModal.tsx
**Antes:** Campanhas e usuarios hardcoded
**Depois:** Buscar politicas reais do banco (tabela `policies`) como campanhas, e usuarios da org como destinatarios. Se vazio, mostrar "Nenhuma politica pendente de atesto"

### 3. ViewAssessmentModal.tsx
**Antes:** Assessment inteiro hardcoded com perguntas/respostas
**Depois:** Receber dados reais via props (do vendor/assessment selecionado no banco). Se nao houver assessment real, mostrar "Nenhuma avaliacao realizada para este fornecedor"

### 4. UseTemplateModal.tsx
**Antes:** Templates SOC 2, LGPD, Financial hardcoded
**Depois:** Manter os templates como dados estaticos de referencia (sao modelos padrao da industria, nao dados do usuario). Adicionar badge "Modelo padrao" para clareza

### 5. ViewPlaybookModal.tsx
**Antes:** 5 steps genericos mockados
**Depois:** Buscar steps reais do playbook (se houver campo `steps` no banco) ou exibir os steps do proprio playbook passado via props. Se vazio, "Este playbook ainda nao possui passos definidos"

### 6. TestDetailsModal.tsx
**Antes:** Detalhes de teste completamente mockados
**Depois:** Receber dados reais via props do teste selecionado. Se nao houver detalhes, mostrar "Detalhes do teste nao disponiveis"

### 7. BCPReportModal.tsx
**Antes:** stats hardcoded (totalPlans=12, activePlans=8, etc.)
**Depois:** Calcular stats reais a partir dos dados de `bcp_plans` passados ou buscados. Se vazio, mostrar zeros

### 8. CustomReports.tsx
**Antes:** mockReport com dados ficticios no handleViewReport
**Depois:** Usar dados reais do relatorio selecionado. Preencher campos como pages/size com "N/A" se nao disponiveis

### 9. RiskEvolution.tsx
**Antes:** Historico inventado com Math.random
**Depois:** Se nao houver dados historicos, mostrar apenas o ponto atual (contagem real de riscos por nivel) + mensagem "Dados historicos serao gerados conforme riscos forem registrados"

### 10. ComplianceChart.tsx
**Antes:** Timeline com Math.random baseada no score atual
**Depois:** Buscar dados de `compliance_check_history` para montar timeline real. Se vazio, mostrar apenas o score atual como ponto unico

### 11. ComplianceScoreCard.tsx
**Antes:** previousScore com Math.random
**Depois:** Buscar score anterior de `compliance_check_history` (ultimo registro antes do atual). Se nao houver, nao exibir tendencia

### 12. ComplianceScoreEvolution.tsx e MTTREvolutionChart.tsx
**Antes:** Fallback para dados aleatorios quando sem dados reais
**Depois:** Quando sem dados, exibir estado vazio: "Dados insuficientes para gerar o grafico. Execute verificacoes de compliance para gerar historico"

### 13. PerformanceKPIs.tsx
**Antes:** Todos os KPIs gerados com Math.random
**Depois:** Mostrar apenas dados derivados dos dados reais (compliance atual, taxa de tarefas atual). Sem historico ficticio - mostrar apenas o mes atual se nao houver historico

### 14. RealTimeMetrics.tsx
**Antes:** Fallback com atividades aleatorias
**Depois:** Se nao houver dados reais (hasRealData=false), mostrar estado vazio: "Conecte integracoes para monitorar atividades em tempo real"

### 15. CreateVendorModal.tsx
**Antes:** complianceScore e pendingActions aleatorios
**Depois:** complianceScore = 0 (a ser avaliado), pendingActions = 0

### 16. FirstScanStep.tsx
**Antes:** Resultados simulados do scan
**Depois:** Chamar a edge function `check-compliance-drift` real para obter score verdadeiro. Se falhar, mostrar erro e opcao de retry

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/notifications/NotificationRulesManager.tsx` | Remover mockRules, estado vazio |
| `src/components/policies/SendRemindersModal.tsx` | Buscar dados reais ou estado vazio |
| `src/components/risk/ViewAssessmentModal.tsx` | Usar props reais ou estado vazio |
| `src/components/incidents/ViewPlaybookModal.tsx` | Usar dados do playbook real |
| `src/components/incidents/TestDetailsModal.tsx` | Usar dados do teste real |
| `src/components/incidents/BCPReportModal.tsx` | Calcular stats reais |
| `src/components/reports/CustomReports.tsx` | Usar dados reais do relatorio |
| `src/components/analytics/RiskEvolution.tsx` | Dados reais ou estado vazio |
| `src/components/dashboard/ComplianceChart.tsx` | Dados de compliance_check_history |
| `src/components/dashboard/ComplianceScoreCard.tsx` | Score anterior real |
| `src/components/analytics/ComplianceScoreEvolution.tsx` | Estado vazio se sem dados |
| `src/components/analytics/MTTREvolutionChart.tsx` | Estado vazio se sem dados |
| `src/components/analytics/PerformanceKPIs.tsx` | Dados derivados reais |
| `src/components/dashboard/RealTimeMetrics.tsx` | Estado vazio se sem integracao |
| `src/components/risk/CreateVendorModal.tsx` | Score e actions = 0 |
| `src/components/onboarding/steps/FirstScanStep.tsx` | Chamar scan real |

---

## Padrao de Estado Vazio

Todos os componentes sem dados seguirao o mesmo padrao visual:

```
+-------------------------------------------+
|  [icone]                                  |
|  Nenhum dado disponivel                   |
|  Descricao contextual do que fazer        |
|  [Botao de acao, se aplicavel]            |
+-------------------------------------------+
```

Exemplo para graficos: area cinza com texto centralizado e icone, sem eixos vazios.

---

## Resultado Esperado

1. Nenhum dado ficticio exibido em nenhuma tela
2. Telas vazias com mensagens amigaveis e orientacao
3. Graficos mostram apenas dados reais (ou estado vazio)
4. Novos registros criados sem valores aleatorios
5. Plataforma pronta para uso real com dados manuais ou de integracoes
