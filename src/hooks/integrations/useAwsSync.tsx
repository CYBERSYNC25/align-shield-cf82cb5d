import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { extractApiError } from '@/lib/api-error-handler';

interface AwsUser {
  userName: string;
  userId: string;
  createdAt: string;
  mfaEnabled: boolean | null;
}

interface AwsBucket {
  name: string;
  createdAt: string;
}

interface AwsTrail {
  name: string;
  isMultiRegion: boolean;
  s3BucketName: string;
}

export interface AwsResourcesData {
  timestamp: string;
  accountId: string;
  iam: {
    totalUsers: number;
    users: AwsUser[];
  };
  s3: {
    totalBuckets: number;
    buckets: AwsBucket[];
  };
  cloudtrail: {
    enabled: boolean;
    totalTrails: number;
    trails: AwsTrail[];
  };
}

export const useAwsSync = (integrationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AwsResourcesData> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('aws-sync-resources', {
        body: { integration_id: integrationId }
      });

      if (error) {
        throw new Error(extractApiError(error));
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na sincronização');
      }

      return data.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.awsResources(integrationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      
      toast.success('Sincronização concluída', {
        description: `${data.iam.totalUsers} usuários e ${data.s3.totalBuckets} buckets encontrados.`
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na sincronização AWS', {
        description: error.message
      });
    }
  });
};

export const useAwsTestConnection = (integrationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('aws-test-connection', {
        body: { integration_id: integrationId }
      });

      if (error) {
        throw new Error(extractApiError(error));
      }

      if (!data?.success) {
        throw new Error(data?.error || data?.message || 'Teste falhou');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awsConnection });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      
      toast.success('Conexão AWS verificada', {
        description: 'A integração está funcionando corretamente.'
      });
    },
    onError: (error: Error) => {
      toast.error('Erro no teste AWS', {
        description: error.message
      });
    }
  });
};
