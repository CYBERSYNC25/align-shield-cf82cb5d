/**
 * Webhook Monitor Hook
 * 
 * Provides real-time monitoring of webhook events and integration status
 * Uses Supabase Realtime to subscribe to database changes
 * 
 * @example
 * ```tsx
 * const { webhooks, integrationStatus, loading } = useWebhookMonitor();
 * 
 * // Access latest webhooks
 * console.log(webhooks);
 * 
 * // Monitor integration health
 * console.log(integrationStatus);
 * ```
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Webhook {
  id: string;
  integration_name: string;
  event_type: string;
  payload: any;
  status: 'pending' | 'processed' | 'failed';
  processed_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

interface IntegrationStatus {
  id: string;
  integration_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  last_sync_at: string | null;
  last_webhook_at: string | null;
  total_webhooks: number;
  failed_webhooks: number;
  health_score: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useWebhookMonitor = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadWebhooks();
    loadIntegrationStatus();
  }, []);

  // Subscribe to real-time updates for webhooks
  useEffect(() => {
    console.log('[WebhookMonitor] Setting up realtime subscription for webhooks');

    const webhookChannel = supabase
      .channel('webhook-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_webhooks'
        },
        (payload) => {
          console.log('[WebhookMonitor] New webhook received:', payload);
          const newWebhook = payload.new as Webhook;
          
          setWebhooks(prev => [newWebhook, ...prev].slice(0, 100)); // Keep last 100
          
          toast({
            title: 'Novo Webhook Recebido',
            description: `${newWebhook.integration_name}: ${newWebhook.event_type}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'integration_webhooks'
        },
        (payload) => {
          console.log('[WebhookMonitor] Webhook updated:', payload);
          const updatedWebhook = payload.new as Webhook;
          
          setWebhooks(prev => 
            prev.map(w => w.id === updatedWebhook.id ? updatedWebhook : w)
          );
          
          // Notify on status change
          if (updatedWebhook.status === 'failed') {
            toast({
              title: 'Webhook Falhou',
              description: `${updatedWebhook.integration_name}: ${updatedWebhook.error_message}`,
              variant: 'destructive',
            });
          } else if (updatedWebhook.status === 'processed') {
            toast({
              title: 'Webhook Processado',
              description: `${updatedWebhook.integration_name}: ${updatedWebhook.event_type}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[WebhookMonitor] Cleaning up webhook subscription');
      supabase.removeChannel(webhookChannel);
    };
  }, [toast]);

  // Subscribe to real-time updates for integration status
  useEffect(() => {
    console.log('[WebhookMonitor] Setting up realtime subscription for integration status');

    const statusChannel = supabase
      .channel('status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_status'
        },
        (payload) => {
          console.log('[WebhookMonitor] Integration status updated:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedStatus = payload.new as IntegrationStatus;
            
            setIntegrationStatus(prev => {
              const existing = prev.find(s => s.id === updatedStatus.id);
              if (existing) {
                return prev.map(s => s.id === updatedStatus.id ? updatedStatus : s);
              } else {
                return [...prev, updatedStatus];
              }
            });

            // Alert on health degradation
            if (updatedStatus.status === 'unhealthy') {
              toast({
                title: 'Integração Não Saudável',
                description: `${updatedStatus.integration_name} está com problemas`,
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[WebhookMonitor] Cleaning up status subscription');
      supabase.removeChannel(statusChannel);
    };
  }, [toast]);

  /**
   * Load webhooks from database
   */
  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_webhooks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setWebhooks((data || []) as Webhook[]);
    } catch (error) {
      console.error('[WebhookMonitor] Error loading webhooks:', error);
      toast({
        title: 'Erro ao carregar webhooks',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load integration status from database
   */
  const loadIntegrationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_status')
        .select('*')
        .order('integration_name');

      if (error) throw error;

      setIntegrationStatus((data || []) as IntegrationStatus[]);
    } catch (error) {
      console.error('[WebhookMonitor] Error loading integration status:', error);
    }
  };

  /**
   * Retry a failed webhook
   */
  const retryWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('integration_webhooks')
        .update({ status: 'pending', retry_count: 0 })
        .eq('id', webhookId);

      if (error) throw error;

      toast({
        title: 'Webhook reagendado',
        description: 'O webhook será processado novamente.',
      });
    } catch (error) {
      console.error('[WebhookMonitor] Error retrying webhook:', error);
      toast({
        title: 'Erro ao reagendar webhook',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  /**
   * Filter webhooks by integration
   */
  const filterByIntegration = (integration: string) => {
    return webhooks.filter(w => w.integration_name === integration);
  };

  /**
   * Get failed webhooks
   */
  const getFailedWebhooks = () => {
    return webhooks.filter(w => w.status === 'failed');
  };

  /**
   * Get pending webhooks
   */
  const getPendingWebhooks = () => {
    return webhooks.filter(w => w.status === 'pending');
  };

  return {
    webhooks,
    integrationStatus,
    loading,
    retryWebhook,
    filterByIntegration,
    getFailedWebhooks,
    getPendingWebhooks,
    refresh: () => {
      loadWebhooks();
      loadIntegrationStatus();
    },
  };
};
