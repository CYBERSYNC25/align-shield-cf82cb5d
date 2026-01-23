
## Plano: Sistema de Logging Centralizado

### Objetivo
Implementar um sistema de logging centralizado que persiste logs de erros e eventos importantes no banco de dados, permitindo rastreamento, depuração e análise por administradores. O sistema captura logs do frontend (erros React, eventos manuais) e backend (Edge Functions) em uma tabela unificada.

---

### Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    CENTRALIZED LOGGING SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│  FRONTEND                                                               │
│  ├── ErrorBoundary (global)                                             │
│  │   └─> Captura erros React não tratados                               │
│  │       └─> Envia via Edge Function                                    │
│  ├── useErrorLogger hook                                                │
│  │   └─> logError(), logWarning(), logInfo(), logDebug()                │
│  │       └─> Batching + debounce para eficiência                        │
│  └── window.onerror + unhandledrejection                                │
│      └─> Captura erros globais JS                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  BACKEND (Edge Functions)                                               │
│  ├── EdgeLogger (existente)                                             │
│  │   └─> Modificado para persistir em system_logs                       │
│  └─> Logs estruturados com contexto                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Edge Function: log-event                                               │
│  ├── POST /log-event                                                    │
│  │   └─> Recebe: { level, source, message, metadata, stack_trace }      │
│  │       └─> INSERT INTO system_logs                                    │
│  └── Validação + Rate limiting                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  system_logs (tabela)                                                   │
│  ├── id (UUID)                                                          │
│  ├── org_id → organizations.id                                          │
│  ├── level (debug, info, warn, error, critical)                         │
│  ├── source (frontend, edge_function, webhook, scheduled_job)           │
│  ├── message (TEXT)                                                     │
│  ├── metadata (JSONB) - contexto, browser, versão, etc.                 │
│  ├── stack_trace (TEXT)                                                 │
│  ├── user_id → auth.users                                               │
│  └── created_at                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Admin UI: /settings (tab "Logs do Sistema")                            │
│  ├── Filtros: level, source, data range                                 │
│  ├── Busca por mensagem/metadata                                        │
│  ├── Visualização de stack trace                                        │
│  └── Exportação CSV/JSON                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Criar Tabela system_logs

**Migration SQL:**
```sql
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Log classification
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  source TEXT NOT NULL CHECK (source IN ('frontend', 'edge_function', 'webhook', 'scheduled_job', 'database')),
  
  -- Content
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  stack_trace TEXT,
  
  -- Context
  function_name TEXT,
  component_name TEXT,
  request_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX system_logs_org_id_idx ON public.system_logs(org_id);
CREATE INDEX system_logs_level_idx ON public.system_logs(level);
CREATE INDEX system_logs_source_idx ON public.system_logs(source);
CREATE INDEX system_logs_created_at_idx ON public.system_logs(created_at DESC);
CREATE INDEX system_logs_user_id_idx ON public.system_logs(user_id);

-- Composite index for common admin queries
CREATE INDEX system_logs_org_level_created_idx 
  ON public.system_logs(org_id, level, created_at DESC);

-- RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view org logs"
  ON public.system_logs FOR SELECT
  USING (
    org_id = get_user_org_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'master_admin')
    )
  );

-- Service role can insert (for Edge Functions)
CREATE POLICY "Service role can insert logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can insert their own logs
CREATE POLICY "Users can insert their own logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND org_id = get_user_org_id(auth.uid())
  );

-- No UPDATE or DELETE (logs are immutable)
```

---

### Fase 2: Edge Function log-event

**Arquivo:** `supabase/functions/log-event/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogEventPayload {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  source: 'frontend' | 'edge_function' | 'webhook' | 'scheduled_job';
  message: string;
  metadata?: Record<string, unknown>;
  stack_trace?: string;
  function_name?: string;
  component_name?: string;
  request_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload: LogEventPayload = await req.json();

    // Extract user from JWT if present
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let orgId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        // Get org_id from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('user_id', user.id)
          .single();
        orgId = profile?.org_id || null;
      }
    }

    // Insert log
    const { error } = await supabase
      .from('system_logs')
      .insert({
        org_id: orgId,
        user_id: userId,
        level: payload.level,
        source: payload.source,
        message: payload.message,
        metadata: payload.metadata || {},
        stack_trace: payload.stack_trace,
        function_name: payload.function_name,
        component_name: payload.component_name,
        request_id: payload.request_id,
      });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error logging event:', error);
    return new Response(JSON.stringify({ error: 'Failed to log event' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

### Fase 3: Atualizar Logger Frontend

**Arquivo modificado:** `src/lib/logger.ts`

Adicionar capacidade de enviar logs para o backend:

```typescript
// Adicionar método para persistir logs críticos
async persistError(message: string, error?: Error, metadata?: LogContext): Promise<void> {
  try {
    await supabase.functions.invoke('log-event', {
      body: {
        level: 'error',
        source: 'frontend',
        message,
        metadata: { ...metadata, module: this.context },
        stack_trace: error?.stack,
        component_name: this.context,
      }
    });
  } catch (e) {
    console.error('Failed to persist log:', e);
  }
}
```

---

### Fase 4: Hook useErrorLogger

**Arquivo:** `src/hooks/useErrorLogger.tsx`

```typescript
export interface ErrorLogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

export function useErrorLogger(componentName?: string) {
  const { user } = useAuth();
  
  const logError = useCallback(async (
    message: string,
    error?: Error,
    context?: ErrorLogContext
  ) => {
    // Log to console
    console.error(`[${componentName}]`, message, error);
    
    // Persist to backend
    try {
      await supabase.functions.invoke('log-event', {
        body: {
          level: 'error',
          source: 'frontend',
          message,
          stack_trace: error?.stack,
          component_name: componentName,
          metadata: {
            ...context,
            url: window.location.href,
            userAgent: navigator.userAgent,
          }
        }
      });
    } catch (e) {
      console.error('Failed to persist error log:', e);
    }
  }, [componentName, user]);

  const logWarning = useCallback(async (
    message: string,
    context?: ErrorLogContext
  ) => { /* similar */ }, [componentName]);

  const logInfo = useCallback(async (
    message: string,
    context?: ErrorLogContext
  ) => { /* similar */ }, [componentName]);

  return { logError, logWarning, logInfo };
}
```

---

### Fase 5: Atualizar ErrorBoundary

**Arquivo modificado:** `src/components/common/ErrorBoundary.tsx`

Adicionar envio de erros para o backend:

```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  // Existing console logging...
  
  // NEW: Persist to backend
  this.persistErrorToBackend(error, errorInfo);
}

private async persistErrorToBackend(error: Error, errorInfo: ErrorInfo) {
  try {
    await supabase.functions.invoke('log-event', {
      body: {
        level: 'critical',
        source: 'frontend',
        message: `React Error Boundary: ${error.message}`,
        stack_trace: error.stack,
        component_name: 'ErrorBoundary',
        metadata: {
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }
      }
    });
  } catch (e) {
    console.error('Failed to persist error to backend:', e);
  }
}
```

---

### Fase 6: Global Error Handlers

**Arquivo:** `src/lib/global-error-handler.ts`

```typescript
export function setupGlobalErrorHandlers() {
  // Captura erros JS não tratados
  window.onerror = (message, source, lineno, colno, error) => {
    supabase.functions.invoke('log-event', {
      body: {
        level: 'error',
        source: 'frontend',
        message: String(message),
        stack_trace: error?.stack,
        metadata: {
          source,
          lineno,
          colno,
          url: window.location.href,
        }
      }
    });
  };

  // Captura Promise rejections não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    supabase.functions.invoke('log-event', {
      body: {
        level: 'error',
        source: 'frontend',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack_trace: event.reason?.stack,
        metadata: {
          url: window.location.href,
        }
      }
    });
  });
}
```

Chamar em `src/main.tsx`:
```typescript
import { setupGlobalErrorHandlers } from '@/lib/global-error-handler';
setupGlobalErrorHandlers();
```

---

### Fase 7: Hook useSystemLogs (Admin)

**Arquivo:** `src/hooks/useSystemLogs.tsx`

```typescript
export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  source: 'frontend' | 'edge_function' | 'webhook' | 'scheduled_job';
  message: string;
  metadata: Record<string, unknown>;
  stack_trace: string | null;
  component_name: string | null;
  function_name: string | null;
  user_id: string | null;
  created_at: string;
}

export interface LogFilters {
  level?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export function useSystemLogs(filters: LogFilters = {}) {
  // Query with filters
  // Pagination support
  // Real-time updates option
  // Export functionality
}
```

---

### Fase 8: UI - Tab "Logs do Sistema" em Settings

**Arquivo:** `src/components/settings/SystemLogsViewer.tsx`

Layout proposto:
- Filtros no topo (level, source, date range)
- Search bar para busca em message/metadata
- Tabela com logs paginados
- Modal para ver detalhes (stack trace completo)
- Botão de export (CSV/JSON)
- Badge colorido por level (debug=gray, info=blue, warn=yellow, error=red, critical=purple)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ LOGS DO SISTEMA                                              [Exportar]│
├─────────────────────────────────────────────────────────────────────────┤
│ [Level ▼]  [Source ▼]  [Data Início]  [Data Fim]  [🔍 Buscar...]       │
├─────────────────────────────────────────────────────────────────────────┤
│ LEVEL    SOURCE        MESSAGE                  COMPONENT   CREATED_AT │
│ ──────   ──────        ───────                  ─────────   ────────── │
│ [ERROR]  frontend      React Error Boundary...  ErrorBound  5 min ago  │
│ [WARN]   edge_func     Rate limit approaching   sync-aws    10 min ago │
│ [INFO]   frontend      User completed action    Dashboard   15 min ago │
│ [CRIT]   webhook       Payment failed           stripe-wh   1 hour ago │
├─────────────────────────────────────────────────────────────────────────┤
│ < 1 2 3 ... 10 >                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 9: Adicionar Tab em Settings

**Arquivo modificado:** `src/pages/Settings.tsx`

```typescript
// Adicionar nova tab
<TabsTrigger value="system-logs" className="gap-1">
  <Terminal className="w-4 h-4" />
  Logs do Sistema
</TabsTrigger>

// Conteúdo da tab
<TabsContent value="system-logs">
  <SystemLogsViewer />
</TabsContent>
```

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx_system_logs.sql` | Criar | Tabela + índices + RLS |
| `supabase/functions/log-event/index.ts` | Criar | Edge Function para receber logs |
| `src/lib/logger.ts` | Modificar | Adicionar persistência para erros |
| `src/lib/global-error-handler.ts` | Criar | Handlers globais window.onerror |
| `src/hooks/useErrorLogger.tsx` | Criar | Hook para logging em componentes |
| `src/hooks/useSystemLogs.tsx` | Criar | Hook para consultar logs (admin) |
| `src/components/common/ErrorBoundary.tsx` | Modificar | Enviar erros para backend |
| `src/components/settings/SystemLogsViewer.tsx` | Criar | UI de visualização de logs |
| `src/pages/Settings.tsx` | Modificar | Adicionar tab "Logs do Sistema" |
| `src/main.tsx` | Modificar | Inicializar global error handlers |
| `src/lib/query-keys.ts` | Modificar | Adicionar chaves para system-logs |

---

### Fluxo de Erro Completo

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. ERRO OCORRE                                                          │
│    ├── React Component Error → ErrorBoundary.componentDidCatch()        │
│    ├── JS Runtime Error → window.onerror                                │
│    └── Promise Rejection → unhandledrejection                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. CAPTURA                                                              │
│    ├── Log no console (desenvolvimento)                                 │
│    └── Prepara payload: { level, source, message, stack_trace, ... }    │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. ENVIO                                                                │
│    └── supabase.functions.invoke('log-event', { body: payload })        │
│        ├── Inclui auth token automaticamente                            │
│        └── Edge Function extrai user_id e org_id                        │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. PERSISTÊNCIA                                                         │
│    └── INSERT INTO system_logs                                          │
│        └── Disponível para admins via RLS                               │
├─────────────────────────────────────────────────────────────────────────┤
│ 5. VISUALIZAÇÃO                                                         │
│    └── Admin acessa Settings → Logs do Sistema                          │
│        ├── Filtra por level, source, data                               │
│        ├── Busca por texto                                              │
│        └── Exporta para análise                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Considerações Técnicas

| Aspecto | Solução |
|---------|---------|
| **Performance** | Logs são enviados assincronamente, não bloqueiam UI |
| **Rate Limiting** | Edge Function pode implementar limite por IP/user |
| **Retenção** | Considerar job periódico para limpar logs > 90 dias |
| **Privacidade** | Não logar dados sensíveis (senhas, tokens) |
| **RLS** | Apenas admins podem ver logs; logs são imutáveis |
| **Batching** | useErrorLogger pode agrupar logs em batch para reduzir requests |
| **Fallback** | Se Edge Function falhar, log apenas no console |

---

### Diferença entre Tabelas Existentes

| Tabela | Propósito |
|--------|-----------|
| `audit_logs` | Ações de usuário (CRUD em recursos) |
| `system_audit_logs` | Eventos de compliance/segurança |
| `system_logs` (NOVA) | Erros técnicos e debugging |

---

### Ordem de Implementação

1. Migration: Criar tabela `system_logs`
2. Edge Function: Criar `log-event`
3. Global Handlers: Criar `global-error-handler.ts`
4. Atualizar `main.tsx` para inicializar handlers
5. Atualizar `ErrorBoundary` para persistir erros
6. Criar hook `useErrorLogger`
7. Criar hook `useSystemLogs`
8. Criar componente `SystemLogsViewer`
9. Adicionar tab em Settings
10. Atualizar `query-keys.ts`
