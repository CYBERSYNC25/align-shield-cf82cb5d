
## Plano: Sistema de Filas Assíncronas para Jobs

### Objetivo
Implementar um sistema robusto de processamento assíncrono para operações pesadas como sincronização de integrações, verificações de compliance e geração de relatórios. Isso melhora a experiência do usuário (resposta imediata), a resiliência (retry automático) e a escalabilidade (processamento em background).

---

### Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         JOB QUEUE SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Frontend (SyncIntegrationButton)                                       │
│  └─> INSERT INTO job_queue (job_type, payload, priority)                │
│      └─> Retorna job_id imediatamente                                   │
│          └─> UI mostra "Job agendado" / polling status                  │
├─────────────────────────────────────────────────────────────────────────┤
│  job_queue (tabela)                                                     │
│  ├── id (UUID)                                                          │
│  ├── org_id → organizations.id                                          │
│  ├── job_type (sync_integration, run_compliance_check, generate_report) │
│  ├── payload (JSONB)                                                    │
│  ├── status (pending → processing → completed/failed)                   │
│  ├── priority (1-5, maior = mais urgente)                               │
│  ├── attempts / max_attempts (default 3)                                │
│  ├── error_message                                                      │
│  ├── result (JSONB)                                                     │
│  ├── created_at / started_at / completed_at                             │
│  └── scheduled_for (para jobs agendados)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Edge Function: process-job-queue                                       │
│  ├── SELECT jobs WHERE status='pending' ORDER BY priority, created_at   │
│  ├── UPDATE status='processing'                                         │
│  ├── Execute job (sync, compliance, report)                             │
│  ├── On Success: status='completed', result=data                        │
│  └── On Failure: attempts++, exponential backoff, retry ou failed       │
├─────────────────────────────────────────────────────────────────────────┤
│  Retry Logic (Exponential Backoff)                                      │
│  ├── Attempt 1: Retry após 1 minuto                                     │
│  ├── Attempt 2: Retry após 5 minutos                                    │
│  └── Attempt 3: Falha definitiva (status='failed')                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Criar Tabela job_queue

**Migration SQL:**
```sql
CREATE TABLE public.job_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Job definition
  job_type TEXT NOT NULL CHECK (job_type IN (
    'sync_integration', 
    'run_compliance_check', 
    'generate_report',
    'send_notification',
    'cleanup_data'
  )),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 
    'processing', 
    'completed', 
    'failed',
    'cancelled'
  )),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  
  -- Retry logic
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  result JSONB,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for queue processing
CREATE INDEX job_queue_pending_idx ON public.job_queue(status, priority DESC, scheduled_for ASC) 
  WHERE status = 'pending';
CREATE INDEX job_queue_org_id_idx ON public.job_queue(org_id);
CREATE INDEX job_queue_user_id_idx ON public.job_queue(user_id);
CREATE INDEX job_queue_job_type_idx ON public.job_queue(job_type);
CREATE INDEX job_queue_created_at_idx ON public.job_queue(created_at DESC);

-- RLS
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org jobs"
  ON public.job_queue FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can create jobs for their org"
  ON public.job_queue FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Service role can manage all jobs"
  ON public.job_queue FOR ALL
  USING (auth.role() = 'service_role');
```

---

### Fase 2: Edge Function process-job-queue

Esta Edge Function será chamada periodicamente (via cron externo ou manualmente) para processar jobs pendentes.

**Arquivo:** `supabase/functions/process-job-queue/index.ts`

```typescript
// Estrutura principal
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('ProcessJobQueue');

// Job handlers por tipo
const JOB_HANDLERS = {
  'sync_integration': handleSyncIntegration,
  'run_compliance_check': handleComplianceCheck,
  'generate_report': handleGenerateReport,
};

// Exponential backoff: 1min, 5min, 15min
const RETRY_DELAYS = [60, 300, 900]; // segundos

serve(async (req) => {
  // 1. Buscar jobs pendentes (batch de 5)
  // 2. Para cada job: marcar processing → executar → completed/retry
  // 3. Retornar resumo
});
```

---

### Fase 3: Helper Functions

**Função para calcular próximo retry:**
```sql
CREATE OR REPLACE FUNCTION public.calculate_next_retry(
  p_attempts INTEGER,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  delay_seconds INTEGER;
BEGIN
  IF p_attempts >= p_max_attempts THEN
    RETURN NULL; -- Não há mais retries
  END IF;
  
  -- Exponential backoff: 60s, 300s, 900s
  delay_seconds := POWER(5, p_attempts) * 60;
  RETURN now() + (delay_seconds || ' seconds')::interval;
END;
$$;
```

**Função para criar job:**
```sql
CREATE OR REPLACE FUNCTION public.enqueue_job(
  p_job_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_priority INTEGER DEFAULT 3,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job_id UUID;
  v_org_id UUID;
BEGIN
  -- Obter org_id do usuário
  SELECT org_id INTO v_org_id FROM profiles WHERE user_id = auth.uid();
  
  INSERT INTO job_queue (org_id, user_id, job_type, payload, priority, scheduled_for)
  VALUES (v_org_id, auth.uid(), p_job_type, p_payload, p_priority, p_scheduled_for)
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;
```

---

### Fase 4: Atualizar SyncIntegrationButton

**Antes (síncrono):**
```typescript
const { data, error } = await supabase.functions.invoke('sync-integration-data', {
  body: { provider }
});
```

**Depois (via fila):**
```typescript
const { data: job, error } = await supabase.rpc('enqueue_job', {
  p_job_type: 'sync_integration',
  p_payload: { provider, integration_id: integrationId },
  p_priority: 4 // Alta prioridade para ações manuais
});

if (job) {
  toast.info('Sincronização agendada', {
    description: 'O processamento iniciará em breve'
  });
}
```

---

### Fase 5: Hook useJobQueue

**Arquivo:** `src/hooks/useJobQueue.tsx`

```typescript
export interface Job {
  id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: Record<string, any>;
  result?: Record<string, any>;
  error_message?: string;
  attempts: number;
  created_at: string;
  completed_at?: string;
}

export function useJobQueue() {
  // Listar jobs do usuário/org
  const { data: jobs } = useQuery({ ... });
  
  // Criar novo job
  const createJob = useMutation({
    mutationFn: async (params: CreateJobParams) => {
      return await supabase.rpc('enqueue_job', params);
    }
  });
  
  // Cancelar job pendente
  const cancelJob = useMutation({ ... });
  
  // Polling para status de um job específico
  const useJobStatus = (jobId: string) => {
    return useQuery({
      queryKey: ['job-status', jobId],
      refetchInterval: (query) => 
        query.state.data?.status === 'pending' || 
        query.state.data?.status === 'processing' ? 2000 : false,
    });
  };
  
  return { jobs, createJob, cancelJob, useJobStatus };
}
```

---

### Fase 6: Componente JobStatusBadge

**Arquivo:** `src/components/jobs/JobStatusBadge.tsx`

```typescript
// Mostra status visual do job com ícone animado
// - pending: Clock icon (amarelo)
// - processing: Spinner (azul)
// - completed: Check (verde)
// - failed: X (vermelho)
```

---

### Fase 7: Painel de Jobs (opcional)

Adicionar uma seção em Settings ou Dashboard para visualizar jobs recentes:

```typescript
// src/components/jobs/JobQueuePanel.tsx
// - Lista de jobs com filtros (status, tipo)
// - Ação de cancelar jobs pendentes
// - Retry manual para jobs falhos
```

---

### Resumo de Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx_job_queue.sql` | Criar | Tabela + índices + RLS + funções |
| `supabase/functions/process-job-queue/index.ts` | Criar | Edge Function processadora |
| `src/hooks/useJobQueue.tsx` | Criar | Hook React para gerenciar jobs |
| `src/components/jobs/JobStatusBadge.tsx` | Criar | Componente visual de status |
| `src/components/jobs/JobQueuePanel.tsx` | Criar | Painel de visualização |
| `src/components/integrations/SyncIntegrationButton.tsx` | Modificar | Usar fila ao invés de chamada direta |
| `src/hooks/integrations/useAwsSync.tsx` | Modificar | Usar fila |
| `src/hooks/integrations/useAzureSync.tsx` | Modificar | Usar fila |
| `src/hooks/integrations/useGoogleSync.tsx` | Modificar | Usar fila |
| `src/hooks/integrations/useDatadogSync.tsx` | Modificar | Usar fila |
| `src/hooks/useOktaSync.tsx` | Modificar | Usar fila |
| `src/hooks/useAuth0Sync.tsx` | Modificar | Usar fila |
| `src/lib/query-keys.ts` | Modificar | Adicionar chaves para jobs |

---

### Fluxo de Processamento Detalhado

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. ENQUEUE                                                              │
│    User clica "Sincronizar"                                             │
│    └─> supabase.rpc('enqueue_job', {...})                               │
│        └─> INSERT job_queue (status='pending')                          │
│            └─> Return job_id                                            │
│                └─> Toast "Agendado!"                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. PROCESS (Edge Function - chamada via cron ou manual)                 │
│    SELECT * FROM job_queue                                              │
│    WHERE status = 'pending' AND scheduled_for <= now()                  │
│    ORDER BY priority DESC, created_at ASC                               │
│    LIMIT 5 FOR UPDATE SKIP LOCKED                                       │
│    └─> Para cada job:                                                   │
│        ├─> UPDATE status = 'processing', started_at = now()             │
│        ├─> Execute handler (sync/compliance/report)                     │
│        ├─> Success: status='completed', result={...}                    │
│        └─> Failure:                                                     │
│            ├─> attempts++                                               │
│            ├─> Se attempts < max: scheduled_for = backoff, status=pending│
│            └─> Se attempts >= max: status='failed', error_message       │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. NOTIFY (opcional)                                                    │
│    Quando job completa/falha:                                           │
│    └─> supabase.rpc('create_notification', {...})                       │
│        └─> User recebe alerta no NotificationCenter                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Considerações Técnicas

| Aspecto | Solução |
|---------|---------|
| **Concorrência** | `FOR UPDATE SKIP LOCKED` evita processamento duplicado |
| **Idempotência** | Jobs devem ser idempotentes (re-executar não causa problemas) |
| **Timeout** | Jobs com `started_at` > 15min sem `completed_at` = timeout → retry |
| **Ordem** | Priority DESC, then created_at ASC (FIFO dentro da mesma prioridade) |
| **Backoff** | 1min → 5min → 15min (exponencial) |
| **Cleanup** | Jobs completed/failed > 30 dias podem ser arquivados/deletados |
| **Rate Limit** | Processo max 5 jobs por execução para evitar timeout da Edge Function |

---

### Ordem de Implementação

1. Migration: Criar tabela `job_queue` com índices e RLS
2. Migration: Criar funções `enqueue_job` e `calculate_next_retry`
3. Edge Function: Criar `process-job-queue` com handlers
4. Hook: Criar `useJobQueue` com criação e polling
5. UI: Criar `JobStatusBadge` component
6. Refatorar: Atualizar `SyncIntegrationButton` para usar fila
7. Refatorar: Atualizar hooks de sync específicos
8. UI: Criar `JobQueuePanel` para Settings

