import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import AvailableIntegrations from '@/components/integrations/AvailableIntegrations';
import ConnectedIntegrations from '@/components/integrations/ConnectedIntegrations';
import IntegrationsStats from '@/components/integrations/IntegrationsStats';
import SecretsManagement from '@/components/integrations/SecretsManagement';
import GoogleWorkspaceOAuth from '@/components/integrations/GoogleWorkspaceOAuth';
import IntegrationDemo from '@/components/integrations/IntegrationDemo';
import WebhookMonitor from '@/components/integrations/WebhookMonitor';
import IntegrationOnboarding from '@/components/integrations/IntegrationOnboarding';
import GoogleApiTester from '@/components/integrations/GoogleApiTester';
import AuditLogsViewer from '@/components/settings/AuditLogsViewer';
import { GoogleConnectionStatus } from '@/components/integrations/GoogleConnectionStatus';
import { DynamicApiConnector } from '@/components/integrations/DynamicApiConnector';
import { ApiRequestHistory } from '@/components/integrations/ApiRequestHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const IntegrationsHub = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Hub de Integrações
            </h1>
            <p className="text-muted-foreground">
              Conecte suas ferramentas para coleta automática de evidências e monitoramento contínuo
            </p>
          </div>

          {/* Integration Stats */}
          <IntegrationsStats />

          {/* Tabs for different sections */}
          <Tabs defaultValue="onboarding" className="w-full">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="onboarding">📚 Guia</TabsTrigger>
              <TabsTrigger value="oauth">OAuth 2.0</TabsTrigger>
              <TabsTrigger value="api">🔌 API Test</TabsTrigger>
              <TabsTrigger value="connector">⚡ Conector</TabsTrigger>
              <TabsTrigger value="demo">Demo API</TabsTrigger>
              <TabsTrigger value="testing">🧪 Testes</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="audit">📋 Auditoria</TabsTrigger>
              <TabsTrigger value="available">Disponíveis</TabsTrigger>
              <TabsTrigger value="connected">Conectadas</TabsTrigger>
            </TabsList>

            <TabsContent value="onboarding" className="mt-6">
              <IntegrationOnboarding />
            </TabsContent>

            <TabsContent value="oauth" className="mt-6">
              <GoogleConnectionStatus />
              <div className="mt-6">
                <GoogleWorkspaceOAuth />
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-6">
              <GoogleApiTester />
            </TabsContent>

            <TabsContent value="connector" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Dynamic API Connector</h2>
                <p className="text-muted-foreground">
                  Faça requisições customizadas para APIs externas usando tokens OAuth armazenados de forma segura.
                </p>
              </div>
              <DynamicApiConnector />
              
              <div className="mt-8 space-y-2">
                <h2 className="text-2xl font-bold">Histórico de Requisições</h2>
                <p className="text-muted-foreground">
                  Acompanhe todas as requisições feitas através do conector, com detalhes completos.
                </p>
              </div>
              <ApiRequestHistory />
            </TabsContent>

            <TabsContent value="demo" className="mt-6">
              <IntegrationDemo />
            </TabsContent>

            <TabsContent value="testing" className="mt-6">
              <IntegrationDemo />
            </TabsContent>

            <TabsContent value="webhooks" className="mt-6">
              <WebhookMonitor />
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <AuditLogsViewer />
            </TabsContent>

            <TabsContent value="available" className="mt-6">
              <AvailableIntegrations />
            </TabsContent>

            <TabsContent value="connected" className="mt-6">
              <ConnectedIntegrations />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default IntegrationsHub;