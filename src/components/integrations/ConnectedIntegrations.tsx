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
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ConnectedIntegrations = () => {
  const connectedIntegrations = [
    {
      name: 'AWS',
      category: 'Cloud',
      status: 'active',
      lastSync: '2 min atrás',
      evidences: 156,
      controls: 23,
      logo: '☁️',
      health: 'healthy',
      config: {
        regions: ['us-east-1', 'sa-east-1'],
        services: ['IAM', 'S3', 'EC2', 'VPC']
      }
    },
    {
      name: 'Okta',
      category: 'Identidade',
      status: 'active',
      lastSync: '5 min atrás',
      evidences: 89,
      controls: 12,
      logo: '🔐',
      health: 'healthy',
      config: {
        domain: 'empresa.okta.com',
        apps: 47
      }
    },
    {
      name: 'GitHub',
      category: 'DevOps',
      status: 'active',
      lastSync: '1 min atrás',
      evidences: 203,
      controls: 18,
      logo: '🐙',
      health: 'healthy',
      config: {
        orgs: ['empresa-dev', 'empresa-ops'],
        repos: 127
      }
    },
    {
      name: 'Microsoft 365',
      category: 'Produtividade',
      status: 'warning',
      lastSync: '2h atrás',
      evidences: 67,
      controls: 8,
      logo: '📧',
      health: 'degraded',
      issue: 'Rate limit atingido'
    },
    {
      name: 'Jamf',
      category: 'Endpoints',
      status: 'active',
      lastSync: '15 min atrás',
      evidences: 234,
      controls: 15,
      logo: '💻',
      health: 'healthy',
      config: {
        devices: 186,
        policies: 23
      }
    },
    {
      name: 'Jira',
      category: 'ITSM',
      status: 'paused',
      lastSync: '1 dia atrás',
      evidences: 45,
      controls: 6,
      logo: '🎫',
      health: 'paused',
      pausedBy: 'Manutenção programada'
    }
  ];

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
          {connectedIntegrations.filter(i => i.status === 'active').length} ativas
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {connectedIntegrations.map((integration, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
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
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />Configurar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      {integration.status === 'paused' ? (
                        <><Play className="h-4 w-4 mr-2" />Retomar</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-2" />Pausar</>
                      )}
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
    </div>
  );
};

export default ConnectedIntegrations;