import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ConnectionTestParams {
  provider: string;
  credentials: Record<string, string>;
  testOnly?: boolean;
}

interface SaveCredentialsParams {
  provider: string;
  credentials: Record<string, string>;
  name: string;
}

interface ConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
  resources?: Record<string, any>;
}

export function useConnectionTest() {
  return useMutation({
    mutationFn: async ({ provider, credentials, testOnly = true }: ConnectionTestParams): Promise<ConnectionResult> => {
      const { data, error } = await supabase.functions.invoke('save-integration-credentials', {
        body: {
          provider,
          credentials,
          testOnly,
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao testar conexão');
      }

      return data as ConnectionResult;
    },
  });
}

export function useSaveCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ provider, credentials, name }: SaveCredentialsParams): Promise<ConnectionResult> => {
      const { data, error } = await supabase.functions.invoke('save-integration-credentials', {
        body: {
          provider,
          credentials,
          name,
          testOnly: false,
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao salvar credenciais');
      }

      return data as ConnectionResult;
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({
          title: "Integração conectada",
          description: `${variables.name} foi conectado com sucesso.`,
        });
        // Invalidate integration status queries
        queryClient.invalidateQueries({ queryKey: ['integration-status'] });
        queryClient.invalidateQueries({ queryKey: ['integrations'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao conectar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}