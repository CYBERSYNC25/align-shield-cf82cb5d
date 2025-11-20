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
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Shield,
  Zap,
  Link2
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
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Verifica o status atual da conexão com Google Workspace
   * 
   * Consulta a tabela integration_oauth_tokens para verificar se existe
   * um token válido para o usuário atual.
   * 
   * @example
   * // Retorna status 'connected' se encontrar token válido:
   * {
   *   id: "uuid",
   *   user_id: "uuid",
   *   integration_name: "google_workspace",
   *   access_token: "ya29.xxx...",
   *   refresh_token: "1//xxx...",
   *   expires_at: "2025-11-18T20:30:00Z",
   *   metadata: { email: "user@domain.com", domain: "domain.com" }
   * }
   * 
   * @throws {Error} Se houver erro na consulta ao banco
   */
  const checkStatus = async () => {
    const startTime = Date.now();
    console.log('[GoogleConnectionStatus] Verificando status da conexão...');
    
    try {
      if (!user) {
        console.log('[GoogleConnectionStatus] Usuário não autenticado');
        setStatus('disconnected');
        return;
      }

      console.log(`[GoogleConnectionStatus] Buscando token para user_id: ${user.id}`);

      const { data, error } = await supabase
        .from('integration_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'google_workspace')
        .single();

      const elapsed = Date.now() - startTime;

      if (error || !data) {
        console.log(`[GoogleConnectionStatus] Token não encontrado (${elapsed}ms)`, error);
        setStatus('disconnected');
        setTokenInfo(null);
      } else {
        const expiresAt = new Date(data.expires_at);
        const isExpired = expiresAt.getTime() < Date.now();
        
        console.log(`[GoogleConnectionStatus] Token encontrado (${elapsed}ms):`, {
          id: data.id,
          expires_at: data.expires_at,
          is_expired: isExpired,
          email: (data.metadata as any)?.email,
          domain: (data.metadata as any)?.domain
        });
        
        setStatus('connected');
        setTokenInfo(data);
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      console.error(`[GoogleConnectionStatus] Erro ao verificar status (${elapsed}ms):`, err);
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

  /**
   * Renovação automática de token quando expira
   * 
   * Chamado automaticamente quando o token expira ou está prestes a expirar.
   * Usa o refresh_token para obter um novo access_token sem intervenção do usuário.
   * 
   * @example Fluxo de renovação:
   * 1. Detecta token expirado (expires_at < now())
   * 2. Chama edge function google-oauth-refresh
   * 3. Edge function usa refresh_token para obter novo access_token
   * 4. Atualiza banco de dados com novos tokens
   * 5. Retorna:
   * {
   *   success: true,
   *   accessToken: "ya29.new_token...",
   *   expiresAt: "2025-11-18T21:30:00Z"
   * }
   * 
   * @throws {Error} Se refresh_token for inválido ou expirado
   */
  const handleAutoRefresh = async () => {
    setAutoRefreshing(true);
    const startTime = Date.now();
    
    try {
      console.log('[AutoRefresh] Iniciando renovação automática de token');
      console.log('[AutoRefresh] Token atual expira em:', tokenInfo?.expires_at);
      
      const { data, error } = await supabase.functions.invoke('google-oauth-refresh');
      const elapsed = Date.now() - startTime;
      
      if (error) {
        console.error(`[AutoRefresh] Erro na chamada (${elapsed}ms):`, error);
        throw error;
      }
      
      if (data.success) {
        console.log(`[AutoRefresh] Token renovado com sucesso (${elapsed}ms):`, {
          new_expires_at: data.expiresAt,
          token_preview: `${data.accessToken?.substring(0, 20)}...`
        });
        
        toast({
          title: '🔄 Token renovado automaticamente',
          description: `Novo token válido até ${new Date(data.expiresAt).toLocaleString('pt-BR')}`,
        });
        await checkStatus();
      } else {
        console.error(`[AutoRefresh] Renovação falhou (${elapsed}ms):`, data.error);
        throw new Error(data.error || 'Falha desconhecida na renovação');
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      console.error(`[AutoRefresh] Exceção capturada (${elapsed}ms):`, err);
      toast({
        title: '⚠️ Falha na renovação automática',
        description: 'Por favor, reconecte manualmente a integração.',
        variant: 'destructive',
      });
    } finally {
      setAutoRefreshing(false);
    }
  };

  /**
   * Conecta o Google Workspace usando OAuth
   * 
   * Inicia o fluxo OAuth com configurações específicas para obter:
   * - access_token: Token de acesso para fazer requisições à API
   * - refresh_token: Token para renovar automaticamente (requer access_type: offline)
   * - Permissões para ler perfil e metadados do Drive
   */
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid profile email https://www.googleapis.com/auth/drive.metadata.readonly',
          redirectTo: window.location.href,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao conectar",
          description: error.message || "Não foi possível iniciar o fluxo de autenticação com o Google.",
        });
        setConnecting(false);
      } else {
        toast({
          title: "Redirecionando para o Google...",
          description: "Você será redirecionado em instantes.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar conectar com o Google. Tente novamente.",
      });
      setConnecting(false);
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
          <div className="space-y-4">
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertTitle>Integração não conectada</AlertTitle>
              <AlertDescription>
                Conecte sua conta Google Workspace para começar a usar os recursos de integração.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleConnect} 
                disabled={connecting}
                className="gap-2"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Conectar Google Workspace
                  </>
                )}
              </Button>
            </div>
          </div>
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
