import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { PlatformAdmin } from '@/types/platform-admin';

export function usePlatformAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['platform-admin', user?.id],
    queryFn: async (): Promise<PlatformAdmin | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('platform_admins' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      if (error) return null;
      return data as unknown as PlatformAdmin;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user,
    adminData,
    isPlatformAdmin: !!adminData,
    isLoading: authLoading || adminLoading,
  };
}
