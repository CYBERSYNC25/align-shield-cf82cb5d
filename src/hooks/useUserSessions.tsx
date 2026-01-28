/**
 * Hook for managing user sessions
 * 
 * Provides functions to list, revoke, and manage user sessions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UserSession {
  id: string;
  device_info: string;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet';
  ip_address: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}

const SUPABASE_URL = 'https://ofbyxnpprwwuieabwhdo.supabase.co';

export function useUserSessions() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['user-sessions'],
    queryFn: async (): Promise<UserSession[]> => {
      if (!session?.access_token) {
        return [];
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/session-manager/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch sessions');
      }

      const data = await response.json();
      return data.sessions || [];
    },
    enabled: !!session?.access_token,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useCreateSession() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/session-manager/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Store session ID for activity updates
      if (data.sessionId) {
        localStorage.setItem('current_session_id', data.sessionId);
      }
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
  });
}

export function useUpdateSessionActivity() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/session-manager/update-activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update activity');
      }

      return response.json();
    },
  });
}

export function useRevokeSession() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, reason = 'manual' }: { sessionId: string; reason?: string }) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/session-manager/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke session');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sessão encerrada',
        description: 'A sessão foi encerrada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao encerrar sessão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRevokeAllOtherSessions() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentSessionId: string) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/session-manager/revoke-all-others`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentSessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke sessions');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sessões encerradas',
        description: `${data.revokedCount || 0} sessão(ões) encerrada(s) com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao encerrar sessões',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCurrentSessionId() {
  return localStorage.getItem('current_session_id');
}

// Format relative time for display
export function formatLastActive(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'Agora';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'} atrás`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} atrás`;
  }
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} atrás`;
  }

  return date.toLocaleDateString('pt-BR');
}

// Format location for display
export function formatSessionLocation(city: string | null, country: string | null): string {
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (country) {
    return country;
  }
  if (city) {
    return city;
  }
  return 'Localização desconhecida';
}
