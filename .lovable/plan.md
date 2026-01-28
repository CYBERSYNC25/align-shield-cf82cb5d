
# Plano: Completar Sistema de Job Queue - UI e Documentação

## Análise do Estado Atual

O sistema de job queue **já está 80% implementado**:

| Componente | Status | Detalhes |
|------------|--------|----------|
| Tabela `job_queue` | Completo | Todos os campos solicitados já existem |
| Funções SQL | Completo | `enqueue_job`, `claim_pending_jobs`, `complete_job`, `fail_job`, `reset_stuck_jobs`, `calculate_next_retry` |
| Edge Function | Completo | `process-job-queue` com handlers para sync_integration, compliance_check, etc. |
| Hooks React | Completo | `useJobs`, `useJobStatus`, `useCreateJob`, `useRetryJob`, `useCancelJob`, `usePendingJobsCount` |
| Componentes | Parcial | `JobStatusBadge` existe, falta página de gestão |
| Integração Sync | Completo | `SyncIntegrationButton` já usa job queue |
| UI de Gestão | **Falta** | Nenhuma página `/settings/jobs` ou similar |
| Documentação | **Falta** | README não menciona job queue |

## O Que Será Implementado

### 1. Página de Gestão de Jobs (`/jobs`)

Nova rota dedicada para administradores gerenciarem a fila de jobs:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Jobs & Background Tasks                                   [Processar]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Stats Cards                                                      │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │ │Pendentes│ │Processa.│ │Concluído│ │ Falhou  │ │Taxa/hora│    │   │
│  │ │   12    │ │    3    │ │   245   │ │    5    │ │   42    │    │   │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Jobs Processados por Hora (24h)              [Recharts AreaChart]│   │
│  │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇                                           │   │
│  │ 00:00        06:00        12:00        18:00        24:00        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Filtros: [Todos ▼] [Todos tipos ▼] [Últimas 24h ▼]   [Atualizar]│   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ │ Status │ Tipo         │ Prioridade │ Tentativas │ Criado  │ Ações│   │
│  │ │────────│──────────────│────────────│────────────│─────────│──────│   │
│  │ │ 🔵     │ sync_aws     │ Alta       │ 1/3        │ 2min    │ Ver  │   │
│  │ │ 🟢     │ compliance   │ Normal     │ 1/3        │ 5min    │ Ver  │   │
│  │ │ 🔴     │ sync_okta    │ Normal     │ 3/3        │ 10min   │ Retry│   │
│  │ │ 🟡     │ report       │ Baixa      │ 0/3        │ 15min   │ Cance│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Componentes a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Jobs.tsx` | Página principal de gestão de jobs |
| `src/components/jobs/JobsStatsCards.tsx` | Cards de estatísticas (pending, processing, etc.) |
| `src/components/jobs/JobsProcessedChart.tsx` | Gráfico de jobs/hora (Recharts AreaChart) |
| `src/components/jobs/JobsTable.tsx` | Tabela com lista de jobs e ações |
| `src/components/jobs/JobDetailsModal.tsx` | Modal com detalhes do job (payload, result, errors) |

### 3. Rota e Navegação

```typescript
// src/App.tsx - Adicionar rota
<Route path="/jobs" element={
  <ProtectedRoute>
    <Jobs />
  </ProtectedRoute>
} />
```

### 4. Hook de Estatísticas

```typescript
// useJobsStats.tsx
export function useJobsStats() {
  return useQuery({
    queryKey: ['jobs-stats'],
    queryFn: async () => {
      // Buscar contagem por status
      const pending = await supabase.from('job_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Buscar jobs por hora (últimas 24h)
      const hourlyData = await supabase.from('job_queue')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());
      
      return { counts, hourlyData };
    }
  });
}
```

### 5. Documentação no README

Adicionar seção completa sobre Job Queue no README:

```markdown
## 📨 Job Queue (Processamento Assíncrono)

O APOC utiliza uma fila de jobs para processamento assíncrono de tarefas pesadas.

### Arquitetura

| Componente | Descrição |
|------------|-----------|
| `job_queue` | Tabela PostgreSQL com jobs e status |
| `process-job-queue` | Edge Function que processa a fila |
| `useJobQueue` | Hook React para criar e monitorar jobs |

### Tipos de Jobs

| Tipo | Descrição | Prioridade |
|------|-----------|------------|
| `sync_integration` | Sincroniza recursos de integrações | Alta (2) |
| `run_compliance_check` | Executa verificação de compliance | Normal (3) |
| `generate_report` | Gera relatórios de compliance | Normal (3) |
| `send_notification` | Envia notificações | Baixa (4) |
| `cleanup_data` | Limpeza de dados antigos | Baixa (5) |

### Retry e Backoff

- **Max Attempts**: 3 tentativas por job
- **Exponential Backoff**: 1min → 5min → 15min
- **Stuck Jobs**: Reset automático após 15min sem resposta

### Uso

// Criar job
const { mutate: createJob } = useCreateJob();
createJob({
  jobType: 'sync_integration',
  payload: { provider: 'aws' },
  priority: 2
});

// Monitorar job
const { data: jobStatus } = useJobStatus(jobId);
// jobStatus.status: 'pending' | 'processing' | 'completed' | 'failed'
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Jobs.tsx` | **NOVO** | Página de gestão de jobs |
| `src/components/jobs/JobsStatsCards.tsx` | **NOVO** | Cards de estatísticas |
| `src/components/jobs/JobsProcessedChart.tsx` | **NOVO** | Gráfico de jobs/hora |
| `src/components/jobs/JobsTable.tsx` | **NOVO** | Tabela de jobs com filtros |
| `src/components/jobs/JobDetailsModal.tsx` | **NOVO** | Modal de detalhes |
| `src/hooks/useJobsStats.tsx` | **NOVO** | Hook de estatísticas |
| `src/App.tsx` | Modificar | Adicionar rota `/jobs` |
| `src/components/layout/Sidebar.tsx` | Modificar | Adicionar link para Jobs |
| `README.md` | Modificar | Adicionar seção Job Queue |

---

## Funcionalidades da UI

### Cards de Estatísticas

| Métrica | Descrição |
|---------|-----------|
| Pendentes | Jobs aguardando processamento |
| Processando | Jobs sendo executados agora |
| Concluídos (24h) | Jobs finalizados com sucesso |
| Falhos (24h) | Jobs que falharam |
| Taxa/hora | Média de jobs processados por hora |

### Filtros da Tabela

| Filtro | Opções |
|--------|--------|
| Status | Todos, Pendente, Processando, Concluído, Falhou, Cancelado |
| Tipo | Todos, sync_integration, compliance_check, generate_report, etc. |
| Período | Últimas 24h, 7 dias, 30 dias |

### Ações por Job

| Status | Ações Disponíveis |
|--------|-------------------|
| pending | Ver, Cancelar |
| processing | Ver |
| completed | Ver |
| failed | Ver, Retry |
| cancelled | Ver |

### Gráfico de Jobs/Hora

Usando `Recharts` (já instalado) para exibir AreaChart com:
- Eixo X: Horas (0-23)
- Eixo Y: Quantidade de jobs
- Áreas empilhadas por status (completed=verde, failed=vermelho)

---

## Acesso e Permissões

A página `/jobs` será restrita a:
- `admin`
- `master_admin`

Verificação via `useUserRoles()` no componente.

---

## Benefícios

1. **Visibilidade**: Admins podem ver todos os jobs em execução
2. **Debugging**: Detalhes de payload/result para diagnóstico
3. **Controle**: Retry manual de jobs falhados
4. **Métricas**: Gráfico de throughput por hora
5. **Documentação**: README completo para desenvolvedores
