import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRoles } from './useUserRoles';
import { useToast } from './use-toast';

export interface MFAStatus {
  enabled: boolean;
  enabledAt: Date | null;
  requiresMfa: boolean;
  pendingSetup: boolean;
  lastUsedAt: Date | null;
}

export interface MFASetupData {
  qrCodeUrl: string;
  otpauthUrl: string;
  backupCodes: string[];
}

export const useMFA = () => {
  const { user } = useAuth();
  const { isAdmin, isMasterAdmin } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check MFA status
  const { data: mfaStatus, isLoading, refetch } = useQuery({
    queryKey: ['mfa-status', user?.id],
    queryFn: async (): Promise<MFAStatus> => {
      if (!user) {
        return {
          enabled: false,
          enabledAt: null,
          requiresMfa: false,
          pendingSetup: false,
          lastUsedAt: null
        };
      }

      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('enabled_at, last_used_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching MFA status:', error);
      }

      const requiresMfa = isAdmin() || isMasterAdmin();
      const enabled = !!data?.enabled_at;

      return {
        enabled,
        enabledAt: data?.enabled_at ? new Date(data.enabled_at) : null,
        requiresMfa,
        pendingSetup: !enabled && requiresMfa,
        lastUsedAt: data?.last_used_at ? new Date(data.last_used_at) : null
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Setup MFA - get QR code and backup codes
  const setupMfa = useMutation({
    mutationFn: async (): Promise<MFASetupData> => {
      const { data, error } = await supabase.functions.invoke('mfa-setup', {
        method: 'POST'
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Falha ao configurar MFA');

      return {
        qrCodeUrl: data.qrCodeUrl,
        otpauthUrl: data.otpauthUrl,
        backupCodes: data.backupCodes
      };
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao configurar MFA',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Verify code (for setup, login, or sensitive actions)
  const verifyCode = useMutation({
    mutationFn: async ({ code, action }: { code: string; action: 'setup' | 'login' | 'sensitive' }) => {
      const { data, error } = await supabase.functions.invoke('mfa-verify', {
        method: 'POST',
        body: { code, action }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Código inválido');

      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.action === 'setup') {
        queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
        toast({
          title: 'MFA Ativado!',
          description: 'Autenticação de dois fatores ativada com sucesso.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Código inválido',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Disable MFA
  const disableMfa = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke('mfa-disable', {
        method: 'POST',
        body: { code }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Falha ao desabilitar MFA');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
      toast({
        title: 'MFA Desabilitado',
        description: 'Autenticação de dois fatores foi desabilitada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao desabilitar MFA',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    mfaStatus,
    isLoading,
    setupMfa,
    verifyCode,
    disableMfa,
    refetch
  };
};
