export type IntegrationCategory = 'cloud' | 'iam' | 'sdlc' | 'productivity' | 'endpoint';
export type IntegrationStatus = 'connected' | 'available' | 'coming_soon';

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  logo: string;
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
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    provider: 'aws',
  },
  {
    id: 'mikrotik',
    name: 'AgentAPOC',
    description: 'Monitoramento de roteadores, firewalls e configurações de rede',
    category: 'cloud',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mikrotik-logo.svg/512px-Mikrotik-logo.svg.png',
    provider: 'mikrotik',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'WAF, DNS, proteção DDoS e análise de tráfego',
    category: 'cloud',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Cloudflare_Logo.svg',
    isNew: true,
    provider: 'cloudflare',
  },

  // Identidade & Acesso (IAM)
  {
    id: 'azure-ad',
    name: 'Microsoft Entra ID',
    description: 'Usuários, grupos, MFA e políticas de acesso condicional',
    category: 'iam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/150px-Microsoft_Azure.svg.png',
    provider: 'azure',
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Diretório de usuários, permissões e políticas de segurança',
    category: 'iam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
    provider: 'google',
  },
  {
    id: 'auth0',
    name: 'Auth0',
    description: 'Gestão de identidades, SSO, MFA e conexões de autenticação',
    category: 'iam',
    logo: 'https://cdn.auth0.com/website/assets/pages/press/img/auth0-logo-3D7CE7F9A0-logo.svg',
    isNew: true,
    provider: 'auth0',
  },
  {
    id: 'okta',
    name: 'Okta',
    description: 'SSO, MFA, lifecycle de identidades e gestão de acessos',
    category: 'iam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Okta_logo.svg',
    isNew: true,
    provider: 'okta',
  },

  // Controle de Código (SDLC)
  {
    id: 'github',
    name: 'GitHub',
    description: 'Branch protection, PRs, secrets scanning e CODEOWNERS',
    category: 'sdlc',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
    isNew: true,
    provider: 'github',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Pipelines CI/CD, compliance de repositórios e SAST',
    category: 'sdlc',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/GitLab_logo.svg',
    isNew: true,
    provider: 'gitlab',
  },

  // Produtividade & RH
  {
    id: 'jira',
    name: 'Jira',
    description: 'Tickets de segurança, vulnerabilidades e SLAs de resposta',
    category: 'productivity',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg',
    isNew: true,
    provider: 'jira',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Auditoria de canais, retenção de mensagens e DLP',
    category: 'productivity',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
    isNew: true,
    provider: 'slack',
  },
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'Onboarding/offboarding e compliance de dados de RH',
    category: 'productivity',
    logo: 'https://www.bamboohr.com/resources/images/logo.svg',
    isNew: true,
    provider: 'bamboohr',
  },

  // Segurança de Endpoint
  {
    id: 'crowdstrike',
    name: 'CrowdStrike Falcon',
    description: 'EDR, detecção de ameaças e postura de segurança',
    category: 'endpoint',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/CrowdStrike_logo.svg',
    isNew: true,
    provider: 'crowdstrike',
  },
  {
    id: 'intune',
    name: 'Microsoft Intune',
    description: 'MDM, políticas de dispositivos e compliance de endpoints',
    category: 'endpoint',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/150px-Microsoft_Azure.svg.png',
    isNew: true,
    provider: 'intune',
  },
];

export const getIntegrationsByCategory = (category: IntegrationCategory): IntegrationDefinition[] => {
  return integrationsCatalog.filter(i => i.category === category);
};

export const getIntegrationById = (id: string): IntegrationDefinition | undefined => {
  return integrationsCatalog.find(i => i.id === id);
};

// IDs das integrações que já estão funcionais
export const FUNCTIONAL_INTEGRATIONS = ['aws', 'azure-ad', 'google-workspace', 'mikrotik', 'auth0', 'okta', 'cloudflare', 'jira', 'github', 'gitlab', 'slack'];

export const isIntegrationFunctional = (id: string): boolean => {
  return FUNCTIONAL_INTEGRATIONS.includes(id);
};
