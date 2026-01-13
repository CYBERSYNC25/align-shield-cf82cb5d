// Educational guides for remediation steps per compliance rule

export interface RemediationGuide {
  steps: string[];
  externalLink?: string;
  linkLabel?: string;
  estimatedTime?: string;
}

export const REMEDIATION_GUIDES: Record<string, RemediationGuide> = {
  'github-public-repo': {
    steps: [
      'Acesse github.com e navegue até o repositório afetado',
      'Clique em "Settings" no menu do repositório',
      'Role até a seção "Danger Zone"',
      'Clique em "Change visibility"',
      'Selecione "Make private" e confirme a ação'
    ],
    externalLink: 'https://github.com/settings/repositories',
    linkLabel: 'Abrir GitHub Settings',
    estimatedTime: '2 minutos'
  },
  'cloudflare-no-https': {
    steps: [
      'Acesse o painel do Cloudflare (dash.cloudflare.com)',
      'Selecione o domínio afetado na lista',
      'Navegue até SSL/TLS > Edge Certificates',
      'Ative a opção "Always Use HTTPS"',
      'Aguarde a propagação (até 5 minutos)'
    ],
    externalLink: 'https://dash.cloudflare.com',
    linkLabel: 'Abrir Cloudflare Dashboard',
    estimatedTime: '5 minutos'
  },
  'slack-admin-no-mfa': {
    steps: [
      'Como admin do Slack, acesse as configurações do Workspace',
      'Navegue até Authentication > Workspace-wide two-factor authentication',
      'Ative a exigência de 2FA para todos os membros',
      'Envie comunicado aos usuários para ativarem 2FA em suas contas',
      'Monitore a conformidade no painel de administração'
    ],
    externalLink: 'https://slack.com/admin/settings',
    linkLabel: 'Abrir Slack Admin',
    estimatedTime: '10 minutos'
  },
  'github-admin-no-mfa': {
    steps: [
      'Acesse a organização no GitHub',
      'Vá em Settings > Authentication security',
      'Ative "Require two-factor authentication"',
      'Notifique os membros afetados para habilitarem 2FA',
      'Membros sem 2FA serão removidos automaticamente após o prazo'
    ],
    externalLink: 'https://github.com/settings/security',
    linkLabel: 'Abrir GitHub Security',
    estimatedTime: '15 minutos'
  },
  'google-admin-no-mfa': {
    steps: [
      'Acesse o Google Admin Console (admin.google.com)',
      'Navegue até Security > 2-Step Verification',
      'Ative a verificação em duas etapas para a organização',
      'Configure políticas de enforcement para administradores',
      'Monitore a ativação pelos usuários afetados'
    ],
    externalLink: 'https://admin.google.com/ac/security/2sv',
    linkLabel: 'Abrir Google Admin',
    estimatedTime: '10 minutos'
  },
  'intune-noncompliant-device': {
    steps: [
      'Acesse o Microsoft Endpoint Manager (endpoint.microsoft.com)',
      'Navegue até Devices > Compliance policies',
      'Identifique o dispositivo não conforme',
      'Revise as políticas de conformidade aplicáveis',
      'Entre em contato com o usuário para remediar o dispositivo',
      'Execute uma sincronização forçada se necessário'
    ],
    externalLink: 'https://endpoint.microsoft.com/#blade/Microsoft_Intune_DeviceSettings/DevicesMenu/compliance',
    linkLabel: 'Abrir Intune',
    estimatedTime: '20 minutos'
  },
  'aws-public-bucket': {
    steps: [
      'Acesse o Console AWS S3',
      'Localize o bucket público identificado',
      'Vá em Permissions > Block public access',
      'Ative todas as opções de bloqueio de acesso público',
      'Revise as ACLs e políticas do bucket',
      'Confirme que nenhum objeto está exposto publicamente'
    ],
    externalLink: 'https://s3.console.aws.amazon.com/s3/buckets',
    linkLabel: 'Abrir AWS S3 Console',
    estimatedTime: '10 minutos'
  },
  'auth0-admin-no-mfa': {
    steps: [
      'Acesse o painel do Auth0',
      'Navegue até Security > Multi-factor Auth',
      'Configure MFA como obrigatório para administradores',
      'Defina políticas de MFA por regras ou actions',
      'Teste o fluxo de autenticação'
    ],
    externalLink: 'https://manage.auth0.com/#/security/mfa',
    linkLabel: 'Abrir Auth0 MFA Settings',
    estimatedTime: '15 minutos'
  },
  'okta-admin-no-mfa': {
    steps: [
      'Acesse o Okta Admin Console',
      'Navegue até Security > Multifactor',
      'Configure fatores de autenticação obrigatórios',
      'Crie uma política de MFA para administradores',
      'Aplique a política ao grupo de admins'
    ],
    externalLink: 'https://admin.okta.com/admin/access/multifactor',
    linkLabel: 'Abrir Okta MFA',
    estimatedTime: '15 minutos'
  },
  'inactive-access': {
    steps: [
      'Revise a lista de usuários com acesso inativo',
      'Confirme com os gestores se o acesso ainda é necessário',
      'Para acessos desnecessários, revogue imediatamente',
      'Documente a decisão no sistema de tickets',
      'Configure alertas para detectar inatividade futura'
    ],
    estimatedTime: '30 minutos'
  },
  'excessive-privileges': {
    steps: [
      'Identifique todos os sistemas onde o usuário tem privilégios elevados',
      'Aplique o princípio do menor privilégio',
      'Remova permissões de admin desnecessárias',
      'Documente a justificativa para privilégios restantes',
      'Configure revisões periódicas de acesso'
    ],
    estimatedTime: '45 minutos'
  }
};

export function getRemediationGuide(ruleId: string): RemediationGuide {
  return REMEDIATION_GUIDES[ruleId] || {
    steps: [
      'Identifique o recurso afetado',
      'Revise as configurações de segurança',
      'Aplique as correções necessárias',
      'Documente as alterações realizadas',
      'Verifique a conformidade após a correção'
    ],
    estimatedTime: '15 minutos'
  };
}
