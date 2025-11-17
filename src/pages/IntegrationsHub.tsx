import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import AvailableIntegrations from '@/components/integrations/AvailableIntegrations';
import ConnectedIntegrations from '@/components/integrations/ConnectedIntegrations';
import IntegrationsStats from '@/components/integrations/IntegrationsStats';
import SecretsManagement from '@/components/integrations/SecretsManagement';
import GoogleWorkspaceOAuth from '@/components/integrations/GoogleWorkspaceOAuth';
import IntegrationDemo from '@/components/integrations/IntegrationDemo';
import WebhookMonitor from '@/components/integrations/WebhookMonitor';
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
          <Tabs defaultValue="oauth" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="oauth">OAuth 2.0</TabsTrigger>
              <TabsTrigger value="demo">Demo API</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="available">Disponíveis</TabsTrigger>
              <TabsTrigger value="connected">Conectadas</TabsTrigger>
              <TabsTrigger value="secrets">🔐 Secrets</TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="mt-6">
              <GoogleWorkspaceOAuth />
            </TabsContent>

            <TabsContent value="demo" className="mt-6">
              <IntegrationDemo />
            </TabsContent>

            <TabsContent value="webhooks" className="mt-6">
              <WebhookMonitor />
            </TabsContent>

            <TabsContent value="available" className="mt-6">
              <AvailableIntegrations />
            </TabsContent>

            <TabsContent value="connected" className="mt-6">
              <ConnectedIntegrations />
            </TabsContent>

            <TabsContent value="secrets" className="mt-6">
              <SecretsManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default IntegrationsHub;