import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useUserRoles');

// Org-Level Roles (Vanta model)
export type AppRole = 
  | 'admin' 
  | 'auditor' 
  | 'compliance_officer' 
  | 'viewer' 
  | 'master_admin' 
  | 'master_ti' 
  | 'master_governance'
  | 'editor'           // NEW - can edit but not manage users
  | 'view_only_admin'; // NEW - sees everything, edits nothing

// Object-Level Permission Types
export type ObjectType = 'control' | 'risk' | 'policy' | 'framework' | 'audit';
export type PermissionLevel = 'owner' | 'reviewer' | 'viewer';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string | null;
  assigned_at: string;
}

export interface ObjectPermission {
  id: string;
  objectType: ObjectType;
  objectId: string;
  permissionLevel: PermissionLevel;
}

// Role hierarchy and capabilities
const ROLE_CAPABILITIES = {
  master_admin: { manageUsers: true, editResources: true, viewAll: true, managePlatform: true },
  admin: { manageUsers: true, editResources: true, viewAll: true, managePlatform: false },
  editor: { manageUsers: false, editResources: true, viewAll: true, managePlatform: false },
  view_only_admin: { manageUsers: false, editResources: false, viewAll: true, managePlatform: false },
  compliance_officer: { manageUsers: false, editResources: true, viewAll: true, managePlatform: false },
  auditor: { manageUsers: false, editResources: false, viewAll: false, managePlatform: false },
  viewer: { manageUsers: false, editResources: false, viewAll: false, managePlatform: false },
  master_ti: { manageUsers: false, editResources: true, viewAll: true, managePlatform: false },
  master_governance: { manageUsers: false, editResources: true, viewAll: true, managePlatform: false },
} as const;

export const useUserRoles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [objectPermissions, setObjectPermissions] = useState<ObjectPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Load org-level roles
  const loadUserRoles = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      setRoles(data.map(r => r.role as AppRole));
    } catch (error) {
      logger.error('Error loading roles', error);
      toast({
        title: 'Erro ao carregar permissões',
        description: 'Não foi possível carregar suas permissões',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Load object-level permissions
  const loadObjectPermissions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('object_permissions')
        .select('id, object_type, object_id, permission_level')
        .eq('user_id', user.id);

      if (error) throw error;

      setObjectPermissions(data.map(p => ({
        id: p.id,
        objectType: p.object_type as ObjectType,
        objectId: p.object_id,
        permissionLevel: p.permission_level as PermissionLevel
      })));
    } catch (error) {
      logger.error('Error loading object permissions', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserRoles();
      loadObjectPermissions();
    }
  }, [user, loadUserRoles, loadObjectPermissions]);

  // ==========================================
  // ORG-LEVEL ROLE CHECKS
  // ==========================================

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  // Individual role checks
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isAuditor = useCallback(() => hasRole('auditor'), [hasRole]);
  const isComplianceOfficer = useCallback(() => hasRole('compliance_officer'), [hasRole]);
  const isViewer = useCallback(() => hasRole('viewer'), [hasRole]);
  const isMasterAdmin = useCallback(() => hasRole('master_admin'), [hasRole]);
  const isMasterTI = useCallback(() => hasRole('master_ti'), [hasRole]);
  const isMasterGovernance = useCallback(() => hasRole('master_governance'), [hasRole]);
  
  // NEW roles
  const isEditor = useCallback(() => hasRole('editor'), [hasRole]);
  const isViewOnlyAdmin = useCallback(() => hasRole('view_only_admin'), [hasRole]);
  
  // Role groups
  const isMasterUser = useCallback(() => 
    isMasterAdmin() || isMasterTI() || isMasterGovernance(), 
    [isMasterAdmin, isMasterTI, isMasterGovernance]
  );

  // ==========================================
  // CAPABILITY-BASED PERMISSIONS
  // ==========================================

  const getHighestCapabilities = useMemo(() => {
    const caps = { manageUsers: false, editResources: false, viewAll: false, managePlatform: false };
    
    for (const role of roles) {
      const roleCaps = ROLE_CAPABILITIES[role];
      if (roleCaps) {
        if (roleCaps.manageUsers) caps.manageUsers = true;
        if (roleCaps.editResources) caps.editResources = true;
        if (roleCaps.viewAll) caps.viewAll = true;
        if (roleCaps.managePlatform) caps.managePlatform = true;
      }
    }
    
    return caps;
  }, [roles]);

  // Permission checks based on capabilities
  const canManageUsers = useCallback(() => getHighestCapabilities.manageUsers, [getHighestCapabilities]);
  const canManageControls = useCallback(() => getHighestCapabilities.editResources, [getHighestCapabilities]);
  const canViewAuditLogs = useCallback(() => isAdmin() || isAuditor() || isMasterAdmin(), [isAdmin, isAuditor, isMasterAdmin]);
  const canApproveDocuments = useCallback(() => getHighestCapabilities.editResources, [getHighestCapabilities]);
  const canEditResources = useCallback(() => getHighestCapabilities.editResources, [getHighestCapabilities]);
  const canViewAll = useCallback(() => getHighestCapabilities.viewAll, [getHighestCapabilities]);

  // ==========================================
  // OBJECT-LEVEL PERMISSION CHECKS (Vanta Model)
  // ==========================================

  /**
   * Check if user has specific permission on an object
   * Hierarchy: owner > reviewer > viewer
   */
  const checkObjectPermission = useCallback((
    objectType: ObjectType,
    objectId: string,
    requiredLevel: PermissionLevel = 'viewer'
  ): boolean => {
    // Admins have full access
    if (isAdmin() || isMasterAdmin()) return true;

    // Editors have reviewer-level access to all objects (but not owner)
    if (isEditor() && requiredLevel !== 'owner') return true;

    // Check specific object permission
    const permission = objectPermissions.find(
      p => p.objectType === objectType && p.objectId === objectId
    );

    if (!permission) return false;

    // Hierarchy check
    const levels: PermissionLevel[] = ['viewer', 'reviewer', 'owner'];
    return levels.indexOf(permission.permissionLevel) >= levels.indexOf(requiredLevel);
  }, [isAdmin, isMasterAdmin, isEditor, objectPermissions]);

  /**
   * Check if user can edit a specific object
   * Rules:
   * a) Admin/Master always can
   * b) Editor can edit objects without specific restrictions
   * c) User with owner permission can
   * d) Viewer/view_only_admin never can
   */
  const hasEditPermission = useCallback((
    objectType: ObjectType,
    objectId: string
  ): boolean => {
    // a) Admin/Master always can
    if (isAdmin() || isMasterAdmin()) return true;

    // d) view_only_admin and viewer never can
    if (isViewOnlyAdmin() || (isViewer() && !isEditor() && !isComplianceOfficer())) {
      return false;
    }

    // b) Editor and compliance_officer can edit
    if (isEditor() || isComplianceOfficer()) return true;

    // c) Check if owner of the object
    return checkObjectPermission(objectType, objectId, 'owner');
  }, [isAdmin, isMasterAdmin, isViewOnlyAdmin, isViewer, isEditor, isComplianceOfficer, checkObjectPermission]);

  /**
   * Check if user can view a specific object
   */
  const hasViewPermission = useCallback((
    objectType: ObjectType,
    objectId: string
  ): boolean => {
    // Admin, editor, view_only_admin see everything
    if (canViewAll()) return true;

    // Check specific permission
    return checkObjectPermission(objectType, objectId, 'viewer');
  }, [canViewAll, checkObjectPermission]);

  /**
   * Check if user can manage permissions for an object
   * Only admins and object owners can
   */
  const canManageObjectPermissions = useCallback((
    objectType: ObjectType,
    objectId: string
  ): boolean => {
    if (isAdmin() || isMasterAdmin()) return true;
    return checkObjectPermission(objectType, objectId, 'owner');
  }, [isAdmin, isMasterAdmin, checkObjectPermission]);

  /**
   * Get user's permission level for an object
   */
  const getObjectPermissionLevel = useCallback((
    objectType: ObjectType,
    objectId: string
  ): PermissionLevel | 'admin' | null => {
    if (isAdmin() || isMasterAdmin()) return 'admin';
    
    const permission = objectPermissions.find(
      p => p.objectType === objectType && p.objectId === objectId
    );
    
    return permission?.permissionLevel ?? null;
  }, [isAdmin, isMasterAdmin, objectPermissions]);

  return {
    // State
    roles,
    loading,
    objectPermissions,
    
    // Org-level role checks
    hasRole,
    isAdmin,
    isAuditor,
    isComplianceOfficer,
    isViewer,
    isMasterAdmin,
    isMasterTI,
    isMasterGovernance,
    isMasterUser,
    
    // NEW org-level roles
    isEditor,
    isViewOnlyAdmin,
    
    // Capability-based permissions
    canManageUsers,
    canManageControls,
    canViewAuditLogs,
    canApproveDocuments,
    canEditResources,
    canViewAll,
    
    // Object-level permissions (Vanta model)
    checkObjectPermission,
    hasEditPermission,
    hasViewPermission,
    canManageObjectPermissions,
    getObjectPermissionLevel,
    
    // Refresh functions
    refresh: loadUserRoles,
    refreshObjectPermissions: loadObjectPermissions
  };
};
