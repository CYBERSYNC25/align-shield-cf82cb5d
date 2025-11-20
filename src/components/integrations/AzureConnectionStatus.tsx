import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAzureConnection } from '@/hooks/useAzureConnection';
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
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AzureConnectionStatus = () => {
  const { 
    testing, 
    revoking, 
    testResult, 
    testConnection, 
    revokeConnection,
    checkConnectionStatus 
  } = useAzureConnection();

  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectionStatus();
  }, [testResult]);

  const loadConnectionStatus = async () => {
    setLoading(true);
    const status = await checkConnectionStatus();
    setConnectionStatus(status);
    setLoading(false);
  };

  const handleRevoke = async () => {
    const success = await revokeConnection();
    if (success) {
      setConnectionStatus(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando status da conexão...</span>
        </div>
      </Card>
    );
  }

  const handleConnect = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email offline_access User.Read',
          redirectTo: window.location.href,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao conectar",
          description: error.message || "Não foi possível iniciar o fluxo de autenticação com a Microsoft.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar conectar com a Microsoft. Tente novamente.",
      });
    }
  };

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
            <Button onClick={handleConnect} className="gap-2">
              <Link2 className="h-4 w-4" />
              Conectar com Microsoft 365
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
                onClick={testConnection}
                disabled={testing || revoking}
                size="sm"
              >
                {testing ? (
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
                onClick={handleRevoke}
                disabled={testing || revoking}
                variant="destructive"
                size="sm"
              >
                {revoking ? (
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

      {testResult && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <h3 className="text-lg font-semibold">
                {testResult.success ? 'Teste Aprovado' : 'Teste Reprovado'}
              </h3>
            </div>

            <Separator />

            {testResult.success && testResult.user_info && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Informações do Usuário</h4>
                <div className="grid gap-2 pl-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{testResult.user_info.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{testResult.user_info.email}</span>
                  </div>
                </div>
              </div>
            )}

            {testResult.test_summary && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Resumo do Teste</h4>
                <div className="grid gap-2 pl-4">
                  {Object.entries(testResult.test_summary).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!testResult.success && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Etapa com falha: {testResult.step}</p>
                    <p>{testResult.error}</p>
                    {testResult.recommendation && (
                      <p className="text-sm mt-2">
                        <strong>Recomendação:</strong> {testResult.recommendation}
                      </p>
                    )}
                    {testResult.status_code && (
                      <p className="text-sm">
                        <strong>Código HTTP:</strong> {testResult.status_code}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {testResult.message && (
              <Alert>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
