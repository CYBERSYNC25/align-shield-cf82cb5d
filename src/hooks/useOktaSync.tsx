import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OktaUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  created: string;
  lastLogin: string | null;
}

export interface OktaGroup {
  id: string;
  name: string;
  description: string | null;
}

export interface OktaApplication {
  id: string;
  name: string;
  label: string;
  status: string;
}

export interface OktaPolicy {
  id: string;
  name: string;
  status: string;
  priority: number;
}

export interface OktaEvidence {
  timestamp: string;
  domain: string;
  users: {
    total: number;
    active: number;
    suspended: number;
    deprovisioned: number;
    list: OktaUser[];
  };
  groups: {
    total: number;
    list: OktaGroup[];
  };
  applications: {
    total: number;
    active: number;
    list: OktaApplication[];
  };
  policies: {
    total: number;
    list: OktaPolicy[];
  };
}

export interface OktaSyncResult {
  success: boolean;
  data?: OktaEvidence;
  error?: string;
  message?: string;
}

export interface OktaCredentials {
  domain: string;
  apiToken: string;
}

export function useOktaTestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: OktaCredentials): Promise<OktaSyncResult> => {
      const { data, error } = await supabase.functions.invoke('okta-integration', {
        body: credentials
      });

      if (error) {
        throw new Error(error.message || 'Erro ao conectar com Okta');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Conexão com Okta estabelecida', {
          description: `${data.data?.users?.total || 0} usuários sincronizados`
        });
        queryClient.invalidateQueries({ queryKey: ['integrations'] });
        queryClient.invalidateQueries({ queryKey: ['integration-status'] });
        queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      }
    },
    onError: (error: Error) => {
      toast.error('Falha na conexão com Okta', {
        description: error.message
      });
    }
  });
}

export function useOktaSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials?: OktaCredentials): Promise<OktaSyncResult> => {
      const { data, error } = await supabase.functions.invoke('okta-integration', {
        body: credentials || {}
      });

      if (error) {
        throw new Error(error.message || 'Erro ao sincronizar com Okta');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Sincronização Okta concluída', {
          description: `Dados atualizados: ${data.data?.users?.total || 0} usuários, ${data.data?.groups?.total || 0} grupos`
        });
        queryClient.invalidateQueries({ queryKey: ['integrations'] });
        queryClient.invalidateQueries({ queryKey: ['integration-status'] });
        queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      }
    },
    onError: (error: Error) => {
      toast.error('Falha na sincronização Okta', {
        description: error.message
      });
    }
  });
}
