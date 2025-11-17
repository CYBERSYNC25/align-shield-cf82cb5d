/**
 * Hook for syncing data from Google Workspace
 * 
 * Provides functions to fetch users, groups, and audit logs from Google Workspace
 * using the google-workspace-sync edge function.
 * 
 * @example
 * ```tsx
 * const { syncUsers, syncGroups, syncAuditLogs, loading, error } = useGoogleWorkspaceSync();
 * 
 * // Fetch users
 * const handleSyncUsers = async () => {
 *   const result = await syncUsers({ maxResults: 100, domain: 'example.com' });
 *   if (result) {
 *     console.log('Users:', result.users);
 *   }
 * };
 * ```
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncParams {
  maxResults?: number;
  domain?: string;
  pageToken?: string;
  startTime?: string;
  endTime?: string;
  applicationName?: string;
}

interface User {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName: string;
    familyName: string;
  };
  isAdmin: boolean;
  suspended: boolean;
  orgUnitPath: string;
  lastLoginTime?: string;
  creationTime: string;
}

interface Group {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: number;
}

interface AuditLog {
  id: {
    time: string;
    uniqueQualifier: string;
  };
  actor: {
    email: string;
    profileId: string;
  };
  events: Array<{
    type: string;
    name: string;
    parameters?: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

interface SyncResult<T> {
  data: T[];
  metadata: {
    totalCount: number;
    syncedAt: string;
    nextPageToken: string | null;
  };
}

export const useGoogleWorkspaceSync = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Sync users from Google Workspace
   * 
   * @param params - Query parameters for the API call
   * @returns Users list with metadata or null if error
   * 
   * @example
   * const result = await syncUsers({ maxResults: 50, domain: 'example.com' });
   */
  const syncUsers = async (params?: SyncParams): Promise<SyncResult<User> | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('google-workspace-sync', {
        body: {
          action: 'list_users',
          params: params || {},
        },
      });

      if (functionError) throw functionError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync users');
      }

      toast({
        title: 'Usuários sincronizados',
        description: `${data.data.metadata.totalCount} usuários carregados com sucesso.`,
      });

      return {
        data: data.data.users,
        metadata: data.data.metadata,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao sincronizar usuários';
      setError(errorMessage);
      
      toast({
        title: 'Erro na sincronização',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync groups from Google Workspace
   * 
   * @param params - Query parameters for the API call
   * @returns Groups list with metadata or null if error
   * 
   * @example
   * const result = await syncGroups({ maxResults: 30 });
   */
  const syncGroups = async (params?: SyncParams): Promise<SyncResult<Group> | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('google-workspace-sync', {
        body: {
          action: 'list_groups',
          params: params || {},
        },
      });

      if (functionError) throw functionError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync groups');
      }

      toast({
        title: 'Grupos sincronizados',
        description: `${data.data.metadata.totalCount} grupos carregados com sucesso.`,
      });

      return {
        data: data.data.groups,
        metadata: data.data.metadata,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao sincronizar grupos';
      setError(errorMessage);
      
      toast({
        title: 'Erro na sincronização',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync audit logs from Google Workspace
   * 
   * @param params - Query parameters for the API call
   * @returns Audit logs with metadata or null if error
   * 
   * @example
   * const result = await syncAuditLogs({ 
   *   maxResults: 100,
   *   startTime: '2024-01-01T00:00:00Z',
   *   applicationName: 'admin'
   * });
   */
  const syncAuditLogs = async (params?: SyncParams): Promise<SyncResult<AuditLog> | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('google-workspace-sync', {
        body: {
          action: 'get_audit_logs',
          params: params || {},
        },
      });

      if (functionError) throw functionError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync audit logs');
      }

      toast({
        title: 'Logs sincronizados',
        description: `${data.data.metadata.totalCount} logs de auditoria carregados.`,
      });

      return {
        data: data.data.auditLogs,
        metadata: data.data.metadata,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao sincronizar logs';
      setError(errorMessage);
      
      toast({
        title: 'Erro na sincronização',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    syncUsers,
    syncGroups,
    syncAuditLogs,
    loading,
    error,
  };
};
