import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Key, 
  ExternalLink, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';

/**
 * Componente para documentar e gerenciar secrets de integrações
 * 
 * IMPORTANTE: Este componente NÃO armazena ou manipula secrets diretamente.
 * Todas as secrets devem ser configuradas via Supabase Dashboard.
 * 
 * Este componente apenas:
 * - Documenta quais secrets são necessárias
 * - Fornece links para o Dashboard do Supabase
 * - Valida se as edge functions estão configuradas corretamente
 */
const SecretsManagement = () => {
  const [showSecretNames, setShowSecretNames] = useState(true);

  const integrationSecrets = [
    {
      integration: 'AWS',
      icon: '☁️',
      secrets: [
        { name: 'AWS_ACCESS_KEY_ID', description: 'Access Key ID da conta AWS', required: true },
        { name: 'AWS_SECRET_ACCESS_KEY', description: 'Secret Access Key da conta AWS', required: true },
        { name: 'AWS_REGION', description: 'Região padrão (ex: us-east-1)', required: true },
        { name: 'AWS_ACCOUNT_ID', description: 'ID da conta AWS', required: false },
      ],
      edgeFunction: 'aws-integration',
      configured: false
    },
    {
      integration: 'Azure',
      icon: '🔷',
      secrets: [
        { name: 'AZURE_TENANT_ID', description: 'Tenant ID do Azure AD', required: true },
        { name: 'AZURE_CLIENT_ID', description: 'Client ID (Application ID)', required: true },
        { name: 'AZURE_CLIENT_SECRET', description: 'Client Secret', required: true },
        { name: 'AZURE_SUBSCRIPTION_ID', description: 'Subscription ID', required: true },
      ],
      edgeFunction: 'azure-integration',
      configured: false
    },
    {
      integration: 'Google Cloud',
      icon: '🟡',
      secrets: [
        { name: 'GCP_SERVICE_ACCOUNT_KEY', description: 'Service Account JSON Key completo', required: true },
        { name: 'GCP_PROJECT_ID', description: 'Project ID do GCP', required: true },
      ],
      edgeFunction: 'gcp-integration',
      configured: false
    },
    {
      integration: 'Okta',
      icon: '🔐',
      secrets: [
        { name: 'OKTA_DOMAIN', description: 'Domínio Okta (ex: dev-123456.okta.com)', required: true },
        { name: 'OKTA_API_TOKEN', description: 'API Token do Okta', required: true },
      ],
      edgeFunction: 'okta-integration',
      configured: false
    },
    {
      integration: 'Microsoft 365',
      icon: '📧',
      secrets: [
        { name: 'M365_TENANT_ID', description: 'Tenant ID do Microsoft 365', required: true },
        { name: 'M365_CLIENT_ID', description: 'Client ID da aplicação', required: true },
        { name: 'M365_CLIENT_SECRET', description: 'Client Secret', required: true },
      ],
      edgeFunction: 'm365-integration',
      configured: false
    },
    {
      integration: 'CrowdStrike',
      icon: '🛡️',
      secrets: [
        { name: 'CROWDSTRIKE_CLIENT_ID', description: 'Client ID do CrowdStrike', required: true },
        { name: 'CROWDSTRIKE_CLIENT_SECRET', description: 'Client Secret', required: true },
        { name: 'CROWDSTRIKE_BASE_URL', description: 'URL base da API (região-específica)', required: true },
      ],
      edgeFunction: 'crowdstrike-integration',
      configured: false
    },
    {
      integration: 'Slack',
      icon: '💬',
      secrets: [
        { name: 'SLACK_TOKEN', description: 'OAuth Token do Slack', required: true },
        { name: 'SLACK_WORKSPACE_ID', description: 'ID do Workspace', required: true },
      ],
      edgeFunction: 'slack-integration',
      configured: false
    },
    {
      integration: 'GitHub',
      icon: '🐙',
      secrets: [
        { name: 'GITHUB_TOKEN', description: 'Personal Access Token ou GitHub App Token', required: true },
        { name: 'GITHUB_ORG', description: 'Nome da Organização', required: false },
      ],
      edgeFunction: 'github-integration',
      configured: false
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/settings/functions', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gerenciamento de Secrets
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure credenciais de forma segura via Supabase Secrets
          </p>
        </div>
        <Button onClick={openSupabaseDashboard} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Abrir Supabase Dashboard
        </Button>
      </div>

      {/* Security Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ Importante - Segurança de Credenciais</AlertTitle>
        <AlertDescription>
          <div className="space-y-2 mt-2">
            <p><strong>NUNCA</strong> adicione credenciais diretamente no código ou frontend.</p>
            <p>Todas as credenciais devem ser configuradas como <strong>Supabase Secrets</strong> e acessadas apenas via Edge Functions.</p>
            <p className="text-sm mt-2">
              ✅ <strong>Correto:</strong> Configurar via Supabase Dashboard → Settings → Edge Functions → Secrets
            </p>
            <p className="text-sm text-destructive">
              ❌ <strong>Errado:</strong> Hardcoded no código, em arquivos .env commitados, ou no frontend
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Instructions */}
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <CardTitle className="text-lg">Como Configurar Secrets</CardTitle>
          <CardDescription>
            Siga os passos abaixo para adicionar credenciais de integrações de forma segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Acesse o Supabase Dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Settings → Edge Functions → Secrets
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Clique em "Add new secret"</p>
                <p className="text-sm text-muted-foreground">
                  Use os nomes exatos listados abaixo (case-sensitive)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Adicione o valor da credencial</p>
                <p className="text-sm text-muted-foreground">
                  Cole o valor da credencial obtida do provider
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Salve e teste a integração</p>
                <p className="text-sm text-muted-foreground">
                  A edge function será automaticamente atualizada
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle Secret Names Visibility */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Secrets Necessárias por Integração
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSecretNames(!showSecretNames)}
          className="gap-2"
        >
          {showSecretNames ? (
            <>
              <EyeOff className="h-4 w-4" />
              Ocultar nomes
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Mostrar nomes
            </>
          )}
        </Button>
      </div>

      {/* Integration Secrets Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {integrationSecrets.map((integration) => (
          <Card key={integration.integration} className="bg-surface-elevated border-card-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <CardTitle className="text-base">{integration.integration}</CardTitle>
                    <CardDescription className="text-sm">
                      Edge Function: <code className="text-xs bg-muted px-1 py-0.5 rounded">{integration.edgeFunction}</code>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={integration.configured ? "default" : "secondary"}>
                  {integration.configured ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Configurado</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> Pendente</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {integration.secrets.map((secret) => (
                <div
                  key={secret.name}
                  className="flex items-start justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Key className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      {showSecretNames ? (
                        <code className="text-xs font-mono text-foreground truncate">
                          {secret.name}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          ••••••••
                        </span>
                      )}
                      {secret.required && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatória
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {secret.description}
                    </p>
                  </div>
                  {showSecretNames && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(secret.name)}
                      className="ml-2 flex-shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 gap-2"
                onClick={openSupabaseDashboard}
              >
                <ExternalLink className="h-4 w-4" />
                Configurar Secrets para {integration.integration}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documentation Link */}
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <CardTitle className="text-base">📚 Documentação Completa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Para informações detalhadas sobre como implementar edge functions, rotação de credenciais e exemplos práticos, consulte:
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2">
              <ExternalLink className="h-4 w-4" />
              docs/SECRETS_MANAGEMENT.md
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <ExternalLink className="h-4 w-4" />
              docs/INTEGRATIONS_ARCHITECTURE.md
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecretsManagement;
