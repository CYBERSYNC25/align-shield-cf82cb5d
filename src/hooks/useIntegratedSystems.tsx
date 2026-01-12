import { useMemo } from 'react';
import { useIntegrationData, useIntegrationDataStats } from './useIntegrationData';
import { SystemInventory, AccessAnomaly } from './useAccess';

// Map provider names to display names
const INTEGRATION_DISPLAY_NAMES: Record<string, string> = {
  github: 'GitHub Enterprise',
  gitlab: 'GitLab',
  slack: 'Slack Workspace',
  jira: 'Jira Cloud',
  cloudflare: 'Cloudflare',
  bamboohr: 'BambooHR',
  crowdstrike: 'CrowdStrike Falcon',
  intune: 'Microsoft Intune',
  aws: 'AWS Cloud',
  azure: 'Azure AD',
  'azure-ad': 'Azure AD',
  google: 'Google Workspace',
  'google-workspace': 'Google Workspace',
  auth0: 'Auth0',
  okta: 'Okta',
};

// Map provider to system type
const INTEGRATION_TYPES: Record<string, 'saas' | 'on-premise' | 'cloud'> = {
  github: 'saas',
  gitlab: 'saas',
  slack: 'saas',
  jira: 'saas',
  cloudflare: 'cloud',
  bamboohr: 'saas',
  crowdstrike: 'saas',
  intune: 'cloud',
  aws: 'cloud',
  azure: 'cloud',
  'azure-ad': 'cloud',
  google: 'saas',
  'google-workspace': 'saas',
  auth0: 'saas',
  okta: 'saas',
};

// Calculate risk level based on integration type and data
function calculateRiskLevel(integrationName: string, resources: any[]): 'low' | 'medium' | 'high' | 'critical' {
  // High-risk integrations (IAM, Infrastructure)
  const highRiskIntegrations = ['aws', 'azure', 'azure-ad', 'crowdstrike', 'intune'];
  if (highRiskIntegrations.includes(integrationName)) {
    return 'high';
  }
  
  // Medium-risk integrations (Code, Access)
  const mediumRiskIntegrations = ['github', 'gitlab', 'auth0', 'okta'];
  if (mediumRiskIntegrations.includes(integrationName)) {
    return 'medium';
  }
  
  return 'low';
}

// Calculate days since a date
function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Hook that transforms collected integration data into SystemInventory format
 * This feeds the Access Reviews and System Inventory components
 */
export function useIntegratedSystems() {
  const { data: collectedData, isLoading } = useIntegrationData();
  const { data: stats } = useIntegrationDataStats();

  // Transform collected data into systems for inventory
  const systems: SystemInventory[] = useMemo(() => {
    if (!collectedData?.length) return [];

    const systemsMap = new Map<string, SystemInventory>();

    // Group by integration as "system"
    collectedData.forEach(item => {
      const key = item.integration_name;
      
      if (!systemsMap.has(key)) {
        // Count users for this integration
        const userCount = collectedData.filter(
          d => d.integration_name === key && 
          (d.resource_type === 'users' || d.resource_type === 'employees' || d.resource_type === 'org_members')
        ).length;

        // Get the most recent collection timestamp
        const latestCollection = collectedData
          .filter(d => d.integration_name === key)
          .sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime())[0];

        systemsMap.set(key, {
          id: key,
          name: INTEGRATION_DISPLAY_NAMES[key] || key,
          type: INTEGRATION_TYPES[key] || 'saas',
          users_count: userCount,
          last_review: latestCollection?.collected_at || new Date().toISOString(),
          risk_level: calculateRiskLevel(key, collectedData.filter(d => d.integration_name === key)),
          compliance_status: 'compliant', // Could be calculated based on policies
          integration_status: 'connected',
          created_at: latestCollection?.collected_at || new Date().toISOString(),
          updated_at: latestCollection?.collected_at || new Date().toISOString(),
        });
      }
    });

    return Array.from(systemsMap.values());
  }, [collectedData]);

  // Detect anomalies based on real data
  const anomalies: AccessAnomaly[] = useMemo(() => {
    if (!collectedData?.length) return [];

    const detectedAnomalies: AccessAnomaly[] = [];

    // Group users by integration
    const usersByIntegration = new Map<string, any[]>();
    collectedData
      .filter(d => d.resource_type === 'users' || d.resource_type === 'employees')
      .forEach(item => {
        const existing = usersByIntegration.get(item.integration_name) || [];
        existing.push(item);
        usersByIntegration.set(item.integration_name, existing);
      });

    // Detect anomalies
    usersByIntegration.forEach((users, integrationName) => {
      users.forEach(user => {
        const data = user.resource_data as Record<string, any>;
        
        // 1. Detect inactive users (no activity in 90+ days)
        const lastActivity = data?.last_activity_at || data?.updated || data?.lastSyncDateTime;
        if (lastActivity && daysSince(lastActivity) > 90) {
          detectedAnomalies.push({
            id: `anomaly-inactive-${user.id}`,
            user_id: user.resource_id || user.id,
            user_name: data?.name || data?.displayName || data?.login || data?.email || 'Usuário',
            system_name: INTEGRATION_DISPLAY_NAMES[integrationName] || integrationName,
            anomaly_type: 'unused_access',
            severity: 'medium',
            description: `Acesso não utilizado há mais de 90 dias (${daysSince(lastActivity)} dias)`,
            detected_at: new Date().toISOString(),
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // 2. Detect excessive privileges (admin users)
        const isAdmin = data?.is_admin || data?.is_owner || data?.site_admin || 
                       data?.role === 'admin' || data?.accountType === 'atlassian';
        if (isAdmin) {
          // Check if user is admin in multiple systems
          const adminInOtherSystems = Array.from(usersByIntegration.entries())
            .filter(([name]) => name !== integrationName)
            .some(([, otherUsers]) => 
              otherUsers.some(u => {
                const d = u.resource_data as Record<string, any>;
                return (d?.email === data?.email || d?.login === data?.login) && 
                       (d?.is_admin || d?.is_owner || d?.site_admin);
              })
            );

          if (adminInOtherSystems) {
            detectedAnomalies.push({
              id: `anomaly-admin-${user.id}`,
              user_id: user.resource_id || user.id,
              user_name: data?.name || data?.displayName || data?.login || 'Usuário',
              system_name: INTEGRATION_DISPLAY_NAMES[integrationName] || integrationName,
              anomaly_type: 'excessive_privileges',
              severity: 'high',
              description: 'Usuário possui privilégios administrativos em múltiplos sistemas',
              detected_at: new Date().toISOString(),
              status: 'open',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        // 3. Detect missing 2FA
        const has2fa = data?.has_2fa || data?.two_factor_enabled || data?.two_factor_authentication;
        if (has2fa === false && (data?.is_admin || data?.is_owner)) {
          detectedAnomalies.push({
            id: `anomaly-no2fa-${user.id}`,
            user_id: user.resource_id || user.id,
            user_name: data?.name || data?.displayName || data?.login || 'Usuário',
            system_name: INTEGRATION_DISPLAY_NAMES[integrationName] || integrationName,
            anomaly_type: 'policy_violation',
            severity: 'critical',
            description: 'Usuário administrativo sem autenticação de dois fatores habilitada',
            detected_at: new Date().toISOString(),
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });
    });

    return detectedAnomalies;
  }, [collectedData]);

  // Get total counts for statistics
  const totalUsers = useMemo(() => {
    if (!collectedData?.length) return 0;
    return collectedData.filter(
      d => d.resource_type === 'users' || d.resource_type === 'employees' || d.resource_type === 'org_members'
    ).length;
  }, [collectedData]);

  const totalResources = useMemo(() => {
    if (!collectedData?.length) return 0;
    return collectedData.length;
  }, [collectedData]);

  return { 
    systems, 
    anomalies, 
    totalUsers,
    totalResources,
    isLoading,
    hasRealData: collectedData && collectedData.length > 0,
  };
}

/**
 * Hook to get integration activity for real-time metrics
 */
export function useIntegrationActivity() {
  const { data: collectedData } = useIntegrationData();

  const activityByHour = useMemo(() => {
    if (!collectedData?.length) return [];

    const hourlyActivity = new Map<string, number>();
    const now = new Date();

    // Group by hour for the last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(now.getHours() - i);
      const key = hour.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      hourlyActivity.set(key, 0);
    }

    collectedData.forEach(item => {
      const collectedAt = new Date(item.collected_at);
      const hoursDiff = Math.floor((now.getTime() - collectedAt.getTime()) / (1000 * 60 * 60));
      
      if (hoursDiff < 24) {
        const key = collectedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (hourlyActivity.has(key)) {
          hourlyActivity.set(key, (hourlyActivity.get(key) || 0) + 1);
        }
      }
    });

    return Array.from(hourlyActivity.entries())
      .slice(-12) // Last 12 hours
      .map(([time, count]) => ({
        time,
        activities: count,
        risks: 0,
        tasks: 0,
      }));
  }, [collectedData]);

  return { activityByHour };
}
