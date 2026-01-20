/**
 * Resource schemas for custom compliance test builder
 * Defines available fields, types, and valid operators per integration/resource type
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'date';

export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'greater_than_or_equals' 
  | 'less_than_or_equals'
  | 'contains' 
  | 'not_contains'
  | 'regex_match'
  | 'is_empty' 
  | 'is_not_empty'
  | 'in_array' 
  | 'not_in_array'
  | 'starts_with' 
  | 'ends_with';

export interface FieldSchema {
  name: string;
  path: string;
  type: FieldType;
  label: string;
  description?: string;
  operators: ConditionOperator[];
}

export interface ResourceSchema {
  resourceType: string;
  label: string;
  description?: string;
  fields: FieldSchema[];
}

export interface IntegrationSchema {
  provider: string;
  name: string;
  icon?: string;
  resources: ResourceSchema[];
}

// Operator tooltips with examples
export const OPERATOR_TOOLTIPS: Record<ConditionOperator, { 
  label: string; 
  tooltip: string; 
  example: string;
  supportedTypes: FieldType[];
}> = {
  equals: { 
    label: 'Igual a', 
    tooltip: 'Valor deve ser exatamente igual ao especificado',
    example: 'mfaEnabled = true',
    supportedTypes: ['string', 'number', 'boolean', 'date']
  },
  not_equals: { 
    label: 'Diferente de', 
    tooltip: 'Valor deve ser diferente do especificado',
    example: 'status != "disabled"',
    supportedTypes: ['string', 'number', 'boolean', 'date']
  },
  greater_than: { 
    label: 'Maior que', 
    tooltip: 'Para números ou datas, valor deve ser maior que o especificado',
    example: 'createdAt > 2024-01-01',
    supportedTypes: ['number', 'date']
  },
  less_than: { 
    label: 'Menor que', 
    tooltip: 'Para números ou datas, valor deve ser menor que o especificado',
    example: 'accessCount < 10',
    supportedTypes: ['number', 'date']
  },
  greater_than_or_equals: { 
    label: 'Maior ou igual', 
    tooltip: 'Para números ou datas, valor deve ser maior ou igual ao especificado',
    example: 'loginCount >= 5',
    supportedTypes: ['number', 'date']
  },
  less_than_or_equals: { 
    label: 'Menor ou igual', 
    tooltip: 'Para números ou datas, valor deve ser menor ou igual ao especificado',
    example: 'riskScore <= 3',
    supportedTypes: ['number', 'date']
  },
  contains: { 
    label: 'Contém', 
    tooltip: 'String deve conter o valor especificado (case insensitive)',
    example: 'email contains "@empresa.com"',
    supportedTypes: ['string']
  },
  not_contains: { 
    label: 'Não contém', 
    tooltip: 'String não deve conter o valor especificado',
    example: 'name not contains "test"',
    supportedTypes: ['string']
  },
  regex_match: { 
    label: 'Expressão Regular', 
    tooltip: 'Valor deve corresponder à expressão regular especificada',
    example: 'userName matches "^admin_.*"',
    supportedTypes: ['string']
  },
  is_empty: { 
    label: 'Está vazio', 
    tooltip: 'Campo é null, undefined ou string vazia',
    example: 'lastLogin is empty',
    supportedTypes: ['string', 'number', 'boolean', 'array', 'date']
  },
  is_not_empty: { 
    label: 'Não está vazio', 
    tooltip: 'Campo tem um valor definido',
    example: 'mfaMethod is not empty',
    supportedTypes: ['string', 'number', 'boolean', 'array', 'date']
  },
  in_array: { 
    label: 'Está na lista', 
    tooltip: 'Valor está presente no array especificado (separe valores por vírgula)',
    example: 'role in ["admin", "owner"]',
    supportedTypes: ['string', 'number']
  },
  not_in_array: { 
    label: 'Não está na lista', 
    tooltip: 'Valor não está presente no array especificado',
    example: 'type not in ["guest", "external"]',
    supportedTypes: ['string', 'number']
  },
  starts_with: { 
    label: 'Começa com', 
    tooltip: 'String deve iniciar com o valor especificado',
    example: 'name starts with "prod-"',
    supportedTypes: ['string']
  },
  ends_with: { 
    label: 'Termina com', 
    tooltip: 'String deve terminar com o valor especificado',
    example: 'email ends with ".br"',
    supportedTypes: ['string']
  }
};

// Get valid operators for a field type
export function getOperatorsForType(type: FieldType): ConditionOperator[] {
  return (Object.keys(OPERATOR_TOOLTIPS) as ConditionOperator[]).filter(
    op => OPERATOR_TOOLTIPS[op].supportedTypes.includes(type)
  );
}

// AWS Schema
const awsSchema: IntegrationSchema = {
  provider: 'aws',
  name: 'Amazon Web Services',
  resources: [
    {
      resourceType: 'iam_users',
      label: 'Usuários IAM',
      description: 'Usuários do AWS Identity and Access Management',
      fields: [
        { 
          name: 'userName', 
          path: 'user.userName', 
          type: 'string', 
          label: 'Nome do Usuário',
          description: 'Identificador único do usuário IAM',
          operators: ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'regex_match', 'is_empty', 'is_not_empty']
        },
        { 
          name: 'mfaEnabled', 
          path: 'user.mfaEnabled', 
          type: 'boolean', 
          label: 'MFA Habilitado',
          description: 'Se a autenticação multi-fator está ativada',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'accessKeyAge', 
          path: 'user.accessKeyAge', 
          type: 'number', 
          label: 'Idade da Access Key (dias)',
          description: 'Quantidade de dias desde a criação da chave de acesso',
          operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equals', 'less_than_or_equals']
        },
        { 
          name: 'lastActivity', 
          path: 'user.lastActivity', 
          type: 'date', 
          label: 'Última Atividade',
          description: 'Data da última atividade do usuário',
          operators: ['equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']
        },
        { 
          name: 'policies', 
          path: 'user.policies', 
          type: 'array', 
          label: 'Políticas Anexadas',
          description: 'Lista de políticas IAM anexadas ao usuário',
          operators: ['is_empty', 'is_not_empty']
        },
        { 
          name: 'groups', 
          path: 'user.groups', 
          type: 'array', 
          label: 'Grupos',
          description: 'Grupos IAM aos quais o usuário pertence',
          operators: ['is_empty', 'is_not_empty']
        }
      ]
    },
    {
      resourceType: 's3_buckets',
      label: 'Buckets S3',
      description: 'Buckets de armazenamento Amazon S3',
      fields: [
        { 
          name: 'name', 
          path: 'bucket.name', 
          type: 'string', 
          label: 'Nome do Bucket',
          operators: ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'regex_match']
        },
        { 
          name: 'encryption', 
          path: 'bucket.encryption', 
          type: 'boolean', 
          label: 'Criptografia Habilitada',
          description: 'Se o bucket tem criptografia server-side habilitada',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'publicAccess', 
          path: 'bucket.publicAccess', 
          type: 'boolean', 
          label: 'Acesso Público',
          description: 'Se o bucket permite acesso público',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'versioning', 
          path: 'bucket.versioning', 
          type: 'boolean', 
          label: 'Versionamento',
          description: 'Se o versionamento de objetos está habilitado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'logging', 
          path: 'bucket.logging', 
          type: 'boolean', 
          label: 'Logging Habilitado',
          description: 'Se o access logging está configurado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'region', 
          path: 'bucket.region', 
          type: 'string', 
          label: 'Região',
          operators: ['equals', 'not_equals', 'in_array', 'not_in_array']
        }
      ]
    },
    {
      resourceType: 'ec2_instances',
      label: 'Instâncias EC2',
      description: 'Instâncias de computação Amazon EC2',
      fields: [
        { 
          name: 'instanceId', 
          path: 'instance.instanceId', 
          type: 'string', 
          label: 'ID da Instância',
          operators: ['equals', 'not_equals', 'starts_with']
        },
        { 
          name: 'state', 
          path: 'instance.state', 
          type: 'string', 
          label: 'Estado',
          description: 'Estado atual da instância (running, stopped, etc.)',
          operators: ['equals', 'not_equals', 'in_array']
        },
        { 
          name: 'publicIp', 
          path: 'instance.publicIp', 
          type: 'string', 
          label: 'IP Público',
          operators: ['is_empty', 'is_not_empty', 'equals']
        },
        { 
          name: 'imdsV2Required', 
          path: 'instance.imdsV2Required', 
          type: 'boolean', 
          label: 'IMDS v2 Obrigatório',
          description: 'Se a instância requer IMDS v2',
          operators: ['equals', 'not_equals']
        }
      ]
    }
  ]
};

// Azure AD Schema
const azureAdSchema: IntegrationSchema = {
  provider: 'azure-ad',
  name: 'Azure Active Directory',
  resources: [
    {
      resourceType: 'user',
      label: 'Usuários',
      description: 'Usuários do Azure Active Directory',
      fields: [
        { 
          name: 'displayName', 
          path: 'user.displayName', 
          type: 'string', 
          label: 'Nome de Exibição',
          operators: ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'regex_match']
        },
        { 
          name: 'userPrincipalName', 
          path: 'user.userPrincipalName', 
          type: 'string', 
          label: 'UPN (Email)',
          operators: ['equals', 'not_equals', 'contains', 'ends_with', 'regex_match']
        },
        { 
          name: 'accountEnabled', 
          path: 'user.accountEnabled', 
          type: 'boolean', 
          label: 'Conta Ativa',
          description: 'Se a conta do usuário está habilitada',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'mfaEnabled', 
          path: 'user.mfaEnabled', 
          type: 'boolean', 
          label: 'MFA Habilitado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'userType', 
          path: 'user.userType', 
          type: 'string', 
          label: 'Tipo de Usuário',
          description: 'Member ou Guest',
          operators: ['equals', 'not_equals', 'in_array']
        },
        { 
          name: 'lastSignIn', 
          path: 'user.lastSignIn', 
          type: 'date', 
          label: 'Último Login',
          operators: ['greater_than', 'less_than', 'is_empty', 'is_not_empty']
        },
        { 
          name: 'createdDateTime', 
          path: 'user.createdDateTime', 
          type: 'date', 
          label: 'Data de Criação',
          operators: ['greater_than', 'less_than']
        },
        { 
          name: 'department', 
          path: 'user.department', 
          type: 'string', 
          label: 'Departamento',
          operators: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty', 'in_array']
        },
        { 
          name: 'jobTitle', 
          path: 'user.jobTitle', 
          type: 'string', 
          label: 'Cargo',
          operators: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty']
        }
      ]
    },
    {
      resourceType: 'group',
      label: 'Grupos',
      description: 'Grupos do Azure AD',
      fields: [
        { 
          name: 'displayName', 
          path: 'group.displayName', 
          type: 'string', 
          label: 'Nome do Grupo',
          operators: ['equals', 'not_equals', 'contains', 'starts_with']
        },
        { 
          name: 'securityEnabled', 
          path: 'group.securityEnabled', 
          type: 'boolean', 
          label: 'Grupo de Segurança',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'memberCount', 
          path: 'group.memberCount', 
          type: 'number', 
          label: 'Número de Membros',
          operators: ['equals', 'greater_than', 'less_than', 'greater_than_or_equals', 'less_than_or_equals']
        }
      ]
    },
    {
      resourceType: 'application',
      label: 'Aplicações',
      description: 'Aplicações registradas no Azure AD',
      fields: [
        { 
          name: 'displayName', 
          path: 'app.displayName', 
          type: 'string', 
          label: 'Nome da Aplicação',
          operators: ['equals', 'not_equals', 'contains']
        },
        { 
          name: 'signInAudience', 
          path: 'app.signInAudience', 
          type: 'string', 
          label: 'Público de Login',
          operators: ['equals', 'not_equals', 'in_array']
        },
        { 
          name: 'createdDateTime', 
          path: 'app.createdDateTime', 
          type: 'date', 
          label: 'Data de Criação',
          operators: ['greater_than', 'less_than']
        }
      ]
    }
  ]
};

// Google Workspace Schema
const googleWorkspaceSchema: IntegrationSchema = {
  provider: 'google-workspace',
  name: 'Google Workspace',
  resources: [
    {
      resourceType: 'user',
      label: 'Usuários',
      description: 'Usuários do Google Workspace',
      fields: [
        { 
          name: 'primaryEmail', 
          path: 'user.primaryEmail', 
          type: 'string', 
          label: 'Email Principal',
          operators: ['equals', 'not_equals', 'contains', 'ends_with', 'regex_match']
        },
        { 
          name: 'name', 
          path: 'user.name.fullName', 
          type: 'string', 
          label: 'Nome Completo',
          operators: ['equals', 'not_equals', 'contains']
        },
        { 
          name: 'suspended', 
          path: 'user.suspended', 
          type: 'boolean', 
          label: 'Conta Suspensa',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'isAdmin', 
          path: 'user.isAdmin', 
          type: 'boolean', 
          label: 'É Administrador',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'is2faEnrolled', 
          path: 'user.isEnrolledIn2Sv', 
          type: 'boolean', 
          label: '2FA Configurado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'is2faEnforced', 
          path: 'user.isEnforcedIn2Sv', 
          type: 'boolean', 
          label: '2FA Forçado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'lastLoginTime', 
          path: 'user.lastLoginTime', 
          type: 'date', 
          label: 'Último Login',
          operators: ['greater_than', 'less_than', 'is_empty', 'is_not_empty']
        },
        { 
          name: 'creationTime', 
          path: 'user.creationTime', 
          type: 'date', 
          label: 'Data de Criação',
          operators: ['greater_than', 'less_than']
        },
        { 
          name: 'orgUnitPath', 
          path: 'user.orgUnitPath', 
          type: 'string', 
          label: 'Unidade Organizacional',
          operators: ['equals', 'not_equals', 'starts_with', 'contains']
        }
      ]
    },
    {
      resourceType: 'group',
      label: 'Grupos',
      description: 'Grupos do Google Workspace',
      fields: [
        { 
          name: 'email', 
          path: 'group.email', 
          type: 'string', 
          label: 'Email do Grupo',
          operators: ['equals', 'not_equals', 'contains', 'ends_with']
        },
        { 
          name: 'name', 
          path: 'group.name', 
          type: 'string', 
          label: 'Nome do Grupo',
          operators: ['equals', 'not_equals', 'contains']
        },
        { 
          name: 'directMembersCount', 
          path: 'group.directMembersCount', 
          type: 'number', 
          label: 'Número de Membros',
          operators: ['equals', 'greater_than', 'less_than', 'greater_than_or_equals', 'less_than_or_equals']
        }
      ]
    }
  ]
};

// GitHub Schema
const githubSchema: IntegrationSchema = {
  provider: 'github',
  name: 'GitHub',
  resources: [
    {
      resourceType: 'repository',
      label: 'Repositórios',
      description: 'Repositórios GitHub',
      fields: [
        { 
          name: 'name', 
          path: 'repo.name', 
          type: 'string', 
          label: 'Nome do Repositório',
          operators: ['equals', 'not_equals', 'contains', 'starts_with', 'regex_match']
        },
        { 
          name: 'visibility', 
          path: 'repo.visibility', 
          type: 'string', 
          label: 'Visibilidade',
          description: 'public, private, ou internal',
          operators: ['equals', 'not_equals', 'in_array']
        },
        { 
          name: 'branchProtection', 
          path: 'repo.branch_protection', 
          type: 'boolean', 
          label: 'Branch Protection',
          description: 'Se a branch principal tem regras de proteção',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'defaultBranch', 
          path: 'repo.default_branch', 
          type: 'string', 
          label: 'Branch Padrão',
          operators: ['equals', 'not_equals', 'in_array']
        },
        { 
          name: 'archived', 
          path: 'repo.archived', 
          type: 'boolean', 
          label: 'Arquivado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'allowForking', 
          path: 'repo.allow_forking', 
          type: 'boolean', 
          label: 'Permite Fork',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'secretScanning', 
          path: 'repo.secret_scanning_enabled', 
          type: 'boolean', 
          label: 'Secret Scanning',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'dependabotEnabled', 
          path: 'repo.dependabot_enabled', 
          type: 'boolean', 
          label: 'Dependabot',
          operators: ['equals', 'not_equals']
        }
      ]
    },
    {
      resourceType: 'member',
      label: 'Membros da Organização',
      description: 'Membros da organização GitHub',
      fields: [
        { 
          name: 'login', 
          path: 'member.login', 
          type: 'string', 
          label: 'Username',
          operators: ['equals', 'not_equals', 'contains', 'starts_with']
        },
        { 
          name: 'role', 
          path: 'member.role', 
          type: 'string', 
          label: 'Papel na Org',
          description: 'admin ou member',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'twoFactorEnabled', 
          path: 'member.two_factor_enabled', 
          type: 'boolean', 
          label: '2FA Habilitado',
          operators: ['equals', 'not_equals']
        }
      ]
    }
  ]
};

// Okta Schema
const oktaSchema: IntegrationSchema = {
  provider: 'okta',
  name: 'Okta',
  resources: [
    {
      resourceType: 'user',
      label: 'Usuários',
      description: 'Usuários Okta',
      fields: [
        { 
          name: 'login', 
          path: 'user.profile.login', 
          type: 'string', 
          label: 'Login',
          operators: ['equals', 'not_equals', 'contains', 'ends_with']
        },
        { 
          name: 'email', 
          path: 'user.profile.email', 
          type: 'string', 
          label: 'Email',
          operators: ['equals', 'not_equals', 'contains', 'ends_with']
        },
        { 
          name: 'status', 
          path: 'user.status', 
          type: 'string', 
          label: 'Status',
          description: 'ACTIVE, STAGED, PROVISIONED, etc.',
          operators: ['equals', 'not_equals', 'in_array']
        },
        { 
          name: 'mfaEnabled', 
          path: 'user.mfaEnabled', 
          type: 'boolean', 
          label: 'MFA Habilitado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'lastLogin', 
          path: 'user.lastLogin', 
          type: 'date', 
          label: 'Último Login',
          operators: ['greater_than', 'less_than', 'is_empty', 'is_not_empty']
        },
        { 
          name: 'created', 
          path: 'user.created', 
          type: 'date', 
          label: 'Data de Criação',
          operators: ['greater_than', 'less_than']
        }
      ]
    },
    {
      resourceType: 'application',
      label: 'Aplicações',
      description: 'Aplicações Okta',
      fields: [
        { 
          name: 'label', 
          path: 'app.label', 
          type: 'string', 
          label: 'Nome da Aplicação',
          operators: ['equals', 'not_equals', 'contains']
        },
        { 
          name: 'status', 
          path: 'app.status', 
          type: 'string', 
          label: 'Status',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'signOnMode', 
          path: 'app.signOnMode', 
          type: 'string', 
          label: 'Modo de Login',
          operators: ['equals', 'not_equals', 'in_array']
        }
      ]
    }
  ]
};

// Auth0 Schema
const auth0Schema: IntegrationSchema = {
  provider: 'auth0',
  name: 'Auth0',
  resources: [
    {
      resourceType: 'user',
      label: 'Usuários',
      description: 'Usuários Auth0',
      fields: [
        { 
          name: 'email', 
          path: 'user.email', 
          type: 'string', 
          label: 'Email',
          operators: ['equals', 'not_equals', 'contains', 'ends_with']
        },
        { 
          name: 'email_verified', 
          path: 'user.email_verified', 
          type: 'boolean', 
          label: 'Email Verificado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'blocked', 
          path: 'user.blocked', 
          type: 'boolean', 
          label: 'Bloqueado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'mfaEnrolled', 
          path: 'user.multifactor.length', 
          type: 'number', 
          label: 'Fatores MFA',
          operators: ['equals', 'greater_than', 'less_than']
        },
        { 
          name: 'last_login', 
          path: 'user.last_login', 
          type: 'date', 
          label: 'Último Login',
          operators: ['greater_than', 'less_than', 'is_empty', 'is_not_empty']
        },
        { 
          name: 'logins_count', 
          path: 'user.logins_count', 
          type: 'number', 
          label: 'Número de Logins',
          operators: ['equals', 'greater_than', 'less_than', 'greater_than_or_equals', 'less_than_or_equals']
        }
      ]
    }
  ]
};

// Slack Schema
const slackSchema: IntegrationSchema = {
  provider: 'slack',
  name: 'Slack',
  resources: [
    {
      resourceType: 'user',
      label: 'Usuários',
      description: 'Usuários do Slack Workspace',
      fields: [
        { 
          name: 'name', 
          path: 'user.name', 
          type: 'string', 
          label: 'Nome',
          operators: ['equals', 'not_equals', 'contains']
        },
        { 
          name: 'email', 
          path: 'user.profile.email', 
          type: 'string', 
          label: 'Email',
          operators: ['equals', 'not_equals', 'contains', 'ends_with']
        },
        { 
          name: 'is_admin', 
          path: 'user.is_admin', 
          type: 'boolean', 
          label: 'É Admin',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'is_owner', 
          path: 'user.is_owner', 
          type: 'boolean', 
          label: 'É Owner',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'is_bot', 
          path: 'user.is_bot', 
          type: 'boolean', 
          label: 'É Bot',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'has_2fa', 
          path: 'user.has_2fa', 
          type: 'boolean', 
          label: '2FA Habilitado',
          operators: ['equals', 'not_equals']
        },
        { 
          name: 'deleted', 
          path: 'user.deleted', 
          type: 'boolean', 
          label: 'Deletado',
          operators: ['equals', 'not_equals']
        }
      ]
    }
  ]
};

// Export all schemas
export const INTEGRATION_SCHEMAS: IntegrationSchema[] = [
  awsSchema,
  azureAdSchema,
  googleWorkspaceSchema,
  githubSchema,
  oktaSchema,
  auth0Schema,
  slackSchema
];

// Helper function to get schema by provider
export function getIntegrationSchema(provider: string): IntegrationSchema | undefined {
  return INTEGRATION_SCHEMAS.find(schema => schema.provider === provider);
}

// Helper function to get resource schema
export function getResourceSchema(provider: string, resourceType: string): ResourceSchema | undefined {
  const integration = getIntegrationSchema(provider);
  return integration?.resources.find(r => r.resourceType === resourceType);
}

// Helper function to get field schema
export function getFieldSchema(provider: string, resourceType: string, fieldName: string): FieldSchema | undefined {
  const resource = getResourceSchema(provider, resourceType);
  return resource?.fields.find(f => f.name === fieldName);
}

// Get all available integrations as options
export function getIntegrationOptions(): { value: string; label: string }[] {
  return INTEGRATION_SCHEMAS.map(schema => ({
    value: schema.provider,
    label: schema.name
  }));
}

// Get resource types for an integration
export function getResourceTypeOptions(provider: string): { value: string; label: string; description?: string }[] {
  const integration = getIntegrationSchema(provider);
  if (!integration) return [];
  
  return integration.resources.map(resource => ({
    value: resource.resourceType,
    label: resource.label,
    description: resource.description
  }));
}

// Get field options for a resource type
export function getFieldOptions(provider: string, resourceType: string): { 
  value: string; 
  label: string; 
  type: FieldType;
  description?: string;
  path: string;
}[] {
  const resource = getResourceSchema(provider, resourceType);
  if (!resource) return [];
  
  return resource.fields.map(field => ({
    value: field.name,
    label: field.label,
    type: field.type,
    description: field.description,
    path: field.path
  }));
}
