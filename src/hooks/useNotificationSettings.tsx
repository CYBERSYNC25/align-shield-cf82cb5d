import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validateWebhookUrl, getSsrfErrorMessage } from "@/lib/security/ssrfValidator";

export interface ChannelConfig {
  email: boolean;
  in_app: boolean;
  slack: boolean;
}

export interface NotificationSettings {
  id: string;
  org_id: string;
  user_id?: string | null;
  
  // Canais
  email_enabled: boolean;
  in_app_enabled: boolean;
  slack_enabled: boolean;
  slack_webhook_url?: string | null;
  
  // Alertas por tipo
  alert_critical_issue: ChannelConfig;
  alert_score_drop: ChannelConfig;
  alert_score_drop_threshold: number;
  alert_sla_expiring: ChannelConfig;
  alert_sync_failed: ChannelConfig;
  alert_new_user: ChannelConfig;
  alert_weekly_report: ChannelConfig;
  
  // Digest
  digest_daily_enabled: boolean;
  digest_weekly_enabled: boolean;
  digest_time: string;
  digest_day_of_week: number;
  
  created_at: string;
  updated_at: string;
}

interface NotificationSettingsUpdate {
  email_enabled?: boolean;
  in_app_enabled?: boolean;
  slack_enabled?: boolean;
  slack_webhook_url?: string | null;
  alert_critical_issue?: ChannelConfig;
  alert_score_drop?: ChannelConfig;
  alert_score_drop_threshold?: number;
  alert_sla_expiring?: ChannelConfig;
  alert_sync_failed?: ChannelConfig;
  alert_new_user?: ChannelConfig;
  alert_weekly_report?: ChannelConfig;
  digest_daily_enabled?: boolean;
  digest_weekly_enabled?: boolean;
  digest_time?: string;
  digest_day_of_week?: number;
}

const defaultChannelConfig: ChannelConfig = {
  email: true,
  in_app: true,
  slack: false,
};

const parseChannelConfig = (value: unknown): ChannelConfig => {
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return {
      email: typeof obj.email === 'boolean' ? obj.email : true,
      in_app: typeof obj.in_app === 'boolean' ? obj.in_app : true,
      slack: typeof obj.slack === 'boolean' ? obj.slack : false,
    };
  }
  return defaultChannelConfig;
};

export function useNotificationSettings() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          alert_critical_issue: parseChannelConfig(data.alert_critical_issue),
          alert_score_drop: parseChannelConfig(data.alert_score_drop),
          alert_sla_expiring: parseChannelConfig(data.alert_sla_expiring),
          alert_sync_failed: parseChannelConfig(data.alert_sync_failed),
          alert_new_user: parseChannelConfig(data.alert_new_user),
          alert_weekly_report: parseChannelConfig(data.alert_weekly_report),
        } as NotificationSettings;
      }
      
      return null;
    },
  });
  
  const createSettingsMutation = useMutation({
    mutationFn: async (input: NotificationSettingsUpdate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get org_id from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.org_id) throw new Error('Organization not found');
      
      // Convert ChannelConfig to JSON-compatible format
      const insertData: Record<string, unknown> = {
        org_id: profile.org_id,
        user_id: user.id,
        email_enabled: input.email_enabled,
        in_app_enabled: input.in_app_enabled,
        slack_enabled: input.slack_enabled,
        slack_webhook_url: input.slack_webhook_url,
        alert_critical_issue: input.alert_critical_issue ? JSON.parse(JSON.stringify(input.alert_critical_issue)) : undefined,
        alert_score_drop: input.alert_score_drop ? JSON.parse(JSON.stringify(input.alert_score_drop)) : undefined,
        alert_score_drop_threshold: input.alert_score_drop_threshold,
        alert_sla_expiring: input.alert_sla_expiring ? JSON.parse(JSON.stringify(input.alert_sla_expiring)) : undefined,
        alert_sync_failed: input.alert_sync_failed ? JSON.parse(JSON.stringify(input.alert_sync_failed)) : undefined,
        alert_new_user: input.alert_new_user ? JSON.parse(JSON.stringify(input.alert_new_user)) : undefined,
        alert_weekly_report: input.alert_weekly_report ? JSON.parse(JSON.stringify(input.alert_weekly_report)) : undefined,
        digest_daily_enabled: input.digest_daily_enabled,
        digest_weekly_enabled: input.digest_weekly_enabled,
        digest_time: input.digest_time,
        digest_day_of_week: input.digest_day_of_week,
      };
      
      // Remove undefined values
      Object.keys(insertData).forEach(key => {
        if (insertData[key] === undefined) {
          delete insertData[key];
        }
      });
      
      const { data, error } = await supabase
        .from('notification_settings')
        .insert(insertData as typeof insertData & { org_id: string })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({
        title: "Configurações salvas",
        description: "Suas preferências de notificação foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (input: NotificationSettingsUpdate) => {
      if (!settings?.id) throw new Error('Settings not found');
      
      // Convert ChannelConfig to JSON-compatible format
      const updateData: Record<string, unknown> = {
        email_enabled: input.email_enabled,
        in_app_enabled: input.in_app_enabled,
        slack_enabled: input.slack_enabled,
        slack_webhook_url: input.slack_webhook_url,
        alert_critical_issue: input.alert_critical_issue ? JSON.parse(JSON.stringify(input.alert_critical_issue)) : undefined,
        alert_score_drop: input.alert_score_drop ? JSON.parse(JSON.stringify(input.alert_score_drop)) : undefined,
        alert_score_drop_threshold: input.alert_score_drop_threshold,
        alert_sla_expiring: input.alert_sla_expiring ? JSON.parse(JSON.stringify(input.alert_sla_expiring)) : undefined,
        alert_sync_failed: input.alert_sync_failed ? JSON.parse(JSON.stringify(input.alert_sync_failed)) : undefined,
        alert_new_user: input.alert_new_user ? JSON.parse(JSON.stringify(input.alert_new_user)) : undefined,
        alert_weekly_report: input.alert_weekly_report ? JSON.parse(JSON.stringify(input.alert_weekly_report)) : undefined,
        digest_daily_enabled: input.digest_daily_enabled,
        digest_weekly_enabled: input.digest_weekly_enabled,
        digest_time: input.digest_time,
        digest_day_of_week: input.digest_day_of_week,
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      const { data, error } = await supabase
        .from('notification_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({
        title: "Configurações atualizadas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const testSlackWebhookMutation = useMutation({
    mutationFn: async (webhookUrl: string) => {
      // SSRF Protection: Validate Slack webhook URL
      const ssrfCheck = validateWebhookUrl(webhookUrl);
      if (!ssrfCheck.valid) {
        throw new Error(getSsrfErrorMessage(ssrfCheck));
      }
      
      // Use AbortController for 10s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: "🔔 Teste de webhook do APOC - Conexão bem-sucedida!",
          }),
          signal: controller.signal,
          redirect: 'manual', // Don't follow redirects
        });
        
        clearTimeout(timeoutId);
        
        // Block redirects
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          throw new Error('Redirect bloqueado por política de segurança');
        }
        
        if (!response.ok) {
          throw new Error('Falha ao enviar mensagem de teste para o Slack');
        }
        
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout: Slack não respondeu em 10 segundos');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Teste bem-sucedido",
        description: "Mensagem de teste enviada para o Slack com sucesso.",
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
  
  const saveSettings = async (input: NotificationSettingsUpdate) => {
    if (settings) {
      return updateSettingsMutation.mutateAsync(input);
    } else {
      return createSettingsMutation.mutateAsync(input);
    }
  };
  
  return {
    settings,
    isLoading,
    error,
    saveSettings,
    isSaving: createSettingsMutation.isPending || updateSettingsMutation.isPending,
    testSlackWebhook: testSlackWebhookMutation.mutateAsync,
    isTestingSlack: testSlackWebhookMutation.isPending,
  };
}
