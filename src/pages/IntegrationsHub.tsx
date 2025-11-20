import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cloud, HardDrive, FileText, WifiOff, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { ConnectAwsModal } from '@/components/integrations/ConnectAwsModal';

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  provider: string;
  icon: React.ReactNode;
  status: 'available' | 'coming_soon';
  isConnected?: boolean;
  lastSync?: string;
}

const integrations: IntegrationCard[] = [
  {
    id: 'aws',
    name: 'AWS Cloud',
    description: 'Coleta automática de usuários IAM e S3 buckets',
    provider: 'AWS',
    icon: <Cloud className="h-8 w-8" />,
    status: 'available',
    isConnected: true,
    lastSync: '2024-01-15 14:30',
  },
  {
    id: 'mikrotik',
    name: 'MikroTik',
    description: 'Gerenciamento de roteadores e configurações de rede',
    provider: 'MIKROTIK',
    icon: <WifiOff className="h-8 w-8" />,
    status: 'coming_soon',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Sincronização de documentos e políticas',
    provider: 'GOOGLE',
    icon: <HardDrive className="h-8 w-8" />,
    status: 'coming_soon',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Integração com tickets e gestão de tarefas',
    provider: 'JIRA',
    icon: <FileText className="h-8 w-8" />,
    status: 'coming_soon',
  },
];

const IntegrationsHub = () => {
  const [isAwsModalOpen, setIsAwsModalOpen] = useState(false);

  const handleConnect = (integrationId: string) => {
    if (integrationId === 'aws') {
      setIsAwsModalOpen(true);
    } else {
      console.log('Conectar:', integrationId);
    }
  };

  const handleAwsSuccess = () => {
    // Atualizar lista de integrações após sucesso
    console.log('AWS conectada com sucesso!');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6">
          {/* Header Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
            <p className="text-muted-foreground mt-2">
              Conecte suas ferramentas e automatize a coleta de evidências de compliance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Integrações Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground mt-1">AWS Cloud conectada</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Última Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Agora</div>
                <p className="text-xs text-muted-foreground mt-1">AWS Cloud</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Evidências Coletadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-muted-foreground mt-1">Este mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Cards Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Serviços Disponíveis</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => (
                <Card
                  key={integration.id}
                  className={`transition-all duration-200 ${
                    integration.id === 'aws'
                      ? 'border-primary shadow-lg hover:shadow-xl'
                      : 'hover:shadow-md'
                  } ${
                    integration.status === 'coming_soon' ? 'opacity-75' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-lg ${
                          integration.id === 'aws'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {integration.icon}
                      </div>
                      <div className="flex flex-col gap-2">
                        {integration.isConnected && (
                          <Badge variant="default" className="bg-success text-success-foreground">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        )}
                        {integration.status === 'coming_soon' && (
                          <Badge variant="secondary">Em Breve</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-4">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {integration.isConnected && integration.lastSync && (
                      <div className="mb-4 p-3 bg-success-bg rounded-lg border border-success/20">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          <span className="text-sm text-success font-medium">
                            Última sincronização
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {integration.lastSync}
                        </p>
                      </div>
                    )}

                    {integration.status === 'available' && !integration.isConnected && (
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(integration.id)}
                      >
                        Conectar
                      </Button>
                    )}

                    {integration.isConnected && (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">
                          Configurar
                        </Button>
                        <Button variant="ghost" className="w-full text-danger hover:text-danger">
                          Desconectar
                        </Button>
                      </div>
                    )}

                    {integration.status === 'coming_soon' && (
                      <Button variant="secondary" className="w-full" disabled>
                        Em breve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <Card className="bg-muted/50 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">🔐 Segurança e Privacidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
                  <span>Todas as credenciais são criptografadas end-to-end</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
                  <span>Dados isolados por usuário com Row Level Security</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
                  <span>Você pode desconectar integrações a qualquer momento</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
                  <span>Auditoria completa de todas as ações realizadas</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* AWS Connection Modal */}
      <ConnectAwsModal
        open={isAwsModalOpen}
        onOpenChange={setIsAwsModalOpen}
        onSuccess={handleAwsSuccess}
      />
    </div>
  );
};

export default IntegrationsHub;