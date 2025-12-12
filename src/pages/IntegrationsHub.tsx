import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cloud, FileText, CheckCircle2, WifiOff, HardDrive, Activity, Clock, Database, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { ConnectAwsModal } from '@/components/integrations/ConnectAwsModal';
import { GoogleIntegrationCard } from '@/components/integrations/GoogleIntegrationCard';
import { AzureIntegrationCard } from '@/components/integrations/AzureIntegrationCard';
import { MikroTikAgentModal } from '@/components/integrations/MikroTikAgentModal';
import { AwsResourcesModal } from '@/components/integrations/AwsResourcesModal';
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus';
import { formatRelativeTime } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  provider: string;
  icon: React.ReactNode;
  status: 'available' | 'coming_soon';
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
  const [isAwsResourcesModalOpen, setIsAwsResourcesModalOpen] = useState(false);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { aws, google, azure, mikrotik, loading, refetch } = useIntegrationStatus();

  // Calculate stats
  const connectedCount = [aws.connected, google.connected, azure.connected, mikrotik.connected].filter(Boolean).length;
  
  const lastSyncDate = [aws.lastSync, google.lastSync, azure.lastSync, mikrotik.lastSync]
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  // Check for Azure OAuth success
  useEffect(() => {
    const azureConnected = searchParams.get('azure_connected');
    if (azureConnected === 'true') {
      toast({
        title: '🟢 Conectado ao Azure AD',
        description: 'Permissão de leitura de diretório confirmada.',
        variant: 'default',
      });
      searchParams.delete('azure_connected');
      setSearchParams(searchParams, { replace: true });
      refetch();
    }
  }, [searchParams, setSearchParams, toast, refetch]);

  const handleAwsSuccess = () => {
    console.log('AWS conectada com sucesso!');
    refetch();
  };

  // Separate connected and available integrations
  const hasConnectedIntegrations = aws.connected || google.connected || azure.connected || mikrotik.connected;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-64 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Header Section */}
              <div className="col-span-full">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight truncate">
                    Hub de Integrações
                  </h1>
                  <p className="text-muted-foreground line-clamp-2">
                    Conecte suas ferramentas e automatize a coleta de evidências de compliance
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="col-span-full lg:col-span-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Integrações Ativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">{connectedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          de 4 disponíveis
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-full lg:col-span-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Última Sincronização
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground truncate">
                          {lastSyncDate ? formatRelativeTime(lastSyncDate) : 'Nenhuma'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {connectedCount > 0 ? 'Sistema sincronizado' : 'Nenhuma integração ativa'}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-full lg:col-span-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Evidências Coletadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">247</div>
                    <p className="text-xs text-muted-foreground mt-1">Este mês</p>
                  </CardContent>
                </Card>
              </div>

              {/* Connected Integrations Section */}
              {hasConnectedIntegrations && (
                <div className="col-span-full">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Integrações Conectadas
                  </h2>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {/* Google Workspace - Connected */}
                    {google.connected && (
                      <GoogleIntegrationCard 
                        isConnected={true} 
                        lastSync={google.lastSync} 
                      />
                    )}

                    {/* Azure AD - Connected */}
                    {azure.connected && (
                      <AzureIntegrationCard 
                        isConnected={true} 
                        lastSync={azure.lastSync} 
                      />
                    )}

                    {/* AWS Cloud - Connected */}
                    {aws.connected && (
                      <Card className="transition-all duration-200 border-green-500/50 ring-1 ring-green-500/20 shadow-lg hover:shadow-xl">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                              <Cloud className="h-8 w-8" />
                            </div>
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                              Conectado
                            </Badge>
                          </div>
                          <CardTitle className="mt-4 text-foreground truncate">AWS Cloud</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {aws.accountId ? `Account: ${aws.accountId}` : 'Coleta automática de usuários IAM e S3 buckets'}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <Button 
                            variant="default" 
                            className="w-full gap-2" 
                            onClick={() => setIsAwsResourcesModalOpen(true)}
                          >
                            <Eye className="h-4 w-4" />
                            Ver Recursos
                          </Button>
                          <Button variant="outline" className="w-full" onClick={() => setIsAwsModalOpen(true)}>
                            Gerenciar
                          </Button>
                          <p className="text-xs text-muted-foreground text-center truncate">
                            Última sync: {formatRelativeTime(aws.lastSync)}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* MikroTik - Connected */}
                    {mikrotik.connected && (
                      <Card className="transition-all duration-200 border-green-500/50 ring-1 ring-green-500/20 shadow-lg hover:shadow-xl">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                              <WifiOff className="h-8 w-8" />
                            </div>
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                              Conectado
                            </Badge>
                          </div>
                          <CardTitle className="mt-4 text-foreground truncate">MikroTik</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {mikrotik.deviceCount 
                              ? `${mikrotik.deviceCount} ${mikrotik.deviceCount === 1 ? 'dispositivo' : 'dispositivos'} ativo${mikrotik.deviceCount === 1 ? '' : 's'}`
                              : 'Monitoramento de roteadores via agente local'
                            }
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-2">
                          <Button variant="outline" className="w-full" onClick={() => setIsMikroTikModalOpen(true)}>
                            Gerenciar
                          </Button>
                          <p className="text-xs text-muted-foreground text-center truncate">
                            Última sync: {formatRelativeTime(mikrotik.lastSync)}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Available Integrations Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {hasConnectedIntegrations ? 'Disponíveis para Conectar' : 'Integrações Disponíveis'}
                </h2>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Google Workspace - Available */}
                  {!google.connected && (
                    <GoogleIntegrationCard isConnected={false} lastSync={null} />
                  )}

                  {/* Azure AD - Available */}
                  {!azure.connected && (
                    <AzureIntegrationCard isConnected={false} lastSync={null} />
                  )}

                  {/* AWS Cloud - Available */}
                  {!aws.connected && (
                    <Card className="transition-all duration-200 border-primary/50 shadow-lg hover:shadow-xl">
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
                        <CardTitle className="mt-4 text-foreground truncate">AWS Cloud</CardTitle>
                        <CardDescription className="line-clamp-2">
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
                  )}

                  {/* MikroTik Agent - Available */}
                  {!mikrotik.connected && (
                    <Card className="transition-all duration-200 border-primary/50 shadow-lg hover:shadow-xl">
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
                        <CardTitle className="mt-4 text-foreground truncate">MikroTik</CardTitle>
                        <CardDescription className="line-clamp-2">
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
                  )}
                </div>
              </div>

              {/* Coming Soon Integrations */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-foreground mb-4">Em Breve</h2>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {comingSoonIntegrations.map((integration) => (
                    <Card key={integration.id} className="transition-all duration-200 opacity-75 hover:shadow-md">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                            {integration.icon}
                          </div>
                          <Badge variant="secondary">Em Breve</Badge>
                        </div>
                        <CardTitle className="mt-4 text-foreground truncate">{integration.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{integration.description}</CardDescription>
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
              <div className="col-span-full">
                <Card className="bg-muted/50 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">🔐 Segurança e Privacidade</CardTitle>
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
                        <span>Compliance com LGPD e padrões internacionais</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>

      {/* Modals */}
      <ConnectAwsModal 
        open={isAwsModalOpen} 
        onOpenChange={setIsAwsModalOpen}
        onSuccess={handleAwsSuccess}
      />
      <MikroTikAgentModal 
        open={isMikroTikModalOpen} 
        onOpenChange={setIsMikroTikModalOpen} 
      />
      <AwsResourcesModal 
        open={isAwsResourcesModalOpen} 
        onOpenChange={setIsAwsResourcesModalOpen}
        integrationId="aws-integration"
      />
    </div>
  );
};

export default IntegrationsHub;
