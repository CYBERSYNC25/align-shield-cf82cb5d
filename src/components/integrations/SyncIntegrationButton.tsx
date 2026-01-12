import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-integration-data', {
        body: { provider }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      queryClient.invalidateQueries({ queryKey: ['integration-data-stats'] });
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      
      const resourceCount = data?.resourcesCollected || 0;
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
