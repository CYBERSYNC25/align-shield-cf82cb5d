/**
 * Hook para interagir com o cache_store no Supabase
 * 
 * Funções:
 * - set_cache: Salva valor com TTL em segundos
 * - get_cache: Busca valor do cache (null se expirado)
 * - invalidate_cache: Remove entradas por pattern
 */

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface UseCacheStoreReturn {
  getCache: (key: string) => Promise<Json | null>;
  setCache: (key: string, value: Json, ttlSeconds: number) => Promise<void>;
  invalidateCache: (keyPattern: string) => Promise<number>;
  clearUserCache: () => Promise<void>;
}

export function useCacheStore(): UseCacheStoreReturn {
  const { user } = useAuth();
  const userId = user?.id;

  /**
   * Busca valor do cache
   * @param key Chave do cache
   * @returns Valor se encontrado e não expirado, null caso contrário
   */
  const getCache = async (key: string): Promise<Json | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase.rpc('get_cache', {
        p_key: key
      });

      if (error) {
        console.warn('[CacheStore] Error fetching cache:', error.message);
        return null;
      }

      return data as Json | null;
    } catch (err) {
      console.warn('[CacheStore] Exception fetching cache:', err);
      return null;
    }
  };

  /**
   * Salva valor no cache com TTL
   * @param key Chave do cache
   * @param value Valor a ser armazenado (será convertido para JSONB)
   * @param ttlSeconds Tempo de vida em segundos
   */
  const setCache = async (key: string, value: Json, ttlSeconds: number): Promise<void> => {
    if (!userId) return;

    try {
      const { error } = await supabase.rpc('set_cache', {
        p_key: key,
        p_value: value,
        p_ttl_seconds: ttlSeconds,
        p_user_id: userId,
        p_org_id: null
      });

      if (error) {
        console.warn('[CacheStore] Error setting cache:', error.message);
      }
    } catch (err) {
      console.warn('[CacheStore] Exception setting cache:', err);
    }
  };

  /**
   * Invalida entradas do cache por pattern (LIKE)
   * @param keyPattern Pattern para match (ex: "compliance_score:%")
   * @returns Número de entradas removidas
   */
  const invalidateCache = async (keyPattern: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('invalidate_cache', {
        p_key_pattern: keyPattern
      });

      if (error) {
        console.warn('[CacheStore] Error invalidating cache:', error.message);
        return 0;
      }

      return data as number;
    } catch (err) {
      console.warn('[CacheStore] Exception invalidating cache:', err);
      return 0;
    }
  };

  /**
   * Limpa todo o cache do usuário atual
   */
  const clearUserCache = async (): Promise<void> => {
    if (!userId) return;
    await invalidateCache('%:' + userId + '%');
  };

  return {
    getCache,
    setCache,
    invalidateCache,
    clearUserCache
  };
}

export default useCacheStore;
