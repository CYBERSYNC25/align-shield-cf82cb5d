import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CollectedResource {
  id: string;
  user_id: string;
  integration_name: string;
  resource_type: string;
  resource_id: string | null;
  resource_data: Record<string, any>;
  collected_at: string;
  expires_at: string | null;
}

export interface IntegrationDataFilters {
  integrationName?: string;
  resourceType?: string;
}

/**
 * Hook para buscar dados coletados das integrações
 * Persiste os dados no banco de dados Supabase
 */
export function useIntegrationData(filters?: IntegrationDataFilters) {
  const { user } = useAuth();
  const { integrationName, resourceType } = filters || {};

  return useQuery({
    queryKey: ['integration-data', integrationName, resourceType, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('integration_collected_data')
        .select('*')
        .eq('user_id', user.id)
        .order('collected_at', { ascending: false });

      if (integrationName) {
        query = query.eq('integration_name', integrationName);
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching integration data:', error);
        throw error;
      }

      return (data || []) as CollectedResource[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obter estatísticas agregadas dos dados coletados
 */
export function useIntegrationDataStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['integration-data-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('integration_collected_data')
        .select('integration_name, resource_type')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching integration stats:', error);
        throw error;
      }

      // Agregar por integração e tipo
      const stats: Record<string, { total: number; byType: Record<string, number> }> = {};

      (data || []).forEach((item) => {
        if (!stats[item.integration_name]) {
          stats[item.integration_name] = { total: 0, byType: {} };
        }
        stats[item.integration_name].total++;
        stats[item.integration_name].byType[item.resource_type] =
          (stats[item.integration_name].byType[item.resource_type] || 0) + 1;
      });

      return stats;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para limpar dados de uma integração específica
 */
export function useClearIntegrationData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integrationName: string) => {
      const { error } = await supabase
        .from('integration_collected_data')
        .delete()
        .eq('integration_name', integrationName);

      if (error) throw error;
    },
    onSuccess: (_, integrationName) => {
      queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      queryClient.invalidateQueries({ queryKey: ['integration-data-stats'] });
      toast({
        title: 'Dados limpos',
        description: `Dados da integração ${integrationName} foram removidos.`,
      });
    },
    onError: (error) => {
      console.error('Error clearing integration data:', error);
      toast({
        title: 'Erro ao limpar dados',
        description: 'Não foi possível remover os dados da integração.',
        variant: 'destructive',
      });
    },
  });
}
