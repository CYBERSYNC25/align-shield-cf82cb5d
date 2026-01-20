/**
 * Webhook Configuration Instructions by Provider
 * 
 * Step-by-step instructions for configuring webhooks on each integration provider
 */

export interface WebhookInstruction {
  title: string;
  steps: string[];
  docUrl: string;
  secretField?: string;
  contentType: string;
}

export const webhookInstructions: Record<string, WebhookInstruction> = {
  github: {
    title: 'Configurar Webhook no GitHub',
    steps: [
      'Acesse seu repositório no GitHub',
      'Vá em Settings > Webhooks > Add webhook',
      'Cole a URL do webhook no campo "Payload URL"',
      'Selecione "application/json" como Content type',
      'Gere um secret seguro e cole no campo "Secret"',
      'Em "Which events would you like to trigger this webhook?", selecione "Let me select individual events"',
      'Marque: Repositories, Branch protection rules, Members',
      'Clique em "Add webhook"',
    ],
    docUrl: 'https://docs.github.com/en/webhooks/creating-webhooks',
    secretField: 'GITHUB_WEBHOOK_SECRET',
    contentType: 'application/json',
  },
  slack: {
    title: 'Configurar Event Subscriptions no Slack',
    steps: [
      'Acesse api.slack.com/apps e selecione seu app',
      'Vá em Features > Event Subscriptions',
      'Ative "Enable Events"',
      'Cole a URL do webhook em "Request URL"',
      'Aguarde a verificação automática',
      'Em "Subscribe to bot events", adicione: user_change, team_join, member_left_channel',
      'Clique em "Save Changes"',
      'Vá em Settings > Basic Information e copie o "Signing Secret"',
    ],
    docUrl: 'https://api.slack.com/apis/connections/events-api',
    secretField: 'SLACK_SIGNING_SECRET',
    contentType: 'application/json',
  },
  aws: {
    title: 'Configurar CloudTrail + SNS no AWS',
    steps: [
      'No Console AWS, acesse CloudTrail > Trails',
      'Crie ou edite uma trail para capturar eventos de gerenciamento',
      'Vá em SNS > Topics > Create topic',
      'Crie um topic do tipo "Standard"',
      'Clique em "Create subscription"',
      'Selecione protocolo "HTTPS" e cole a URL do webhook',
      'Confirme a subscription quando receber a requisição de confirmação',
      'No CloudTrail, configure para enviar notificações para o topic SNS',
    ],
    docUrl: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/configure-sns-notifications-for-cloudtrail.html',
    contentType: 'application/json',
  },
  azure: {
    title: 'Configurar Graph Subscriptions no Azure',
    steps: [
      'Acesse portal.azure.com > Microsoft Graph',
      'Ou use a API: POST /subscriptions',
      'Configure changeType: "created,updated,deleted"',
      'Defina resource: "/users" ou "/groups"',
      'Cole a URL do webhook em notificationUrl',
      'Defina expirationDateTime (máximo 3 dias para users)',
      'A URL será validada automaticamente com um token',
      'Renove a subscription antes da expiração',
    ],
    docUrl: 'https://docs.microsoft.com/en-us/graph/webhooks',
    contentType: 'application/json',
  },
  'google-workspace': {
    title: 'Configurar Push Notifications no Google',
    steps: [
      'Acesse console.cloud.google.com',
      'Vá em APIs & Services > Credentials',
      'Configure um domínio verificado para webhooks',
      'Use a Admin SDK Reports API para configurar push',
      'Faça uma requisição POST para /admin/reports/v1/activity/users/all/applications/admin/watch',
      'Inclua o webhook URL no campo address',
      'Configure o expiration time (máximo 24 horas)',
      'Renove automaticamente via cron job',
    ],
    docUrl: 'https://developers.google.com/admin-sdk/reports/v1/guides/push',
    contentType: 'application/json',
  },
  okta: {
    title: 'Configurar Event Hooks no Okta',
    steps: [
      'Acesse Admin Console > Workflow > Event Hooks',
      'Clique em "Create Event Hook"',
      'Cole a URL do webhook',
      'Selecione os eventos desejados (user.lifecycle.*, group.*)',
      'Clique em "Save & Continue"',
      'Verifique o hook enviando um teste',
      'Ative o hook após verificação bem-sucedida',
      'Configure autenticação com header Authorization',
    ],
    docUrl: 'https://developer.okta.com/docs/concepts/event-hooks/',
    secretField: 'OKTA_HOOK_SECRET',
    contentType: 'application/json',
  },
  auth0: {
    title: 'Configurar Log Streams no Auth0',
    steps: [
      'Acesse Auth0 Dashboard > Monitoring > Streams',
      'Clique em "Create Log Stream"',
      'Selecione "Custom Webhook"',
      'Cole a URL do webhook',
      'Configure Content-Type como application/json',
      'Selecione os eventos de log desejados',
      'Adicione headers de autenticação se necessário',
      'Clique em "Save"',
    ],
    docUrl: 'https://auth0.com/docs/customize/log-streams/custom-log-streams',
    contentType: 'application/json',
  },
};

export const getProviderInstructions = (provider: string): WebhookInstruction | null => {
  const normalizedProvider = provider.toLowerCase().replace(/\s+/g, '-');
  return webhookInstructions[normalizedProvider] || null;
};
