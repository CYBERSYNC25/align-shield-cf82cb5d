import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Shield, 
  Key, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Settings
} from 'lucide-react';
import { AzureAdConnector } from './connectors/AzureAdConnector';
import { IntegrationLogs } from './IntegrationLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ApiProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  authType: 'oauth2' | 'api_key' | 'basic';
  status: 'available' | 'coming_soon';
  category: string;
  scopes?: ApiScope[];
  docsUrl?: string;
}

export interface ApiScope {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'azure_ad',
    name: 'Azure AD / Entra ID',
    description: 'Integre com Microsoft Azure Active Directory para gestão de identidades e acessos',
    icon: <Cloud className="h-6 w-6" />,
    authType: 'oauth2',
    status: 'available',
    category: 'Identity & Access',
    scopes: [
      {
        id: 'User.Read.All',
        name: 'Ler todos os usuários',
        description: 'Permite ler perfis de todos os usuários',
        required: true
      },
      {
        id: 'Group.Read.All',
        name: 'Ler todos os grupos',
        description: 'Permite ler informações de grupos',
        required: false
      },
      {
        id: 'Directory.Read.All',
        name: 'Ler diretório',
        description: 'Permite ler dados do diretório organizacional',
        required: false
      }
    ],
    docsUrl: 'https://docs.microsoft.com/azure/active-directory/'
  },
  {
    id: 'okta',
    name: 'Okta',
    description: 'Gestão de identidades e acessos empresarial',
    icon: <Shield className="h-6 w-6" />,
    authType: 'oauth2',
    status: 'coming_soon',
    category: 'Identity & Access'
  },
  {
    id: 'aws_iam',
    name: 'AWS IAM',
    description: 'Gestão de identidades e acessos na AWS',
    icon: <Key className="h-6 w-6" />,
    authType: 'api_key',
    status: 'coming_soon',
    category: 'Identity & Access'
  }
];

export const ApiIntegrationFlow = () => {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [activeTab, setActiveTab] = useState<string>('connect');

  const renderProviderCard = (provider: ApiProvider) => (
    <Card 
      key={provider.id}
      className="p-6 hover:border-primary transition-colors cursor-pointer"
      onClick={() => provider.status === 'available' && setSelectedProvider(provider)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          {provider.icon}
        </div>
        <Badge variant={provider.status === 'available' ? 'default' : 'secondary'}>
          {provider.status === 'available' ? 'Disponível' : 'Em breve'}
        </Badge>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{provider.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{provider.description}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{provider.category}</span>
        <div className="flex items-center gap-2">
          {provider.authType === 'oauth2' && (
            <Badge variant="outline" className="text-xs">
              OAuth 2.0
            </Badge>
          )}
          {provider.status === 'available' && (
            <Button size="sm" variant="ghost">
              Conectar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const renderConnector = () => {
    if (!selectedProvider) return null;

    switch (selectedProvider.id) {
      case 'azure_ad':
        return <AzureAdConnector provider={selectedProvider} onBack={() => setSelectedProvider(null)} />;
      default:
        return (
          <Card className="p-6">
            <p className="text-muted-foreground">Conector em desenvolvimento</p>
            <Button onClick={() => setSelectedProvider(null)} className="mt-4">
              Voltar
            </Button>
          </Card>
        );
    }
  };

  if (selectedProvider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedProvider(null)}>
            ← Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedProvider.name}</h2>
            <p className="text-muted-foreground">{selectedProvider.description}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connect">
              <Settings className="h-4 w-4 mr-2" />
              Conectar
            </TabsTrigger>
            <TabsTrigger value="status">
              <CheckCircle className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger value="logs">
              <AlertCircle className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="mt-6">
            {renderConnector()}
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status da Integração</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Autenticação</p>
                      <p className="text-sm text-muted-foreground">Token válido até 18/12/2025</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Renovar</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Permissões</p>
                      <p className="text-sm text-muted-foreground">3 escopos ativos</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <IntegrationLogs integrationName={selectedProvider.id} />
          </TabsContent>
        </Tabs>

        {selectedProvider.docsUrl && (
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <a 
                href={selectedProvider.docsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:underline"
              >
                Documentação oficial do {selectedProvider.name}
              </a>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Conectar API Externa</h2>
        <p className="text-muted-foreground">
          Escolha uma API para integrar com sua plataforma de compliance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {API_PROVIDERS.map(renderProviderCard)}
      </div>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-2">🔐 Segurança e Privacidade</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Todas as credenciais são criptografadas e isoladas por usuário</li>
          <li>• Tokens OAuth são armazenados com segurança no Supabase</li>
          <li>• Você pode desconectar integrações a qualquer momento</li>
          <li>• Auditoria completa de todas as ações realizadas</li>
        </ul>
      </Card>
    </div>
  );
};
