import { supabase } from '@/integrations/supabase/client';
import { usePlatformAdmin } from './usePlatformAdmin';

export function useAdminLog() {
  const { adminData } = usePlatformAdmin();

  const logAction = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    if (!adminData) return;
    try {
      await supabase.from('platform_admin_logs' as any).insert({
        admin_id: adminData.id,
        admin_email: adminData.email,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        details: details || {},
        user_agent: navigator.userAgent,
      } as any);
    } catch (e) {
      console.warn('Failed to log admin action:', e);
    }
  };

  return { logAction };
}
