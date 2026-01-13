import { useMemo } from 'react';
import { useIntegrationData, CollectedResource } from './useIntegrationData';
import { getIntegrationById, integrationsCatalog } from '@/lib/integrations-catalog';

export type AssetType = 'user' | 'repository' | 'device' | 'domain' | 'bucket' | 'channel' | 'project' | 'other';
export type AssetCategory = 'identity' | 'infrastructure' | 'security' | 'productivity';
export type AssetComplianceStatus = 'pass' | 'fail' | 'not-checked';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  typeLabel: string;
  category: AssetCategory;
  integrationId: string;
  integrationName: string;
  integrationLogo: string;
  complianceStatus: AssetComplianceStatus;
  complianceIssues: string[];
  lastSynced: Date;
  rawData: Record<string, unknown>;
}

interface AssetTypeMapping {
  type: AssetType;
  label: string;
  category: AssetCategory;
}

const RESOURCE_TYPE_MAPPING: Record<string, AssetTypeMapping> = {
  user: { type: 'user', label: 'Usuário', category: 'identity' },
  users: { type: 'user', label: 'Usuário', category: 'identity' },
  org_members: { type: 'user', label: 'Usuário', category: 'identity' },
  employees: { type: 'user', label: 'Funcionário', category: 'identity' },
  repository: { type: 'repository', label: 'Repositório', category: 'infrastructure' },
  repositories: { type: 'repository', label: 'Repositório', category: 'infrastructure' },
  device: { type: 'device', label: 'Dispositivo', category: 'security' },
  devices: { type: 'device', label: 'Dispositivo', category: 'security' },
  zone: { type: 'domain', label: 'Domínio', category: 'infrastructure' },
  zones: { type: 'domain', label: 'Domínio', category: 'infrastructure' },
  bucket: { type: 'bucket', label: 'Bucket', category: 'infrastructure' },
  buckets: { type: 'bucket', label: 'Bucket', category: 'infrastructure' },
  channel: { type: 'channel', label: 'Canal', category: 'productivity' },
  channels: { type: 'channel', label: 'Canal', category: 'productivity' },
  project: { type: 'project', label: 'Projeto', category: 'productivity' },
  projects: { type: 'project', label: 'Projeto', category: 'productivity' },
  guardian: { type: 'other', label: 'Configuração', category: 'security' },
};

// Security integrations for filtering
const SECURITY_INTEGRATIONS = ['crowdstrike', 'intune'];

// Compliance rules for checking individual assets
interface ComplianceCheckRule {
  integrationId: string;
  resourceType: string;
  checkFn: (data: Record<string, unknown>) => boolean;
  issue: string;
}

const ASSET_COMPLIANCE_RULES: ComplianceCheckRule[] = [
  // GitHub
  {
    integrationId: 'github',
    resourceType: 'repository',
    checkFn: (data) => data?.private === false || data?.visibility === 'public',
    issue: 'Repositório público',
  },
  {
    integrationId: 'github',
    resourceType: 'repository',
    checkFn: (data) => data?.default_branch_protected === false,
    issue: 'Branch sem proteção',
  },
  // Cloudflare
  {
    integrationId: 'cloudflare',
    resourceType: 'zone',
    checkFn: (data) => data?.always_use_https === false || (data?.ssl as Record<string, unknown>)?.mode === 'off',
    issue: 'HTTPS não forçado',
  },
  // Slack
  {
    integrationId: 'slack',
    resourceType: 'user',
    checkFn: (data) => data?.is_admin === true && data?.has_2fa === false,
    issue: 'Admin sem MFA',
  },
  // Intune
  {
    integrationId: 'intune',
    resourceType: 'device',
    checkFn: (data) => data?.complianceState !== 'compliant' && data?.complianceState !== undefined,
    issue: 'Dispositivo não conforme',
  },
  {
    integrationId: 'intune',
    resourceType: 'device',
    checkFn: (data) => data?.isEncrypted === false,
    issue: 'Sem criptografia',
  },
  // AWS
  {
    integrationId: 'aws',
    resourceType: 'bucket',
    checkFn: (data) => data?.public_access === true || (data?.publicAccessBlock as Record<string, unknown>)?.BlockPublicAcls === false,
    issue: 'Bucket público',
  },
  // Google Workspace
  {
    integrationId: 'google-workspace',
    resourceType: 'user',
    checkFn: (data) => data?.isEnrolledIn2Sv === false && data?.suspended !== true,
    issue: 'Sem MFA',
  },
  {
    integrationId: 'google-workspace',
    resourceType: 'user',
    checkFn: (data) => data?.isAdmin === true && data?.isEnrolledIn2Sv === false,
    issue: 'Admin sem MFA',
  },
  // Okta
  {
    integrationId: 'okta',
    resourceType: 'user',
    checkFn: (data) => data?.status === 'ACTIVE' && (data?.mfaEnabled === false || (data?.enrolledFactors as unknown[])?.length === 0),
    issue: 'Sem MFA',
  },
];

function getAssetName(resource: CollectedResource): string {
  const data = resource.resource_data;
  
  // Try common name patterns
  return (
    data?.name ||
    data?.full_name ||
    data?.displayName ||
    data?.deviceName ||
    data?.primaryEmail ||
    data?.email ||
    data?.real_name ||
    (data?.profile as Record<string, unknown>)?.email ||
    resource.resource_id ||
    'Recurso sem nome'
  ) as string;
}

function getAssetComplianceStatus(
  resource: CollectedResource,
  integrationId: string
): { status: AssetComplianceStatus; issues: string[] } {
  const matchingRules = ASSET_COMPLIANCE_RULES.filter(
    (rule) => rule.integrationId === integrationId && rule.resourceType === resource.resource_type
  );
  
  if (matchingRules.length === 0) {
    return { status: 'not-checked', issues: [] };
  }
  
  const failingRules = matchingRules.filter((rule) => 
    rule.checkFn(resource.resource_data as Record<string, unknown>)
  );
  
  if (failingRules.length > 0) {
    return {
      status: 'fail',
      issues: failingRules.map((r) => r.issue),
    };
  }
  
  return { status: 'pass', issues: [] };
}

function normalizeIntegrationId(integrationName: string): string {
  // Map integration_name from database to integration catalog id
  const nameMap: Record<string, string> = {
    github: 'github',
    cloudflare: 'cloudflare',
    slack: 'slack',
    'google-workspace': 'google-workspace',
    'azure-ad': 'azure-ad',
    intune: 'intune',
    aws: 'aws',
    auth0: 'auth0',
    okta: 'okta',
    crowdstrike: 'crowdstrike',
    jira: 'jira',
    gitlab: 'gitlab',
    bamboohr: 'bamboohr',
  };
  
  return nameMap[integrationName.toLowerCase()] || integrationName.toLowerCase();
}

export interface AssetInventoryResult {
  assets: Asset[];
  identityAssets: Asset[];
  infrastructureAssets: Asset[];
  securityAssets: Asset[];
  productivityAssets: Asset[];
  counts: {
    total: number;
    identity: number;
    infrastructure: number;
    security: number;
    productivity: number;
  };
  hasRealData: boolean;
  isLoading: boolean;
}

export function useAssetInventory(): AssetInventoryResult {
  const { data: resources, isLoading } = useIntegrationData();
  
  const result = useMemo(() => {
    if (!resources || resources.length === 0) {
      return {
        assets: [],
        identityAssets: [],
        infrastructureAssets: [],
        securityAssets: [],
        productivityAssets: [],
        counts: {
          total: 0,
          identity: 0,
          infrastructure: 0,
          security: 0,
          productivity: 0,
        },
        hasRealData: false,
        isLoading: false,
      };
    }
    
    const assets: Asset[] = resources.map((resource) => {
      const integrationId = normalizeIntegrationId(resource.integration_name);
      const integration = getIntegrationById(integrationId);
      
      const typeMapping = RESOURCE_TYPE_MAPPING[resource.resource_type] || {
        type: 'other' as AssetType,
        label: resource.resource_type,
        category: 'productivity' as AssetCategory,
      };
      
      // Override category for security integrations
      let category = typeMapping.category;
      if (SECURITY_INTEGRATIONS.includes(integrationId)) {
        category = 'security';
      }
      
      const { status, issues } = getAssetComplianceStatus(resource, integrationId);
      
      return {
        id: resource.id,
        name: getAssetName(resource),
        type: typeMapping.type,
        typeLabel: typeMapping.label,
        category,
        integrationId,
        integrationName: integration?.name || resource.integration_name,
        integrationLogo: integration?.logo || '',
        complianceStatus: status,
        complianceIssues: issues,
        lastSynced: new Date(resource.collected_at),
        rawData: resource.resource_data as Record<string, unknown>,
      };
    });
    
    const identityAssets = assets.filter((a) => a.category === 'identity');
    const infrastructureAssets = assets.filter((a) => a.category === 'infrastructure');
    const securityAssets = assets.filter((a) => a.category === 'security');
    const productivityAssets = assets.filter((a) => a.category === 'productivity');
    
    return {
      assets,
      identityAssets,
      infrastructureAssets,
      securityAssets,
      productivityAssets,
      counts: {
        total: assets.length,
        identity: identityAssets.length,
        infrastructure: infrastructureAssets.length,
        security: securityAssets.length,
        productivity: productivityAssets.length,
      },
      hasRealData: assets.length > 0,
      isLoading: false,
    };
  }, [resources]);
  
  return {
    ...result,
    isLoading,
  };
}
