import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type OrganizationPlan = 'free' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  user_id: string;
  display_name: string | null;
  email?: string;
  role_in_org: 'admin' | 'member' | 'viewer';
  avatar_url: string | null;
}

export interface UserProfile {
  org_id: string | null;
  role_in_org: 'admin' | 'member' | 'viewer' | null;
  organization: Organization | null;
}

export function useOrganization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar organização do usuário atual
  const { 
    data: profile, 
    isLoading: isLoadingProfile,
    error: profileError 
  } = useQuery({
    queryKey: ['user-organization', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          org_id,
          role_in_org,
          organizations:org_id (
            id,
            name,
            slug,
            plan,
            settings,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }

      // Handle the joined data structure
      const orgData = data?.organizations as unknown as Organization | null;

      return {
        org_id: data?.org_id ?? null,
        role_in_org: data?.role_in_org as UserProfile['role_in_org'],
        organization: orgData,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });

  // Buscar membros da organização
  const { 
    data: members = [], 
    isLoading: isLoadingMembers 
  } = useQuery({
    queryKey: ['organization-members', profile?.org_id],
    queryFn: async (): Promise<OrganizationMember[]> => {
      if (!profile?.org_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, role_in_org, avatar_url')
        .eq('org_id', profile.org_id)
        .order('display_name');

      if (error) {
        console.error('Error fetching organization members:', error);
        return [];
      }

      return (data || []).map(member => ({
        user_id: member.user_id,
        display_name: member.display_name,
        role_in_org: (member.role_in_org || 'member') as OrganizationMember['role_in_org'],
        avatar_url: member.avatar_url,
      }));
    },
    enabled: !!profile?.org_id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Atualizar organização
  const updateOrganization = useMutation({
    mutationFn: async (updates: { name?: string; settings?: Record<string, unknown> }) => {
      if (!profile?.org_id) throw new Error('No organization found');

      // Build update object with proper typing
      const updatePayload: Record<string, unknown> = {};
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.settings !== undefined) updatePayload.settings = updates.settings;

      const { data, error } = await supabase
        .from('organizations')
        .update(updatePayload)
        .eq('id', profile.org_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Organização atualizada',
        description: 'As configurações foram salvas com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-organization'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar role de um membro
  const updateMemberRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: OrganizationMember['role_in_org'] }) => {
      if (!profile?.org_id) throw new Error('No organization found');
      if (profile.role_in_org !== 'admin') throw new Error('Only admins can change roles');

      const { error } = await supabase
        .from('profiles')
        .update({ role_in_org: role })
        .eq('user_id', userId)
        .eq('org_id', profile.org_id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Permissão atualizada',
        description: 'O papel do membro foi alterado.',
      });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verificações de permissão
  const isAdmin = profile?.role_in_org === 'admin';
  const isMember = profile?.role_in_org === 'member' || isAdmin;
  const isViewer = profile?.role_in_org === 'viewer' || isMember;

  return {
    // Dados
    organization: profile?.organization ?? null,
    orgId: profile?.org_id ?? null,
    roleInOrg: profile?.role_in_org ?? null,
    members,

    // Loading states
    isLoading: isLoadingProfile,
    isLoadingMembers,
    error: profileError,

    // Permissões
    isAdmin,
    isMember,
    isViewer,

    // Ações
    updateOrganization: updateOrganization.mutateAsync,
    updateMemberRole: updateMemberRole.mutateAsync,
    isUpdating: updateOrganization.isPending || updateMemberRole.isPending,

    // Refresh
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['user-organization'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
  };
}

// Hook para obter org_id de forma simples (útil para inserts)
export function useOrgId(): string | null {
  const { orgId } = useOrganization();
  return orgId;
}
