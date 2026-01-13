import { useMemo } from 'react';
import { useIntegrationData, CollectedResource } from './useIntegrationData';
import { integrationsCatalog, getIntegrationById } from '@/lib/integrations-catalog';
import { useRiskAcceptances } from './useRiskAcceptances';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type TestStatus = 'pass' | 'fail' | 'not-configured' | 'risk_accepted';

export interface ComplianceTest {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: TestStatus;
  integration: string;
  integrationId: string;
  integrationLogo: string;
  resourceType: string;
  affectedResources: number;
  affectedItems: string[];
  lastChecked: Date;
  fixAction: string;
  ruleId: string;
}

export interface ComplianceStatusResult {
  tests: ComplianceTest[];
  failingTests: ComplianceTest[];
  passingTests: ComplianceTest[];
  notConfiguredTests: ComplianceTest[];
  riskAcceptedTests: ComplianceTest[];
  score: number;
  totalTests: number;
  isLoading: boolean;
}

interface ComplianceRule {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  integrationId: string;
  resourceType: string;
  checkFn: (resource: CollectedResource) => boolean;
  getAffectedName: (resource: CollectedResource) => string;
  fixAction: string;
}

// Define compliance rules that process integration_collected_data
const COMPLIANCE_RULES: ComplianceRule[] = [
  // GitHub Rules
  {
    id: 'github-public-repo',
    title: 'Repositório Público Detectado',
    description: 'Repositórios públicos podem expor código sensível e segredos',
    severity: 'critical',
    integrationId: 'github',
    resourceType: 'repository',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.private === false || data?.visibility === 'public';
    },
    getAffectedName: (resource) => resource.resource_data?.full_name || resource.resource_data?.name || 'Repo',
    fixAction: '/integrations',
  },
  {
    id: 'github-no-branch-protection',
    title: 'Branch Principal sem Proteção',
    description: 'Branch main/master sem regras de proteção habilitadas',
    severity: 'high',
    integrationId: 'github',
    resourceType: 'repository',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.default_branch_protected === false;
    },
    getAffectedName: (resource) => resource.resource_data?.full_name || resource.resource_data?.name || 'Repo',
    fixAction: '/integrations',
  },

  // Cloudflare Rules
  {
    id: 'cloudflare-no-https',
    title: 'HTTPS Não Forçado',
    description: 'Site sem redirecionamento HTTPS automático habilitado',
    severity: 'critical',
    integrationId: 'cloudflare',
    resourceType: 'zone',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.always_use_https === false || data?.ssl?.mode === 'off';
    },
    getAffectedName: (resource) => resource.resource_data?.name || 'Zone',
    fixAction: '/integrations',
  },
  {
    id: 'cloudflare-no-waf',
    title: 'WAF Desativado',
    description: 'Web Application Firewall não está ativo',
    severity: 'high',
    integrationId: 'cloudflare',
    resourceType: 'zone',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.waf_enabled === false;
    },
    getAffectedName: (resource) => resource.resource_data?.name || 'Zone',
    fixAction: '/integrations',
  },

  // Slack Rules
  {
    id: 'slack-admin-no-mfa',
    title: 'Admin Slack sem MFA',
    description: 'Administradores do Slack sem autenticação de dois fatores',
    severity: 'critical',
    integrationId: 'slack',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.is_admin === true && data?.has_2fa === false;
    },
    getAffectedName: (resource) => resource.resource_data?.real_name || resource.resource_data?.name || 'User',
    fixAction: '/access-reviews',
  },
  {
    id: 'slack-inactive-user',
    title: 'Usuário Slack Inativo',
    description: 'Usuário sem atividade há mais de 90 dias',
    severity: 'medium',
    integrationId: 'slack',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      if (!data?.updated) return false;
      const lastActivity = new Date(data.updated * 1000);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity > 90 && data?.deleted !== true;
    },
    getAffectedName: (resource) => resource.resource_data?.real_name || resource.resource_data?.name || 'User',
    fixAction: '/access-reviews',
  },

  // Azure/Intune Rules
  {
    id: 'intune-noncompliant-device',
    title: 'Dispositivo Não Conforme',
    description: 'Dispositivo não atende políticas de compliance do Intune',
    severity: 'critical',
    integrationId: 'intune',
    resourceType: 'device',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.complianceState !== 'compliant' && data?.complianceState !== undefined;
    },
    getAffectedName: (resource) => resource.resource_data?.deviceName || resource.resource_data?.displayName || 'Device',
    fixAction: '/integrations',
  },
  {
    id: 'intune-unencrypted-device',
    title: 'Dispositivo sem Criptografia',
    description: 'Dispositivo sem criptografia de disco habilitada',
    severity: 'high',
    integrationId: 'intune',
    resourceType: 'device',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.isEncrypted === false;
    },
    getAffectedName: (resource) => resource.resource_data?.deviceName || resource.resource_data?.displayName || 'Device',
    fixAction: '/integrations',
  },

  // AWS Rules
  {
    id: 'aws-public-bucket',
    title: 'Bucket S3 Público',
    description: 'Bucket S3 com acesso público habilitado',
    severity: 'critical',
    integrationId: 'aws',
    resourceType: 'bucket',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.public_access === true || data?.publicAccessBlock?.BlockPublicAcls === false;
    },
    getAffectedName: (resource) => resource.resource_data?.Name || 'Bucket',
    fixAction: '/integrations',
  },
  {
    id: 'aws-unencrypted-bucket',
    title: 'Bucket sem Criptografia',
    description: 'Bucket S3 sem criptografia server-side',
    severity: 'high',
    integrationId: 'aws',
    resourceType: 'bucket',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.encryption_enabled === false;
    },
    getAffectedName: (resource) => resource.resource_data?.Name || 'Bucket',
    fixAction: '/integrations',
  },

  // Google Workspace Rules
  {
    id: 'google-user-no-mfa',
    title: 'Usuário Google sem MFA',
    description: 'Usuário do Google Workspace sem verificação em duas etapas',
    severity: 'high',
    integrationId: 'google-workspace',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.isEnrolledIn2Sv === false && data?.suspended !== true;
    },
    getAffectedName: (resource) => resource.resource_data?.primaryEmail || resource.resource_data?.name?.fullName || 'User',
    fixAction: '/access-reviews',
  },
  {
    id: 'google-admin-no-mfa',
    title: 'Admin Google sem MFA',
    description: 'Administrador do Google Workspace sem verificação em duas etapas',
    severity: 'critical',
    integrationId: 'google-workspace',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.isAdmin === true && data?.isEnrolledIn2Sv === false;
    },
    getAffectedName: (resource) => resource.resource_data?.primaryEmail || 'Admin',
    fixAction: '/access-reviews',
  },

  // Auth0 Rules
  {
    id: 'auth0-no-mfa',
    title: 'MFA não Configurado',
    description: 'Tenant Auth0 sem MFA obrigatório configurado',
    severity: 'high',
    integrationId: 'auth0',
    resourceType: 'guardian',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.enabled === false;
    },
    getAffectedName: () => 'Auth0 Guardian',
    fixAction: '/integrations',
  },

  // Okta Rules
  {
    id: 'okta-user-no-mfa',
    title: 'Usuário Okta sem MFA',
    description: 'Usuário ativo no Okta sem fator de autenticação secundário',
    severity: 'high',
    integrationId: 'okta',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.status === 'ACTIVE' && (data?.mfaEnabled === false || data?.enrolledFactors?.length === 0);
    },
    getAffectedName: (resource) => resource.resource_data?.profile?.email || resource.resource_data?.profile?.login || 'User',
    fixAction: '/access-reviews',
  },
];

export function useComplianceStatus(): ComplianceStatusResult {
  const { data: allResources, isLoading } = useIntegrationData();
  const { acceptances, isLoading: isLoadingAcceptances } = useRiskAcceptances();

  const result = useMemo(() => {
    if (!allResources || allResources.length === 0) {
      // Return not-configured tests when no data
      const notConfiguredTests: ComplianceTest[] = [
        {
          id: 'no-integrations',
          title: 'Nenhuma Integração Configurada',
          description: 'Conecte suas ferramentas para monitoramento automático de compliance',
          severity: 'high',
          status: 'not-configured',
          integration: 'Sistema',
          integrationId: 'system',
          integrationLogo: '',
          resourceType: 'system',
          affectedResources: 0,
          affectedItems: [],
          lastChecked: new Date(),
          fixAction: '/integrations',
          ruleId: 'no-integrations',
        },
      ];

      return {
        tests: notConfiguredTests,
        failingTests: [],
        passingTests: [],
        notConfiguredTests,
        riskAcceptedTests: [],
        score: 0,
        totalTests: 0,
        isLoading: false,
      };
    }

    // Group resources by integration
    const resourcesByIntegration: Record<string, CollectedResource[]> = {};
    allResources.forEach((resource) => {
      const key = resource.integration_name;
      if (!resourcesByIntegration[key]) {
        resourcesByIntegration[key] = [];
      }
      resourcesByIntegration[key].push(resource);
    });

    // Get unique integrations that have data
    const activeIntegrations = Object.keys(resourcesByIntegration);

    // Process each rule
    const tests: ComplianceTest[] = [];

    COMPLIANCE_RULES.forEach((rule) => {
      const integration = getIntegrationById(rule.integrationId);
      if (!integration) return;

      // Check if this integration has data
      const integrationResources = resourcesByIntegration[integration.provider] || 
                                   resourcesByIntegration[integration.id] ||
                                   resourcesByIntegration[integration.name.toLowerCase()];

      if (!integrationResources || integrationResources.length === 0) {
        // Integration not configured - skip this rule
        return;
      }

      // Filter resources of the correct type
      const relevantResources = integrationResources.filter(
        (r) => r.resource_type === rule.resourceType
      );

      if (relevantResources.length === 0) {
        // No resources of this type, skip
        return;
      }

      // Check which resources fail the rule
      const failingResources = relevantResources.filter((r) => rule.checkFn(r));
      const affectedItems = failingResources.map((r) => rule.getAffectedName(r));

      // Check if this rule has an active risk acceptance
      const hasRiskAcceptance = acceptances.some(
        (a) => a.ruleId === rule.id && a.status === 'active'
      );

      // Determine status
      let status: TestStatus = 'pass';
      if (failingResources.length > 0) {
        status = hasRiskAcceptance ? 'risk_accepted' : 'fail';
      }

      const test: ComplianceTest = {
        id: `${rule.id}-${integration.id}`,
        title: rule.title,
        description: rule.description,
        severity: rule.severity,
        status,
        integration: integration.name,
        integrationId: integration.id,
        integrationLogo: integration.logo,
        resourceType: rule.resourceType,
        affectedResources: failingResources.length,
        affectedItems,
        lastChecked: new Date(),
        fixAction: rule.fixAction,
        ruleId: rule.id,
      };

      tests.push(test);
    });

    // Separate by status
    const failingTests = tests
      .filter((t) => t.status === 'fail')
      .sort((a, b) => {
        const severityOrder: Record<SeverityLevel, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

    const passingTests = tests.filter((t) => t.status === 'pass');
    const notConfiguredTests = tests.filter((t) => t.status === 'not-configured');
    const riskAcceptedTests = tests.filter((t) => t.status === 'risk_accepted');

    // Calculate score: passing + risk_accepted count as "ok"
    const totalTests = tests.length;
    const okCount = passingTests.length + riskAcceptedTests.length;
    const score = totalTests > 0 ? Math.round((okCount / totalTests) * 100) : 100;

    return {
      tests,
      failingTests,
      passingTests,
      notConfiguredTests,
      riskAcceptedTests,
      score,
      totalTests,
      isLoading: false,
    };
  }, [allResources, acceptances]);

  return {
    ...result,
    isLoading: isLoading || isLoadingAcceptances,
  };
}
