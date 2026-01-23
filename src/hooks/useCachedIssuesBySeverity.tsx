/**
 * Hook para cache de contagem de Issues por Severidade
 * TTL: 2 minutos (120 segundos)
 * 
 * Dados cacheados:
 * - critical: Número de issues críticos
 * - high: Número de issues altos
 * - medium: Número de issues médios
 * - low: Número de issues baixos
 * - total: Total de issues
 * - overdue: Número de issues vencidos
 * - lastUpdated: Timestamp da atualização
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCacheStore } from '@/hooks/useCacheStore';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import type { Json } from '@/integrations/supabase/types';

export interface IssuesBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  overdue: number;
  lastUpdated: string;
}

const TTL_SECONDS = 120; // 2 minutos
const STALE_TIME = TTL_SECONDS * 1000;

export function useCachedIssuesBySeverity() {
  const { user } = useAuth();
  const { getCache, setCache } = useCacheStore();

  const userId = user?.id;
  const cacheKey = `issues_by_severity:${userId}`;

  return useQuery({
    queryKey: queryKeys.cachedIssuesBySeverity(userId || ''),
    queryFn: async (): Promise<IssuesBySeverity | null> => {
      if (!userId) return null;

      // Tentar buscar do cache primeiro
      const cached = await getCache(cacheKey);
      if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
        console.log('[CachedIssuesBySeverity] Cache hit');
        return cached as unknown as IssuesBySeverity;
      }

      console.log('[CachedIssuesBySeverity] Cache miss, calculating...');

      // Calcular contagem a partir de compliance_alerts não resolvidos
      const { data: alerts, error } = await supabase
        .from('compliance_alerts')
        .select('severity, is_overdue, resolved')
        .eq('resolved', false);

      if (error) {
        console.error('[CachedIssuesBySeverity] Error fetching alerts:', error);
        return null;
      }

      const counts: IssuesBySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: alerts?.length || 0,
        overdue: 0,
        lastUpdated: new Date().toISOString()
      };

      alerts?.forEach(alert => {
        switch (alert.severity) {
          case 'critical':
            counts.critical++;
            break;
          case 'high':
            counts.high++;
            break;
          case 'medium':
            counts.medium++;
            break;
          case 'low':
            counts.low++;
            break;
        }
        if (alert.is_overdue) {
          counts.overdue++;
        }
      });

      // Salvar no cache
      await setCache(cacheKey, counts as unknown as Json, TTL_SECONDS);

      return counts;
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}

/**
 * Hook auxiliar para invalidar o cache de issues
 */
export function useInvalidateIssuesCache() {
  const { user } = useAuth();
  const { invalidateCache } = useCacheStore();
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!user?.id) return;

    await invalidateCache(`issues_by_severity:${user.id}%`);
    queryClient.invalidateQueries({
      queryKey: queryKeys.cachedIssuesBySeverity(user.id)
    });
  };

  return { invalidate };
}

export default useCachedIssuesBySeverity;
