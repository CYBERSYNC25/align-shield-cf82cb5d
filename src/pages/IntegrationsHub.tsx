import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  Shield, 
  GitBranch, 
  Users, 
  Laptop, 
  Plug, 
  Activity,
  RefreshCw,
  Lock
} from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import PageContainer from "@/components/layout/PageContainer";
import { useIntegrationStatus } from "@/hooks/useIntegrationStatus";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Components
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { FeatureRequestModal } from "@/components/integrations/FeatureRequestModal";
import { ConnectAwsModal } from "@/components/integrations/ConnectAwsModal";
import { MikroTikAgentModal } from "@/components/integrations/MikroTikAgentModal";
import { AwsResourcesModal } from "@/components/integrations/AwsResourcesModal";
import { GoogleOAuthValidator } from "@/components/integrations/GoogleOAuthValidator";
import { AzureConnectionStatus } from "@/components/integrations/AzureConnectionStatus";
import { AzureResourcesModal } from "@/components/integrations/AzureResourcesModal";
import { GoogleWorkspaceResourcesModal } from "@/components/integrations/GoogleWorkspaceResourcesModal";
import { Auth0Connector } from "@/components/integrations/Auth0Connector";
import { Auth0ResourcesModal } from "@/components/integrations/Auth0ResourcesModal";
import { ConnectAuth0Modal } from "@/components/integrations/ConnectAuth0Modal";
import { ConnectOktaModal } from "@/components/integrations/ConnectOktaModal";
import { ConnectionModal } from "@/components/integrations/ConnectionModal";
import { Auth0Evidence } from "@/hooks/useAuth0Sync";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Catalog
import { 
  integrationsCatalog, 
  IntegrationDefinition,
  IntegrationCategory,
  CATEGORY_LABELS,
  isIntegrationFunctional,
  getIntegrationsByCategory
} from "@/lib/integrations-catalog";

const CATEGORY_ICONS: Record<IntegrationCategory, React.ReactNode> = {
  cloud: <Cloud className="h-4 w-4" />,
  iam: <Shield className="h-4 w-4" />,
  sdlc: <GitBranch className="h-4 w-4" />,
  productivity: <Users className="h-4 w-4" />,
  endpoint: <Laptop className="h-4 w-4" />,
};

export default function IntegrationsHub() {
  const [searchParams] = useSearchParams();
  const { aws, google, azure, mikrotik, auth0, okta, cloudflare, jira, github, gitlab, slack, bamboohr, crowdstrike, intune, loading, refetch } = useIntegrationStatus();

  // Modal states
  const [showAwsModal, setShowAwsModal] = useState(false);
  const [showMikroTikModal, setShowMikroTikModal] = useState(false);
  const [showAwsResourcesModal, setShowAwsResourcesModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showGoogleResourcesModal, setShowGoogleResourcesModal] = useState(false);
  const [showAzureModal, setShowAzureModal] = useState(false);
  const [showAzureResourcesModal, setShowAzureResourcesModal] = useState(false);
  const [showConnectAuth0Modal, setShowConnectAuth0Modal] = useState(false);
  const [showAuth0ManageModal, setShowAuth0ManageModal] = useState(false);
  const [showAuth0ResourcesModal, setShowAuth0ResourcesModal] = useState(false);
  const [showConnectOktaModal, setShowConnectOktaModal] = useState(false);
  const [auth0Data, setAuth0Data] = useState<Auth0Evidence | null>(null);
  const [featureRequestModal, setFeatureRequestModal] = useState<IntegrationDefinition | null>(null);
  
  // Generic ConnectionModal state
  const [connectionModalConfig, setConnectionModalConfig] = useState<{
    open: boolean;
    provider: string;
    integrationName: string;
    integrationLogo: string;
  } | null>(null);

  // Handle Azure OAuth callback
  useEffect(() => {
    const azureConnected = searchParams.get('azure_connected');
    if (azureConnected === 'true') {
      toast({
        title: "Azure AD conectado!",
        description: "A integração com Azure Active Directory foi configurada com sucesso.",
      });
      refetch();
    }
  }, [searchParams, refetch]);

  // Get integration status
  const getIntegrationStatus = (id: string): 'connected' | 'available' | 'coming_soon' => {
    if (!isIntegrationFunctional(id)) return 'coming_soon';
    
    switch (id) {
      case 'aws':
        return aws.connected ? 'connected' : 'available';
      case 'google-workspace':
        return google.connected ? 'connected' : 'available';
      case 'azure-ad':
        return azure.connected ? 'connected' : 'available';
      case 'mikrotik':
        return mikrotik.connected ? 'connected' : 'available';
      case 'auth0':
        return auth0.connected ? 'connected' : 'available';
      case 'okta':
        return okta.connected ? 'connected' : 'available';
      case 'cloudflare':
        return cloudflare.connected ? 'connected' : 'available';
      case 'jira':
        return jira.connected ? 'connected' : 'available';
      case 'github':
        return github.connected ? 'connected' : 'available';
      case 'gitlab':
        return gitlab.connected ? 'connected' : 'available';
      case 'slack':
        return slack.connected ? 'connected' : 'available';
      case 'bamboohr':
        return bamboohr.connected ? 'connected' : 'available';
      case 'crowdstrike':
        return crowdstrike.connected ? 'connected' : 'available';
      case 'intune':
        return intune.connected ? 'connected' : 'available';
      default:
        return 'available';
    }
  };

  const getLastSync = (id: string): Date | null => {
    switch (id) {
      case 'aws':
        return aws.lastSync;
      case 'google-workspace':
        return google.lastSync;
      case 'azure-ad':
        return azure.lastSync;
      case 'mikrotik':
        return mikrotik.lastSync;
      case 'auth0':
        return auth0.lastSync;
      case 'okta':
        return okta.lastSync;
      case 'cloudflare':
        return cloudflare.lastSync;
      case 'jira':
        return jira.lastSync;
      case 'github':
        return github.lastSync;
      case 'gitlab':
        return gitlab.lastSync;
      case 'slack':
        return slack.lastSync;
      case 'bamboohr':
        return bamboohr.lastSync;
      case 'crowdstrike':
        return crowdstrike.lastSync;
      case 'intune':
        return intune.lastSync;
      default:
        return null;
    }
  };


  // Handlers for each integration
  const handleConnect = (integration: IntegrationDefinition) => {
    // Integrations with specific modals
    switch (integration.id) {
      case 'aws':
        setShowAwsModal(true);
        break;
      case 'google-workspace':
        setShowGoogleModal(true);
        break;
      case 'azure-ad':
        setShowAzureModal(true);
        break;
      case 'mikrotik':
        setShowMikroTikModal(true);
        break;
      case 'auth0':
        setShowConnectAuth0Modal(true);
        break;
      case 'okta':
        setShowConnectOktaModal(true);
        break;
      // Self-service integrations use the generic ConnectionModal
      case 'cloudflare':
      case 'jira':
      case 'github':
      case 'gitlab':
      case 'slack':
      case 'bamboohr':
      case 'crowdstrike':
      case 'intune':
        setConnectionModalConfig({
          open: true,
          provider: integration.provider,
          integrationName: integration.name,
          integrationLogo: integration.logo,
        });
        break;
      default:
        setFeatureRequestModal(integration);
    }
  };

  const handleManage = (integration: IntegrationDefinition) => {
    switch (integration.id) {
      case 'google-workspace':
        setShowGoogleModal(true);
        break;
      case 'azure-ad':
        setShowAzureModal(true);
        break;
      case 'aws':
        setShowAwsModal(true);
        break;
      case 'mikrotik':
        setShowMikroTikModal(true);
        break;
      case 'auth0':
        setShowConnectAuth0Modal(true);
        break;
      case 'okta':
        setShowConnectOktaModal(true);
        break;
      // Self-service integrations use the generic ConnectionModal for management too
      case 'cloudflare':
      case 'jira':
      case 'github':
      case 'gitlab':
      case 'slack':
      case 'bamboohr':
      case 'crowdstrike':
      case 'intune':
        setConnectionModalConfig({
          open: true,
          provider: integration.provider,
          integrationName: integration.name,
          integrationLogo: integration.logo,
        });
        break;
    }
  };

  const handleViewResources = (integration: IntegrationDefinition) => {
    switch (integration.id) {
      case 'aws':
        setShowAwsResourcesModal(true);
        break;
      case 'google-workspace':
        setShowGoogleResourcesModal(true);
        break;
      case 'azure-ad':
        setShowAzureResourcesModal(true);
        break;
      case 'auth0':
        if (auth0Data) {
          setShowAuth0ResourcesModal(true);
        }
        break;
    }
  };

  const handleAuth0Connected = (data: Auth0Evidence) => {
    setAuth0Data(data);
    setShowConnectAuth0Modal(false);
    // Optionally open the resources modal
    setShowAuth0ResourcesModal(true);
  };

  const handleAuth0ViewResources = (data: Auth0Evidence) => {
    setAuth0Data(data);
    setShowAuth0ResourcesModal(true);
  };

  // Stats
  const connectedCount = integrationsCatalog.filter(i => getIntegrationStatus(i.id) === 'connected').length;
  const availableCount = integrationsCatalog.filter(i => getIntegrationStatus(i.id) === 'available').length;
  const comingSoonCount = integrationsCatalog.filter(i => getIntegrationStatus(i.id) === 'coming_soon').length;

  const renderIntegrationCards = (integrations: IntegrationDefinition[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {integrations.map((integration) => {
        const status = getIntegrationStatus(integration.id);
        return (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            status={status}
            lastSync={getLastSync(integration.id)}
            onConnect={() => handleConnect(integration)}
            onManage={() => handleManage(integration)}
            onViewResources={
              ['aws', 'google-workspace', 'azure-ad'].includes(integration.id) && status === 'connected'
                ? () => handleViewResources(integration)
                : undefined
            }
            onRequestFeature={() => setFeatureRequestModal(integration)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Plug className="h-6 w-6 text-primary" />
                    Hub de Integrações
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Conecte suas ferramentas e automatize a coleta de evidências de compliance
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <Activity className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
                      <p className="text-sm text-muted-foreground">Integrações Ativas</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <RefreshCw className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{availableCount}</p>
                      <p className="text-sm text-muted-foreground">Disponíveis para Conectar</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-amber-500/10">
                      <Lock className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{comingSoonCount}</p>
                      <p className="text-sm text-muted-foreground">Em Desenvolvimento</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Tabs */}
              <Tabs defaultValue="all" className="w-full overflow-hidden">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 overflow-x-auto">
                  <TabsTrigger value="all" className="flex-1 min-w-[120px]">
                    Todas
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {integrationsCatalog.length}
                    </Badge>
                  </TabsTrigger>
                  {(Object.keys(CATEGORY_LABELS) as IntegrationCategory[]).map((category) => (
                    <TabsTrigger key={category} value={category} className="flex-1 min-w-[140px] gap-1.5">
                      {CATEGORY_ICONS[category]}
                      <span className="hidden sm:inline">{CATEGORY_LABELS[category]}</span>
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {getIntegrationsByCategory(category).length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  {renderIntegrationCards(integrationsCatalog)}
                </TabsContent>

                {(Object.keys(CATEGORY_LABELS) as IntegrationCategory[]).map((category) => (
                  <TabsContent key={category} value={category} className="mt-6">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {CATEGORY_ICONS[category]}
                        {CATEGORY_LABELS[category]}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category === 'cloud' && 'Monitore sua infraestrutura de nuvem e redes'}
                        {category === 'iam' && 'Gerencie identidades, acessos e políticas de segurança'}
                        {category === 'sdlc' && 'Audite repositórios, pipelines e práticas de desenvolvimento seguro'}
                        {category === 'productivity' && 'Integre ferramentas de produtividade e gestão de pessoas'}
                        {category === 'endpoint' && 'Monitore dispositivos, endpoints e proteção contra ameaças'}
                      </p>
                    </div>
                    {renderIntegrationCards(getIntegrationsByCategory(category))}
                  </TabsContent>
                ))}
              </Tabs>

              {/* Security Info */}
              <Card className="bg-muted/30 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Segurança e Privacidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Todas as credenciais são criptografadas em repouso. Os tokens de acesso OAuth são 
                    armazenados de forma segura e renovados automaticamente. Nunca armazenamos senhas 
                    em texto claro.
                  </p>
                </CardContent>
              </Card>
            </div>
          </PageContainer>
        </main>
      </div>

      <Footer />

      {/* Modals */}
      <ConnectAwsModal 
        open={showAwsModal} 
        onOpenChange={setShowAwsModal} 
      />
      
      <MikroTikAgentModal 
        open={showMikroTikModal} 
        onOpenChange={setShowMikroTikModal} 
      />
      
      <AwsResourcesModal 
        open={showAwsResourcesModal} 
        onOpenChange={setShowAwsResourcesModal}
        integrationId={aws.connected ? 'aws' : ''}
      />

      <Dialog open={showGoogleModal} onOpenChange={setShowGoogleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Google Workspace</DialogTitle>
          </DialogHeader>
          <GoogleOAuthValidator />
        </DialogContent>
      </Dialog>

      <GoogleWorkspaceResourcesModal
        open={showGoogleResourcesModal}
        onOpenChange={setShowGoogleResourcesModal}
      />

      <Dialog open={showAzureModal} onOpenChange={setShowAzureModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Microsoft Entra ID (Azure AD)</DialogTitle>
          </DialogHeader>
          <AzureConnectionStatus />
        </DialogContent>
      </Dialog>

      <AzureResourcesModal
        open={showAzureResourcesModal}
        onOpenChange={setShowAzureResourcesModal}
      />

      <ConnectAuth0Modal
        open={showConnectAuth0Modal}
        onOpenChange={setShowConnectAuth0Modal}
        onSuccess={handleAuth0Connected}
      />

      <Dialog open={showAuth0ManageModal} onOpenChange={setShowAuth0ManageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Auth0</DialogTitle>
          </DialogHeader>
          <Auth0Connector onViewResources={handleAuth0ViewResources} />
        </DialogContent>
      </Dialog>

      <Auth0ResourcesModal
        open={showAuth0ResourcesModal}
        onOpenChange={setShowAuth0ResourcesModal}
        data={auth0Data}
      />

      <ConnectOktaModal
        open={showConnectOktaModal}
        onOpenChange={setShowConnectOktaModal}
        onConnected={refetch}
      />

      <FeatureRequestModal
        open={!!featureRequestModal}
        onOpenChange={(open) => !open && setFeatureRequestModal(null)}
        integration={featureRequestModal}
      />

      {/* Generic Connection Modal for Self-Service Integrations */}
      {connectionModalConfig && (
        <ConnectionModal
          open={connectionModalConfig.open}
          onOpenChange={(open) => {
            if (!open) setConnectionModalConfig(null);
          }}
          provider={connectionModalConfig.provider}
          integrationName={connectionModalConfig.integrationName}
          integrationLogo={connectionModalConfig.integrationLogo}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
