import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import AvailableIntegrations from '@/components/integrations/AvailableIntegrations';
import ConnectedIntegrations from '@/components/integrations/ConnectedIntegrations';
import IntegrationsStats from '@/components/integrations/IntegrationsStats';
import SecretsManagement from '@/components/integrations/SecretsManagement';
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
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="available">Integrações Disponíveis</TabsTrigger>
              <TabsTrigger value="connected">Conectadas</TabsTrigger>
              <TabsTrigger value="secrets">🔐 Secrets</TabsTrigger>
            </TabsList>

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