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
  User,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface OAuthToken {
  id: string;
  integration_name: string;
  expires_at: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const GoogleWorkspaceOAuth = () => {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [tokenData, setTokenData] = useState<OAuthToken | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'idle' | 'authorizing' | 'complete'>('idle');
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
    
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (success === 'google_workspace' || success === 'true') {
      setCurrentStep('complete');
      toast({
        title: '✅ Conexão estabelecida com sucesso!',
        description: message || 'Google Workspace conectado. Tokens armazenados com segurança.',
      });
      window.history.replaceState({}, '', window.location.pathname);
      checkConnectionStatus();
      setTimeout(() => setCurrentStep('idle'), 3000);
    }
    
    if (error) {
      setCurrentStep('idle');
      let errorTitle = '❌ Erro na conexão';
      let errorDescription = message || decodeURIComponent(error);
      
      if (errorDescription.includes('access_denied')) {
        errorTitle = '❌ Autorização negada';
        errorDescription = 'Você negou o acesso. Para usar esta integração, é necessário autorizar as permissões.';
      }
      
      toast({ title: errorTitle, description: errorDescription, variant: 'destructive' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!tokenData?.expires_at) return;

    const updateTimer = () => {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilExpiry('Expirado');
        // Tenta renovar automaticamente apenas uma vez
        if (connectionStatus === 'connected' && !autoRefreshing) {
          handleAutoRefresh();
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilExpiry(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [tokenData, connectionStatus]);

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
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setCurrentStep('authorizing');
      
      toast({ title: '🚀 Iniciando conexão', description: 'Gerando URL de autorização...' });

      const { data, error } = await supabase.functions.invoke('google-oauth-start', { body: {} });

      if (error || data.error) throw new Error(error?.message || data.error);

      toast({ title: '✅ URL gerada', description: 'Redirecionando para o Google...' });
      
      setTimeout(() => { window.location.href = data.authUrl; }, 1000);
    } catch (error) {
      setCurrentStep('idle');
      toast({
        title: '❌ Erro ao conectar',
        description: error instanceof Error ? error.message : 'Verifique os secrets no Supabase.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // Renovação automática quando token expira
  const handleAutoRefresh = async () => {
    setAutoRefreshing(true);
    try {
      console.log('[AutoRefresh] Tentando renovar token automaticamente...');
      
      const { data, error } = await supabase.functions.invoke('google-oauth-refresh');
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: '🔄 Token renovado automaticamente',
          description: `Conexão restabelecida. Novo token válido até ${new Date(data.expiresAt).toLocaleString('pt-BR')}`,
        });
        await checkConnectionStatus();
      } else {
        throw new Error(data.error || 'Falha ao renovar token');
      }
    } catch (err: any) {
      console.error('[AutoRefresh] Erro:', err);
      toast({
        title: '⚠️ Falha na renovação automática',
        description: 'Por favor, clique em "Renovar Token" manualmente ou reconecte a integração.',
        variant: 'destructive',
      });
    } finally {
      setAutoRefreshing(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      toast({ title: '🔄 Renovando token', description: 'Solicitando novo access_token...' });

      const { data, error } = await supabase.functions.invoke('google-oauth-refresh', { body: {} });

      if (error || data.error) throw new Error(error?.message || data.error);

      toast({ title: '✅ Token renovado', description: `Válido até ${new Date(data.expires_at).toLocaleString('pt-BR')}` });
      await checkConnectionStatus();
    } catch (error) {
      toast({
        title: '❌ Erro ao renovar',
        description: error instanceof Error ? error.message : 'Falha ao renovar token',
        variant: 'destructive'
      });
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Deseja desconectar o Google Workspace?')) return;
    
    try {
      setLoading(true);
      toast({ title: '🔓 Revogando acesso', description: 'Removendo permissões...' });

      const { data, error } = await supabase.functions.invoke('google-oauth-revoke', { body: {} });

      if (error || data.error) throw new Error(error?.message || data.error);

      toast({ title: '✅ Desconectado', description: 'Integração removida com sucesso.' });
      setConnectionStatus('disconnected');
      setTokenData(null);
    } catch (error) {
      toast({
        title: '❌ Erro ao desconectar',
        description: error instanceof Error ? error.message : 'Falha ao revogar',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTokenLifePercentage = (): number => {
    if (!tokenData?.expires_at) return 0;
    const createdAt = new Date(tokenData.created_at);
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const totalLife = expiresAt.getTime() - createdAt.getTime();
    const elapsed = now.getTime() - createdAt.getTime();
    return Math.max(0, Math.round(100 - (elapsed / totalLife) * 100));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟡</span>
            <div>
              <CardTitle className="text-base">Google Workspace OAuth 2.0</CardTitle>
              <CardDescription>Integração com renovação automática de tokens</CardDescription>
            </div>
          </div>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus === 'connected' ? <><CheckCircle className="h-3 w-3 mr-1" />Conectado</> : 
             connectionStatus === 'disconnected' ? <><XCircle className="h-3 w-3 mr-1" />Desconectado</> :
             <><Clock className="h-3 w-3 mr-1 animate-spin" />Verificando...</>}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentStep !== 'idle' && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-medium text-sm">
                  {currentStep === 'authorizing' ? '🔐 Gerando URL...' : '✅ Sucesso!'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {connectionStatus === 'connected' && tokenData && (
          <>
            {tokenData.metadata.email && (
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {tokenData.metadata.picture ? (
                    <img src={tokenData.metadata.picture} alt="User" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tokenData.metadata.name || tokenData.metadata.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{tokenData.metadata.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />Token expira em:
                </span>
                <span className={timeUntilExpiry === 'Expirado' ? 'text-destructive font-medium' : ''}>
                  {timeUntilExpiry}
                </span>
              </div>
              <Progress value={getTokenLifePercentage()} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {new Date(tokenData.expires_at).toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRefreshToken} variant="outline" size="sm" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />Renovar
              </Button>
              <Button onClick={handleRevoke} variant="destructive" size="sm" className="flex-1" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Desconectando...</> : 
                <><XCircle className="mr-2 h-4 w-4" />Desconectar</>}
              </Button>
            </div>
          </>
        )}

        {connectionStatus === 'disconnected' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não conectado</AlertTitle>
              <AlertDescription>Configure os secrets GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no Supabase.</AlertDescription>
            </Alert>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">🔐 Fluxo OAuth 2.0:</h4>
              <ol className="space-y-1 text-xs list-decimal list-inside">
                <li>Gerar URL de autorização</li>
                <li>Autorizar no Google</li>
                <li>Trocar código por tokens</li>
                <li>Armazenar tokens no banco</li>
              </ol>
            </div>

            <Button onClick={handleConnect} disabled={loading} className="w-full" size="lg">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Conectando...</> : 
              <><ExternalLink className="mr-2 h-4 w-4" />Conectar</>}
            </Button>
          </div>
        )}

        {connectionStatus === 'checking' && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleWorkspaceOAuth;
