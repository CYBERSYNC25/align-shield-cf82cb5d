import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useObjectPermissions');

export type ObjectType = 'control' | 'risk' | 'policy' | 'framework' | 'audit';
export type PermissionLevel = 'owner' | 'reviewer' | 'viewer';

export interface ObjectPermission {
  id: string;
  user_id: string;
  object_type: ObjectType;
  object_id: string;
  permission_level: PermissionLevel;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  notes: string | null;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GrantPermissionInput {
  userId: string;
  level: PermissionLevel;
  notes?: string;
  expiresAt?: string;
}

/**
 * Hook dedicado para gerenciar permissões de um objeto específico
 * Segue modelo Vanta de object-level permissions
 */
export function useObjectPermissions(objectType: ObjectType, objectId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ['object-permissions', objectType, objectId];

  // Buscar permissões do objeto
  const { data: permissions, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!objectId) return [];

      // First get permissions
      const { data: perms, error: permsError } = await supabase
        .from('object_permissions')
        .select('*')
        .eq('object_type', objectType)
        .eq('object_id', objectId);

      if (permsError) {
        logger.error('Error fetching object permissions', permsError);
        throw permsError;
      }

      // Then get profiles for each user
      const userIds = perms.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        logger.error('Error fetching profiles', profilesError);
      }

      // Merge data
      return perms.map(p => ({
        ...p,
        object_type: p.object_type as ObjectType,
        permission_level: p.permission_level as PermissionLevel,
        profiles: profiles?.find(prof => prof.user_id === p.user_id) ?? null
      })) as ObjectPermission[];
    },
    enabled: !!objectId
  });

  // Adicionar/atualizar permissão
  const addPermission = useMutation({
    mutationFn: async ({ userId, level, notes, expiresAt }: GrantPermissionInput) => {
      const { error } = await supabase
        .from('object_permissions')
        .upsert({
          user_id: userId,
          object_type: objectType,
          object_id: objectId,
          permission_level: level,
          granted_by: user?.id,
          notes,
          expires_at: expiresAt
        }, {
          onConflict: 'user_id,object_type,object_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Permissão concedida',
        description: 'O acesso foi configurado com sucesso'
      });
    },
    onError: (error) => {
      logger.error('Error adding permission', error);
      toast({
        title: 'Erro ao conceder permissão',
        description: 'Não foi possível configurar o acesso',
        variant: 'destructive'
      });
    }
  });

  // Remover permissão
  const removePermission = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('object_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Permissão removida',
        description: 'O acesso foi revogado com sucesso'
      });
    },
    onError: (error) => {
      logger.error('Error removing permission', error);
      toast({
        title: 'Erro ao remover permissão',
        description: 'Não foi possível revogar o acesso',
        variant: 'destructive'
      });
    }
  });

  // Atualizar permissão
  const updatePermission = useMutation({
    mutationFn: async ({ 
      permissionId, 
      level, 
      notes 
    }: { 
      permissionId: string; 
      level: PermissionLevel; 
      notes?: string 
    }) => {
      const { error } = await supabase
        .from('object_permissions')
        .update({
          permission_level: level,
          notes
        })
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Permissão atualizada',
        description: 'O nível de acesso foi alterado'
      });
    },
    onError: (error) => {
      logger.error('Error updating permission', error);
      toast({
        title: 'Erro ao atualizar permissão',
        variant: 'destructive'
      });
    }
  });

  // Verificar se usuário atual tem permissão específica
  const hasPermission = (requiredLevel: PermissionLevel): boolean => {
    if (!user || !permissions) return false;

    const userPermission = permissions.find(p => p.user_id === user.id);
    if (!userPermission) return false;

    const levels: PermissionLevel[] = ['viewer', 'reviewer', 'owner'];
    return levels.indexOf(userPermission.permission_level) >= levels.indexOf(requiredLevel);
  };

  // Obter permissão do usuário atual
  const getCurrentUserPermission = (): PermissionLevel | null => {
    if (!user || !permissions) return null;
    const userPermission = permissions.find(p => p.user_id === user.id);
    return userPermission?.permission_level ?? null;
  };

  return {
    permissions: permissions ?? [],
    isLoading,
    error,
    addPermission,
    removePermission,
    updatePermission,
    hasPermission,
    getCurrentUserPermission
  };
}

/**
 * Hook para buscar todas as permissões de objeto do usuário atual
 */
export function useMyObjectPermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-object-permissions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('object_permissions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error fetching user permissions', error);
        throw error;
      }

      return data as Omit<ObjectPermission, 'profiles'>[];
    },
    enabled: !!user
  });
}
