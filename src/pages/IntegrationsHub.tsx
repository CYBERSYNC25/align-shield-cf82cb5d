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
            <h1 className="h1">
              Hub de Integrações
            </h1>
            <p className="text-body-sm">
              Conecte suas ferramentas para automatizar coleta de evidências e monitoramento contínuo de compliance
            </p>
          </div>

          {/* Integration Stats */}
          <IntegrationsStats />

          {/* Tabs for different sections */}
          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="catalog">📚 Catálogo</TabsTrigger>
              <TabsTrigger value="connect">🔌 Minhas Integrações</TabsTrigger>
              <TabsTrigger value="test">✅ Testar Conexão</TabsTrigger>
              <TabsTrigger value="monitor">📊 Logs & Webhooks</TabsTrigger>
            </TabsList>

            {/* Aba 1: Catálogo - Integrações disponíveis e guia */}
            <TabsContent value="catalog" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="h2">Guia de Início Rápido</h2>
                <p className="text-body-sm">
                  Aprenda como conectar e configurar suas integrações em minutos
                </p>
              </div>
              <IntegrationOnboarding />
              
              <div className="mt-8 space-y-2">
                <h2 className="h2">Conectar Nova Integração</h2>
                <p className="text-body-sm">
                  Escolha entre mais de 50 integrações disponíveis
                </p>
              </div>
              <AvailableIntegrations />
            </TabsContent>

            {/* Aba 2: Conectar - OAuth, integrações conectadas */}
            <TabsContent value="connect" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="h2">Suas Integrações Ativas</h2>
                <p className="text-body-sm">
                  Gerencie e monitore todas as suas conexões em um só lugar
                </p>
              </div>
              <ConnectedIntegrations />
              
              <div className="mt-8 space-y-2">
                <h2 className="h2">Configuração Google Workspace</h2>
                <p className="text-body-sm">
                  Configure autenticação OAuth 2.0 para integração completa
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
                <h2 className="h2">Validar Integração</h2>
                <p className="text-body-sm">
                  Teste se sua integração OAuth está funcionando corretamente
                </p>
              </div>
              <IntegrationValidator 
                integrationName="google_workspace"
                testEndpoint="https://www.googleapis.com/oauth2/v1/userinfo"
                autoTest={false}
              />
              
              <div className="mt-8 space-y-2">
                <h2 className="h2">Testar Endpoints da API</h2>
                <p className="text-body-sm">
                  Faça requisições de teste para validar permissões e escopos
                </p>
              </div>
              <GoogleApiTester />
              
              <div className="mt-8 space-y-2">
                <h2 className="h2">Conector de API Personalizado</h2>
                <p className="text-body-sm">
                  Crie requisições customizadas usando seus tokens OAuth
                </p>
              </div>
              <DynamicApiConnector />
              
              <div className="mt-8 space-y-2">
                <h2 className="h2">Histórico de Requisições</h2>
                <p className="text-body-sm">
                  Veja detalhes de todas as chamadas feitas através do conector
                </p>
              </div>
              <ApiRequestHistory />
            </TabsContent>

            {/* Aba 4: Monitorar - Webhooks, audit logs, status */}
            <TabsContent value="monitor" className="mt-6 space-y-6">
              <div className="space-y-2">
                <h2 className="h2">Monitor de Webhooks em Tempo Real</h2>
                <p className="text-body-sm">
                  Acompanhe webhooks recebidos e processados automaticamente
                </p>
              </div>
              <WebhookMonitor />
              
              <div className="mt-8 space-y-2">
                <h2 className="h2">Logs de Auditoria</h2>
                <p className="text-body-sm">
                  Histórico completo de todas as ações no sistema de integrações
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