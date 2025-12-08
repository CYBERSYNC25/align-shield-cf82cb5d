import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { extractApiError } from '@/lib/api-error-handler';

interface WorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName?: string;
    familyName?: string;
  };
  isAdmin: boolean;
  suspended: boolean;
  orgUnitPath?: string;
  lastLoginTime?: string;
  creationTime?: string;
}

interface WorkspaceGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: number;
  adminCreated?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  hd?: string;
}

export interface GoogleWorkspaceData {
  timestamp: string;
  profile: UserProfile | null;
  users: {
    totalCount: number;
    items: WorkspaceUser[];
  };
  groups: {
    totalCount: number;
    items: WorkspaceGroup[];
  };
}

export const useGoogleSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<GoogleWorkspaceData> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      // Fetch profile
      const profileResponse = await supabase.functions.invoke('google-workspace-sync', {
        body: { action: 'get_user_profile' }
      });

      let profile: UserProfile | null = null;
      if (profileResponse.data?.success) {
        profile = profileResponse.data.data.profile;
      }

      // Try to fetch users (may fail without Admin SDK permissions)
      let users: WorkspaceUser[] = [];
      try {
        const usersResponse = await supabase.functions.invoke('google-workspace-sync', {
          body: { action: 'list_users', params: { maxResults: 100 } }
        });
        
        if (usersResponse.data?.success && usersResponse.data?.data?.users) {
          users = usersResponse.data.data.users;
        }
      } catch (err) {
        console.log('Users fetch skipped (Admin SDK not available)');
      }

      // Try to fetch groups (may fail without Admin SDK permissions)
      let groups: WorkspaceGroup[] = [];
      try {
        const groupsResponse = await supabase.functions.invoke('google-workspace-sync', {
          body: { action: 'list_groups', params: { maxResults: 100 } }
        });
        
        if (groupsResponse.data?.success && groupsResponse.data?.data?.groups) {
          groups = groupsResponse.data.data.groups;
        }
      } catch (err) {
        console.log('Groups fetch skipped (Admin SDK not available)');
      }

      return {
        timestamp: new Date().toISOString(),
        profile,
        users: {
          totalCount: users.length,
          items: users,
        },
        groups: {
          totalCount: groups.length,
          items: groups,
        },
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.googleWorkspace });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      queryClient.invalidateQueries({ queryKey: queryKeys.googleConnection });

      const messages: string[] = [];
      if (data.profile) messages.push(`Perfil: ${data.profile.email}`);
      if (data.users.totalCount > 0) messages.push(`${data.users.totalCount} usuários`);
      if (data.groups.totalCount > 0) messages.push(`${data.groups.totalCount} grupos`);

      toast.success('Sincronização concluída', {
        description: messages.length > 0 ? messages.join(', ') : 'Dados do perfil carregados'
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na sincronização Google', {
        description: error.message
      });
    }
  });
};

export const useGoogleOAuthRevoke = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-oauth-revoke');

      if (error) {
        throw new Error(extractApiError(error));
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao revogar conexão');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.googleConnection });
      queryClient.invalidateQueries({ queryKey: queryKeys.googleOAuthStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });

      toast.success('Conexão revogada', {
        description: 'A integração com o Google foi desconectada.'
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao revogar', {
        description: error.message
      });
    }
  });
};

export const useGoogleOAuthDiagnostic = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-oauth-start', {
        body: { diagnostic: true }
      });

      if (error) {
        throw new Error(extractApiError(error));
      }

      if (!data?.diagnostic) {
        throw new Error(data?.error || 'Resposta inesperada');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Diagnóstico Concluído', {
        description: 'Verifique as informações abaixo e compare com o Google Cloud Console'
      });
    },
    onError: (error: Error) => {
      toast.error('Erro no Diagnóstico', {
        description: error.message
      });
    }
  });
};
