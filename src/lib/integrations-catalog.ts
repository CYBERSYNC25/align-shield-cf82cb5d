export type IntegrationCategory = 'cloud' | 'iam' | 'sdlc' | 'productivity' | 'endpoint';
export type IntegrationStatus = 'connected' | 'available' | 'coming_soon';

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  logo: string | null;
  isNew?: boolean;
  provider: string;
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  cloud: 'Cloud & Infraestrutura',
  iam: 'Identidade & Acesso',
  sdlc: 'Controle de Código',
  productivity: 'Produtividade & RH',
  endpoint: 'Segurança de Endpoint',
};

export const CATEGORY_ICONS: Record<IntegrationCategory, string> = {
  cloud: 'Cloud',
  iam: 'Shield',
  sdlc: 'GitBranch',
  productivity: 'Users',
  endpoint: 'Laptop',
};

export const integrationsCatalog: IntegrationDefinition[] = [
  // Cloud & Infraestrutura
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Auditoria de IAM, S3, CloudTrail e conformidade AWS',
    category: 'cloud',
    logo: 'https://cdn.simpleicons.org/amazonaws/FF9900',
    provider: 'aws',
  },
  {
    id: 'mikrotik',
    name: 'AgentAPOC',
    description: 'Monitoramento de roteadores, firewalls e configurações de rede',
    category: 'cloud',
    logo: 'https://cdn.simpleicons.org/mikrotik/293239',
    provider: 'mikrotik',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'WAF, DNS, proteção DDoS e análise de tráfego',
    category: 'cloud',
    logo: 'https://cdn.simpleicons.org/cloudflare/F38020',
    isNew: true,
    provider: 'cloudflare',
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Monitors, security signals, log pipelines e synthetic tests',
    category: 'cloud',
    logo: 'https://cdn.simpleicons.org/datadog/632CA6',
    isNew: true,
    provider: 'datadog',
  },

  // Identidade & Acesso (IAM)
  {
    id: 'azure-ad',
    name: 'Microsoft Entra ID',
    description: 'Usuários, grupos, MFA e políticas de acesso condicional',
    category: 'iam',
    logo: 'https://cdn.simpleicons.org/microsoftazure/0078D4',
    provider: 'azure-ad',
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Diretório de usuários, permissões e políticas de segurança',
    category: 'iam',
    logo: 'https://cdn.simpleicons.org/google/4285F4',
    provider: 'google',
  },
  {
    id: 'auth0',
    name: 'Auth0',
    description: 'Gestão de identidades, SSO, MFA e conexões de autenticação',
    category: 'iam',
    logo: 'https://cdn.simpleicons.org/auth0/EB5424',
    isNew: true,
    provider: 'auth0',
  },
  {
    id: 'okta',
    name: 'Okta',
    description: 'SSO, MFA, lifecycle de identidades e gestão de acessos',
    category: 'iam',
    logo: 'https://cdn.simpleicons.org/okta/007DC1',
    isNew: true,
    provider: 'okta',
  },

  // Controle de Código (SDLC)
  {
    id: 'github',
    name: 'GitHub',
    description: 'Branch protection, PRs, secrets scanning e CODEOWNERS',
    category: 'sdlc',
    logo: 'https://cdn.simpleicons.org/github/181717',
    isNew: true,
    provider: 'github',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Pipelines CI/CD, compliance de repositórios e SAST',
    category: 'sdlc',
    logo: 'https://cdn.simpleicons.org/gitlab/FC6D26',
    isNew: true,
    provider: 'gitlab',
  },

  // Produtividade & RH
  {
    id: 'jira',
    name: 'Jira',
    description: 'Tickets de segurança, vulnerabilidades e SLAs de resposta',
    category: 'productivity',
    logo: 'https://cdn.simpleicons.org/jira/0052CC',
    isNew: true,
    provider: 'jira',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Auditoria de canais, retenção de mensagens e DLP',
    category: 'productivity',
    logo: 'https://cdn.simpleicons.org/slack/4A154B',
    isNew: true,
    provider: 'slack',
  },
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'Onboarding/offboarding e compliance de dados de RH',
    category: 'productivity',
    logo: 'https://cdn.simpleicons.org/bamboo/0052CC',
    isNew: true,
    provider: 'bamboohr',
  },

  // Segurança de Endpoint
  {
    id: 'crowdstrike',
    name: 'CrowdStrike Falcon',
    description: 'EDR, detecção de ameaças e postura de segurança',
    category: 'endpoint',
    logo: 'https://cdn.simpleicons.org/crowdstrike/F85149',
    isNew: true,
    provider: 'crowdstrike',
  },
  {
    id: 'intune',
    name: 'Microsoft Intune',
    description: 'MDM, políticas de dispositivos e compliance de endpoints',
    category: 'endpoint',
    logo: 'https://cdn.simpleicons.org/microsoftazure/0078D4',
    isNew: true,
    provider: 'intune',
  },
  
  // Manual Entry
  {
    id: 'manual-entry',
    name: 'Manual Entry',
    description: 'Add resources manually without API integration',
    category: 'productivity',
    logo: null,
    provider: 'manual',
  },
];

export const getIntegrationsByCategory = (category: IntegrationCategory): IntegrationDefinition[] => {
  return integrationsCatalog.filter(i => i.category === category);
};

export const getIntegrationById = (id: string): IntegrationDefinition | undefined => {
  return integrationsCatalog.find(i => i.id === id);
};

// IDs das integrações que já estão funcionais
export const FUNCTIONAL_INTEGRATIONS = ['aws', 'azure-ad', 'google-workspace', 'mikrotik', 'auth0', 'okta', 'cloudflare', 'jira', 'github', 'gitlab', 'slack', 'bamboohr', 'crowdstrike', 'intune', 'datadog', 'manual-entry'];

export const isIntegrationFunctional = (id: string): boolean => {
  return FUNCTIONAL_INTEGRATIONS.includes(id);
};
