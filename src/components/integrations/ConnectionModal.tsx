import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { useConnectionTest, useSaveCredentials } from "@/hooks/useConnectionTest";

// Field configuration per provider
interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder?: string;
  required: boolean;
  helpText?: string;
}

interface InstructionStep {
  step: number;
  text: string;
  link?: string;
}

interface ProviderConfig {
  fields: FieldConfig[];
  instructions: InstructionStep[];
  docsUrl: string;
  testEndpoint?: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  cloudflare: {
    fields: [
      { 
        name: 'email', 
        label: 'Email da Conta', 
        type: 'email', 
        required: true,
        placeholder: 'seu@email.com',
        helpText: 'Email associado à sua conta Cloudflare'
      },
      { 
        name: 'apiToken', 
        label: 'API Token', 
        type: 'password', 
        required: true,
        placeholder: '••••••••••••••••',
        helpText: 'Token de API com permissões de leitura'
      },
    ],
    instructions: [
      { step: 1, text: 'Acesse o Cloudflare Dashboard', link: 'https://dash.cloudflare.com' },
      { step: 2, text: 'Vá em My Profile → API Tokens' },
      { step: 3, text: 'Clique em "Create Token"' },
      { step: 4, text: 'Use o template "Read all resources" ou crie um personalizado' },
      { step: 5, text: 'Copie o token gerado (só será exibido uma vez!)' },
    ],
    docsUrl: 'https://developers.cloudflare.com/fundamentals/api/get-started/create-token/',
  },
  jira: {
    fields: [
      { 
        name: 'domain', 
        label: 'Domínio Atlassian', 
        type: 'text', 
        placeholder: 'empresa.atlassian.net',
        required: true,
        helpText: 'Seu domínio do Atlassian (sem https://)'
      },
      { 
        name: 'email', 
        label: 'Email', 
        type: 'email', 
        required: true,
        placeholder: 'seu@email.com'
      },
      { 
        name: 'apiToken', 
        label: 'API Token', 
        type: 'password', 
        required: true,
        placeholder: '••••••••••••••••',
        helpText: 'Gere em Atlassian Account → Security → API Tokens'
      },
    ],
    instructions: [
      { step: 1, text: 'Acesse sua conta Atlassian', link: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
      { step: 2, text: 'Vá em Security → API Tokens' },
      { step: 3, text: 'Clique em "Create API token"' },
      { step: 4, text: 'Dê um nome ao token e copie-o' },
    ],
    docsUrl: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/',
  },
  github: {
    fields: [
      { 
        name: 'personalAccessToken', 
        label: 'Personal Access Token', 
        type: 'password', 
        required: true,
        placeholder: 'ghp_••••••••••••••••',
        helpText: 'Token clássico ou fine-grained com permissões de leitura'
      },
    ],
    instructions: [
      { step: 1, text: 'Acesse Settings → Developer settings', link: 'https://github.com/settings/tokens' },
      { step: 2, text: 'Clique em "Personal access tokens"' },
      { step: 3, text: 'Gere um novo token com escopo "repo" e "read:org"' },
      { step: 4, text: 'Copie o token gerado' },
    ],
    docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
  },
  gitlab: {
    fields: [
      { 
        name: 'domain', 
        label: 'GitLab URL', 
        type: 'text', 
        placeholder: 'gitlab.com ou gitlab.suaempresa.com',
        required: true,
        helpText: 'URL do GitLab (gitlab.com ou self-hosted)'
      },
      { 
        name: 'accessToken', 
        label: 'Access Token', 
        type: 'password', 
        required: true,
        placeholder: 'glpat-••••••••••••••••',
        helpText: 'Personal Access Token com escopo api ou read_api'
      },
    ],
    instructions: [
      { step: 1, text: 'Acesse Preferences → Access Tokens', link: 'https://gitlab.com/-/user_settings/personal_access_tokens' },
      { step: 2, text: 'Clique em "Add new token"' },
      { step: 3, text: 'Selecione escopos: api ou read_api' },
      { step: 4, text: 'Copie o token gerado' },
    ],
    docsUrl: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
  },
  slack: {
    fields: [
      { 
        name: 'botToken', 
        label: 'Bot Token', 
        type: 'password', 
        required: true,
        placeholder: 'xoxb-••••••••••••••••',
        helpText: 'Token de Bot do seu Slack App'
      },
    ],
    instructions: [
      { step: 1, text: 'Crie ou acesse seu Slack App', link: 'https://api.slack.com/apps' },
      { step: 2, text: 'Vá em "OAuth & Permissions"' },
      { step: 3, text: 'Adicione escopos necessários (channels:read, users:read)' },
      { step: 4, text: 'Instale o app no workspace e copie o Bot Token' },
    ],
    docsUrl: 'https://api.slack.com/authentication/token-types',
  },
  bamboohr: {
    fields: [
      { 
        name: 'subdomain', 
        label: 'Subdomínio', 
        type: 'text', 
        placeholder: 'empresa',
        required: true,
        helpText: 'Seu subdomínio BambooHR (ex: empresa.bamboohr.com)'
      },
      { 
        name: 'apiKey', 
        label: 'API Key', 
        type: 'password', 
        required: true,
        placeholder: '••••••••••••••••',
        helpText: 'Chave de API do BambooHR'
      },
    ],
    instructions: [
      { step: 1, text: 'Acesse BambooHR → Settings', link: 'https://app.bamboohr.com' },
      { step: 2, text: 'Vá em API Keys na seção de configurações' },
      { step: 3, text: 'Clique em "Add New Key"' },
      { step: 4, text: 'Dê um nome à chave e copie-a' },
    ],
    docsUrl: 'https://documentation.bamboohr.com/docs/getting-started',
  },
  crowdstrike: {
    fields: [
      { 
        name: 'clientId', 
        label: 'Client ID', 
        type: 'text', 
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'ID do cliente OAuth2'
      },
      { 
        name: 'clientSecret', 
        label: 'Client Secret', 
        type: 'password', 
        required: true,
        placeholder: '••••••••••••••••',
        helpText: 'Segredo do cliente OAuth2'
      },
      { 
        name: 'baseUrl', 
        label: 'Base URL (Região)', 
        type: 'text', 
        placeholder: 'api.crowdstrike.com',
        required: true,
        helpText: 'URL da sua região (api.crowdstrike.com, api.us-2.crowdstrike.com, api.eu-1.crowdstrike.com)'
      },
    ],
    instructions: [
      { step: 1, text: 'Acesse o Falcon Console', link: 'https://falcon.crowdstrike.com' },
      { step: 2, text: 'Vá em Support → API Clients and Keys' },
      { step: 3, text: 'Crie um novo API Client com escopos de leitura' },
      { step: 4, text: 'Copie Client ID e Client Secret' },
    ],
    docsUrl: 'https://falcon.crowdstrike.com/documentation/46/crowdstrike-oauth2-based-apis',
  },
  intune: {
    fields: [
      { 
        name: 'tenantId', 
        label: 'Tenant ID', 
        type: 'text', 
        required: true,
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'ID do tenant do Azure AD'
      },
      { 
        name: 'clientId', 
        label: 'Client ID (App ID)', 
        type: 'text', 
        required: true,
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'ID do aplicativo registrado no Azure AD'
      },
      { 
        name: 'clientSecret', 
        label: 'Client Secret', 
        type: 'password', 
        required: true,
        placeholder: '••••••••••••••••',
        helpText: 'Segredo do cliente do aplicativo'
      },
    ],
    instructions: [
      { step: 1, text: 'Acesse Azure Portal → App Registrations', link: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade' },
      { step: 2, text: 'Crie ou selecione um App com permissões Microsoft Graph' },
      { step: 3, text: 'Adicione permissão: DeviceManagementManagedDevices.Read.All' },
      { step: 4, text: 'Crie um Client Secret e copie Tenant ID, Client ID e Secret' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/mem/intune/developer/intune-graph-apis',
  },
};

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  integrationName: string;
  integrationLogo: string;
  onSuccess?: () => void;
}

type StepType = 'form' | 'testing' | 'success' | 'error';

export function ConnectionModal({
  open,
  onOpenChange,
  provider,
  integrationName,
  integrationLogo,
  onSuccess,
}: ConnectionModalProps) {
  const [step, setStep] = useState<StepType>('form');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, any> | null>(null);

  const testConnection = useConnectionTest();
  const saveCredentials = useSaveCredentials();

  const config = PROVIDER_CONFIGS[provider];

  if (!config) {
    return null;
  }

  const handleFieldChange = (name: string, value: string) => {
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const isFormValid = config.fields.every(
    field => !field.required || credentials[field.name]?.trim()
  );

  const handleTestConnection = async () => {
    setStep('testing');
    setErrorMessage('');

    try {
      const result = await testConnection.mutateAsync({
        provider,
        credentials,
        testOnly: true,
      });

      if (result.success) {
        setTestResult(result.resources);
        // Now save the credentials
        const saveResult = await saveCredentials.mutateAsync({
          provider,
          credentials,
          name: integrationName,
        });

        if (saveResult.success) {
          setStep('success');
        } else {
          setErrorMessage(saveResult.error || 'Erro ao salvar credenciais');
          setStep('error');
        }
      } else {
        setErrorMessage(result.error || 'Falha na conexão');
        setStep('error');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao testar conexão');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('form');
    setCredentials({});
    setErrorMessage('');
    setShowPasswords({});
    setTestResult(null);
    onOpenChange(false);
    
    if (step === 'success') {
      onSuccess?.();
    }
  };

  const handleRetry = () => {
    setStep('form');
    setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img 
              src={integrationLogo} 
              alt={integrationName} 
              className="w-10 h-10 object-contain"
            />
            <div>
              <DialogTitle>Conectar {integrationName}</DialogTitle>
              <DialogDescription>
                Configure suas credenciais para habilitar a integração
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4 text-primary" />
                Como obter suas credenciais
              </div>
              <ol className="space-y-2">
                {config.instructions.map((instruction) => (
                  <li key={instruction.step} className="text-sm text-muted-foreground flex gap-2">
                    <Badge variant="outline" className="h-5 w-5 p-0 justify-center shrink-0">
                      {instruction.step}
                    </Badge>
                    <span>
                      {instruction.text}
                      {instruction.link && (
                        <a 
                          href={instruction.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              <a 
                href={config.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver documentação completa
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {config.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type={field.type === 'password' && !showPasswords[field.name] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={credentials[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="pr-10"
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility(field.name)}
                      >
                        {showPasswords[field.name] ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleTestConnection} 
                disabled={!isFormValid}
                className="flex-1"
              >
                Testar e Conectar
              </Button>
            </div>
          </div>
        )}

        {step === 'testing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="font-medium">Testando conexão...</p>
              <p className="text-sm text-muted-foreground">
                Validando credenciais com a API do {integrationName}
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-lg">Conexão estabelecida!</p>
              <p className="text-sm text-muted-foreground">
                {integrationName} foi conectado com sucesso
              </p>
            </div>
            {testResult && Object.keys(testResult).length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-sm font-medium mb-2">Recursos detectados:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(testResult).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="ml-1 font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleClose} className="w-full">
              Concluído
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-lg">Falha na conexão</p>
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleRetry} className="flex-1">
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}