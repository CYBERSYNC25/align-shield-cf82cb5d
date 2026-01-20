import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrationData, CollectedResource } from './useIntegrationData';
import { getIntegrationById } from '@/lib/integrations-catalog';
import { useRiskAcceptances } from './useRiskAcceptances';
import { useAuth } from './useAuth';
import { 
  TestLogic, 
  Condition, 
  evaluateTestLogic 
} from '@/lib/custom-test-schemas';
import { queryKeys } from '@/lib/query-keys';

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
  isCustomRule?: boolean;
  customTestId?: string;
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
  customTestsCount: number;
  builtInTestsCount: number;
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

interface CustomTestFromDB {
  id: string;
  test_name: string;
  test_description: string | null;
  severity: string;
  integration_name: string;
  resource_type: string;
  test_logic: any;
  enabled: boolean;
  sla_hours: number | null;
}

interface CachedCustomTestResult {
  testId: string;
  failingResources: CollectedResource[];
  affectedItems: string[];
  timestamp: number;
}

// Cache duration: 1 hour
const CUSTOM_TEST_CACHE_DURATION = 60 * 60 * 1000;

// In-memory cache for custom test results
const customTestResultsCache = new Map<string, CachedCustomTestResult>();

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

  // Azure AD / Microsoft Entra ID Rules
  {
    id: 'azure-user-no-mfa',
    title: 'Usuário Azure AD sem MFA',
    description: 'Usuário do Microsoft Entra ID sem autenticação multifator habilitada',
    severity: 'high',
    integrationId: 'azure-ad',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.accountEnabled === true && data?.mfaEnabled === false;
    },
    getAffectedName: (resource) => resource.resource_data?.userPrincipalName || resource.resource_data?.displayName || 'User',
    fixAction: '/access-reviews',
  },
  {
    id: 'azure-guest-active',
    title: 'Usuário Guest Ativo',
    description: 'Usuário externo (Guest) com acesso ativo ao tenant',
    severity: 'medium',
    integrationId: 'azure-ad',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.userType === 'Guest' && data?.accountEnabled === true;
    },
    getAffectedName: (resource) => resource.resource_data?.userPrincipalName || resource.resource_data?.displayName || 'Guest User',
    fixAction: '/access-reviews',
  },
  {
    id: 'azure-disabled-user',
    title: 'Usuário Desativado',
    description: 'Conta de usuário desativada que pode precisar ser removida',
    severity: 'low',
    integrationId: 'azure-ad',
    resourceType: 'user',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.accountEnabled === false;
    },
    getAffectedName: (resource) => resource.resource_data?.userPrincipalName || resource.resource_data?.displayName || 'User',
    fixAction: '/access-reviews',
  },
  {
    id: 'azure-no-conditional-access',
    title: 'Sem Políticas de Acesso Condicional',
    description: 'Tenant sem políticas de acesso condicional ativas para proteção',
    severity: 'high',
    integrationId: 'azure-ad',
    resourceType: 'conditional_access_policy',
    checkFn: (resource) => {
      const data = resource.resource_data;
      return data?.state !== 'enabled' && data?.state !== 'enabledForReportingButNotEnforced';
    },
    getAffectedName: (resource) => resource.resource_data?.displayName || 'Policy',
    fixAction: '/integrations',
  },
];

// Helper function to get resource name from custom test
function getCustomTestAffectedName(resource: CollectedResource): string {
  const data = resource.resource_data;
  return data?.name || 
         data?.displayName || 
         data?.userName || 
         data?.userPrincipalName || 
         data?.primaryEmail ||
         data?.full_name ||
         data?.email ||
         data?.title ||
         resource.resource_id || 
         'Resource';
}

// Evaluate custom test against resources with caching
function evaluateCustomTest(
  customTest: CustomTestFromDB,
  resources: CollectedResource[],
  forceRefresh = false
): { failingResources: CollectedResource[]; affectedItems: string[] } {
  const cacheKey = `${customTest.id}-${resources.length}`;
  const now = Date.now();

  // Check cache (unless force refresh)
  if (!forceRefresh) {
    const cached = customTestResultsCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CUSTOM_TEST_CACHE_DURATION) {
      return {
        failingResources: cached.failingResources,
        affectedItems: cached.affectedItems
      };
    }
  }

  const failingResources: CollectedResource[] = [];
  const affectedItems: string[] = [];

  try {
    // Parse test_logic if it's a string
    const testLogic: TestLogic = typeof customTest.test_logic === 'string' 
      ? JSON.parse(customTest.test_logic)
      : customTest.test_logic;

    // Validate test_logic structure
    if (!testLogic?.conditions || !Array.isArray(testLogic.conditions)) {
      console.warn(`Invalid test_logic for custom test ${customTest.id}`);
      return { failingResources: [], affectedItems: [] };
    }

    // Filter resources by resource type
    const relevantResources = resources.filter(
      r => r.resource_type === customTest.resource_type
    );

    // Evaluate each resource
    for (const resource of relevantResources) {
      try {
        const resourceData = resource.resource_data as Record<string, any>;
        
        // evaluateTestLogic returns true if conditions match (i.e., resource fails the compliance check)
        const matchesConditions = evaluateTestLogic(testLogic, resourceData);
        
        if (matchesConditions) {
          failingResources.push(resource);
          affectedItems.push(getCustomTestAffectedName(resource));
        }
      } catch (resourceError) {
        // Log but continue with other resources
        console.warn(`Error evaluating resource ${resource.id} for custom test ${customTest.id}:`, resourceError);
      }
    }

    // Cache the result
    customTestResultsCache.set(cacheKey, {
      testId: customTest.id,
      failingResources,
      affectedItems,
      timestamp: now
    });

  } catch (error) {
    console.error(`Error evaluating custom test ${customTest.id}:`, error);
    // Return empty results on error - don't break the scoring
  }

  return { failingResources, affectedItems };
}

export function useComplianceStatus(): ComplianceStatusResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allResources, isLoading } = useIntegrationData();
  const { acceptances, isLoading: isLoadingAcceptances } = useRiskAcceptances();
  const lastResultSaveRef = useRef<number>(0);

  // Fetch enabled custom tests
  const { data: customTests = [], isLoading: isLoadingCustomTests } = useQuery({
    queryKey: [...queryKeys.customTests, 'enabled'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('custom_compliance_tests')
        .select('id, test_name, test_description, severity, integration_name, resource_type, test_logic, enabled, sla_hours')
        .eq('user_id', user.id)
        .eq('enabled', true);

      if (error) {
        console.error('Error fetching custom tests:', error);
        return [];
      }

      return data as CustomTestFromDB[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Function to save custom test results to DB (debounced)
  const saveCustomTestResults = useCallback(async (
    customTest: CustomTestFromDB,
    failingCount: number,
    executionTimeMs: number
  ) => {
    if (!user?.id) return;

    // Debounce: only save once per minute per test
    const now = Date.now();
    if (now - lastResultSaveRef.current < 60000) return;
    lastResultSaveRef.current = now;

    try {
      await supabase
        .from('custom_test_results')
        .insert({
          test_id: customTest.id,
          user_id: user.id,
          status: failingCount > 0 ? 'failed' : 'passed',
          affected_resources_count: failingCount,
          execution_time_ms: Math.round(executionTimeMs),
          triggered_by: 'auto',
          result_details: {
            failing_count: failingCount,
            evaluated_at: new Date().toISOString()
          }
        });
    } catch (error) {
      // Silent fail - don't break the UI
      console.warn('Failed to save custom test result:', error);
    }
  }, [user?.id]);

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
        customTestsCount: 0,
        builtInTestsCount: 0,
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

    // Process each built-in rule
    const tests: ComplianceTest[] = [];
    let builtInTestsCount = 0;

    COMPLIANCE_RULES.forEach((rule) => {
      const integration = getIntegrationById(rule.integrationId);
      if (!integration) return;

      // Check if this integration has data
      const integrationResources = resourcesByIntegration[integration.provider] || 
                                   resourcesByIntegration[integration.id] ||
                                   resourcesByIntegration[integration.name.toLowerCase()];

      if (!integrationResources || integrationResources.length === 0) {
        return;
      }

      // Filter resources of the correct type
      const relevantResources = integrationResources.filter(
        (r) => r.resource_type === rule.resourceType
      );

      if (relevantResources.length === 0) {
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
        isCustomRule: false,
      };

      tests.push(test);
      builtInTestsCount++;
    });

    // Process custom tests
    let customTestsCount = 0;

    customTests.forEach((customTest) => {
      try {
        const startTime = performance.now();

        // Get resources for this integration
        const integrationResources = resourcesByIntegration[customTest.integration_name] || [];

        if (integrationResources.length === 0) {
          return; // Skip if no data for this integration
        }

        // Evaluate custom test with caching
        const { failingResources, affectedItems } = evaluateCustomTest(
          customTest,
          integrationResources
        );

        const executionTime = performance.now() - startTime;

        // Check if this custom test has an active risk acceptance
        const hasRiskAcceptance = acceptances.some(
          (a) => a.ruleId === `custom-${customTest.id}` && a.status === 'active'
        );

        // Determine status
        let status: TestStatus = 'pass';
        if (failingResources.length > 0) {
          status = hasRiskAcceptance ? 'risk_accepted' : 'fail';
        }

        // Get integration info for display
        const integration = getIntegrationById(customTest.integration_name);

        const test: ComplianceTest = {
          id: `custom-${customTest.id}`,
          title: `[Custom] ${customTest.test_name}`,
          description: customTest.test_description || 'Teste de compliance personalizado',
          severity: customTest.severity as SeverityLevel,
          status,
          integration: integration?.name || customTest.integration_name,
          integrationId: customTest.integration_name,
          integrationLogo: integration?.logo || '',
          resourceType: customTest.resource_type,
          affectedResources: failingResources.length,
          affectedItems,
          lastChecked: new Date(),
          fixAction: '/controls',
          ruleId: `custom-${customTest.id}`,
          isCustomRule: true,
          customTestId: customTest.id,
        };

        tests.push(test);
        customTestsCount++;

        // Async save result to DB (fire and forget)
        if (user?.id) {
          saveCustomTestResults(customTest, failingResources.length, executionTime);
        }

      } catch (error) {
        // Log error but don't break the loop
        console.error(`Error processing custom test ${customTest.id}:`, error);
      }
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
        // Sort by severity, then by custom (custom rules show after built-in at same severity)
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return (a.isCustomRule ? 1 : 0) - (b.isCustomRule ? 1 : 0);
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
      customTestsCount,
      builtInTestsCount,
    };
  }, [allResources, acceptances, customTests, user?.id, saveCustomTestResults]);

  return {
    ...result,
    isLoading: isLoading || isLoadingAcceptances || isLoadingCustomTests,
  };
}

// Export function to clear custom test cache (useful after editing tests)
export function clearCustomTestCache(testId?: string) {
  if (testId) {
    // Clear specific test cache entries
    for (const key of customTestResultsCache.keys()) {
      if (key.startsWith(testId)) {
        customTestResultsCache.delete(key);
      }
    }
  } else {
    // Clear all
    customTestResultsCache.clear();
  }
}
