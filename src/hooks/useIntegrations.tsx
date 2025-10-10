import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'paused' | 'warning';
  lastSync: string;
  evidences: number;
  controls: number;
  logo: string;
  health: 'healthy' | 'degraded' | 'paused';
  issue?: string;
  pausedBy?: string;
  config?: any;
  credentials?: {
    apiKey?: string;
    apiSecret?: string;
    endpoint?: string;
  };
  connectedAt: string;
  connectedBy: string;
}

const STORAGE_KEY = 'connected_integrations';

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setIntegrations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveIntegrations = (newIntegrations: Integration[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIntegrations));
      setIntegrations(newIntegrations);
    } catch (error) {
      console.error('Erro ao salvar integrações:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a integração.',
        variant: 'destructive',
      });
    }
  };

  const connectIntegration = (
    integration: any,
    credentials: { apiKey: string; apiSecret: string; endpoint?: string },
    userName: string = 'Usuário'
  ) => {
    const newIntegration: Integration = {
      id: `${integration.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: integration.name,
      category: integration.category || 'Outros',
      status: 'active',
      lastSync: 'Agora',
      evidences: 0,
      controls: integration.controls?.length || 0,
      logo: integration.logo,
      health: 'healthy',
      credentials: {
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        endpoint: credentials.endpoint,
      },
      connectedAt: new Date().toISOString(),
      connectedBy: userName,
    };

    const updatedIntegrations = [...integrations, newIntegration];
    saveIntegrations(updatedIntegrations);

    toast({
      title: 'Integração conectada!',
      description: `${integration.name} foi conectado com sucesso.`,
    });

    return newIntegration;
  };

  const disconnectIntegration = (id: string) => {
    const integration = integrations.find(i => i.id === id);
    const updatedIntegrations = integrations.filter(i => i.id !== id);
    saveIntegrations(updatedIntegrations);

    if (integration) {
      toast({
        title: 'Integração desconectada',
        description: `${integration.name} foi desconectado.`,
      });
    }
  };

  const pauseIntegration = (id: string, reason?: string) => {
    const updatedIntegrations = integrations.map(integration =>
      integration.id === id
        ? {
            ...integration,
            status: 'paused' as const,
            health: 'paused' as const,
            pausedBy: reason || 'Pausada pelo usuário',
          }
        : integration
    );
    saveIntegrations(updatedIntegrations);

    toast({
      title: 'Integração pausada',
      description: 'A sincronização foi pausada.',
    });
  };

  const resumeIntegration = (id: string) => {
    const updatedIntegrations = integrations.map(integration =>
      integration.id === id
        ? {
            ...integration,
            status: 'active' as const,
            health: 'healthy' as const,
            pausedBy: undefined,
            lastSync: 'Agora',
          }
        : integration
    );
    saveIntegrations(updatedIntegrations);

    toast({
      title: 'Integração retomada',
      description: 'A sincronização foi retomada.',
    });
  };

  const updateIntegrationConfig = (id: string, config: any) => {
    const updatedIntegrations = integrations.map(integration =>
      integration.id === id
        ? { ...integration, config }
        : integration
    );
    saveIntegrations(updatedIntegrations);

    toast({
      title: 'Configuração atualizada',
      description: 'As configurações foram salvas com sucesso.',
    });
  };

  return {
    integrations,
    loading,
    connectIntegration,
    disconnectIntegration,
    pauseIntegration,
    resumeIntegration,
    updateIntegrationConfig,
  };
};
