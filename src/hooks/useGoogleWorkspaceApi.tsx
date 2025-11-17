/**
 * Hook para consumir a API do Google Workspace
 * 
 * Fornece funções tipadas para chamar endpoints do Google Workspace
 * com tratamento automático de erros, feedback visual e renovação de tokens.
 * 
 * @example
 * ```tsx
 * const { getUserProfile, listUsers, loading, error } = useGoogleWorkspaceApi();
 * 
 * // Buscar perfil do usuário
 * const profile = await getUserProfile();
 * if (profile) {
 *   console.log('Email:', profile.email);
 * }
 * 
 * // Listar usuários do domínio
 * const users = await listUsers({ maxResults: 50, domain: 'empresa.com' });
 * ```
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============= INTERFACES =============

/**
 * Perfil do usuário autenticado (OAuth2 UserInfo)
 */
export interface GoogleUserProfile {
  id: string;              // ID único do Google
  email: string;           // Email verificado
  verified_email: boolean; // Email foi verificado?
  name: string;            // Nome completo
  given_name: string;      // Primeiro nome
  family_name: string;     // Sobrenome
  picture: string;         // URL do avatar
  locale: string;          // Idioma (ex: pt-BR)
  hd?: string;             // Domínio da organização (ex: empresa.com)
}

/**
 * Usuário do Google Workspace (Admin SDK)
 */
export interface WorkspaceUser {
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
  agreedToTerms?: boolean;
}

/**
 * Grupo do Google Workspace
 */
export interface WorkspaceGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: number;
}

/**
 * Log de auditoria
 */
export interface AuditLog {
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

/**
 * Parâmetros para sincronização
 */
interface SyncParams {
  maxResults?: number;    // Máximo de resultados (padrão: 100)
  domain?: string;        // Filtrar por domínio
  pageToken?: string;     // Token de paginação
  customer?: string;      // ID do cliente (padrão: 'my_customer')
  query?: string;         // Query de busca
  orderBy?: string;       // Campo para ordenar
}

/**
 * Parâmetros para audit logs
 */
interface AuditParams extends SyncParams {
  applicationName?: string;  // admin, drive, login, token, etc
  startTime: string;         // Data inicial (RFC 3339)
  endTime?: string;          // Data final (opcional)
  userKey?: string;          // 'all' ou email específico
}

// ============= HOOK =============

export const useGoogleWorkspaceApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Chama a edge function google-workspace-sync
   * Trata erros automaticamente e exibe toasts
   */
  const callAPI = async (action: string, params?: any): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`[GoogleAPI] Calling ${action}`, params);

      const { data, error: functionError } = await supabase.functions.invoke('google-workspace-sync', {
        body: { action, params: params || {} }
      });

      if (functionError) {
        console.error('[GoogleAPI] Function error:', functionError);
        throw new Error(functionError.message);
      }

      if (!data.success) {
        console.error('[GoogleAPI] API error:', data);
        
        // Tratamento específico por código de erro
        switch (data.code) {
          case 'TOKEN_EXPIRED':
            toast({
              title: '🔑 Token expirado',
              description: 'Seu token OAuth expirou. Clique em "Renovar Token" na aba OAuth 2.0.',
              variant: 'destructive'
            });
            break;
          
          case 'FORBIDDEN':
            toast({
              title: '⛔ Sem permissão',
              description: data.error,
              variant: 'destructive'
            });
            break;
          
          case 'RATE_LIMIT':
            toast({
              title: '⏳ Muitas requisições',
              description: 'Aguarde alguns minutos antes de tentar novamente.',
              variant: 'destructive'
            });
            break;
          
          case 'SERVER_ERROR':
            toast({
              title: '🔧 Erro no servidor',
              description: 'Erro temporário do Google. Tente novamente em alguns instantes.',
              variant: 'destructive'
            });
            break;
          
          default:
            toast({
              title: '❌ Erro na requisição',
              description: data.error || 'Falha ao buscar dados do Google Workspace',
              variant: 'destructive'
            });
        }
        
        throw new Error(data.error);
      }

      console.log('[GoogleAPI] Success:', data);
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('[GoogleAPI] Exception:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obter perfil do usuário autenticado
   * 
   * @returns Perfil do usuário ou null em caso de erro
   * 
   * @example
   * const profile = await getUserProfile();
   * if (profile) {
   *   console.log('Usuário:', profile.name);
   *   console.log('Email:', profile.email);
   *   console.log('Organização:', profile.hd); // pode ser undefined
   * }
   */
  const getUserProfile = async (): Promise<GoogleUserProfile | null> => {
    const result = await callAPI('get_user_profile');
    
    if (result?.profile) {
      toast({
        title: '✅ Perfil carregado',
        description: `Bem-vindo, ${result.profile.name}!`
      });
    }
    
    return result?.profile || null;
  };

  /**
   * Listar usuários do Google Workspace
   * 
   * @param params - Parâmetros de filtro e paginação
   * @returns Lista de usuários com metadados ou null
   * 
   * @example
   * // Listar primeiros 50 usuários
   * const result = await listUsers({ maxResults: 50 });
   * 
   * // Filtrar por domínio específico
   * const result = await listUsers({ 
   *   domain: 'empresa.com',
   *   maxResults: 100 
   * });
   * 
   * // Paginação
   * const result = await listUsers({ 
   *   pageToken: 'ABC123...' 
   * });
   */
  const listUsers = async (params?: SyncParams): Promise<{
    users: WorkspaceUser[];
    metadata: {
      totalCount: number;
      syncedAt: string;
      nextPageToken: string | null;
    };
  } | null> => {
    const result = await callAPI('list_users', params);
    
    if (result?.users) {
      toast({
        title: '✅ Usuários carregados',
        description: `${result.metadata.totalCount} usuários encontrados${params?.domain ? ` no domínio ${params.domain}` : ''}.`
      });
    }
    
    return result;
  };

  /**
   * Listar grupos do Google Workspace
   * 
   * @param params - Parâmetros de filtro
   * @returns Lista de grupos ou null
   * 
   * @example
   * const result = await listGroups({ maxResults: 30 });
   * if (result) {
   *   result.groups.forEach(group => {
   *     console.log(`${group.name} (${group.email}): ${group.directMembersCount} membros`);
   *   });
   * }
   */
  const listGroups = async (params?: SyncParams): Promise<{
    groups: WorkspaceGroup[];
    metadata: {
      totalCount: number;
      syncedAt: string;
      nextPageToken: string | null;
    };
  } | null> => {
    const result = await callAPI('list_groups', params);
    
    if (result?.groups) {
      toast({
        title: '✅ Grupos carregados',
        description: `${result.metadata.totalCount} grupos encontrados.`
      });
    }
    
    return result;
  };

  /**
   * Obter logs de auditoria
   * 
   * @param params - Parâmetros incluindo startTime obrigatório
   * @returns Logs de auditoria ou null
   * 
   * @example
   * // Logs de login dos últimos 7 dias
   * const result = await getAuditLogs({
   *   applicationName: 'login',
   *   startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
   *   maxResults: 100
   * });
   * 
   * // Logs de admin do usuário específico
   * const result = await getAuditLogs({
   *   applicationName: 'admin',
   *   userKey: 'user@empresa.com',
   *   startTime: '2025-11-01T00:00:00Z'
   * });
   */
  const getAuditLogs = async (params: AuditParams): Promise<{
    auditLogs: AuditLog[];
    metadata: {
      totalCount: number;
      syncedAt: string;
      applicationName: string;
      startTime: string;
      endTime: string;
    };
  } | null> => {
    if (!params.startTime) {
      toast({
        title: '❌ Parâmetro obrigatório',
        description: 'startTime é obrigatório para buscar audit logs.',
        variant: 'destructive'
      });
      return null;
    }

    const result = await callAPI('get_audit_logs', params);
    
    if (result?.auditLogs) {
      toast({
        title: '✅ Logs carregados',
        description: `${result.metadata.totalCount} eventos de auditoria encontrados.`
      });
    }
    
    return result;
  };

  return {
    getUserProfile,
    listUsers,
    listGroups,
    getAuditLogs,
    loading,
    error
  };
};
