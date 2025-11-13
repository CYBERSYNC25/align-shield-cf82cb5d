# Documentação Completa do Dashboard

## 📊 Visão Geral

O Dashboard de Compliance é o centro de controle da plataforma ComplianceSync. Fornece visibilidade em tempo real sobre todos os aspectos do programa de GRC (Governance, Risk & Compliance).

---

## 🎯 KPIs Principais

### 1. Controles Ativos

**Descrição**: Total de controles de segurança implementados nos frameworks de compliance.

**Cálculo**:
```typescript
total_controles = frameworks.reduce((sum, f) => sum + f.total_controls, 0)
```

**Interpretação**:
- **< 50 controles**: Cobertura básica - **Ação**: Priorizar implementação
- **50-100 controles**: Cobertura adequada - **Ação**: Manter e melhorar
- **> 100 controles**: Cobertura avançada - **Ação**: Monitorar e otimizar

**Edge Cases**:
- Sem frameworks cadastrados → value = 0, exibe "Nenhum framework configurado"
- API offline → exibe skeleton de loading
- Erro de permissão → exibe mensagem de erro com ícone

**JSON de Resposta**:
```json
{
  "frameworks": [
    { "id": "soc2", "total_controls": 64 },
    { "id": "iso27001", "total_controls": 114 }
  ],
  "total": 178
}
```

---

### 2. Riscos Identificados

**Descrição**: Quantidade de riscos mapeados, categorizados por severidade (Alto, Médio, Baixo).

**Cálculo**:
```typescript
risks_by_level = {
  high: risks.filter(r => r.level === 'high').length,
  medium: risks.filter(r => r.level === 'medium').length,
  low: risks.filter(r => r.level === 'low').length
}
```

**Interpretação**:
- **> 10 riscos altos**: 🔴 Crítico - Mitigação urgente
- **5-10 riscos altos**: 🟡 Atenção - Plano de mitigação
- **< 5 riscos altos**: 🟢 Normal - Monitorar

**Scoring de Risco**:
```
score = 100 - ((riscos_altos / total_riscos) * 100)
```

**Edge Cases**:
- Nenhum risco cadastrado → value = 0, emptyMessage = "Nenhum risco identificado"
- Todos riscos altos → progress bar vermelha (0-30%)
- Apenas riscos baixos → progress bar verde (80-100%)

---

### 3. Auditorias Concluídas

**Descrição**: Número de auditorias finalizadas com sucesso (internas, externas, certificação).

**Cálculo**:
```typescript
completed = audits.filter(a => a.status === 'completed').length
progress = (completed / total_audits) * 100
```

**Interpretação**:
- **100% completas**: ✅ Excelente - No prazo
- **70-99% completas**: ⚠️ Bom - Alguns atrasos
- **< 70% completas**: 🚨 Crítico - Revisar planejamento

**Edge Cases**:
- Sem auditorias agendadas → value = 0, emptyMessage = "Nenhuma auditoria agendada"
- Auditoria em andamento → não conta como completa
- Auditoria reprovada → ainda conta (mas com flag de alerta)

---

### 4. Tarefas Pendentes

**Descrição**: Tarefas em aberto que requerem ação (implementação, evidências, remediações).

**Cálculo**:
```typescript
pending = tasks.filter(t => t.status === 'pending').length
progress = ((total - pending) / total) * 100
```

**Interpretação**:
- **0-5 tarefas**: 🟢 Ótimo - Carga gerenciável
- **6-15 tarefas**: 🟡 Normal - Priorizar por prazo
- **> 15 tarefas**: 🔴 Sobrecarga - Delegar ou estender prazos

**Priorização**:
1. **Urgente + Alta prioridade** → Fazer agora
2. **Urgente + Baixa prioridade** → Fazer hoje
3. **Não urgente + Alta prioridade** → Planejar
4. **Não urgente + Baixa prioridade** → Backlog

**Edge Cases**:
- Todas tarefas concluídas → value = 0, emptyMessage = "🎉 Todas tarefas concluídas!"
- Tarefas vencidas → highlight com badge "Atrasado"
- Tarefas sem responsável → alert "Requer atribuição"

---

### 5. Políticas Ativas

**Descrição**: Número de políticas de segurança publicadas e em vigor.

**Exemplos de Políticas**:
- Política de Senha
- Política de BYOD (Bring Your Own Device)
- Política de Backup e Recuperação
- Política de Resposta a Incidentes
- Política de Acesso Remoto

**Cálculo**:
```typescript
active = policies.filter(p => p.status === 'active').length
progress = (active / total_policies) * 100
```

**Ciclo de Vida**:
1. **Rascunho** → Em elaboração
2. **Revisão** → Aguardando aprovação
3. **Ativa** → Publicada e em vigor
4. **Arquivada** → Obsoleta ou substituída

**Edge Cases**:
- Sem políticas → value = 0, emptyMessage = "Nenhuma política cadastrada"
- Política vencida (>1 ano) → badge "Revisão necessária"
- Atestações pendentes → alert "Coletar atestações"

---

### 6. Taxa de Compliance

**Descrição**: Percentual médio de compliance across todos os frameworks.

**Cálculo**:
```typescript
avg_score = frameworks.reduce((sum, f) => sum + f.compliance_score, 0) / frameworks.length
```

**Benchmarks por Framework**:
| Framework | Score Mínimo | Score Ideal |
|-----------|--------------|-------------|
| SOC 2     | 80%          | 95%         |
| ISO 27001 | 85%          | 98%         |
| LGPD      | 75%          | 90%         |
| GDPR      | 80%          | 95%         |

**Interpretação**:
- **90-100%**: 🏆 Excelente - Pronto para certificação
- **80-89%**: ✅ Bom - Algumas melhorias
- **70-79%**: ⚠️ Regular - Ação necessária
- **< 70%**: 🚨 Crítico - Risco de reprovação

**Cálculo de Score por Framework**:
```typescript
score = (controles_implementados / total_controles) * 100
```

---

## 📈 Gráficos e Visualizações

### Evolução do Compliance (Line Chart)

**Propósito**: Visualizar tendência do score de compliance ao longo do tempo.

**Dados**:
```json
{
  "timeline": [
    { "month": "Jan", "score": 78 },
    { "month": "Fev", "score": 82 },
    { "month": "Mar", "score": 85 }
  ]
}
```

**Análise de Tendências**:
- **Ascendente (>5% ao mês)**: 📈 Melhorias significativas
- **Estável (±2%)**: ➡️ Mantendo postura
- **Descendente (<-3%)**: 📉 Deterioração - investigar

**Edge Cases**:
- Dados de 1 mês apenas → exibe ponto único
- Gaps nos dados → linha pontilhada
- Score negativo → error "Dados inválidos"

---

### Distribuição de Riscos (Pie Chart)

**Propósito**: Visualizar proporção de riscos por severidade.

**Dados**:
```json
{
  "distribution": [
    { "level": "high", "count": 8, "percentage": 20 },
    { "level": "medium", "count": 18, "percentage": 45 },
    { "level": "low", "count": 14, "percentage": 35 }
  ]
}
```

**Cores Padrão**:
- 🔴 Alto: #ef4444 (red-500)
- 🟡 Médio: #f59e0b (amber-500)
- 🟢 Baixo: #22c55e (green-500)

**Edge Cases**:
- Sem riscos → exibe mensagem "Nenhum risco cadastrado"
- 100% riscos altos → gráfico totalmente vermelho + alert
- Apenas 1 tipo de risco → exibe círculo sólido

---

## 🎨 Estados de Interface

### Loading State

Exibido enquanto dados estão sendo carregados da API.

**Componentes**:
- Skeleton cards com animação de shimmer
- Gráficos mostram placeholder vazio
- Texto "Carregando..." acessível para screen readers

**Implementação**:
```tsx
{loading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <KPICard {...data} />
)}
```

---

### Error State

Exibido quando há falha ao carregar dados.

**Tipos de Erro**:
1. **Network Error**: "Não foi possível conectar ao servidor"
2. **Permission Error**: "Você não tem permissão para visualizar esses dados"
3. **Server Error**: "Erro ao processar requisição (500)"
4. **Timeout**: "A requisição demorou muito tempo"

**Ações de Recuperação**:
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erro ao carregar dados</AlertTitle>
  <AlertDescription>
    {errorMessage}
    <Button onClick={retry} variant="link">
      Tentar novamente
    </Button>
  </AlertDescription>
</Alert>
```

---

### Empty State

Exibido quando não há dados cadastrados.

**Mensagens por KPI**:
- Controles: "Nenhum framework configurado. Comece criando um."
- Riscos: "Nenhum risco identificado. Realize uma avaliação de riscos."
- Auditorias: "Nenhuma auditoria agendada. Crie sua primeira auditoria."
- Tarefas: "🎉 Todas as tarefas concluídas! Excelente trabalho."
- Políticas: "Nenhuma política cadastrada. Crie políticas de segurança."

**Call-to-Actions**:
```tsx
<EmptyState
  icon={FileText}
  title="Nenhuma política cadastrada"
  description="Políticas são fundamentais para compliance"
  action={
    <Button onClick={openCreatePolicyModal}>
      Criar Primeira Política
    </Button>
  }
/>
```

---

## 🧪 Casos de Teste

### Teste 1: Dashboard com Dados Completos

**Setup**:
```json
{
  "frameworks": 4,
  "controls": 178,
  "risks": 40,
  "audits": 8,
  "tasks": 12,
  "policies": 15
}
```

**Resultado Esperado**:
- Todos os KPIs exibidos corretamente
- Gráficos renderizados com dados
- Sem mensagens de erro ou empty state

---

### Teste 2: Dashboard Vazio (Novo Usuário)

**Setup**:
```json
{
  "frameworks": 0,
  "controls": 0,
  "risks": 0,
  "audits": 0,
  "tasks": 0,
  "policies": 0
}
```

**Resultado Esperado**:
- KPIs mostram "0" ou "—"
- Empty state messages exibidas
- CTAs para criar primeiro item
- Onboarding modal exibido automaticamente

---

### Teste 3: Dashboard com Erros Parciais

**Setup**:
```json
{
  "frameworks": { "error": "Network timeout" },
  "controls": 64,
  "risks": 18,
  "audits": { "error": "Permission denied" },
  "tasks": 5,
  "policies": 10
}
```

**Resultado Esperado**:
- KPIs com dados exibidos normalmente
- KPIs com erro mostram alert vermelho
- Botão "Tentar novamente" disponível
- Dashboard permanece funcional

---

### Teste 4: Dashboard com Alta Carga (>1000 itens)

**Setup**:
```json
{
  "controls": 1234,
  "risks": 892,
  "tasks": 567
}
```

**Resultado Esperado**:
- Números formatados com separadores (1.234)
- Performance mantida (<100ms render)
- Paginação em tabelas
- Virtual scrolling em listas longas

---

## 🔐 Segurança e Permissões

### Controle de Acesso

**Roles**:
- **Admin**: Visualiza todos os KPIs
- **Auditor**: Visualiza auditorias e evidências
- **Usuário**: Visualiza apenas tarefas atribuídas

**RLS Policies**:
```sql
-- Exemplo: Usuários só veem suas próprias tarefas
CREATE POLICY "users_view_own_tasks"
ON tasks FOR SELECT
USING (assigned_to = auth.uid());
```

---

## 📱 Responsividade

### Breakpoints

| Dispositivo | Breakpoint | Layout |
|-------------|------------|--------|
| Mobile      | < 640px    | 1 coluna, cards empilhados |
| Tablet      | 640-1024px | 2 colunas |
| Desktop     | > 1024px   | 3 colunas, gráficos lado a lado |

**Mobile Optimizations**:
- Gráficos simplificados
- Toque para expandir detalhes
- Swipe para navegar entre KPIs
- Menu hamburger para sidebar

---

## ♿ Acessibilidade

### WCAG 2.1 AA Compliance

**Implementações**:
- ✅ Contraste de cores > 4.5:1
- ✅ Labels descritivos em todos os inputs
- ✅ Navegação via teclado (Tab, Enter, Esc)
- ✅ Screen reader support (ARIA labels)
- ✅ Focus visible em elementos interativos
- ✅ Textos alternativos em gráficos

**Atalhos de Teclado**:
- `?` → Abrir ajuda
- `Ctrl+K` → Busca global
- `G+D` → Ir para Dashboard
- `G+T` → Ir para Tarefas

---

## 🚀 Performance

### Otimizações

**Lazy Loading**:
```tsx
const ComplianceChart = lazy(() => import('./ComplianceChart'));
```

**Memoization**:
```tsx
const metrics = useMemo(() => calculateMetrics(data), [data]);
```

**Debounce de Filtros**:
```tsx
const debouncedSearch = useMemo(
  () => debounce((value) => setSearch(value), 300),
  []
);
```

**Code Splitting**:
- Dashboard: 45KB (gzipped)
- Charts: 32KB (loaded on demand)
- Total FCP: <1.5s

---

## 📚 Referências

- [Recharts Documentation](https://recharts.org/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Última atualização**: 2025-01-13  
**Versão**: 1.0.0  
**Autor**: ComplianceSync Team
