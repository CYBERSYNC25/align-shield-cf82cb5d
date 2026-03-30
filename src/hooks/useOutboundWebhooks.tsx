import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validateWebhookUrl, getSsrfErrorMessage } from "@/lib/security/ssrfValidator";

export interface OutboundWebhook {
  id: string;
  org_id: string;
  name: string;
  url: string;
  secret?: string | null;
  events: string[];
  custom_headers: Record<string, string>;
  enabled: boolean;
  last_triggered_at?: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface OutboundWebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  status_code?: number | null;
  response_body?: string | null;
  error_message?: string | null;
  attempts: number;
  next_retry_at?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  secret?: string;
  events?: string[];
  custom_headers?: Record<string, string>;
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  secret?: string;
  events?: string[];
  custom_headers?: Record<string, string>;
  enabled?: boolean;
}

export const WEBHOOK_EVENTS = [
  { id: 'critical_issue', label: 'Issue Crítico Detectado', description: 'Quando um novo issue crítico é detectado' },
  { id: 'score_drop', label: 'Queda no Score', description: 'Quando o score de compliance cai significativamente' },
  { id: 'sla_expiring', label: 'SLA Expirando', description: 'Quando um SLA está próximo do vencimento' },
  { id: 'sync_failed', label: 'Sincronização Falhou', description: 'Quando uma sincronização de integração falha' },
  { id: 'new_user', label: 'Novo Usuário', description: 'Quando um novo usuário entra na organização' },
  { id: 'issue_remediated', label: 'Issue Remediado', description: 'Quando um issue é resolvido' },
];

export function useOutboundWebhooks() {
  const queryClient = useQueryClient();
  
  const { data: webhooks = [], isLoading, error } = useQuery({
    queryKey: ['outbound-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound_webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(webhook => ({
        ...webhook,
        custom_headers: (webhook.custom_headers as Record<string, string>) || {},
      })) as OutboundWebhook[];
    },
  });
  
  const createWebhookMutation = useMutation({
    mutationFn: async (input: CreateWebhookInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get org_id from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.org_id) throw new Error('Organization not found');
      
      const { data, error } = await supabase
        .from('outbound_webhooks')
        .insert({
          org_id: profile.org_id,
          name: input.name,
          url: input.url,
          secret: input.secret || null,
          events: input.events || WEBHOOK_EVENTS.map(e => e.id),
          custom_headers: input.custom_headers || {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-webhooks'] });
      toast({
        title: "Webhook criado",
        description: "O webhook foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateWebhookInput & { id: string }) => {
      const { data, error } = await supabase
        .from('outbound_webhooks')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-webhooks'] });
      toast({
        title: "Webhook atualizado",
        description: "O webhook foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('outbound_webhooks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-webhooks'] });
      toast({
        title: "Webhook excluído",
        description: "O webhook foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('outbound_webhooks')
        .update({ enabled })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-webhooks'] });
      toast({
        title: variables.enabled ? "Webhook ativado" : "Webhook desativado",
        description: `O webhook foi ${variables.enabled ? 'ativado' : 'desativado'} com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const testWebhookMutation = useMutation({
    mutationFn: async (webhook: OutboundWebhook) => {
      // SSRF Protection: Validate URL before sending
      const ssrfCheck = validateWebhookUrl(webhook.url);
      if (!ssrfCheck.valid) {
        throw new Error(getSsrfErrorMessage(ssrfCheck));
      }
      
      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        org_id: webhook.org_id,
        data: {
          message: 'This is a test webhook from Compliance Sync',
          webhook_name: webhook.name,
        },
      };
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...webhook.custom_headers,
      };
      
      // Add HMAC signature if secret is configured
      if (webhook.secret) {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(testPayload));
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhook.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, data);
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        headers['X-Webhook-Signature'] = `sha256=${signatureHex}`;
      }
      
      // Use AbortController for 10s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(testPayload),
          signal: controller.signal,
          redirect: 'manual', // Don't follow redirects
        });
        
        clearTimeout(timeoutId);
        
        // Block redirects
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          throw new Error('Redirect bloqueado por política de segurança');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout: webhook não respondeu em 10 segundos');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Teste bem-sucedido",
        description: "Webhook de teste enviado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Teste falhou",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const useWebhookLogs = (webhookId: string) => {
    return useQuery({
      queryKey: ['webhook-logs', webhookId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('outbound_webhook_logs')
          .select('*')
          .eq('webhook_id', webhookId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        return (data || []).map(log => ({
          ...log,
          payload: (log.payload as Record<string, unknown>) || {},
        })) as OutboundWebhookLog[];
      },
      enabled: !!webhookId,
    });
  };
  
  return {
    webhooks,
    isLoading,
    error,
    createWebhook: createWebhookMutation.mutateAsync,
    isCreating: createWebhookMutation.isPending,
    updateWebhook: updateWebhookMutation.mutateAsync,
    isUpdating: updateWebhookMutation.isPending,
    deleteWebhook: deleteWebhookMutation.mutateAsync,
    isDeleting: deleteWebhookMutation.isPending,
    toggleWebhook: toggleWebhookMutation.mutateAsync,
    isToggling: toggleWebhookMutation.isPending,
    testWebhook: testWebhookMutation.mutateAsync,
    isTesting: testWebhookMutation.isPending,
    useWebhookLogs,
  };
}
