import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cloud, FileText, CheckCircle2, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { ConnectAwsModal } from '@/components/integrations/ConnectAwsModal';
import { GoogleIntegrationCard } from '@/components/integrations/GoogleIntegrationCard';
import { AzureIntegrationCard } from '@/components/integrations/AzureIntegrationCard';
import { MikroTikAgentModal } from '@/components/integrations/MikroTikAgentModal';

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

const comingSoonIntegrations: IntegrationCard[] = [
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
  const [isMikroTikModalOpen, setIsMikroTikModalOpen] = useState(false);

  const handleAwsSuccess = () => {
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
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Google, Azure e AWS disponíveis
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">Sistema atualizado</p>
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

          {/* Main Integrations Grid - Google, Azure, AWS, MikroTik */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Integrações Principais</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Google Workspace */}
              <GoogleIntegrationCard />

              {/* Azure AD */}
              <AzureIntegrationCard />

              {/* AWS Cloud */}
              <Card className="transition-all duration-200 border-primary shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Cloud className="h-8 w-8" />
                    </div>
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">AWS Cloud</CardTitle>
                  <CardDescription>
                    Coleta automática de usuários IAM e S3 buckets
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={() => setIsAwsModalOpen(true)}>
                    Conectar
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Configure via Cross-Account Role
                  </p>
                </CardContent>
              </Card>

              {/* MikroTik Agent */}
              <Card className="transition-all duration-200 border-primary shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <WifiOff className="h-8 w-8" />
                    </div>
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">MikroTik</CardTitle>
                  <CardDescription>
                    Monitoramento de roteadores via agente local
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={() => setIsMikroTikModalOpen(true)}>
                    Instalar Agente
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Baixe e configure o APOC Agent
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Coming Soon Integrations */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Em Breve</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {comingSoonIntegrations.map((integration) => (
                <Card key={integration.id} className="transition-all duration-200 opacity-75 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                        {integration.icon}
                      </div>
                      <Badge variant="secondary">Em Breve</Badge>
                    </div>
                    <CardTitle className="mt-4">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Button variant="secondary" className="w-full" disabled>
                      Em breve
                    </Button>
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

      {/* MikroTik Agent Modal */}
      <MikroTikAgentModal
        open={isMikroTikModalOpen}
        onOpenChange={setIsMikroTikModalOpen}
      />
    </div>
  );
};

export default IntegrationsHub;
