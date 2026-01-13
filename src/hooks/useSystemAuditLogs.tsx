import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SystemAuditLog {
  id: string;
  user_id: string | null;
  action_type: string;
  action_category: string;
  resource_type: string | null;
  resource_id: string | null;
  description: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type ActionType = 
  | 'risk_acceptance_created'
  | 'risk_acceptance_revoked'
  | 'integration_sync_started'
  | 'integration_sync_completed'
  | 'compliance_check_completed'
  | 'compliance_drift_detected'
  | 'alert_acknowledged'
  | 'user_login'
  | 'user_logout';

export type ActionCategory = 
  | 'compliance'
  | 'integration'
  | 'authentication'
  | 'security';

interface CreateLogInput {
  actionType: ActionType;
  actionCategory: ActionCategory;
  resourceType?: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export function useSystemAuditLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['system-audit-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SystemAuditLog[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createLog = useMutation({
    mutationFn: async (input: CreateLogInput) => {
      const { data, error } = await supabase
        .from('system_audit_logs')
        .insert({
          user_id: user?.id || null,
          action_type: input.actionType,
          action_category: input.actionCategory,
          resource_type: input.resourceType || null,
          resource_id: input.resourceId || null,
          description: input.description,
          metadata: input.metadata || {},
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-audit-logs'] });
    },
  });

  // Helper function for easy logging
  const logAction = async (input: CreateLogInput) => {
    try {
      await createLog.mutateAsync(input);
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  return {
    logs,
    isLoading,
    refetch,
    logAction,
    createLog: createLog.mutateAsync,
    isCreating: createLog.isPending,
  };
}
