import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  MoreHorizontal,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIntegrations, Integration } from '@/hooks/useIntegrations';
import { EmptyState } from '@/components/common';
import IntegrationDetailsModal from './IntegrationDetailsModal';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de provider para logo/categoria
const providerInfo: Record<string, { logo: string; category: string }> = {
  'aws': { logo: '☁️', category: 'Cloud' },
  'azure': { logo: '🔷', category: 'Cloud' },
  'gcp': { logo: '🌐', category: 'Cloud' },
  'google-workspace': { logo: '📧', category: 'Produtividade' },
  'github': { logo: '🐙', category: 'DevOps' },
  'gitlab': { logo: '🦊', category: 'DevOps' },
  'jira': { logo: '📋', category: 'Gestão' },
  'okta': { logo: '🔐', category: 'Identidade' },
  'cloudflare': { logo: '🛡️', category: 'Segurança' },
  'crowdstrike': { logo: '🦅', category: 'Segurança' },
  'jamf': { logo: '🍎', category: 'MDM' },
  'intune': { logo: '💼', category: 'MDM' },
  'slack': { logo: '💬', category: 'Comunicação' },
  'datadog': { logo: '📊', category: 'Monitoramento' },
  'snyk': { logo: '🔍', category: 'Segurança' },
};

const ConnectedIntegrations = () => {
  const { integrations, loading, disconnectIntegration, refreshIntegrations } = useIntegrations();
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleAction = async (action: string, integration: Integration) => {
    switch (action) {
      case 'disconnect':
        if (confirm('Tem certeza que deseja desconectar esta integração?')) {
          await disconnectIntegration(integration.id);
        }
        break;
      case 'details':
        const info = providerInfo[integration.provider] || { logo: '🔗', category: 'Outro' };
        setSelectedIntegration({
          id: integration.id,
          name: integration.name,
          status: integration.status,
          health: integration.status === 'connected' ? 'healthy' : 'degraded',
          logo: info.logo,
          description: `Integração ${info.category}`,
          connectedAt: integration.createdAt,
          lastSync: integration.lastSync,
          webhookCount: 0,
          failedWebhooks: 0,
        });
        setDetailsModalOpen(true);
        break;
    }
  };

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3" />Ativa</Badge>;
      case 'error':
        return <Badge variant="secondary" className="gap-1 bg-danger/10 text-danger border-danger/20"><AlertTriangle className="h-3 w-3" />Erro</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3" />Expirada</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Desconectada</Badge>;
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Nunca sincronizado';
    try {
      return formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="h3">Suas Integrações Ativas</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="h3">Suas Integrações Ativas</h2>
        <EmptyState 
          title="Nenhuma integração conectada"
          description="Conecte suas primeiras integrações para começar a coletar evidências automaticamente e simplificar auditorias."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="h3">Suas Integrações Ativas</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshIntegrations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {integrations.length} {integrations.length === 1 ? 'Integração' : 'Integrações'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const info = providerInfo[integration.provider] || { logo: '🔗', category: 'Outro' };
          
          return (
            <Card key={integration.id} className="bg-surface-elevated border-card-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{info.logo}</div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {integration.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {info.category}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-dropdown">
                      <DropdownMenuItem onClick={() => handleAction('details', integration)}>
                        <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />Configurar Integração
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleAction('disconnect', integration)}
                        className="text-danger"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />Desconectar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(integration.status)}
                  <span className="text-xs text-muted-foreground">
                    {formatLastSync(integration.lastSync)}
                  </span>
                </div>

                {integration.status === 'error' && (
                  <div className="text-xs text-danger bg-danger/10 p-2 rounded">
                    Erro na conexão. Verifique as credenciais.
                  </div>
                )}

                {integration.status === 'expired' && (
                  <div className="text-xs text-warning bg-warning/10 p-2 rounded">
                    Token expirado. Reconecte a integração.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-caption">Provider</p>
                    <p className="font-semibold text-foreground capitalize">{integration.provider}</p>
                  </div>
                  <div>
                    <p className="text-caption">Última Atividade</p>
                    <p className="font-semibold text-foreground">
                      {integration.lastUsedAt 
                        ? formatDistanceToNow(new Date(integration.lastUsedAt), { addSuffix: true, locale: ptBR })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
