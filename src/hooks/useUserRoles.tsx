import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type AppRole = 'admin' | 'auditor' | 'compliance_officer' | 'viewer' | 'master_admin' | 'master_ti' | 'master_governance';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string | null;
  assigned_at: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRoles();
    }
  }, [user]);

  const loadUserRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      setRoles(data.map(r => r.role as AppRole));
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Erro ao carregar permissões',
        description: 'Não foi possível carregar suas permissões',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const isAdmin = () => hasRole('admin');
  const isAuditor = () => hasRole('auditor');
  const isComplianceOfficer = () => hasRole('compliance_officer');
  const isViewer = () => hasRole('viewer');
  const isMasterAdmin = () => hasRole('master_admin');
  const isMasterTI = () => hasRole('master_ti');
  const isMasterGovernance = () => hasRole('master_governance');
  
  const isMasterUser = () => isMasterAdmin() || isMasterTI() || isMasterGovernance();

  const canManageUsers = () => isAdmin();
  const canManageControls = () => isAdmin() || isComplianceOfficer();
  const canViewAuditLogs = () => isAdmin() || isAuditor();
  const canApproveDocuments = () => isAdmin() || isComplianceOfficer();

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isAuditor,
    isComplianceOfficer,
    isViewer,
    isMasterAdmin,
    isMasterTI,
    isMasterGovernance,
    isMasterUser,
    canManageUsers,
    canManageControls,
    canViewAuditLogs,
    canApproveDocuments,
    refresh: loadUserRoles
  };
};
