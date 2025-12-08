import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { extractApiError } from '@/lib/api-error-handler';

export interface AzureTestResult {
  success: boolean;
  step: string;
  message?: string;
  error?: string;
  recommendation?: string;
  user_info?: {
    name: string;
    email: string;
    id: string;
  };
  token_status?: {
    valid: boolean;
    expires_at: string;
    scopes: string;
  };
  test_summary?: Record<string, string>;
  details?: any;
  status_code?: number;
}

interface ConnectionStatus {
  connected: boolean;
  expires_at: string;
  scopes: string | null;
  created_at: string;
  is_expired: boolean;
}

export const useAzureConnectionStatus = () => {
  return useQuery({
    queryKey: queryKeys.azureConnection,
    queryFn: async (): Promise<ConnectionStatus | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('integration_oauth_tokens')
        .select('id, expires_at, scope, created_at')
        .eq('user_id', user.id)
        .eq('integration_name', 'azure_ad')
        .single();

      if (error || !data) return null;

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const isExpired = expiresAt <= now;

      return {
        connected: true,
        expires_at: data.expires_at,
        scopes: data.scope,
        created_at: data.created_at,
        is_expired: isExpired
      };
    },
    staleTime: 30000, // 30 seconds
  });
};

export const useAzureTestConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AzureTestResult> => {
      const { data, error } = await supabase.functions.invoke('azure-test-connection');

      if (error) {
        throw new Error(extractApiError(error));
      }

      if (!data.success) {
        // Return the full result for display, but don't throw
        return data as AzureTestResult;
      }

      return data as AzureTestResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.azureConnection });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });

      if (data.success) {
        toast.success('Teste concluído com sucesso', {
          description: 'A integração com Azure AD está funcionando corretamente'
        });
      } else {
        toast.error('Teste falhou', {
          description: data.error || 'Erro ao testar conexão'
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro no teste', {
        description: error.message
      });
    }
  });
};

export const useAzureRevokeConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('azure-oauth-revoke');

      if (error) {
        throw new Error(extractApiError(error));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.azureConnection });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });

      toast.success('Conexão revogada', {
        description: 'A integração com Azure AD foi desconectada'
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao revogar', {
        description: error.message
      });
    }
  });
};

export const useAzureConnect = () => {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email offline_access User.Read',
          redirectTo: window.location.href,
        },
      });

      if (error) {
        throw new Error(error.message || 'Não foi possível iniciar o fluxo de autenticação com a Microsoft.');
      }

      return true;
    },
    onError: (error: Error) => {
      toast.error('Erro ao conectar', {
        description: error.message
      });
    }
  });
};
