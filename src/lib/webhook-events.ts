/**
 * Supported Webhook Events by Provider
 * 
 * Lists all events that can be received from each integration
 * with toggle state and compliance rule mapping
 */

export interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  triggersComplianceRule: boolean;
  ruleId?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export const webhookEvents: Record<string, WebhookEvent[]> = {
  github: [
    {
      id: 'repository.publicized',
      name: 'Repository Publicized',
      description: 'Repositório foi tornado público',
      triggersComplianceRule: true,
      ruleId: 'github-public-repo',
      severity: 'critical',
    },
    {
      id: 'repository.privatized',
      name: 'Repository Privatized',
      description: 'Repositório foi tornado privado',
      triggersComplianceRule: false,
    },
    {
      id: 'branch_protection_rule.deleted',
      name: 'Branch Protection Deleted',
      description: 'Regra de proteção de branch removida',
      triggersComplianceRule: true,
      ruleId: 'github-branch-protection',
      severity: 'high',
    },
    {
      id: 'member.added',
      name: 'Member Added',
      description: 'Novo membro adicionado ao repositório/org',
      triggersComplianceRule: false,
    },
    {
      id: 'member.removed',
      name: 'Member Removed',
      description: 'Membro removido do repositório/org',
      triggersComplianceRule: false,
    },
  ],
  slack: [
    {
      id: 'user_change',
      name: 'User Change',
      description: 'Perfil de usuário atualizado (inclui 2FA)',
      triggersComplianceRule: true,
      ruleId: 'slack-admin-no-mfa',
      severity: 'critical',
    },
    {
      id: 'team_join',
      name: 'Team Join',
      description: 'Novo usuário entrou no workspace',
      triggersComplianceRule: false,
    },
    {
      id: 'member_left_channel',
      name: 'Member Left Channel',
      description: 'Usuário saiu de um canal',
      triggersComplianceRule: false,
    },
    {
      id: 'channel_created',
      name: 'Channel Created',
      description: 'Novo canal criado',
      triggersComplianceRule: false,
    },
  ],
  aws: [
    {
      id: 'PutBucketPolicy',
      name: 'Put Bucket Policy',
      description: 'Política de bucket S3 alterada',
      triggersComplianceRule: true,
      ruleId: 'aws-public-bucket',
      severity: 'critical',
    },
    {
      id: 'PutBucketAcl',
      name: 'Put Bucket ACL',
      description: 'ACL de bucket S3 alterada',
      triggersComplianceRule: true,
      ruleId: 'aws-public-bucket',
      severity: 'critical',
    },
    {
      id: 'DeleteBucketEncryption',
      name: 'Delete Bucket Encryption',
      description: 'Criptografia de bucket removida',
      triggersComplianceRule: true,
      ruleId: 'aws-bucket-encryption',
      severity: 'high',
    },
    {
      id: 'CreateUser',
      name: 'Create User',
      description: 'Novo usuário IAM criado',
      triggersComplianceRule: false,
    },
    {
      id: 'CreateAccessKey',
      name: 'Create Access Key',
      description: 'Nova access key criada',
      triggersComplianceRule: true,
      ruleId: 'aws-access-key-rotation',
      severity: 'medium',
    },
  ],
  azure: [
    {
      id: 'user.created',
      name: 'User Created',
      description: 'Novo usuário criado no Azure AD',
      triggersComplianceRule: false,
    },
    {
      id: 'user.updated',
      name: 'User Updated',
      description: 'Usuário atualizado (inclui MFA)',
      triggersComplianceRule: true,
      ruleId: 'azure-user-no-mfa',
      severity: 'critical',
    },
    {
      id: 'user.deleted',
      name: 'User Deleted',
      description: 'Usuário removido do Azure AD',
      triggersComplianceRule: false,
    },
    {
      id: 'group.member.added',
      name: 'Group Member Added',
      description: 'Membro adicionado a grupo',
      triggersComplianceRule: false,
    },
    {
      id: 'conditionalAccessPolicy.deleted',
      name: 'Conditional Access Deleted',
      description: 'Política de acesso condicional removida',
      triggersComplianceRule: true,
      ruleId: 'azure-no-conditional-access',
      severity: 'high',
    },
  ],
  'google-workspace': [
    {
      id: 'user.2sv.disabled',
      name: '2FA Disabled',
      description: 'Verificação em 2 etapas desativada',
      triggersComplianceRule: true,
      ruleId: 'google-admin-no-mfa',
      severity: 'critical',
    },
    {
      id: 'user.created',
      name: 'User Created',
      description: 'Novo usuário criado',
      triggersComplianceRule: false,
    },
    {
      id: 'user.suspended',
      name: 'User Suspended',
      description: 'Usuário suspenso',
      triggersComplianceRule: false,
    },
    {
      id: 'group.member.added',
      name: 'Group Member Added',
      description: 'Membro adicionado a grupo',
      triggersComplianceRule: false,
    },
  ],
  okta: [
    {
      id: 'user.lifecycle.deactivate',
      name: 'User Deactivated',
      description: 'Usuário desativado',
      triggersComplianceRule: false,
    },
    {
      id: 'user.mfa.factor.deactivate',
      name: 'MFA Deactivated',
      description: 'Fator MFA removido do usuário',
      triggersComplianceRule: true,
      ruleId: 'okta-user-no-mfa',
      severity: 'critical',
    },
    {
      id: 'group.user_membership.add',
      name: 'Group Membership Added',
      description: 'Usuário adicionado a grupo',
      triggersComplianceRule: false,
    },
    {
      id: 'policy.lifecycle.deactivate',
      name: 'Policy Deactivated',
      description: 'Política de segurança desativada',
      triggersComplianceRule: true,
      ruleId: 'okta-policy-disabled',
      severity: 'high',
    },
  ],
  auth0: [
    {
      id: 'ss',
      name: 'Successful Silent Auth',
      description: 'Autenticação silenciosa bem-sucedida',
      triggersComplianceRule: false,
    },
    {
      id: 'fp',
      name: 'Failed Login (Password)',
      description: 'Falha de login por senha incorreta',
      triggersComplianceRule: true,
      ruleId: 'auth0-brute-force',
      severity: 'medium',
    },
    {
      id: 'fu',
      name: 'Failed Login (User)',
      description: 'Falha de login por usuário inexistente',
      triggersComplianceRule: false,
    },
    {
      id: 'seccft',
      name: 'Client Credentials Success',
      description: 'Autenticação M2M bem-sucedida',
      triggersComplianceRule: false,
    },
  ],
};

export const getProviderEvents = (provider: string): WebhookEvent[] => {
  const normalizedProvider = provider.toLowerCase().replace(/\s+/g, '-');
  return webhookEvents[normalizedProvider] || [];
};
