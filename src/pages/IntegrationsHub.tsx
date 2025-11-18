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
import { IntegrationValidator } from '@/components/integrations/IntegrationValidator';
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
          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="catalog">📚 Catálogo</TabsTrigger>
              <TabsTrigger value="connect">🔌 Conectar</TabsTrigger>
              <TabsTrigger value="test">✅ Testar</TabsTrigger>
              <TabsTrigger value="monitor">📊 Monitorar</TabsTrigger>
            </TabsList>

            {/* Aba 1: Catálogo - Integrações disponíveis e guia */}
            <TabsContent value="catalog" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Guia de Integrações</h2>
                <p className="text-muted-foreground">
                  Documentação completa sobre como conectar e usar integrações no Complice
                </p>
              </div>
              <IntegrationOnboarding />
              
              <div className="mt-8 space-y-2">
                <h2 className="text-2xl font-bold">Integrações Disponíveis</h2>
                <p className="text-muted-foreground">
                  Catálogo de todas as integrações suportadas pela plataforma
                </p>
              </div>
              <AvailableIntegrations />
            </TabsContent>

            {/* Aba 2: Conectar - OAuth, integrações conectadas */}
            <TabsContent value="connect" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Suas Integrações</h2>
                <p className="text-muted-foreground">
                  Gerencie suas conexões OAuth e integrações ativas
                </p>
              </div>
              <ConnectedIntegrations />
              
              <div className="mt-8 space-y-2">
                <h2 className="text-2xl font-bold">Conectar Google Workspace</h2>
                <p className="text-muted-foreground">
                  Configure OAuth 2.0 para integração com Google Workspace
                </p>
              </div>
              <GoogleConnectionStatus />
              <div className="mt-6">
                <GoogleWorkspaceOAuth />
              </div>
            </TabsContent>

            {/* Aba 3: Testar - Validação, API tester, connector */}
            <TabsContent value="test" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Validar Integração</h2>
                <p className="text-muted-foreground">
                  Teste automaticamente se sua integração OAuth está funcionando corretamente
                </p>
              </div>
              <IntegrationValidator 
                integrationName="google_workspace"
                testEndpoint="https://www.googleapis.com/oauth2/v1/userinfo"
                autoTest={false}
              />
              
              <div className="mt-8 space-y-2">
                <h2 className="text-2xl font-bold">Testar API Google</h2>
                <p className="text-muted-foreground">
                  Faça requisições de teste para endpoints da Google API
                </p>
              </div>
              <GoogleApiTester />
              
              <div className="mt-8 space-y-2">
                <h2 className="text-2xl font-bold">Dynamic API Connector</h2>
                <p className="text-muted-foreground">
                  Faça requisições customizadas para APIs externas usando tokens OAuth armazenados de forma segura
                </p>
              </div>
              <DynamicApiConnector />
              
              <div className="mt-8 space-y-2">
                <h2 className="text-2xl font-bold">Histórico de Requisições</h2>
                <p className="text-muted-foreground">
                  Acompanhe todas as requisições feitas através do conector
                </p>
              </div>
              <ApiRequestHistory />
            </TabsContent>

            {/* Aba 4: Monitorar - Webhooks, audit logs, status */}
            <TabsContent value="monitor" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Monitor de Webhooks</h2>
                <p className="text-muted-foreground">
                  Acompanhe webhooks recebidos e seu processamento em tempo real
                </p>
              </div>
              <WebhookMonitor />
              
              <div className="mt-8 space-y-2">
                <h2 className="text-2xl font-bold">Logs de Auditoria</h2>
                <p className="text-muted-foreground">
                  Histórico completo de ações e eventos do sistema de integrações
                </p>
              </div>
              <AuditLogsViewer />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default IntegrationsHub;