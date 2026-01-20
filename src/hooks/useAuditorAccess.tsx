import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface AuditorToken {
  id: string;
  userId: string;
  auditorEmail: string | null;
  auditorName: string | null;
  companyName: string | null;
  auditType: string | null;
  permissions: {
    view_evidence: boolean;
    view_inventory: boolean;
    view_history: boolean;
  };
  expiresAt: string;
  lastAccessedAt: string | null;
  accessCount: number;
  isRevoked: boolean;
  createdAt: string;
  // Note: token is intentionally NOT included - it's only shown once during creation
}

export interface CreateAuditorTokenInput {
  auditorEmail?: string;
  auditorName?: string;
  companyName?: string;
  auditType?: string;
  expiresInDays: number;
  permissions?: {
    view_evidence?: boolean;
    view_inventory?: boolean;
    view_history?: boolean;
  };
}

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a token using SHA-256
 * We use SHA-256 instead of bcrypt because:
 * 1. Tokens are already 256 bits of entropy (not passwords that need slow hashing)
 * 2. SHA-256 is faster and doesn't require additional dependencies
 * 3. The high entropy makes rainbow table attacks infeasible
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function useAuditorAccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading, refetch } = useQuery({
    queryKey: ['auditor-tokens', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('auditor_access_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        // Note: We don't include the token in the returned data for security
        auditorEmail: item.auditor_email,
        auditorName: item.auditor_name,
        companyName: item.company_name,
        auditType: item.audit_type,
        permissions: item.permissions as AuditorToken['permissions'],
        expiresAt: item.expires_at,
        lastAccessedAt: item.last_accessed_at,
        accessCount: item.access_count,
        isRevoked: item.is_revoked,
        createdAt: item.created_at,
      })) as AuditorToken[];
    },
    enabled: !!user?.id,
  });

  const createTokenMutation = useMutation({
    mutationFn: async (input: CreateAuditorTokenInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Generate secure token and hash it
      const token = generateSecureToken();
      const tokenHash = await hashToken(token);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const { data, error } = await supabase
        .from('auditor_access_tokens')
        .insert({
          user_id: user.id,
          token: '', // Empty string for legacy column - will be removed in future migration
          token_hash: tokenHash, // Store only the hash
          auditor_email: input.auditorEmail || null,
          auditor_name: input.auditorName || null,
          company_name: input.companyName || null,
          audit_type: input.auditType || null,
          permissions: {
            view_evidence: input.permissions?.view_evidence ?? true,
            view_inventory: input.permissions?.view_inventory ?? true,
            view_history: input.permissions?.view_history ?? true,
          },
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action_type: 'auditor_token_created',
        action_category: 'audit',
        resource_type: 'auditor_access_token',
        resource_id: data.id,
        description: `Token de auditor criado para: ${input.auditorName || input.auditorEmail || 'Auditor'}`,
        metadata: {
          auditor_email: input.auditorEmail,
          company_name: input.companyName,
          audit_type: input.auditType,
          expires_at: expiresAt.toISOString(),
        },
      });

      // Return the plaintext token ONLY ONCE - it cannot be retrieved again
      return { ...data, token };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditor-tokens'] });
      toast({
        title: 'Token criado',
        description: 'Link seguro gerado com sucesso. Copie agora - ele não será exibido novamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('auditor_access_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log to audit
      await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action_type: 'auditor_token_revoked',
        action_category: 'audit',
        resource_type: 'auditor_access_token',
        resource_id: tokenId,
        description: 'Token de auditor revogado',
        metadata: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditor-tokens'] });
      toast({
        title: 'Token revogado',
        description: 'O link de acesso foi desativado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao revogar token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const activeTokens = tokens.filter(t => !t.isRevoked && new Date(t.expiresAt) > new Date());
  const expiredTokens = tokens.filter(t => t.isRevoked || new Date(t.expiresAt) <= new Date());

  return {
    tokens,
    activeTokens,
    expiredTokens,
    isLoading,
    refetch,
    createToken: createTokenMutation.mutateAsync,
    isCreating: createTokenMutation.isPending,
    revokeToken: revokeTokenMutation.mutate,
    isRevoking: revokeTokenMutation.isPending,
  };
}

/**
 * Hook to validate token (for public auditor portal)
 * 
 * SECURITY: This validates tokens by hashing the input and comparing with stored hashes.
 * If the database is compromised, attackers cannot use the hashes to access the portal.
 */
export function useValidateAuditorToken(token: string | null) {
  return useQuery({
    queryKey: ['validate-auditor-token', token],
    queryFn: async () => {
      if (!token) return null;

      // Hash the input token for comparison
      const inputTokenHash = await hashToken(token);

      // Find token by hash
      const { data, error } = await supabase
        .from('auditor_access_tokens')
        .select('*')
        .eq('token_hash', inputTokenHash)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        console.error('Token validation error:', error);
        return null;
      }

      // Update access count and last accessed
      await supabase
        .from('auditor_access_tokens')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (data.access_count || 0) + 1,
        })
        .eq('id', data.id);

      return {
        id: data.id,
        userId: data.user_id,
        auditorName: data.auditor_name,
        companyName: data.company_name,
        auditType: data.audit_type,
        permissions: data.permissions as AuditorToken['permissions'],
        expiresAt: data.expires_at,
      };
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
