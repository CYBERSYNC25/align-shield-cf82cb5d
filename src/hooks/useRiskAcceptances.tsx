import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type AcceptanceDuration = '3_months' | '6_months' | '1_year' | 'permanent';
export type AcceptanceStatus = 'active' | 'expired' | 'revoked';

export interface RiskAcceptance {
  id: string;
  userId: string;
  ruleId: string;
  integrationName: string;
  resourceType: string;
  resourceId: string | null;
  justification: string;
  acceptedBy: string;
  duration: AcceptanceDuration;
  expiresAt: string | null;
  status: AcceptanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcceptanceInput {
  ruleId: string;
  integrationName: string;
  resourceType: string;
  resourceId?: string;
  justification: string;
  duration: AcceptanceDuration;
}

function calculateExpiresAt(duration: AcceptanceDuration): string | null {
  if (duration === 'permanent') return null;
  
  const now = new Date();
  switch (duration) {
    case '3_months':
      now.setMonth(now.getMonth() + 3);
      break;
    case '6_months':
      now.setMonth(now.getMonth() + 6);
      break;
    case '1_year':
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  return now.toISOString();
}

export function useRiskAcceptances() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all active risk acceptances for the user
  const { data: acceptances = [], isLoading, refetch } = useQuery({
    queryKey: ['risk-acceptances', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('risk_acceptances')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) {
        console.error('Error fetching risk acceptances:', error);
        throw error;
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        ruleId: item.rule_id,
        integrationName: item.integration_name,
        resourceType: item.resource_type,
        resourceId: item.resource_id,
        justification: item.justification,
        acceptedBy: item.accepted_by,
        duration: item.duration as AcceptanceDuration,
        expiresAt: item.expires_at,
        status: item.status as AcceptanceStatus,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) as RiskAcceptance[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create a new risk acceptance
  const createAcceptanceMutation = useMutation({
    mutationFn: async (input: CreateAcceptanceInput) => {
      if (!user?.id || !user?.email) {
        throw new Error('Usuário não autenticado');
      }

      const expiresAt = calculateExpiresAt(input.duration);

      const { data, error } = await supabase
        .from('risk_acceptances')
        .insert({
          user_id: user.id,
          rule_id: input.ruleId,
          integration_name: input.integrationName,
          resource_type: input.resourceType,
          resource_id: input.resourceId || null,
          justification: input.justification,
          accepted_by: user.email,
          duration: input.duration,
          expires_at: expiresAt,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating risk acceptance:', error);
        throw error;
      }

      // Log to system audit logs
      await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action_type: 'risk_acceptance_created',
        action_category: 'compliance',
        resource_type: 'risk_acceptance',
        resource_id: data.id,
        description: `Risco aceito: ${input.ruleId} (${input.integrationName})`,
        metadata: {
          rule_id: input.ruleId,
          integration_name: input.integrationName,
          resource_type: input.resourceType,
          justification: input.justification,
          duration: input.duration,
          expires_at: expiresAt,
        },
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-acceptances'] });
      queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      toast({
        title: 'Risco aceito',
        description: 'A exceção foi registrada e o item foi removido da lista de falhas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao aceitar risco',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Revoke a risk acceptance
  const revokeAcceptanceMutation = useMutation({
    mutationFn: async (acceptanceId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('risk_acceptances')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', acceptanceId);

      if (error) {
        console.error('Error revoking risk acceptance:', error);
        throw error;
      }

      // Get the acceptance details for logging
      const acceptance = acceptances.find(a => a.id === acceptanceId);

      // Log to system audit logs
      await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action_type: 'risk_acceptance_revoked',
        action_category: 'compliance',
        resource_type: 'risk_acceptance',
        resource_id: acceptanceId,
        description: `Exceção revogada: ${acceptance?.ruleId || 'unknown'}`,
        metadata: {
          rule_id: acceptance?.ruleId,
          integration_name: acceptance?.integrationName,
        },
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-acceptances'] });
      queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      toast({
        title: 'Exceção revogada',
        description: 'O item voltará a aparecer na lista de falhas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao revogar exceção',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check if a specific resource has an active risk acceptance
  const isResourceAccepted = (ruleId: string, resourceId?: string): boolean => {
    return acceptances.some(a => 
      a.ruleId === ruleId && 
      (resourceId ? a.resourceId === resourceId : true) &&
      a.status === 'active'
    );
  };

  // Get acceptance for a specific rule
  const getAcceptanceForRule = (ruleId: string): RiskAcceptance | undefined => {
    return acceptances.find(a => a.ruleId === ruleId && a.status === 'active');
  };

  return {
    acceptances,
    isLoading,
    refetch,
    createAcceptance: createAcceptanceMutation.mutate,
    createAcceptanceAsync: createAcceptanceMutation.mutateAsync,
    isCreating: createAcceptanceMutation.isPending,
    revokeAcceptance: revokeAcceptanceMutation.mutate,
    isRevoking: revokeAcceptanceMutation.isPending,
    isResourceAccepted,
    getAcceptanceForRule,
  };
}
