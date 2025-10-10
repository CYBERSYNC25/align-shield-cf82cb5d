import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useAuditLogs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAuditLogs();
    }
  }, [user]);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    oldData?: any,
    newData?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          old_data: oldData,
          new_data: newData,
          ip_address: null, // Could be captured from request
          user_agent: navigator.userAgent
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const filterByResource = (resourceType: string) => {
    return logs.filter(log => log.resource_type === resourceType);
  };

  const filterByAction = (action: string) => {
    return logs.filter(log => log.action === action);
  };

  return {
    logs,
    loading,
    logAction,
    filterByResource,
    filterByAction,
    refresh: loadAuditLogs
  };
};
