/**
 * Componente de Status de Conexão Google Workspace
 * 
 * Exibe status em tempo real da integração:
 * - Conectado/Desconectado
 * - Token válido/expirado
 * - Tempo até expiração
 * - Renovação automática quando necessário
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Shield,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TokenInfo {
  id: string;
  integration_name: string;
  expires_at: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const GoogleConnectionStatus = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [tokenLifePercent, setTokenLifePercent] = useState<number>(100);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Verifica status da conexão
  const checkStatus = async () => {
    try {
      if (!user) {
        setStatus('disconnected');
        return;
      }

      const { data, error } = await supabase
        .from('integration_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'google_workspace')
        .single();

      if (error || !data) {
        setStatus('disconnected');
        setTokenInfo(null);
      } else {
        setStatus('connected');
        setTokenInfo(data);
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
      setStatus('disconnected');
    }
  };

  // Atualiza temporizador e porcentagem de vida do token
  useEffect(() => {
    if (!tokenInfo?.expires_at) return;

    const updateTimer = () => {
      const expiresAt = new Date(tokenInfo.expires_at);
      const createdAt = new Date(tokenInfo.created_at);
      const now = new Date();
      
      const totalLife = expiresAt.getTime() - createdAt.getTime();
      const remaining = expiresAt.getTime() - now.getTime();
      const percent = Math.max(0, Math.min(100, (remaining / totalLife) * 100));
      
      setTokenLifePercent(percent);

      if (remaining <= 0) {
        setTimeRemaining('Expirado');
        // Tenta renovar automaticamente
        if (!autoRefreshing && status === 'connected') {
          handleAutoRefresh();
        }
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [tokenInfo, status, autoRefreshing]);

  // Renovação automática de token
  const handleAutoRefresh = async () => {
    setAutoRefreshing(true);
    try {
      console.log('[AutoRefresh] Tentando renovar token automaticamente...');
      
      const { data, error } = await supabase.functions.invoke('google-oauth-refresh');
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: '🔄 Token renovado automaticamente',
          description: `Novo token válido até ${new Date(data.expiresAt).toLocaleString('pt-BR')}`,
        });
        await checkStatus();
      }
    } catch (err) {
      console.error('[AutoRefresh] Erro:', err);
      toast({
        title: '⚠️ Falha na renovação automática',
        description: 'Por favor, reconecte manualmente a integração.',
        variant: 'destructive',
      });
    } finally {
      setAutoRefreshing(false);
    }
  };

  // Verifica status ao montar e periodicamente
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Verifica a cada 1 minuto
    return () => clearInterval(interval);
  }, [user]);

  // Obter cor do badge baseado na porcentagem
  const getStatusColor = () => {
    if (status === 'disconnected') return 'destructive';
    if (status === 'checking') return 'secondary';
    if (tokenLifePercent < 10) return 'destructive';
    if (tokenLifePercent < 30) return 'default';
    return 'default';
  };

  // Obter ícone baseado no status
  const getStatusIcon = () => {
    if (status === 'checking') return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === 'disconnected') return <XCircle className="h-4 w-4" />;
    if (tokenLifePercent < 10) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  // Obter texto do status
  const getStatusText = () => {
    if (status === 'checking') return 'Verificando...';
    if (status === 'disconnected') return 'Desconectado';
    if (timeRemaining === 'Expirado') return 'Token Expirado';
    if (tokenLifePercent < 10) return 'Expirando em breve';
    return 'Conectado';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Status da Conexão
            </CardTitle>
            <CardDescription>Monitoramento em tempo real da integração</CardDescription>
          </div>
          <Badge variant={getStatusColor()} className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status === 'connected' && tokenInfo && (
          <>
            {/* Barra de vida do token */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Validade do Token
                </span>
                <span className="font-mono font-medium">{timeRemaining}</span>
              </div>
              <Progress 
                value={tokenLifePercent} 
                className={`h-2 ${
                  tokenLifePercent < 10 ? 'bg-destructive/20' : 
                  tokenLifePercent < 30 ? 'bg-yellow-500/20' : 
                  'bg-green-500/20'
                }`}
              />
              <p className="text-xs text-muted-foreground">
                Token expira em {new Date(tokenInfo.expires_at).toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Renovação automática */}
            {autoRefreshing && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertTitle>Renovação Automática</AlertTitle>
                <AlertDescription>
                  Renovando token automaticamente. Por favor, aguarde...
                </AlertDescription>
              </Alert>
            )}

            {/* Informações do usuário */}
            {tokenInfo.metadata?.email && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                <p className="text-sm font-medium">Conta Conectada</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  {tokenInfo.metadata.email}
                </p>
                {tokenInfo.metadata?.domain && (
                  <p className="text-xs text-muted-foreground">
                    Domínio: {tokenInfo.metadata.domain}
                  </p>
                )}
              </div>
            )}

            {/* Recursos disponíveis */}
            <div className="rounded-lg border bg-primary/5 p-3 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Recursos Disponíveis
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>✅ Listar usuários do domínio</li>
                <li>✅ Gerenciar grupos</li>
                <li>✅ Consultar logs de auditoria</li>
                <li>✅ Sincronização automática de evidências</li>
              </ul>
            </div>
          </>
        )}

        {status === 'disconnected' && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertTitle>Integração não conectada</AlertTitle>
            <AlertDescription>
              Conecte sua conta Google Workspace na aba "🔐 OAuth 2.0" para começar a usar os recursos de integração.
            </AlertDescription>
          </Alert>
        )}

        {status === 'checking' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Verificando conexão</AlertTitle>
            <AlertDescription>
              Aguarde enquanto verificamos o status da integração...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
