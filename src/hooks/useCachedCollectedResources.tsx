/**
 * Hook para cache de resumo de Recursos Coletados
 * TTL: 10 minutos (600 segundos)
 * 
 * Dados cacheados:
 * - totalResources: Total de recursos coletados
 * - byIntegration: Contagem por integração
 * - byType: Contagem por tipo de recurso
 * - lastSync: Timestamp da última sincronização
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCacheStore } from '@/hooks/useCacheStore';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import type { Json } from '@/integrations/supabase/types';

export interface CachedResourcesSummary {
  totalResources: number;
  byIntegration: Record<string, number>;
  byType: Record<string, number>;
  lastSync: string | null;
  lastUpdated: string;
}

const TTL_SECONDS = 600; // 10 minutos
const STALE_TIME = TTL_SECONDS * 1000;

export function useCachedCollectedResources() {
  const { user } = useAuth();
  const { getCache, setCache } = useCacheStore();

  const userId = user?.id;
  const cacheKey = `collected_resources:${userId}`;

  return useQuery({
    queryKey: queryKeys.cachedCollectedResources(userId || ''),
    queryFn: async (): Promise<CachedResourcesSummary | null> => {
      if (!userId) return null;

      // Tentar buscar do cache primeiro
      const cached = await getCache(cacheKey);
      if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
        console.log('[CachedCollectedResources] Cache hit');
        return cached as unknown as CachedResourcesSummary;
      }

      console.log('[CachedCollectedResources] Cache miss, calculating...');

      // Buscar recursos coletados
      const { data: resources, error } = await supabase
        .from('integration_collected_data')
        .select('integration_name, resource_type, collected_at');

      if (error) {
        console.error('[CachedCollectedResources] Error fetching resources:', error);
        return null;
      }

      const byIntegration: Record<string, number> = {};
      const byType: Record<string, number> = {};
      let lastSyncTime: Date | null = null;

      resources?.forEach(resource => {
        // Contar por integração
        byIntegration[resource.integration_name] = 
          (byIntegration[resource.integration_name] || 0) + 1;

        // Contar por tipo
        byType[resource.resource_type] = 
          (byType[resource.resource_type] || 0) + 1;

        // Encontrar última sincronização
        if (resource.collected_at) {
          const collectedAt = new Date(resource.collected_at);
          if (!lastSyncTime || collectedAt > lastSyncTime) {
            lastSyncTime = collectedAt;
          }
        }
      });

      const summary: CachedResourcesSummary = {
        totalResources: resources?.length || 0,
        byIntegration,
        byType,
        lastSync: lastSyncTime?.toISOString() || null,
        lastUpdated: new Date().toISOString()
      };

      // Salvar no cache
      await setCache(cacheKey, summary as unknown as Json, TTL_SECONDS);

      return summary;
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}

/**
 * Hook auxiliar para invalidar o cache de recursos
 */
export function useInvalidateResourcesCache() {
  const { user } = useAuth();
  const { invalidateCache } = useCacheStore();
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!user?.id) return;

    await invalidateCache(`collected_resources:${user.id}%`);
    queryClient.invalidateQueries({
      queryKey: queryKeys.cachedCollectedResources(user.id)
    });
  };

  return { invalidate };
}

export default useCachedCollectedResources;
