/**
 * Integration Validator Component
 * 
 * Valida automaticamente conexões OAuth testando endpoints públicos autorizados.
 * Exibe logs detalhados, status visual e instruções de correção.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  RefreshCw,
  Clock,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ValidationLog {
  timestamp: string;
  step: string;
  status: 'success' | 'error' | 'info';
  message: string;
  details?: any;
}

interface ValidationResult {
  success: boolean;
  statusCode: number;
  statusText: string;
  duration: number;
  data?: any;
  error?: string;
  errorType?: string;
  timestamp: string;
}

interface IntegrationValidatorProps {
  integrationName: string;
  testEndpoint?: string;
  autoTest?: boolean;
  onValidationComplete?: (result: ValidationResult) => void;
}

export function IntegrationValidator({
  integrationName,
  testEndpoint = 'https://www.googleapis.com/oauth2/v1/userinfo',
  autoTest = false,
  onValidationComplete
}: IntegrationValidatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    checkTokenStatus();
  }, [user]);

  useEffect(() => {
    if (autoTest && hasToken && !validationResult) {
      validateConnection();
    }
  }, [autoTest, hasToken]);

  const addLog = (step: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    const log: ValidationLog = {
      timestamp: new Date().toISOString(),
      step,
      status,
      message,
      details
    };
    setLogs(prev => [...prev, log]);
    console.log(`[IntegrationValidator] ${step}:`, message, details);
  };

  const checkTokenStatus = async () => {
    if (!user) {
      setHasToken(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('integration_oauth_tokens')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('integration_name', integrationName)
        .single();

      if (data) {
        const isExpired = new Date(data.expires_at).getTime() < Date.now();
        setHasToken(!isExpired);
        addLog('Token Check', isExpired ? 'error' : 'success', 
          isExpired ? 'Token expirado' : 'Token válido encontrado',
          { tokenId: data.id, expiresAt: data.expires_at }
        );
      } else {
        setHasToken(false);
        addLog('Token Check', 'error', 'Nenhum token encontrado', null);
      }
    } catch (error) {
      setHasToken(false);
      addLog('Token Check', 'error', 'Erro ao verificar token', error);
    }
  };

  const validateConnection = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive'
      });
      return;
    }

    setIsValidating(true);
    setLogs([]);
    setValidationResult(null);
    
    addLog('Iniciando', 'info', 'Iniciando validação da integração...', {
      integration: integrationName,
      endpoint: testEndpoint,
      userId: user.id
    });

    const startTime = Date.now();

    try {
      addLog('Requisição', 'info', 'Enviando requisição de teste...', { endpoint: testEndpoint });

      const { data, error } = await supabase.functions.invoke('proxy-api-request', {
        body: {
          integration_name: integrationName,
          endpoint: testEndpoint,
          method: 'GET',
          headers: {},
          query_params: {}
        }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw error;
      }

      if (!data.success) {
        const result: ValidationResult = {
          success: false,
          statusCode: data.status_code || 0,
          statusText: data.status_text || 'Unknown Error',
          duration,
          error: data.error || 'Falha na requisição',
          errorType: getErrorType(data.status_code),
          timestamp: new Date().toISOString()
        };

        addLog('Erro', 'error', `Erro ${data.status_code}: ${data.error}`, data);
        setValidationResult(result);
        
        toast({
          title: '❌ Validação falhou',
          description: getErrorMessage(data.status_code),
          variant: 'destructive'
        });

        if (onValidationComplete) {
          onValidationComplete(result);
        }
      } else {
        const result: ValidationResult = {
          success: true,
          statusCode: data.status_code,
          statusText: data.status_text,
          duration,
          data: data.data,
          timestamp: new Date().toISOString()
        };

        addLog('Sucesso', 'success', 'Conexão validada com sucesso!', {
          statusCode: data.status_code,
          duration: `${duration}ms`,
          responseData: data.data
        });

        setValidationResult(result);
        
        toast({
          title: '✅ Validação bem-sucedida',
          description: 'Integração está funcionando corretamente!',
        });

        if (onValidationComplete) {
          onValidationComplete(result);
        }
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: ValidationResult = {
        success: false,
        statusCode: 0,
        statusText: 'Network Error',
        duration,
        error: error.message || 'Erro desconhecido',
        errorType: 'network',
        timestamp: new Date().toISOString()
      };

      addLog('Erro Crítico', 'error', 'Erro ao executar validação', error);
      setValidationResult(result);
      
      toast({
        title: '❌ Erro na validação',
        description: 'Não foi possível conectar ao serviço. Verifique sua conexão.',
        variant: 'destructive'
      });

      if (onValidationComplete) {
        onValidationComplete(result);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const getErrorType = (statusCode: number): string => {
    if (statusCode === 401) return 'auth_invalid';
    if (statusCode === 403) return 'auth_denied';
    if (statusCode === 404) return 'not_found';
    if (statusCode >= 500) return 'server_error';
    return 'unknown';
  };

  const getErrorMessage = (statusCode: number): string => {
    switch (statusCode) {
      case 401:
        return 'Token inválido ou expirado. Reconecte sua conta.';
      case 403:
        return 'Acesso negado. Verifique as permissões e escopos OAuth.';
      case 404:
        return 'Endpoint não encontrado. Verifique a URL da API.';
      case 429:
        return 'Limite de requisições excedido. Aguarde alguns minutos.';
      case 500:
      case 502:
      case 503:
        return 'Erro no servidor da API. Tente novamente mais tarde.';
      default:
        return 'Erro desconhecido. Verifique os logs para mais detalhes.';
    }
  };

  const getTroubleshootingSteps = (errorType?: string) => {
    const steps: Record<string, string[]> = {
      auth_invalid: [
        'Reconecte sua conta usando o botão "Conectar Google Workspace"',
        'Verifique se o token não expirou',
        'Certifique-se de que as credenciais OAuth estão corretas'
      ],
      auth_denied: [
        'Verifique se os escopos OAuth estão corretos no Google Cloud Console',
        'Confirme se a conta tem as permissões necessárias',
        'Revise a configuração da tela de consentimento OAuth',
        'Certifique-se de que o Redirect URI está configurado corretamente',
        'Verifique se as APIs necessárias estão ativadas no Google Cloud'
      ],
      not_found: [
        'Verifique se o endpoint da API está correto',
        'Confirme se a API está disponível para sua conta',
        'Revise a documentação da API para endpoints válidos'
      ],
      server_error: [
        'Aguarde alguns minutos e tente novamente',
        'Verifique o status da API no painel do provedor',
        'Entre em contato com o suporte se o problema persistir'
      ],
      network: [
        'Verifique sua conexão com a internet',
        'Teste se o endpoint está acessível diretamente',
        'Verifique configurações de firewall ou proxy'
      ]
    };

    return steps[errorType || 'unknown'] || [
      'Revise todas as configurações OAuth',
      'Verifique os logs detalhados abaixo',
      'Tente reconectar sua conta'
    ];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Validação de Integração
            </CardTitle>
            <CardDescription>
              Teste automático da conexão OAuth com endpoint autorizado
            </CardDescription>
          </div>
          {validationResult && (
            <Badge variant={validationResult.success ? 'default' : 'destructive'}>
              {validationResult.success ? (
                <><CheckCircle2 className="h-4 w-4 mr-1" /> Ativa</>
              ) : (
                <><XCircle className="h-4 w-4 mr-1" /> Erro</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Test Button */}
        <div className="flex gap-2">
          <Button
            onClick={validateConnection}
            disabled={isValidating || !hasToken}
            className="flex-1"
          >
            {isValidating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Testar Conexão</>
            )}
          </Button>
        </div>

        {!hasToken && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Token não encontrado</AlertTitle>
            <AlertDescription>
              Conecte sua conta primeiro para poder validar a integração.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div className="space-y-4">
            <Separator />
            
            {validationResult.success ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>✅ Integração Funcionando</AlertTitle>
                <AlertDescription>
                  A conexão foi validada com sucesso em {validationResult.duration}ms
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>❌ Erro na Validação</AlertTitle>
                <AlertDescription>
                  {validationResult.error || getErrorMessage(validationResult.statusCode)}
                </AlertDescription>
              </Alert>
            )}

            {/* Response Details */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Detalhes da Resposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status HTTP:</span>
                    <span className="ml-2 font-mono font-semibold">
                      {validationResult.statusCode} {validationResult.statusText}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tempo de Resposta:</span>
                    <span className="ml-2 font-mono font-semibold">
                      {validationResult.duration}ms
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="ml-2 font-mono text-xs">
                      {new Date(validationResult.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Success Response Data */}
                {validationResult.success && validationResult.data && (
                  <div className="space-y-2 pt-2">
                    <Separator />
                    <p className="text-sm font-semibold">Dados Retornados:</p>
                    {validationResult.data.name && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Nome:</span>
                        <span className="ml-2">{validationResult.data.name}</span>
                      </div>
                    )}
                    {validationResult.data.email && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{validationResult.data.email}</span>
                      </div>
                    )}
                    {validationResult.data.id && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="ml-2 font-mono text-xs">{validationResult.data.id}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Troubleshooting for errors */}
            {!validationResult.success && validationResult.errorType && (
              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Como Resolver
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {getTroubleshootingSteps(validationResult.errorType).map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600 font-semibold">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Logs Collapsible */}
        {logs.length > 0 && (
          <Collapsible open={showLogs} onOpenChange={setShowLogs}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Logs Detalhados ({logs.length})
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`text-xs p-2 rounded border ${
                          log.status === 'success'
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                            : log.status === 'error'
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{log.step}</span>
                          <span className="text-muted-foreground font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-foreground">{log.message}</p>
                        {log.details && (
                          <pre className="mt-1 text-[10px] overflow-x-auto bg-background/50 p-1 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Info Box */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Como funciona o teste</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>1. Verifica se existe um token OAuth válido para sua conta</p>
            <p>2. Faz uma requisição GET para: {testEndpoint}</p>
            <p>3. Valida a resposta e exibe os dados retornados</p>
            <p>4. Registra logs detalhados para diagnóstico</p>
            <p>5. Fornece instruções específicas em caso de erro</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
