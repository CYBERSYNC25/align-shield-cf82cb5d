import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plug, 
  ArrowRight, 
  Zap,
  CheckCircle2,
  Loader2
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

// Marketplace Components
import { MarketplaceFilters, IntegrationCategory, IntegrationStatus } from "@/components/integrations/MarketplaceFilters";
import { MarketplaceIntegrationCard } from "@/components/integrations/MarketplaceIntegrationCard";
import { PopularIntegrations } from "@/components/integrations/PopularIntegrations";
import { ComingSoonSection } from "@/components/integrations/ComingSoonSection";

// Modals
import { ConnectAwsModal } from "@/components/integrations/ConnectAwsModal";
import { MikroTikAgentModal } from "@/components/integrations/MikroTikAgentModal";
import { AwsResourcesModal } from "@/components/integrations/AwsResourcesModal";
import { GoogleOAuthValidator } from "@/components/integrations/GoogleOAuthValidator";
import { AzureResourcesModal } from "@/components/integrations/AzureResourcesModal";
import { GoogleWorkspaceResourcesModal } from "@/components/integrations/GoogleWorkspaceResourcesModal";
import { Auth0ResourcesModal } from "@/components/integrations/Auth0ResourcesModal";
import { ConnectAuth0Modal } from "@/components/integrations/ConnectAuth0Modal";
import { ConnectOktaModal } from "@/components/integrations/ConnectOktaModal";
import { ConnectionModal } from "@/components/integrations/ConnectionModal";
import { DatadogResourcesModal } from "@/components/integrations/DatadogResourcesModal";
import { IntegrationLogs } from "@/components/integrations/IntegrationLogs";
import { ManualEntryModal } from "@/components/integrations/ManualEntryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Auth0Connector } from "@/components/integrations/Auth0Connector";
import { Auth0Evidence } from "@/hooks/useAuth0Sync";

// Catalog & Utils
import { 
  integrationsCatalog, 
  IntegrationDefinition,
  isIntegrationFunctional,
  getIntegrationFrameworks,
  FrameworkType
} from "@/lib/integrations-catalog";
import { useIntegrationStatus } from "@/hooks/useIntegrationStatus";
import { fuzzyMatch, getSearchScore, POPULAR_INTEGRATION_IDS, COMING_SOON_INTEGRATIONS } from "@/lib/marketplace-utils";

const TOTAL_AVAILABLE_INTEGRATIONS = 15;

export default function IntegrationsHub() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { 
    aws, google, azure, mikrotik, auth0, okta, cloudflare, 
    jira, github, gitlab, slack, bamboohr, crowdstrike, intune, 
    loading, refetch 
  } = useIntegrationStatus();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IntegrationCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus>('all');
  const [frameworkFilter, setFrameworkFilter] = useState<FrameworkType | 'all'>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Modal states
  const [showAwsModal, setShowAwsModal] = useState(false);
  const [showMikroTikModal, setShowMikroTikModal] = useState(false);
  const [showAwsResourcesModal, setShowAwsResourcesModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showGoogleResourcesModal, setShowGoogleResourcesModal] = useState(false);
  const [showAzureResourcesModal, setShowAzureResourcesModal] = useState(false);
  const [showConnectAuth0Modal, setShowConnectAuth0Modal] = useState(false);
  const [showAuth0ManageModal, setShowAuth0ManageModal] = useState(false);
  const [showAuth0ResourcesModal, setShowAuth0ResourcesModal] = useState(false);
  const [showConnectOktaModal, setShowConnectOktaModal] = useState(false);
  const [showDatadogResourcesModal, setShowDatadogResourcesModal] = useState(false);
  const [auth0Data, setAuth0Data] = useState<Auth0Evidence | null>(null);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
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
      case 'aws': return aws.connected ? 'connected' : 'available';
      case 'google-workspace': return google.connected ? 'connected' : 'available';
      case 'azure-ad': return azure.connected ? 'connected' : 'available';
      case 'mikrotik': return mikrotik.connected ? 'connected' : 'available';
      case 'auth0': return auth0.connected ? 'connected' : 'available';
      case 'okta': return okta.connected ? 'connected' : 'available';
      case 'cloudflare': return cloudflare.connected ? 'connected' : 'available';
      case 'jira': return jira.connected ? 'connected' : 'available';
      case 'github': return github.connected ? 'connected' : 'available';
      case 'gitlab': return gitlab.connected ? 'connected' : 'available';
      case 'slack': return slack.connected ? 'connected' : 'available';
      case 'bamboohr': return bamboohr.connected ? 'connected' : 'available';
      case 'crowdstrike': return crowdstrike.connected ? 'connected' : 'available';
      case 'intune': return intune.connected ? 'connected' : 'available';
      case 'manual-entry': return 'available'; // Always available, users click to add resources
      default: return 'available';
    }
  };

  // Check if connected
  const isConnected = (id: string): boolean => getIntegrationStatus(id) === 'connected';

  // Count connected
  const connectedCount = useMemo(() => {
    return integrationsCatalog.filter(i => isConnected(i.id)).length;
  }, [aws, google, azure, mikrotik, auth0, okta, cloudflare, jira, github, gitlab, slack, bamboohr, crowdstrike, intune]);

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    return integrationsCatalog
      .filter(integration => {
        // Search filter (fuzzy)
        if (searchTerm) {
          const nameMatch = fuzzyMatch(integration.name, searchTerm);
          const descMatch = fuzzyMatch(integration.description, searchTerm);
          if (!nameMatch && !descMatch) return false;
        }
        
        // Category filter
        if (categoryFilter !== 'all' && integration.category !== categoryFilter) {
          return false;
        }
        
        // Framework filter
        if (frameworkFilter !== 'all') {
          const integrationFrameworks = getIntegrationFrameworks(integration.id);
          if (!integrationFrameworks.includes(frameworkFilter)) {
            return false;
          }
        }
        
        // Status filter based on tab
        if (activeTab === 'connected' && !isConnected(integration.id)) {
          return false;
        }
        if (activeTab === 'available' && isConnected(integration.id)) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by search relevance if searching
        if (searchTerm) {
          const scoreA = Math.max(
            getSearchScore(a.name, searchTerm),
            getSearchScore(a.description, searchTerm)
          );
          const scoreB = Math.max(
            getSearchScore(b.name, searchTerm),
            getSearchScore(b.description, searchTerm)
          );
          return scoreB - scoreA;
        }
        // Otherwise sort connected first, then by name
        const aConnected = isConnected(a.id) ? 1 : 0;
        const bConnected = isConnected(b.id) ? 1 : 0;
        if (aConnected !== bConnected) return bConnected - aConnected;
        return a.name.localeCompare(b.name);
      });
  }, [searchTerm, categoryFilter, frameworkFilter, activeTab, aws, google, azure, mikrotik, auth0, okta, cloudflare, jira, github, gitlab, slack, bamboohr, crowdstrike, intune]);

  // Popular integrations
  const popularIntegrations = useMemo(() => {
    return integrationsCatalog.filter(i => POPULAR_INTEGRATION_IDS.includes(i.id));
  }, []);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (categoryFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (frameworkFilter !== 'all') count++;
    return count;
  }, [searchTerm, categoryFilter, statusFilter, frameworkFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setFrameworkFilter('all');
  };

  // Handle connect
  const handleConnect = (integration: IntegrationDefinition) => {
    switch (integration.id) {
      case 'aws':
        setShowAwsModal(true);
        break;
      case 'google-workspace':
        setShowGoogleModal(true);
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
      case 'manual-entry':
        setShowManualEntryModal(true);
        break;
      case 'azure-ad':
      case 'cloudflare':
      case 'jira':
      case 'github':
      case 'gitlab':
      case 'slack':
      case 'bamboohr':
      case 'crowdstrike':
      case 'intune':
      case 'datadog':
        setConnectionModalConfig({
          open: true,
          provider: integration.id,
          integrationName: integration.name,
          integrationLogo: integration.logo || '',
        });
        break;
      default:
        toast({
          title: "Em breve",
          description: `A integração com ${integration.name} estará disponível em breve.`,
        });
    }
  };

  // Handle manage
  const handleManage = (integration: IntegrationDefinition) => {
    switch (integration.id) {
      case 'aws':
        setShowAwsResourcesModal(true);
        break;
      case 'azure-ad':
        setShowAzureResourcesModal(true);
        break;
      case 'google-workspace':
        setShowGoogleResourcesModal(true);
        break;
      case 'auth0':
        setShowAuth0ResourcesModal(true);
        break;
      case 'datadog':
        setShowDatadogResourcesModal(true);
        break;
      default:
        toast({
          title: "Gerenciar integração",
          description: `Gerencie a integração ${integration.name} nas configurações.`,
        });
    }
  };

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: integrationsCatalog.length,
    connected: connectedCount,
    available: integrationsCatalog.length - connectedCount,
    coming_soon: COMING_SOON_INTEGRATIONS.length,
  }), [connectedCount]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Plug className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace de Integrações</h1>
          <p className="text-sm text-muted-foreground">Conecte suas ferramentas e automatize compliance</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Progress Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Progress 
                        value={(connectedCount / TOTAL_AVAILABLE_INTEGRATIONS) * 100} 
                        className="w-32 h-2"
                      />
                      <span className="text-sm font-medium">
                        <span className="text-primary">{connectedCount}</span>
                        <span className="text-muted-foreground">/{TOTAL_AVAILABLE_INTEGRATIONS}</span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {connectedCount === 0 
                        ? "Comece conectando sua primeira integração"
                        : connectedCount < 5
                        ? "Continue conectando para aumentar a cobertura"
                        : "Ótimo progresso! Continue automatizando"}
                    </p>
                  </div>
                </div>
                
                {connectedCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('connected')}
                    className="shrink-0"
                  >
                    Ver conectadas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <MarketplaceFilters
          search={searchTerm}
          onSearchChange={setSearchTerm}
          category={categoryFilter}
          onCategoryChange={setCategoryFilter}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          framework={frameworkFilter}
          onFrameworkChange={setFrameworkFilter}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={clearFilters}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-muted/50">
            <TabsTrigger value="all" className="gap-2">
              Todas
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {tabCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="connected" className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conectadas
              <Badge className="h-5 px-1.5 text-xs bg-primary/20 text-primary border-0">
                {tabCounts.connected}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              Disponíveis
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {tabCounts.available}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="coming_soon" className="gap-2">
              Em Breve
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {tabCounts.coming_soon}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-8">
            {/* Popular Section - only show when not filtering */}
            {!searchTerm && categoryFilter === 'all' && (
              <PopularIntegrations>
                {popularIntegrations.map((integration) => (
                  <MarketplaceIntegrationCard
                    key={integration.id}
                    integration={integration}
                    isConnected={isConnected(integration.id)}
                    onConnect={() => handleConnect(integration)}
                    onManage={() => handleManage(integration)}
                  />
                ))}
              </PopularIntegrations>
            )}

            {/* All Integrations Grid */}
            <div>
              {!searchTerm && categoryFilter === 'all' && (
                <h2 className="text-lg font-semibold mb-4">Todas as Integrações</h2>
              )}
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${searchTerm}-${categoryFilter}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredIntegrations.map((integration) => (
                    <motion.div key={integration.id} variants={itemVariants}>
                      <MarketplaceIntegrationCard
                        integration={integration}
                        isConnected={isConnected(integration.id)}
                        onConnect={() => handleConnect(integration)}
                        onManage={() => handleManage(integration)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {filteredIntegrations.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-muted-foreground">
                    Nenhuma integração encontrada para "{searchTerm}"
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Limpar filtros
                  </Button>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Connected Tab */}
          <TabsContent value="connected">
            <AnimatePresence mode="wait">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredIntegrations.map((integration) => (
                  <motion.div key={integration.id} variants={itemVariants}>
                    <MarketplaceIntegrationCard
                      integration={integration}
                      isConnected={true}
                      onConnect={() => handleConnect(integration)}
                      onManage={() => handleManage(integration)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredIntegrations.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Plug className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Nenhuma integração conectada</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Conecte sua primeira integração para começar a automatizar compliance
                </p>
                <Button onClick={() => setActiveTab('available')}>
                  Ver disponíveis
                </Button>
              </motion.div>
            )}
          </TabsContent>

          {/* Available Tab */}
          <TabsContent value="available">
            <AnimatePresence mode="wait">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredIntegrations.map((integration) => (
                  <motion.div key={integration.id} variants={itemVariants}>
                    <MarketplaceIntegrationCard
                      integration={integration}
                      isConnected={false}
                      onConnect={() => handleConnect(integration)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Coming Soon Tab */}
          <TabsContent value="coming_soon">
            <ComingSoonSection integrations={COMING_SOON_INTEGRATIONS} />
          </TabsContent>
        </Tabs>

        {/* Integration Logs */}
        <IntegrationLogs />
      </div>

      {/* Modals */}
      <ConnectAwsModal
        open={showAwsModal}
        onOpenChange={setShowAwsModal}
        onSuccess={() => {
          setShowAwsModal(false);
          refetch();
        }}
      />

      <MikroTikAgentModal
        open={showMikroTikModal}
        onOpenChange={setShowMikroTikModal}
      />

      <AwsResourcesModal
        open={showAwsResourcesModal}
        onOpenChange={setShowAwsResourcesModal}
        integrationId=""
      />

      <Dialog open={showGoogleModal} onOpenChange={setShowGoogleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conectar Google Workspace</DialogTitle>
          </DialogHeader>
          <GoogleOAuthValidator />
        </DialogContent>
      </Dialog>

      <GoogleWorkspaceResourcesModal
        open={showGoogleResourcesModal}
        onOpenChange={setShowGoogleResourcesModal}
      />

      <AzureResourcesModal
        open={showAzureResourcesModal}
        onOpenChange={setShowAzureResourcesModal}
      />

      <ConnectAuth0Modal
        open={showConnectAuth0Modal}
        onOpenChange={setShowConnectAuth0Modal}
        onSuccess={() => {
          refetch();
        }}
      />

      <Dialog open={showAuth0ManageModal} onOpenChange={setShowAuth0ManageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Auth0</DialogTitle>
          </DialogHeader>
          <Auth0Connector 
            onViewResources={(data) => {
              setAuth0Data(data);
              setShowAuth0ManageModal(false);
              setShowAuth0ResourcesModal(true);
            }}
          />
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
        onConnected={() => {
          refetch();
        }}
      />

      <DatadogResourcesModal
        open={showDatadogResourcesModal}
        onOpenChange={setShowDatadogResourcesModal}
        integrationId=""
      />

      {connectionModalConfig && (
        <ConnectionModal
          open={connectionModalConfig.open}
          onOpenChange={(open) => !open && setConnectionModalConfig(null)}
          provider={connectionModalConfig.provider}
          integrationName={connectionModalConfig.integrationName}
          integrationLogo={connectionModalConfig.integrationLogo}
          onSuccess={() => {
            setConnectionModalConfig(null);
            refetch();
          }}
        />
      )}

      <ManualEntryModal
        open={showManualEntryModal}
        onOpenChange={setShowManualEntryModal}
        onSuccess={() => {
          setShowManualEntryModal(false);
          queryClient.invalidateQueries({ queryKey: ['integration-data'] });
          refetch();
        }}
      />
    </MainLayout>
  );
}
