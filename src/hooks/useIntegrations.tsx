import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Integration {
  id: string;
  name: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  lastSync: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  orgId: string | null;
}

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadIntegrations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Usar a VIEW segura que não expõe credenciais
      const { data, error } = await supabase
        .from('integrations_safe')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Integration[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        provider: item.provider,
        status: item.status as Integration['status'],
        lastSync: item.last_sync_at,
        lastUsedAt: item.last_used_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        orgId: item.org_id,
      }));

      setIntegrations(mapped);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as integrações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const disconnectIntegration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => prev.filter(i => i.id !== id));

      toast({
        title: 'Integração desconectada',
        description: 'A integração foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao desconectar integração:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível remover a integração.',
        variant: 'destructive',
      });
    }
  };

  const refreshIntegrations = useCallback(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  return {
    integrations,
    loading,
    disconnectIntegration,
    refreshIntegrations,
  };
};
