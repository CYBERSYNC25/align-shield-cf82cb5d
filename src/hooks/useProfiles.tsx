import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';

export interface Profile {
  user_id: string;
  display_name: string | null;
  organization: string | null;
  role: string | null;
}

export const useProfiles = () => {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, organization, role')
        .order('display_name');
      
      if (error) throw error;
      return data as Profile[];
    },
  });
};
