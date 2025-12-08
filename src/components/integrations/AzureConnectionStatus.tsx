import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useAzureConnectionStatus, 
  useAzureTestConnection, 
  useAzureRevokeConnection,
  useAzureConnect 
} from '@/hooks/integrations/useAzureSync';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  Shield,
  RefreshCw,
  Unplug,
  Play,
  Link2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AzureConnectionStatus = () => {
  const { data: connectionStatus, isLoading } = useAzureConnectionStatus();
  const testMutation = useAzureTestConnection();
  const revokeMutation = useAzureRevokeConnection();
  const connectMutation = useAzureConnect();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando status da conexão...</span>
        </div>
      </Card>
    );
  }

  if (!connectionStatus?.connected) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma conexão Azure AD encontrada. Configure a integração primeiro.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => connectMutation.mutate()} 
              disabled={connectMutation.isPending}
              className="gap-2"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Conectar com Microsoft 365
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus.is_expired ? "destructive" : "default"}>
                {connectionStatus.is_expired ? 'Token Expirado' : 'Conectado'}
              </Badge>
              {connectionStatus.is_expired && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending || revokeMutation.isPending}
                size="sm"
              >
                {testMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Teste
                  </>
                )}
              </Button>
              <Button
                onClick={() => revokeMutation.mutate()}
                disabled={testMutation.isPending || revokeMutation.isPending}
                variant="destructive"
                size="sm"
              >
                {revokeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Revogando...
                  </>
                ) : (
                  <>
                    <Unplug className="h-4 w-4 mr-2" />
                    Desconectar
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Data de Conexão</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(connectionStatus.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Validade do Token</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus.is_expired ? (
                    'Expirado - necessário renovar'
                  ) : (
                    `Expira ${formatDistanceToNow(new Date(connectionStatus.expires_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Escopos Configurados</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus.scopes || 'Nenhum escopo registrado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {testMutation.data && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {testMutation.data.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <h3 className="text-lg font-semibold">
                {testMutation.data.success ? 'Teste Aprovado' : 'Teste Reprovado'}
              </h3>
            </div>

            <Separator />

            {testMutation.data.success && testMutation.data.user_info && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Informações do Usuário</h4>
                <div className="grid gap-2 pl-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{testMutation.data.user_info.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{testMutation.data.user_info.email}</span>
                  </div>
                </div>
              </div>
            )}

            {testMutation.data.test_summary && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Resumo do Teste</h4>
                <div className="grid gap-2 pl-4">
                  {Object.entries(testMutation.data.test_summary).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!testMutation.data.success && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Etapa com falha: {testMutation.data.step}</p>
                    <p>{testMutation.data.error}</p>
                    {testMutation.data.recommendation && (
                      <p className="text-sm mt-2">
                        <strong>Recomendação:</strong> {testMutation.data.recommendation}
                      </p>
                    )}
                    {testMutation.data.status_code && (
                      <p className="text-sm">
                        <strong>Código HTTP:</strong> {testMutation.data.status_code}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {testMutation.data.message && (
              <Alert>
                <AlertDescription>{testMutation.data.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
