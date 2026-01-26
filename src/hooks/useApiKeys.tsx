import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_tier: 'free' | 'pro' | 'enterprise';
  requests_today: number;
  last_request_at: string | null;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

interface CreateApiKeyInput {
  name: string;
  scopes?: string[];
  rate_limit_tier?: 'free' | 'pro' | 'enterprise';
  expires_in_days?: number;
}

// Generate a secure API key
function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const key = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  return `apoc_${key}`;
}

// Hash API key using SHA-256
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Fetch all API keys
  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, rate_limit_tier, requests_today, last_request_at, expires_at, is_revoked, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!user?.id,
  });

  // Create new API key
  const createMutation = useMutation({
    mutationFn: async (input: CreateApiKeyInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get user's org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      const rawKey = generateApiKey();
      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12) + '...';

      const expiresAt = input.expires_in_days
        ? new Date(Date.now() + input.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          org_id: profile?.org_id,
          name: input.name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes: input.scopes || ['read'],
          rate_limit_tier: input.rate_limit_tier || 'free',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      return { ...data, rawKey };
    },
    onSuccess: (data) => {
      setNewlyCreatedKey(data.rawKey);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'API Key criada',
        description: 'Copie a chave agora - ela não será exibida novamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Revoke API key
  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_revoked: true, revoked_at: new Date().toISOString() })
        .eq('id', keyId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'API Key revogada',
        description: 'A chave foi desativada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao revogar API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete API key
  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'API Key excluída',
        description: 'A chave foi removida permanentemente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const clearNewlyCreatedKey = useCallback(() => {
    setNewlyCreatedKey(null);
  }, []);

  return {
    apiKeys: apiKeys || [],
    isLoading,
    error,
    newlyCreatedKey,
    clearNewlyCreatedKey,
    createApiKey: createMutation.mutate,
    isCreating: createMutation.isPending,
    revokeApiKey: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
    deleteApiKey: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
