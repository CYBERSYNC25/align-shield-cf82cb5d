import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SyncIntegrationButtonProps {
  provider: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
}

export function SyncIntegrationButton({ 
  provider, 
  variant = 'outline',
  size = 'sm',
  showLabel = true 
}: SyncIntegrationButtonProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Log sync started
      if (user?.id) {
        await supabase.from('system_audit_logs').insert({
          user_id: user.id,
          action_type: 'integration_sync_started',
          action_category: 'integration',
          resource_type: 'integration',
          resource_id: provider,
          description: `Sincronização ${provider} iniciada`,
          metadata: { provider },
          user_agent: navigator.userAgent,
        });
      }

      const { data, error } = await supabase.functions.invoke('sync-integration-data', {
        body: { provider }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      queryClient.invalidateQueries({ queryKey: ['integration-data-stats'] });
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      
      const resourceCount = data?.resourcesCollected || 0;
      
      // Log sync completed
      if (user?.id) {
        await supabase.from('system_audit_logs').insert({
          user_id: user.id,
          action_type: 'integration_sync_completed',
          action_category: 'integration',
          resource_type: 'integration',
          resource_id: provider,
          description: `Sincronização ${provider} concluída: ${resourceCount} recursos`,
          metadata: { provider, resources_collected: resourceCount },
          user_agent: navigator.userAgent,
        });
      }

      toast.success(`Sincronização concluída`, {
        description: `${resourceCount} recursos coletados de ${provider}`
      });
    },
    onError: (error: Error) => {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar', {
        description: error.message || 'Tente novamente em alguns instantes'
      });
    }
  });

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        syncMutation.mutate();
      }}
      disabled={syncMutation.isPending}
      className="gap-2"
    >
      <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
      {showLabel && (syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar')}
    </Button>
  );
}
