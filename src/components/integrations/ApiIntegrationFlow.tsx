import { useState, useEffect } from 'react';
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
  Settings,
  ArrowLeft
} from 'lucide-react';
import { AzureAdConnector } from './connectors/AzureAdConnector';
import { AzureConnectionStatus } from './AzureConnectionStatus';
import { IntegrationLogs } from './IntegrationLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

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
  const [connectedApis, setConnectedApis] = useState<string[]>([]);

  useEffect(() => {
    checkConnectedApis();
  }, []);

  const checkConnectedApis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('integration_oauth_tokens')
        .select('integration_name')
        .eq('user_id', user.id);

      if (data) {
        setConnectedApis(data.map(d => d.integration_name));
      }
    } catch (error) {
      console.error('Error checking connected APIs:', error);
    }
  };

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
        <div className="flex gap-2">
          <Badge variant={provider.status === 'available' ? 'default' : 'secondary'}>
            {provider.status === 'available' ? 'Disponível' : 'Em breve'}
          </Badge>
          {connectedApis.includes(provider.id) && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </div>
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

    const isConnected = connectedApis.includes(selectedProvider.id);

    switch (selectedProvider.id) {
      case 'azure_ad':
        return isConnected ? (
          <AzureConnectionStatus />
        ) : (
          <AzureAdConnector 
            provider={selectedProvider} 
            onBack={() => {
              setSelectedProvider(null);
              checkConnectedApis();
            }} 
          />
        );
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
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedProvider(null);
            checkConnectedApis();
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista de APIs
        </Button>

        {renderConnector()}
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
