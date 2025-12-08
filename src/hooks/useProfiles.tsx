import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { Database } from '@/integrations/supabase/types';

// Tipo derivado diretamente do banco - garante sincronia com schema
type Profile = Database['public']['Tables']['profiles']['Row'];

// Subconjunto para uso nos componentes
export type ProfileData = Pick<Profile, 'user_id' | 'display_name' | 'organization' | 'role'>;

export const useProfiles = () => {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, organization, role')
        .order('display_name');
      
      if (error) {
        console.error('Erro ao buscar perfis:', error);
        throw error;
      }

      return data as ProfileData[];
    },
    // Performance: Perfis não mudam frequentemente
    staleTime: 1000 * 60 * 5, // 5 minutos considerado "fresco"
    retry: 1, // Limita retries para não travar UI
  });
};
