import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ComplianceAlert {
  id: string;
  user_id: string;
  rule_id: string;
  rule_title: string;
  previous_status: string;
  new_status: string;
  severity: string;
  integration_name: string;
  affected_resources: number;
  affected_items: string[];
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved: boolean;
  resolved_at: string | null;
  metadata: Record<string, any>;
  // SLA fields
  remediation_deadline: string | null;
  sla_hours: number | null;
  is_overdue: boolean;
  overdue_notified_at: string | null;
  external_ticket_id: string | null;
  external_ticket_url: string | null;
  resolved_by: string | null;
  time_to_resolve_hours: number | null;
}

export function useComplianceAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['compliance-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false });

      if (error) throw error;
      return data as ComplianceAlert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('compliance_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.email || user.id,
        })
        .eq('id', alertId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action_type: 'alert_acknowledged',
        action_category: 'compliance',
        resource_type: 'compliance_alert',
        resource_id: alertId,
        description: `Alerta reconhecido: ${data.rule_title}`,
        metadata: {
          rule_id: data.rule_id,
          severity: data.severity,
        },
        user_agent: navigator.userAgent,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts'] });
      toast.success('Alerta reconhecido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao reconhecer alerta', { description: error.message });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Get the alert to calculate time to resolve
      const { data: alertData, error: fetchError } = await supabase
        .from('compliance_alerts')
        .select('triggered_at')
        .eq('id', alertId)
        .single();

      if (fetchError) throw fetchError;

      const triggeredAt = new Date(alertData.triggered_at);
      const resolvedAt = new Date();
      const timeToResolveHours = Math.round((resolvedAt.getTime() - triggeredAt.getTime()) / (1000 * 60 * 60));

      const { data, error } = await supabase
        .from('compliance_alerts')
        .update({
          resolved: true,
          resolved_at: resolvedAt.toISOString(),
          resolved_by: user.email || user.id,
          time_to_resolve_hours: timeToResolveHours,
        })
        .eq('id', alertId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['mttr-metrics'] });
      toast.success('Alerta resolvido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao resolver alerta', { description: error.message });
    },
  });

  // Create external ticket via Edge Function
  const createTicket = useMutation({
    mutationFn: async ({ alertId, ruleId, ruleTitle, severity, externalSystem = 'jira' }: { 
      alertId: string; 
      ruleId: string; 
      ruleTitle: string;
      severity?: string;
      externalSystem?: 'jira' | 'linear';
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Call Edge Function for real ticket creation
      const { data, error } = await supabase.functions.invoke('create-remediation-ticket', {
        body: {
          alertId,
          ruleId,
          ruleTitle,
          severity: severity || 'medium',
          externalSystem,
          description: `Alerta de compliance detectado pelo APOC.\n\nRegra: ${ruleId}\nSeveridade: ${severity || 'medium'}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return { 
        ticketId: data.ticketId, 
        ticketUrl: data.ticketUrl,
        isSimulated: data.isSimulated,
      };
    },
    onSuccess: ({ ticketId, isSimulated }) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts'] });
      toast.success('Ticket de correção aberto!', {
        description: isSimulated 
          ? `${ticketId} (simulado) - Configure a integração Jira/Linear para criar tickets reais.`
          : `${ticketId} - Enviado para o board da equipe de TI.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar ticket', { description: error.message });
    },
  });

  // Computed values
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(a => a.severity === 'critical');
  const highAlerts = unacknowledgedAlerts.filter(a => a.severity === 'high');
  const overdueAlerts = alerts.filter(a => a.is_overdue && !a.resolved);

  return {
    alerts,
    unacknowledgedAlerts,
    criticalAlerts,
    highAlerts,
    overdueAlerts,
    unacknowledgedCount: unacknowledgedAlerts.length,
    criticalCount: criticalAlerts.length,
    overdueCount: overdueAlerts.length,
    isLoading,
    refetch,
    acknowledgeAlert: acknowledgeAlert.mutateAsync,
    resolveAlert: resolveAlert.mutateAsync,
    createTicket: createTicket.mutateAsync,
    isAcknowledging: acknowledgeAlert.isPending,
    isCreatingTicket: createTicket.isPending,
  };
}
