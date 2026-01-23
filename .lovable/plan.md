

## Plano: Sistema de Tracking de Eventos para Product Analytics

### Objetivo
Implementar um sistema completo de rastreamento de eventos para analytics de produto, incluindo tabela de eventos, hook `useAnalytics`, instrumentacao automatica de eventos-chave e dashboard de analytics exclusivo para admins.

---

### Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND - Instrumentacao de Eventos                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  useAnalytics() hook                                                        │
│  ├── track('page_viewed', { path: '/dashboard' })                           │
│  ├── track('integration_connected', { type: 'aws' })                        │
│  ├── track('compliance_scan_completed', { score: 87 })                      │
│  └── ... outros eventos                                                     │
│                                                                             │
│  Componentes instrumentados:                                                │
│  ├── ProtectedRoute → page_viewed                                           │
│  ├── useIntegrations → integration_connected                                │
│  ├── useComplianceStatus → compliance_scan_started/completed                │
│  ├── IssueDetailsSheet → issue_viewed, issue_remediated                     │
│  ├── ReportsExports → report_exported                                       │
│  └── UserRolesManagement → user_invited                                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ DATABASE                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ analytics_events                                                   │     │
│  │ ─────────────────────────────────────────────────────────────────  │     │
│  │ id (PK)    │ org_id    │ user_id    │ event_name                   │     │
│  │ properties (JSONB)     │ session_id │ created_at                   │     │
│  │ ─────────────────────────────────────────────────────────────────  │     │
│  │ uuid       │ uuid      │ uuid       │ 'page_viewed'                │     │
│  │ {path: '/dashboard'}   │ 'sess_123' │ 2026-01-23T10:00:00          │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Views SQL para metricas agregadas:                                         │
│  ├── daily_active_users (DAU)                                               │
│  ├── weekly_active_users (WAU)                                              │
│  ├── monthly_active_users (MAU)                                             │
│  └── integration_connection_stats                                           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ SETTINGS/ANALYTICS - Dashboard (admin only)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Usuarios Ativos            Integracoes Populares                     │   │
│  │ ┌──────────────────┐       ┌──────────────────────┐                  │   │
│  │ │ DAU: 45          │       │ GitHub     ████  32  │                  │   │
│  │ │ WAU: 187         │       │ AWS        ███   24  │                  │   │
│  │ │ MAU: 412         │       │ Slack      ██    18  │                  │   │
│  │ └──────────────────┘       └──────────────────────┘                  │   │
│  │                                                                      │   │
│  │ Taxa de Remediacao         Tempo ate 1o Scan                         │   │
│  │ ┌──────────────────┐       ┌──────────────────────┐                  │   │
│  │ │ 78% resolvidos   │       │ Media: 2.3 horas     │                  │   │
│  │ │ MTTR: 18h        │       │ Mediana: 45 min      │                  │   │
│  │ └──────────────────┘       └──────────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Migracao de Banco de Dados

Criar tabela `analytics_events` e funcoes auxiliares:

**Estrutura da tabela:**
```sql
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Indices para performance
  CONSTRAINT valid_event_name CHECK (event_name <> '')
);

-- Indices para queries frequentes
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_org_id ON analytics_events(org_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- Indice composto para queries de dashboard
CREATE INDEX idx_analytics_events_org_date 
  ON analytics_events(org_id, created_at DESC);
```

**RLS Policies:**
```sql
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Usuarios podem inserir seus proprios eventos
CREATE POLICY "Users can insert own events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos os eventos da org
CREATE POLICY "Admins can view org events"
  ON analytics_events FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'master_admin')
  );

-- Service role para batch inserts
CREATE POLICY "Service role full access"
  ON analytics_events FOR ALL
  USING (auth.role() = 'service_role');
```

**Funcoes SQL para metricas:**
```sql
-- Funcao para calcular DAU/WAU/MAU
CREATE OR REPLACE FUNCTION get_active_users_metrics(p_org_id UUID)
RETURNS TABLE(dau BIGINT, wau BIGINT, mau BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT CASE 
      WHEN created_at >= CURRENT_DATE THEN user_id 
    END) as dau,
    COUNT(DISTINCT CASE 
      WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN user_id 
    END) as wau,
    COUNT(DISTINCT CASE 
      WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN user_id 
    END) as mau
  FROM analytics_events
  WHERE org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para integracoes mais conectadas
CREATE OR REPLACE FUNCTION get_top_integrations(p_org_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE(integration_type TEXT, connection_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    properties->>'type' as integration_type,
    COUNT(*) as connection_count
  FROM analytics_events
  WHERE org_id = p_org_id 
    AND event_name = 'integration_connected'
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY properties->>'type'
  ORDER BY connection_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para taxa de remediacao
CREATE OR REPLACE FUNCTION get_remediation_rate(p_org_id UUID)
RETURNS TABLE(
  total_issues BIGINT, 
  remediated_issues BIGINT, 
  remediation_rate NUMERIC,
  avg_time_to_remediate_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH issue_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE event_name = 'issue_viewed') as viewed,
      COUNT(*) FILTER (WHERE event_name = 'issue_remediated') as remediated
    FROM analytics_events
    WHERE org_id = p_org_id
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  ),
  mttr AS (
    SELECT AVG(time_to_resolve_hours) as avg_mttr
    FROM compliance_alerts
    WHERE org_id = p_org_id
      AND resolved = true
      AND resolved_at >= CURRENT_DATE - INTERVAL '30 days'
  )
  SELECT 
    issue_stats.viewed as total_issues,
    issue_stats.remediated as remediated_issues,
    CASE WHEN issue_stats.viewed > 0 
      THEN ROUND((issue_stats.remediated::numeric / issue_stats.viewed) * 100, 1)
      ELSE 0 
    END as remediation_rate,
    COALESCE(mttr.avg_mttr, 0) as avg_time_to_remediate_hours
  FROM issue_stats, mttr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para tempo ate primeiro scan
CREATE OR REPLACE FUNCTION get_time_to_first_scan(p_org_id UUID)
RETURNS TABLE(
  avg_hours NUMERIC,
  median_hours NUMERIC,
  users_scanned BIGINT,
  users_total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH first_scans AS (
    SELECT 
      ae.user_id,
      MIN(ae.created_at) as first_scan_at,
      p.created_at as user_created_at
    FROM analytics_events ae
    JOIN profiles p ON ae.user_id = p.user_id
    WHERE ae.org_id = p_org_id
      AND ae.event_name = 'compliance_scan_completed'
    GROUP BY ae.user_id, p.created_at
  ),
  time_diffs AS (
    SELECT 
      EXTRACT(EPOCH FROM (first_scan_at - user_created_at)) / 3600 as hours_to_scan
    FROM first_scans
  ),
  user_counts AS (
    SELECT COUNT(DISTINCT user_id) as total
    FROM profiles
    WHERE org_id = p_org_id
  )
  SELECT
    COALESCE(ROUND(AVG(hours_to_scan)::numeric, 1), 0) as avg_hours,
    COALESCE(ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hours_to_scan)::numeric, 1), 0) as median_hours,
    COUNT(*) as users_scanned,
    (SELECT total FROM user_counts) as users_total
  FROM time_diffs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Fase 2: Hook useAnalytics

Criar hook React para tracking de eventos:

**Arquivo:** `src/hooks/useAnalytics.tsx`

```typescript
interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, unknown>;
}

interface UseAnalyticsReturn {
  track: (eventName: string, properties?: Record<string, unknown>) => void;
  trackAsync: (eventName: string, properties?: Record<string, unknown>) => Promise<void>;
  identify: (traits?: Record<string, unknown>) => void;
  sessionId: string;
}

// Eventos validos para type safety
type EventName = 
  | 'page_viewed'
  | 'integration_connected'
  | 'compliance_scan_started'
  | 'compliance_scan_completed'
  | 'issue_viewed'
  | 'issue_remediated'
  | 'report_exported'
  | 'user_invited';

interface PageViewedProperties {
  path: string;
  title?: string;
  referrer?: string;
}

interface IntegrationConnectedProperties {
  type: string;
  name?: string;
}

interface ComplianceScanProperties {
  score?: number;
  passing?: number;
  failing?: number;
  duration_ms?: number;
}

interface IssueProperties {
  issue_id: string;
  severity: string;
  rule_id?: string;
  integration?: string;
}

interface ReportExportedProperties {
  report_type: string;
  format?: string;
  filters?: Record<string, unknown>;
}

interface UserInvitedProperties {
  role: string;
  email_domain?: string;
}
```

**Funcionalidades:**
- Gera `session_id` unico por sessao do browser
- Batching de eventos para reduzir chamadas de API
- Fallback para localStorage se offline
- Type-safe event properties
- Auto-flush ao fechar pagina

**Implementacao:**
```typescript
export function useAnalytics(): UseAnalyticsReturn {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const queueRef = useRef<AnalyticsEvent[]>([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Flush events to database
  const flushEvents = useCallback(async () => {
    if (queueRef.current.length === 0 || !user?.id) return;

    const events = queueRef.current.splice(0, 50); // Max 50 per batch
    
    try {
      // Get org_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      // Insert batch
      await supabase.from('analytics_events').insert(
        events.map(e => ({
          user_id: user.id,
          org_id: profile?.org_id,
          event_name: e.eventName,
          properties: e.properties || {},
          session_id: sessionIdRef.current,
        }))
      );
    } catch (error) {
      // Re-queue failed events
      queueRef.current.unshift(...events);
      console.error('[Analytics] Flush failed:', error);
    }
  }, [user?.id]);

  // Track event (non-blocking)
  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    queueRef.current.push({ eventName, properties });
    
    // Debounced flush
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    flushTimeoutRef.current = setTimeout(flushEvents, 1000);
    
    // Immediate flush if queue is large
    if (queueRef.current.length >= 10) {
      flushEvents();
    }
  }, [flushEvents]);

  // Track event (blocking, returns Promise)
  const trackAsync = useCallback(async (
    eventName: string, 
    properties?: Record<string, unknown>
  ) => {
    track(eventName, properties);
    await flushEvents();
  }, [track, flushEvents]);

  // Flush on unmount/page close
  useEffect(() => {
    const handleBeforeUnload = () => flushEvents();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushEvents();
    };
  }, [flushEvents]);

  return {
    track,
    trackAsync,
    identify: () => {}, // Future: update user traits
    sessionId: sessionIdRef.current,
  };
}
```

---

### Fase 3: Instrumentacao de Eventos

**Eventos a rastrear:**

| Evento | Componente/Hook | Properties |
|--------|-----------------|------------|
| `page_viewed` | `ProtectedRoute.tsx` | `{ path, title, referrer }` |
| `integration_connected` | `useIntegrations.tsx` | `{ type, name }` |
| `compliance_scan_started` | `useComplianceStatus.tsx` | `{}` |
| `compliance_scan_completed` | `useComplianceStatus.tsx` | `{ score, passing, failing }` |
| `issue_viewed` | `IssueDetailsSheet.tsx` | `{ issue_id, severity, rule_id }` |
| `issue_remediated` | `ActionCenter.tsx` | `{ issue_id, severity, action }` |
| `report_exported` | `ReportsExports.tsx` | `{ report_type, format }` |
| `user_invited` | `UserRolesManagement.tsx` | `{ role }` |

**Exemplo de instrumentacao em ProtectedRoute:**
```typescript
// Em ProtectedRoute.tsx
const { track } = useAnalytics();
const location = useLocation();

useEffect(() => {
  if (user && !onboardingLoading) {
    track('page_viewed', { 
      path: location.pathname,
      referrer: document.referrer 
    });
  }
}, [location.pathname, user, track]);
```

**Exemplo em useIntegrations:**
```typescript
// Em useIntegrations.tsx
const { track } = useAnalytics();

const connectIntegration = (integration, credentials, userName) => {
  // ... logica existente ...
  
  track('integration_connected', {
    type: integration.id,
    name: integration.name,
  });
  
  return newIntegration;
};
```

---

### Fase 4: Dashboard de Analytics (Admin Only)

**Criar nova tab em Settings:**

Adicionar tab "Analytics" ao TabsList em Settings.tsx:

```typescript
<TabsTrigger value="analytics" className="gap-1">
  <BarChart3 className="w-4 h-4" />
  Analytics
</TabsTrigger>
```

**Criar componente ProductAnalyticsDashboard:**

**Arquivo:** `src/components/settings/ProductAnalyticsDashboard.tsx`

```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: { value: number; isPositive: boolean };
  icon: React.ReactNode;
}

export default function ProductAnalyticsDashboard() {
  const { isAdmin, isMasterAdmin } = useUserRoles();
  
  // Verificar permissao
  if (!isAdmin() && !isMasterAdmin()) {
    return <AccessDenied />;
  }

  // Hooks para dados
  const { data: activeUsers } = useActiveUsersMetrics();
  const { data: topIntegrations } = useTopIntegrations();
  const { data: remediationRate } = useRemediationRate();
  const { data: timeToFirstScan } = useTimeToFirstScan();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Product Analytics</h2>
        <p className="text-muted-foreground">
          Metricas de uso e engajamento da plataforma
        </p>
      </div>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title="DAU" value={activeUsers?.dau || 0} icon={<Activity />} />
            <MetricCard title="WAU" value={activeUsers?.wau || 0} icon={<Activity />} />
            <MetricCard title="MAU" value={activeUsers?.mau || 0} icon={<Activity />} />
          </div>
        </CardContent>
      </Card>

      {/* Top Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            Integracoes Mais Conectadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topIntegrations?.map((int, i) => (
              <div key={int.integration_type} className="flex items-center gap-3">
                <span className="text-muted-foreground w-6">{i + 1}.</span>
                <span className="flex-1 font-medium">{int.integration_type}</span>
                <Progress value={(int.connection_count / topIntegrations[0].connection_count) * 100} className="w-32" />
                <span className="text-sm text-muted-foreground w-8">{int.connection_count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remediation Rate */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Taxa de Remediacao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {remediationRate?.remediation_rate || 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {remediationRate?.remediated_issues} de {remediationRate?.total_issues} issues remediadas
            </p>
            <Separator className="my-4" />
            <div className="text-sm">
              <span className="text-muted-foreground">MTTR: </span>
              <span className="font-medium">{remediationRate?.avg_time_to_remediate_hours || 0}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tempo ate Primeiro Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {timeToFirstScan?.avg_hours || 0}h
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Media de tempo apos registro
            </p>
            <Separator className="my-4" />
            <div className="text-sm">
              <span className="text-muted-foreground">Mediana: </span>
              <span className="font-medium">{timeToFirstScan?.median_hours || 0}h</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-muted-foreground">Usuarios com scan: </span>
              <span className="font-medium">
                {timeToFirstScan?.users_scanned}/{timeToFirstScan?.users_total}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### Fase 5: Hooks para Metricas do Dashboard

**Arquivo:** `src/hooks/useProductAnalytics.tsx`

```typescript
// Hook para usuarios ativos
export function useActiveUsersMetrics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['product-analytics', 'active-users', user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user!.id)
        .single();
        
      const { data, error } = await supabase
        .rpc('get_active_users_metrics', { p_org_id: profile?.org_id });
      
      if (error) throw error;
      return data[0];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// Hook para integracoes populares
export function useTopIntegrations() {
  // Similar pattern...
}

// Hook para taxa de remediacao
export function useRemediationRate() {
  // Similar pattern...
}

// Hook para tempo ate primeiro scan
export function useTimeToFirstScan() {
  // Similar pattern...
}
```

---

### Estrutura de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/migrations/xxx_analytics_events.sql` | Criar | Tabela e funcoes SQL |
| `src/hooks/useAnalytics.tsx` | Criar | Hook de tracking |
| `src/hooks/useProductAnalytics.tsx` | Criar | Hooks para metricas |
| `src/components/settings/ProductAnalyticsDashboard.tsx` | Criar | Dashboard admin |
| `src/components/auth/ProtectedRoute.tsx` | Modificar | Adicionar page_viewed |
| `src/hooks/useIntegrations.tsx` | Modificar | Adicionar integration_connected |
| `src/hooks/useComplianceStatus.tsx` | Modificar | Adicionar scan events |
| `src/components/dashboard/IssueDetailsSheet.tsx` | Modificar | Adicionar issue_viewed |
| `src/components/dashboard/ActionCenter.tsx` | Modificar | Adicionar issue_remediated |
| `src/pages/ReportsExports.tsx` | Modificar | Adicionar report_exported |
| `src/components/settings/UserRolesManagement.tsx` | Modificar | Adicionar user_invited |
| `src/pages/Settings.tsx` | Modificar | Adicionar tab Analytics |

---

### Consideracoes Tecnicas

| Aspecto | Implementacao |
|---------|---------------|
| **Performance** | Batching de eventos, debounce de 1s, max 50 por batch |
| **Offline** | Fallback para localStorage, sync quando online |
| **Privacidade** | Sem PII em properties, apenas IDs e metricas |
| **RLS** | Usuarios inserem proprios eventos, admins veem org |
| **Retencao** | Manter 90 dias por padrao (pode adicionar cron de limpeza) |
| **Type Safety** | Event types definidos para autocompletion |
| **Session** | UUID gerado por tab, persiste em sessionStorage |

---

### Eventos Detalhados

| Evento | Quando | Properties |
|--------|--------|------------|
| `page_viewed` | Cada navegacao | `{ path, title, referrer }` |
| `integration_connected` | Apos conexao bem-sucedida | `{ type: 'aws', name: 'AWS' }` |
| `compliance_scan_started` | Inicio de check manual | `{}` |
| `compliance_scan_completed` | Fim de check | `{ score: 87, passing: 45, failing: 8 }` |
| `issue_viewed` | Abrir detalhes de issue | `{ issue_id, severity, rule_id, integration }` |
| `issue_remediated` | Marcar como resolvido/aceito | `{ issue_id, severity, action: 'resolved' }` |
| `report_exported` | Download de relatorio | `{ report_type: 'compliance', format: 'pdf' }` |
| `user_invited` | Convite enviado | `{ role: 'viewer' }` |

---

### Ordem de Implementacao

1. Criar migracao com tabela e funcoes SQL
2. Criar hook `useAnalytics`
3. Criar hooks de metricas `useProductAnalytics`
4. Criar componente `ProductAnalyticsDashboard`
5. Adicionar tab Analytics em Settings
6. Instrumentar `page_viewed` em ProtectedRoute
7. Instrumentar `integration_connected` em useIntegrations
8. Instrumentar eventos de compliance scan
9. Instrumentar eventos de issues
10. Instrumentar `report_exported` e `user_invited`
11. Testar dashboard com dados reais

