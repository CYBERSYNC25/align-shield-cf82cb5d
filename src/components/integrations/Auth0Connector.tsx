import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users, 
  Key, 
  AppWindow,
  Zap,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth0TestConnection, useAuth0Sync, Auth0Evidence } from '@/hooks/useAuth0Sync';

interface Auth0ConnectorProps {
  onViewResources?: (data: Auth0Evidence) => void;
}

export function Auth0Connector({ onViewResources }: Auth0ConnectorProps) {
  const [connectionData, setConnectionData] = useState<Auth0Evidence | null>(null);
  
  const testConnection = useAuth0TestConnection();
  const syncData = useAuth0Sync();

  const handleTestConnection = async () => {
    const result = await testConnection.mutateAsync();
    if (result.success && result.data) {
      setConnectionData(result.data);
    }
  };

  const handleSync = async () => {
    const result = await syncData.mutateAsync();
    if (result.success && result.data) {
      setConnectionData(result.data);
    }
  };

  const isLoading = testConnection.isPending || syncData.isPending;
  const isConnected = connectionData !== null;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.auth0.com/website/assets/pages/press/img/auth0-logo-3D7CE7F9A0-logo.svg" 
                alt="Auth0" 
                className="h-8 w-auto"
              />
              <div>
                <CardTitle className="text-lg">Auth0</CardTitle>
                <CardDescription>Identity & Access Management</CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Conectado' : 'Não conectado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          {!isConnected && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Configure as secrets <code className="text-xs bg-muted px-1 py-0.5 rounded">AUTH0_DOMAIN</code>, 
                {' '}<code className="text-xs bg-muted px-1 py-0.5 rounded">AUTH0_CLIENT_ID</code> e 
                {' '}<code className="text-xs bg-muted px-1 py-0.5 rounded">AUTH0_CLIENT_SECRET</code> no 
                {' '}Supabase Dashboard → Edge Functions → Secrets.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={isLoading}
              variant={isConnected ? 'outline' : 'default'}
              className="flex-1"
            >
              {testConnection.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  {isConnected ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                  {isConnected ? 'Re-testar Conexão' : 'Testar Conexão'}
                </>
              )}
            </Button>
            
            {isConnected && (
              <Button
                onClick={handleSync}
                disabled={isLoading}
                variant="default"
                className="flex-1"
              >
                {syncData.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar Dados
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Error Display */}
          {(testConnection.isError || syncData.isError) && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {testConnection.error?.message || syncData.error?.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Connected Stats */}
          {isConnected && connectionData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{connectionData.users.total}</p>
                      <p className="text-xs text-muted-foreground">Usuários</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <AppWindow className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{connectionData.applications.total}</p>
                      <p className="text-xs text-muted-foreground">Aplicações</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Key className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{connectionData.connections.total}</p>
                      <p className="text-xs text-muted-foreground">Conexões</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{connectionData.actions.total}</p>
                      <p className="text-xs text-muted-foreground">Actions</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* View Details Button */}
              {onViewResources && (
                <Button
                  onClick={() => onViewResources(connectionData)}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Detalhes dos Recursos
                </Button>
              )}

              {/* Last Sync */}
              <p className="text-xs text-muted-foreground text-center">
                Última sincronização: {new Date(connectionData.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
