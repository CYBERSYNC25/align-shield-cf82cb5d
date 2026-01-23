
## Plano: Sistema de Cache para Otimização do Dashboard

### Objetivo
Implementar caching no nível de banco de dados para melhorar a performance do dashboard, reduzindo consultas repetitivas e agregando dados pré-computados com invalidação automática.

---

### Arquitetura do Sistema de Cache

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND - Dashboard                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  useCachedComplianceScore()    useCachedIssuesBySerity()                    │
│         │                              │                                    │
│         └──────────────┬───────────────┘                                    │
│                        ▼                                                    │
│              useCacheStore() hook                                           │
│         ┌─────────────┴─────────────┐                                       │
│         ▼                           ▼                                       │
│   get_cache(key)             set_cache(key, val, ttl)                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ DATABASE                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ cache_store                                                        │     │
│  │ ─────────────────────────────────────────────────────────────────  │     │
│  │ key (PK)          │ value (JSONB)  │ expires_at   │ created_at    │     │
│  │ ─────────────────────────────────────────────────────────────────  │     │
│  │ compliance_score:user123   │ {score: 87...}  │ +5min    │ now()   │     │
│  │ issues_by_severity:user123 │ {critical:2...} │ +2min    │ now()   │     │
│  │ collected_resources:user123│ [{...}]         │ +10min   │ now()   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Funções SQL:                                                               │
│  ├── set_cache(key, value, ttl_seconds)                                     │
│  ├── get_cache(key) → JSONB ou NULL se expirado                             │
│  └── invalidate_cache(key_pattern) → LIKE pattern matching                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRIGGERS DE INVALIDAÇÃO                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  integration_collected_data  ──► invalidate: collected_resources:*          │
│  compliance_alerts           ──► invalidate: compliance_score:*             │
│                                  invalidate: issues_by_severity:*           │
│  integration_status          ──► invalidate: collected_resources:*          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Migração de Banco de Dados

Criar tabela `cache_store` e funções auxiliares:

**Estrutura da tabela:**
```sql
CREATE TABLE cache_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID,  -- Para filtro por usuário (RLS)
  org_id UUID    -- Para filtro por organização
);

-- Índices para performance
CREATE INDEX idx_cache_store_expires_at ON cache_store(expires_at);
CREATE INDEX idx_cache_store_user_id ON cache_store(user_id);
CREATE INDEX idx_cache_store_key_pattern ON cache_store(key text_pattern_ops);
```

**Função set_cache:**
```sql
CREATE OR REPLACE FUNCTION set_cache(
  p_key TEXT,
  p_value JSONB,
  p_ttl_seconds INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_org_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO cache_store (key, value, expires_at, user_id, org_id)
  VALUES (
    p_key, 
    p_value, 
    now() + (p_ttl_seconds || ' seconds')::INTERVAL,
    p_user_id,
    p_org_id
  )
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    expires_at = EXCLUDED.expires_at,
    created_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Função get_cache:**
```sql
CREATE OR REPLACE FUNCTION get_cache(p_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT value INTO v_result
  FROM cache_store
  WHERE key = p_key AND expires_at > now();
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Função invalidate_cache:**
```sql
CREATE OR REPLACE FUNCTION invalidate_cache(p_key_pattern TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM cache_store 
  WHERE key LIKE p_key_pattern;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Fase 2: Triggers de Invalidação Automática

**Trigger para integration_collected_data:**
```sql
CREATE OR REPLACE FUNCTION invalidate_cache_on_collected_data_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidar cache de recursos coletados do usuário
  PERFORM invalidate_cache('collected_resources:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
  
  -- Também invalidar score pois pode ter mudado
  PERFORM invalidate_cache('compliance_score:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
  PERFORM invalidate_cache('issues_by_severity:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invalidate_cache_collected_data
AFTER INSERT OR UPDATE OR DELETE ON integration_collected_data
FOR EACH ROW EXECUTE FUNCTION invalidate_cache_on_collected_data_change();
```

**Trigger para compliance_alerts:**
```sql
CREATE OR REPLACE FUNCTION invalidate_cache_on_alert_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidar caches de compliance
  PERFORM invalidate_cache('compliance_score:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
  PERFORM invalidate_cache('issues_by_severity:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invalidate_cache_alerts
AFTER INSERT OR UPDATE ON compliance_alerts
FOR EACH ROW EXECUTE FUNCTION invalidate_cache_on_alert_change();
```

**Trigger para integration_status (sync):**
```sql
CREATE OR REPLACE FUNCTION invalidate_cache_on_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma integração sincroniza, invalidar todos os caches do usuário
  IF NEW.last_sync_at IS DISTINCT FROM OLD.last_sync_at THEN
    PERFORM invalidate_cache('collected_resources:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
    PERFORM invalidate_cache('compliance_score:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
    PERFORM invalidate_cache('issues_by_severity:' || COALESCE(NEW.user_id, OLD.user_id)::TEXT || '%');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invalidate_cache_on_sync
AFTER UPDATE ON integration_status
FOR EACH ROW EXECUTE FUNCTION invalidate_cache_on_sync();
```

**Job de limpeza automática (cron):**
```sql
-- Limpar entradas expiradas a cada hora
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM cache_store WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
```

---

### Fase 3: Hook useCacheStore

Criar hook React para interagir com o cache:

**Arquivo:** `src/hooks/useCacheStore.tsx`

```typescript
interface CacheOptions {
  ttlSeconds: number;
  bypassCache?: boolean;
}

interface UseCacheStoreReturn {
  getCache: <T>(key: string) => Promise<T | null>;
  setCache: <T>(key: string, value: T, ttlSeconds: number) => Promise<void>;
  invalidateCache: (keyPattern: string) => Promise<number>;
}
```

**Funcionalidades:**
- `getCache<T>(key)`: Busca valor do cache, retorna `null` se expirado/não existir
- `setCache<T>(key, value, ttl)`: Salva valor com TTL em segundos
- `invalidateCache(pattern)`: Invalida chaves que correspondem ao pattern

---

### Fase 4: Hooks de Cache Específicos

**1. useCachedComplianceScore (TTL: 5 minutos)**

**Arquivo:** `src/hooks/useCachedComplianceScore.tsx`

```typescript
interface CachedComplianceScore {
  score: number;
  passingTests: number;
  failingTests: number;
  riskAcceptedTests: number;
  totalTests: number;
  lastCalculated: string;
}

export function useCachedComplianceScore() {
  const { user } = useAuth();
  const { getCache, setCache } = useCacheStore();
  const cacheKey = `compliance_score:${user?.id}`;
  const TTL_SECONDS = 300; // 5 minutos
  
  return useQuery({
    queryKey: ['cached-compliance-score', user?.id],
    queryFn: async () => {
      // Tentar buscar do cache primeiro
      const cached = await getCache<CachedComplianceScore>(cacheKey);
      if (cached) return cached;
      
      // Se não houver cache, calcular e salvar
      const freshData = await calculateComplianceScore(user?.id);
      await setCache(cacheKey, freshData, TTL_SECONDS);
      return freshData;
    },
    staleTime: TTL_SECONDS * 1000,
  });
}
```

**2. useCachedIssuesBySeverity (TTL: 2 minutos)**

**Arquivo:** `src/hooks/useCachedIssuesBySeverity.tsx`

```typescript
interface IssuesBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  overdue: number;
  lastUpdated: string;
}

export function useCachedIssuesBySeverity() {
  const { user } = useAuth();
  const { getCache, setCache } = useCacheStore();
  const cacheKey = `issues_by_severity:${user?.id}`;
  const TTL_SECONDS = 120; // 2 minutos
  
  return useQuery({
    queryKey: ['cached-issues-by-severity', user?.id],
    queryFn: async () => {
      const cached = await getCache<IssuesBySeverity>(cacheKey);
      if (cached) return cached;
      
      const freshData = await countIssuesBySeverity(user?.id);
      await setCache(cacheKey, freshData, TTL_SECONDS);
      return freshData;
    },
    staleTime: TTL_SECONDS * 1000,
  });
}
```

**3. useCachedCollectedResources (TTL: 10 minutos)**

**Arquivo:** `src/hooks/useCachedCollectedResources.tsx`

```typescript
interface CachedResourcesSummary {
  totalResources: number;
  byIntegration: Record<string, number>;
  byType: Record<string, number>;
  lastSync: string | null;
}

export function useCachedCollectedResources() {
  const { user } = useAuth();
  const { getCache, setCache } = useCacheStore();
  const cacheKey = `collected_resources:${user?.id}`;
  const TTL_SECONDS = 600; // 10 minutos
  
  return useQuery({
    queryKey: ['cached-collected-resources', user?.id],
    queryFn: async () => {
      const cached = await getCache<CachedResourcesSummary>(cacheKey);
      if (cached) return cached;
      
      const freshData = await aggregateCollectedResources(user?.id);
      await setCache(cacheKey, freshData, TTL_SECONDS);
      return freshData;
    },
    staleTime: TTL_SECONDS * 1000,
  });
}
```

---

### Fase 5: Integração com Dashboard

**Atualizar componentes do dashboard:**

| Componente | Antes | Depois |
|------------|-------|--------|
| ActionCenter | `useComplianceStatus()` | `useCachedComplianceScore()` + `useCachedIssuesBySeverity()` |
| MetricsGrid | Múltiplas queries | Cached hooks + fallback |
| PassingTestsSummary | Query direta | `useCachedComplianceScore()` |

**Atualização do ActionCenter.tsx:**
```typescript
// Usar cache para score e contagens
const { data: cachedScore } = useCachedComplianceScore();
const { data: issuesCounts } = useCachedIssuesBySeverity();

// Fallback para dados em tempo real se cache estiver vazio
const { score, failingTests } = useComplianceStatus();

const displayScore = cachedScore?.score ?? score;
```

---

### Fase 6: Atualização dos query-keys

Adicionar chaves de cache ao arquivo centralizado:

**Arquivo:** `src/lib/query-keys.ts`

```typescript
export const queryKeys = {
  // ... keys existentes
  
  // Cache keys
  cachedComplianceScore: (userId: string) => ['cached-compliance-score', userId] as const,
  cachedIssuesBySeverity: (userId: string) => ['cached-issues-by-severity', userId] as const,
  cachedCollectedResources: (userId: string) => ['cached-collected-resources', userId] as const,
};
```

---

### Estrutura de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx_cache_store.sql` | Criar | Tabela e funções de cache |
| `src/hooks/useCacheStore.tsx` | Criar | Hook base para interação com cache |
| `src/hooks/useCachedComplianceScore.tsx` | Criar | Cache de score (TTL 5min) |
| `src/hooks/useCachedIssuesBySeverity.tsx` | Criar | Cache de issues (TTL 2min) |
| `src/hooks/useCachedCollectedResources.tsx` | Criar | Cache de recursos (TTL 10min) |
| `src/lib/query-keys.ts` | Modificar | Adicionar cache keys |
| `src/components/dashboard/ActionCenter.tsx` | Modificar | Usar cached hooks |
| `src/components/dashboard/MetricsGrid.tsx` | Modificar | Usar cached hooks |

---

### RLS e Segurança

```sql
-- RLS para cache_store
ALTER TABLE cache_store ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver/gerenciar apenas seu próprio cache
CREATE POLICY "Users can read their own cache"
  ON cache_store FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert their own cache"
  ON cache_store FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own cache"
  ON cache_store FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete their own cache"
  ON cache_store FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Service role para invalidação via triggers
CREATE POLICY "Service role full access"
  ON cache_store FOR ALL
  USING (auth.role() = 'service_role');
```

---

### Configuração de TTLs

| Dado | TTL | Justificativa |
|------|-----|---------------|
| Compliance Score | 5 min | Dados agregados, muda com menos frequência |
| Issues por Severidade | 2 min | Precisa atualizar mais rápido para alertas críticos |
| Recursos Coletados | 10 min | Muda apenas em sync manual/automático |

---

### Benefícios Esperados

1. **Performance**: Redução de ~70% em queries ao dashboard
2. **Consistência**: Dados pré-agregados evitam recálculos
3. **Escalabilidade**: Menos carga no banco conforme usuários crescem
4. **Invalidação Inteligente**: Triggers garantem dados frescos quando necessário

---

### Ordem de Implementação

1. Criar migração com tabela e funções SQL
2. Criar hook `useCacheStore`
3. Criar hooks de cache específicos
4. Atualizar `query-keys.ts`
5. Atualizar `ActionCenter.tsx` para usar cache
6. Atualizar `MetricsGrid.tsx` para usar cache
7. Testar invalidação automática
8. Monitorar performance em produção
