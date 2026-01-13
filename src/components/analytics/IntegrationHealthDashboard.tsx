import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Clock,
  Database
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntegrationHealth {
  name: string;
  displayName: string;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
  lastSync: Date | null;
  healthScore: number;
}

export function IntegrationHealthDashboard() {
  const statusResult = useIntegrationStatus();
  const isLoading = statusResult.loading;

  const integrationNames = ['aws', 'google', 'azure', 'github', 'gitlab', 'slack', 'cloudflare', 'jira', 'bamboohr', 'crowdstrike', 'intune', 'auth0', 'okta'] as const;

  const integrations: IntegrationHealth[] = integrationNames
    .map((name) => {
      const data = statusResult[name];
      if (!data) return null;
      
      const connected = data.connected;
      let status: IntegrationHealth['status'] = 'disconnected';
      
      if (connected) {
        status = 'healthy';
      }

      return {
        name: name as string,
        displayName: name.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        status,
        lastSync: data.lastSync,
        healthScore: connected ? 100 : 0,
      };
    })
    .filter((i): i is IntegrationHealth => i !== null && i.status !== 'disconnected');

  const healthyCount = integrations.filter(i => i.status === 'healthy').length;
  const warningCount = integrations.filter(i => i.status === 'warning').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  const getStatusIcon = (status: IntegrationHealth['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: IntegrationHealth['status']) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Saudável</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Atenção</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      default: return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Carregando status das integrações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (integrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma integração configurada</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/integrations'}>
            Configurar Integrações
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Saúde das Integrações
          </CardTitle>
          <p className="text-sm text-muted-foreground">Status de conexão e sincronização</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-green-500">
            <CheckCircle2 className="h-3 w-3" />
            {healthyCount}
          </Badge>
          {warningCount > 0 && (
            <Badge variant="outline" className="gap-1 text-yellow-500">
              <AlertTriangle className="h-3 w-3" />
              {warningCount}
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="outline" className="gap-1 text-red-500">
              <XCircle className="h-3 w-3" />
              {errorCount}
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={() => statusResult.refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <div 
              key={integration.name}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  <span className="font-medium">{integration.displayName}</span>
                </div>
                {getStatusBadge(integration.status)}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                {integration.lastSync && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Sincronizado {formatDistanceToNow(new Date(integration.lastSync), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                )}
                
                {integration.status !== 'disconnected' && (
                  <div className="flex items-center justify-between mt-2">
                    <span>Saúde</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            integration.healthScore >= 80 ? 'bg-green-500' :
                            integration.healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${integration.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{integration.healthScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default IntegrationHealthDashboard;
