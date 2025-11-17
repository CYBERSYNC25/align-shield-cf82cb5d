import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  XCircle,
  Clock,
  Shield,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

/**
 * GoogleWorkspaceOAuth Component
 * 
 * Gerencia o fluxo completo de OAuth 2.0 com Google Workspace:
 * - Iniciar conexão (start)
 * - Verificar status da conexão
 * - Renovar tokens automaticamente (refresh)
 * - Revogar acesso (revoke/logout)
 * 
 * IMPORTANTE:
 * - Nunca expõe tokens no frontend
 * - Todas as operações passam por edge functions
 * - Implementa tratamento de erros completo
 * - Renova tokens automaticamente quando expiram
 */

interface OAuthToken {
  id: string;
  integration_name: string;
  expires_at: string;
  metadata: any; // Json type from Supabase
  created_at: string;
  updated_at: string;
}

const GoogleWorkspaceOAuth = () => {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [tokenData, setTokenData] = useState<OAuthToken | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Verifica o status da conexão ao carregar o componente
   */
  useEffect(() => {
    checkConnectionStatus();
    
    // Verificar query params para mensagens de sucesso/erro do callback
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'google_workspace') {
      toast({
        title: 'Conexão estabelecida!',
        description: 'Google Workspace foi conectado com sucesso.',
      });
      // Limpar query params
      window.history.replaceState({}, '', window.location.pathname);
      checkConnectionStatus();
    }
    
    if (error) {
      toast({
        title: 'Erro na conexão',
        description: decodeURIComponent(error),
        variant: 'destructive'
      });
      // Limpar query params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  /**
   * Atualiza o tempo até expiração do token
   */
  useEffect(() => {
    if (!tokenData?.expires_at) return;

    const updateTimer = () => {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilExpiry('Expirado');
        // Tentar renovar automaticamente
        if (connectionStatus === 'connected') {
          handleRefreshToken();
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilExpiry(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [tokenData, connectionStatus]);

  /**
   * Verifica o status atual da conexão OAuth
   */
  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus('checking');

      if (!user) {
        setConnectionStatus('disconnected');
        return;
      }

      const { data, error } = await supabase
        .from('integration_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'google_workspace')
        .single();

      if (error || !data) {
        setConnectionStatus('disconnected');
        setTokenData(null);
      } else {
        setConnectionStatus('connected');
        setTokenData(data);

        // Verificar se o token está próximo de expirar (< 5 minutos)
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();
        
        if (diff < 5 * 60 * 1000 && diff > 0) {
          console.log('Token expiring soon, refreshing automatically...');
          handleRefreshToken();
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('disconnected');
    }
  };

  /**
   * Inicia o fluxo OAuth redirecionando para o Google
   */
  const handleConnect = async () => {
    try {
      setLoading(true);

      console.log('Starting OAuth flow...');

      const { data, error } = await supabase.functions.invoke('google-oauth-start', {
        body: {}
      });

      if (error) {
        console.error('Error starting OAuth:', error);
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Redirecting to Google authorization URL...');
      
      // Redirecionar para a URL de autorização do Google
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('Connect error:', error);
      toast({
        title: 'Erro ao conectar',
        description: error instanceof Error ? error.message : 'Falha ao iniciar conexão',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  /**
   * Renova o token de acesso usando o refresh token
   */
  const handleRefreshToken = async () => {
    try {
      console.log('Refreshing access token...');

      const { data, error } = await supabase.functions.invoke('google-oauth-refresh', {
        body: {}
      });

      if (error) {
        console.error('Error refreshing token:', error);
        
        // Se o refresh token for inválido, desconectar
        if (data?.requiresReconnection) {
          setConnectionStatus('disconnected');
          setTokenData(null);
          toast({
            title: 'Reconexão necessária',
            description: 'Por favor, reconecte o Google Workspace.',
            variant: 'destructive'
          });
        }
        
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Token refreshed successfully');
      toast({
        title: 'Token renovado',
        description: 'Token de acesso foi renovado com sucesso.'
      });

      // Atualizar status
      await checkConnectionStatus();

    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: 'Erro ao renovar token',
        description: error instanceof Error ? error.message : 'Falha ao renovar token',
        variant: 'destructive'
      });
    }
  };

  /**
   * Revoga o acesso e desconecta a integração
   */
  const handleRevoke = async () => {
    try {
      setLoading(true);

      console.log('Revoking OAuth access...');

      const { data, error } = await supabase.functions.invoke('google-oauth-revoke', {
        body: {}
      });

      if (error) {
        console.error('Error revoking access:', error);
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Access revoked successfully');
      toast({
        title: 'Acesso revogado',
        description: 'Google Workspace foi desconectado com sucesso.'
      });

      setConnectionStatus('disconnected');
      setTokenData(null);

    } catch (error) {
      console.error('Revoke error:', error);
      toast({
        title: 'Erro ao revogar acesso',
        description: error instanceof Error ? error.message : 'Falha ao desconectar',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcula a porcentagem de vida útil do token
   */
  const getTokenLifePercentage = (): number => {
    if (!tokenData?.expires_at) return 0;

    const createdAt = new Date(tokenData.created_at);
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    const totalLife = expiresAt.getTime() - createdAt.getTime();
    const elapsed = now.getTime() - createdAt.getTime();
    const remaining = Math.max(0, 100 - (elapsed / totalLife) * 100);

    return Math.round(remaining);
  };

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟡</span>
            <div>
              <CardTitle className="text-base">Google Workspace</CardTitle>
              <CardDescription className="text-sm">
                Integração OAuth 2.0 com renovação automática
              </CardDescription>
            </div>
          </div>
          
          {connectionStatus === 'connected' ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Conectado
            </Badge>
          ) : connectionStatus === 'disconnected' ? (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Desconectado
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3 animate-spin" />
              Verificando...
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {connectionStatus === 'connected' && tokenData && (
          <>
            {/* User Info */}
            {tokenData.metadata.email && (
              <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                <div className="flex items-center gap-3">
                  {tokenData.metadata.picture ? (
                    <img
                      src={tokenData.metadata.picture}
                      alt={tokenData.metadata.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tokenData.metadata.name || tokenData.metadata.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tokenData.metadata.email}
                    </p>
                  </div>
                  {tokenData.metadata.verified_email && (
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* Token Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status do Token</span>
                <span className="text-foreground font-medium">{timeUntilExpiry}</span>
              </div>
              <Progress value={getTokenLifePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Token renova automaticamente quando próximo de expirar
              </p>
            </div>

            {/* Connection Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-background/50 border border-border/30">
                <p className="text-xs text-muted-foreground">Conectado em</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(tokenData.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-background/50 border border-border/30">
                <p className="text-xs text-muted-foreground">Última atualização</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(tokenData.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshToken}
                disabled={loading}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Renovar Token
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevoke}
                disabled={loading}
                className="flex-1 gap-2 text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4" />
                Desconectar
              </Button>
            </div>
          </>
        )}

        {connectionStatus === 'disconnected' && (
          <>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Integração OAuth 2.0</AlertTitle>
              <AlertDescription>
                Conecte com segurança usando OAuth 2.0. Você será redirecionado para o Google para autorizar o acesso.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Recursos habilitados:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Listagem de usuários e grupos</li>
                <li>Relatórios de auditoria</li>
                <li>Metadados do Drive</li>
                <li>Renovação automática de tokens</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Conectar Google Workspace
                </>
              )}
            </Button>
          </>
        )}

        {connectionStatus === 'checking' && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Security Note */}
        <Alert variant="default" className="border-primary/20 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm">Segurança</AlertTitle>
          <AlertDescription className="text-xs">
            Seus tokens são armazenados com criptografia e nunca expostos no frontend. 
            Todas as operações passam por edge functions seguras.
          </AlertDescription>
        </Alert>

        {/* Documentation Link */}
        <div className="pt-2 border-t border-border/50">
          <Button
            variant="link"
            size="sm"
            className="gap-2 text-xs h-auto p-0"
            onClick={() => window.open('/docs/OAUTH_FLOW_DOCUMENTATION.md', '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
            Ver documentação completa do fluxo OAuth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleWorkspaceOAuth;
