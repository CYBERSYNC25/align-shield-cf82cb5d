/**
 * Hook para cache de Compliance Score
 * TTL: 5 minutos (300 segundos)
 * 
 * Dados cacheados:
 * - score: Percentual de compliance (0-100)
 * - passingTests: Número de testes aprovados
 * - failingTests: Número de testes falhando
 * - riskAcceptedTests: Número de testes com risco aceito
 * - totalTests: Total de testes avaliados
 * - lastCalculated: Timestamp do cálculo
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCacheStore } from '@/hooks/useCacheStore';
import { queryKeys } from '@/lib/query-keys';
import type { Json } from '@/integrations/supabase/types';

export interface CachedComplianceScore {
  score: number;
  passingTests: number;
  failingTests: number;
  riskAcceptedTests: number;
  totalTests: number;
  lastCalculated: string;
}

const TTL_SECONDS = 300; // 5 minutos
const STALE_TIME = TTL_SECONDS * 1000;

interface UseCachedComplianceScoreProps {
  /** Se true, busca dados frescos e atualiza cache */
  forceRefresh?: boolean;
  /** Função para calcular score quando cache está vazio */
  calculateFn?: () => Promise<CachedComplianceScore>;
}

export function useCachedComplianceScore(props?: UseCachedComplianceScoreProps) {
  const { forceRefresh = false, calculateFn } = props || {};
  const { user } = useAuth();
  const { getCache, setCache } = useCacheStore();
  const queryClient = useQueryClient();

  const userId = user?.id;
  const cacheKey = `compliance_score:${userId}`;

  return useQuery({
    queryKey: queryKeys.cachedComplianceScore(userId || ''),
    queryFn: async (): Promise<CachedComplianceScore | null> => {
      if (!userId) return null;

      // Se não forçar refresh, tentar buscar do cache primeiro
      if (!forceRefresh) {
        const cached = await getCache(cacheKey);
        if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
          console.log('[CachedComplianceScore] Cache hit');
          return cached as unknown as CachedComplianceScore;
        }
      }

      // Se tiver função de cálculo, calcular e cachear
      if (calculateFn) {
        console.log('[CachedComplianceScore] Cache miss, calculating...');
        const freshData = await calculateFn();
        await setCache(cacheKey, freshData as unknown as Json, TTL_SECONDS);
        return freshData;
      }

      // Sem dados nem função de cálculo
      return null;
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}

/**
 * Hook auxiliar para atualizar o cache manualmente
 */
export function useUpdateComplianceScoreCache() {
  const { user } = useAuth();
  const { setCache } = useCacheStore();
  const queryClient = useQueryClient();

  const updateCache = async (data: CachedComplianceScore) => {
    if (!user?.id) return;

    const cacheKey = `compliance_score:${user.id}`;
    await setCache(cacheKey, data as unknown as Json, TTL_SECONDS);
    
    // Invalidar query para forçar refetch
    queryClient.invalidateQueries({
      queryKey: queryKeys.cachedComplianceScore(user.id)
    });
  };

  return { updateCache };
}

export default useCachedComplianceScore;
