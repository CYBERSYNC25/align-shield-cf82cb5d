import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-keys';
import { useCreateJob, useJobStatus } from '@/hooks/useJobQueue';
import { useState, useEffect } from 'react';

export interface Auth0User {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
  blocked: boolean;
  createdAt: string;
  lastLogin: string;
  loginsCount: number;
  providers: string[];
}

export interface Auth0Connection {
  id: string;
  name: string;
  strategy: string;
  enabledClients: number;
}

export interface Auth0Application {
  id: string;
  name: string;
  description: string;
  type: string;
  isFirstParty: boolean;
}

export interface Auth0Action {
  id: string;
  name: string;
  triggers: string[];
  status: string;
  createdAt: string;
}

export interface Auth0Evidence {
  timestamp: string;
  domain: string;
  users: {
    total: number;
    verified: number;
    blocked: number;
    withMfa: number;
    list: Auth0User[];
  };
  connections: {
    total: number;
    list: Auth0Connection[];
  };
  applications: {
    total: number;
    firstParty: number;
    list: Auth0Application[];
  };
  actions: {
    total: number;
    deployed: number;
    list: Auth0Action[];
  };
}

export interface Auth0SyncResult {
  success: boolean;
  data?: Auth0Evidence;
  error?: string;
  message?: string;
  missing?: string[];
}

export interface Auth0Credentials {
  domain: string;
  clientId: string;
  clientSecret: string;
}

export const useAuth0TestConnection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials?: Auth0Credentials): Promise<Auth0SyncResult> => {
      const { data, error } = await supabase.functions.invoke('auth0-integration', {
        body: credentials || {},
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao conectar com Auth0');
      }
      
      return data;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Auth0 conectado!',
          description: `${result.data?.users.total || 0} usuários, ${result.data?.applications.total || 0} aplicações encontradas.`,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Falha na conexão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAuth0Sync = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials?: Auth0Credentials): Promise<Auth0SyncResult> => {
      const { data, error } = await supabase.functions.invoke('auth0-integration', {
        body: credentials || {},
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao sincronizar Auth0');
      }
      
      return data;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Sincronização concluída!',
          description: `Dados do Auth0 atualizados com sucesso.`,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Falha na sincronização',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// New: Async sync via job queue
export const useAuth0SyncAsync = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const createJob = useCreateJob();
  const { data: jobStatus } = useJobStatus(jobId);

  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      const timer = setTimeout(() => setJobId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [jobStatus?.status]);

  const enqueue = () => {
    createJob.mutate(
      {
        jobType: 'sync_integration',
        payload: { provider: 'auth0' },
        priority: 4,
        metadata: { triggered_by: 'user_action' }
      },
      { onSuccess: (id) => setJobId(id) }
    );
  };

  return {
    enqueue,
    isEnqueuing: createJob.isPending,
    jobId,
    jobStatus,
    isProcessing: jobStatus?.status === 'pending' || jobStatus?.status === 'processing',
  };
};
