import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIntegrations } from '@/hooks/useIntegrations';
import { EmptyState } from '@/components/common';
import IntegrationDetailsModal from './IntegrationDetailsModal';
import { useState } from 'react';

const ConnectedIntegrations = () => {
  const { integrations, loading, pauseIntegration, resumeIntegration, disconnectIntegration } = useIntegrations();
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleAction = (action: string, integrationId: string) => {
    switch (action) {
      case 'pause':
        pauseIntegration(integrationId);
        break;
      case 'resume':
        resumeIntegration(integrationId);
        break;
      case 'disconnect':
        if (confirm('Tem certeza que deseja desconectar esta integração?')) {
          disconnectIntegration(integrationId);
        }
        break;
      case 'details':
        const integration = integrations.find(i => i.id === integrationId);
        if (integration) {
          setSelectedIntegration({
            id: integration.id,
            name: integration.name,
            status: integration.status === 'active' ? 'connected' : 'disconnected',
            health: integration.health,
            logo: integration.logo,
            description: `Integração ${integration.category}`,
            connectedAt: integration.connectedAt,
            lastSync: integration.lastSync,
            webhookCount: integration.evidences || 0,
            failedWebhooks: 0,
          });
          setDetailsModalOpen(true);
        }
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Integrações Conectadas
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Integrações Conectadas
        </h2>
        <EmptyState 
          title="Nenhuma integração conectada"
          description="Conecte suas primeiras integrações para começar a coletar evidências automaticamente."
        />
      </div>
    );
  }

  const getStatusBadge = (status: string, health: string) => {
    if (status === 'paused') {
      return <Badge variant="outline" className="gap-1"><Pause className="h-3 w-3" />Pausada</Badge>;
    }
    if (health === 'healthy') {
      return <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3" />Ativa</Badge>;
    }
    if (health === 'degraded') {
      return <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20"><AlertTriangle className="h-3 w-3" />Alerta</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Conectando</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Integrações Conectadas
        </h2>
        <Badge variant="outline" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          {integrations.filter(i => i.status === 'active').length} ativas
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <Card key={integration.id} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{integration.logo}</div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {integration.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {integration.category}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction('details', integration.id)}>
                      <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />Configurar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleAction(
                        integration.status === 'paused' ? 'resume' : 'pause', 
                        integration.id
                      )}
                    >
                      {integration.status === 'paused' ? (
                        <><Play className="h-4 w-4 mr-2" />Retomar</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-2" />Pausar</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleAction('disconnect', integration.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />Desconectar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(integration.status, integration.health)}
                <span className="text-xs text-muted-foreground">
                  {integration.lastSync}
                </span>
              </div>

              {integration.issue && (
                <div className="text-xs text-warning bg-warning/10 p-2 rounded">
                  {integration.issue}
                </div>
              )}

              {integration.pausedBy && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                  {integration.pausedBy}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Evidências</p>
                  <p className="font-semibold text-foreground">{integration.evidences}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Controles</p>
                  <p className="font-semibold text-foreground">{integration.controls}</p>
                </div>
              </div>

              {integration.config && (
                <div className="text-xs space-y-1">
                  {integration.config.regions && (
                    <p className="text-muted-foreground">
                      Regiões: {integration.config.regions.join(', ')}
                    </p>
                  )}
                  {integration.config.domain && (
                    <p className="text-muted-foreground">
                      Domínio: {integration.config.domain}
                    </p>
                  )}
                  {integration.config.services && (
                    <p className="text-muted-foreground">
                      Serviços: {integration.config.services.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Details Modal */}
      <IntegrationDetailsModal
        integration={selectedIntegration}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onDisconnect={() => {
          if (selectedIntegration) {
            disconnectIntegration(selectedIntegration.id);
          }
        }}
      />
    </div>
  );
};

export default ConnectedIntegrations;