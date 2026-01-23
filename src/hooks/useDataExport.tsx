/**
 * Hook para gerenciar exportação de dados LGPD e exclusão de conta
 * 
 * @module useDataExport
 * @description
 * - Gerencia solicitações de exportação de dados (portabilidade LGPD)
 * - Gerencia exclusão de conta com soft delete
 * - Permite cancelar exclusão agendada
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DataExportRequest {
  id: string;
  user_id: string;
  org_id: string | null;
  request_type: 'export' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requested_at: string;
  completed_at: string | null;
  file_url: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  expires_at: string | null;
  created_at: string;
}

export interface ExportResult {
  success: boolean;
  export_id: string;
  download_url: string | null;
  expires_at: string;
  total_records: number;
  message: string;
}

export interface DeletionResult {
  success: boolean;
  message: string;
  deletion_scheduled_for?: string;
  retention_days?: number;
}

export interface DeletionStatus {
  isScheduled: boolean;
  scheduledFor: Date | null;
  reason: string | null;
}

export function useDataExport() {
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar histórico de exportações
  const { data: exportRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['data-export-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DataExportRequest[];
    },
    enabled: !!user,
  });

  // Buscar status de exclusão agendada
  const { data: deletionStatus, refetch: refetchDeletionStatus } = useQuery({
    queryKey: ['deletion-status', user?.id],
    queryFn: async (): Promise<DeletionStatus> => {
      if (!user) return { isScheduled: false, scheduledFor: null, reason: null };

      const { data, error } = await supabase
        .from('profiles')
        .select('deleted_at, deletion_scheduled_for, deletion_reason')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching deletion status:', error);
        return { isScheduled: false, scheduledFor: null, reason: null };
      }

      return {
        isScheduled: !!data?.deleted_at,
        scheduledFor: data?.deletion_scheduled_for ? new Date(data.deletion_scheduled_for) : null,
        reason: data?.deletion_reason || null,
      };
    },
    enabled: !!user,
  });

  // Última exportação concluída
  const lastCompletedExport = exportRequests.find(
    r => r.request_type === 'export' && r.status === 'completed'
  );

  // Exportação em andamento
  const pendingExport = exportRequests.find(
    r => r.request_type === 'export' && (r.status === 'pending' || r.status === 'processing')
  );

  // Solicitar exportação de dados
  const requestExport = useCallback(async (includeActivityLogs = true): Promise<ExportResult | null> => {
    if (!session?.access_token) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para exportar seus dados.",
        variant: "destructive"
      });
      return null;
    }

    setIsExporting(true);

    try {
      const response = await fetch(
        `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/export-user-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ include_activity_logs: includeActivityLogs }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao exportar dados');
      }

      toast({
        title: "Exportação concluída!",
        description: `${result.total_records} registros exportados. O link expira em 24 horas.`,
      });

      // Recarregar lista de exportações
      await refetchRequests();

      return result as ExportResult;
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar seus dados.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [session, toast, refetchRequests]);

  // Solicitar exclusão de conta
  const requestDeletion = useCallback(async (password: string, reason?: string): Promise<DeletionResult | null> => {
    if (!session?.access_token) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para excluir sua conta.",
        variant: "destructive"
      });
      return null;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/delete-user-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password, reason }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao excluir conta');
      }

      toast({
        title: "Exclusão agendada",
        description: result.message,
      });

      // Recarregar status
      await refetchDeletionStatus();

      // Deslogar o usuário
      setTimeout(() => signOut(), 2000);

      return result as DeletionResult;
    } catch (error: any) {
      console.error('Deletion error:', error);
      toast({
        title: "Erro na exclusão",
        description: error.message || "Não foi possível processar a exclusão.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsDeleting(false);
    }
  }, [session, toast, refetchDeletionStatus, signOut]);

  // Cancelar exclusão agendada
  const cancelDeletion = useCallback(async (): Promise<boolean> => {
    if (!session?.access_token) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const response = await fetch(
        `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/delete-user-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancel_deletion: true, password: '' }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao cancelar exclusão');
      }

      toast({
        title: "Exclusão cancelada",
        description: "Sua conta não será mais excluída.",
      });

      await refetchDeletionStatus();
      return true;
    } catch (error: any) {
      console.error('Cancel deletion error:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar a exclusão.",
        variant: "destructive"
      });
      return false;
    }
  }, [session, toast, refetchDeletionStatus]);

  return {
    // Exportação
    requestExport,
    exportRequests,
    isExporting,
    isLoadingRequests,
    lastCompletedExport,
    pendingExport,
    refetchRequests,

    // Exclusão
    requestDeletion,
    cancelDeletion,
    isDeleting,
    deletionStatus: deletionStatus || { isScheduled: false, scheduledFor: null, reason: null },
    refetchDeletionStatus,
  };
}
