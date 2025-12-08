/**
 * Componente de Validação OAuth do Google
 * 
 * Interface visual para executar e visualizar resultados
 * da validação completa da configuração OAuth.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Search,
  Copy,
  Check
} from 'lucide-react';
import { useGoogleOAuthValidation, CheckStatus } from '@/hooks/useGoogleOAuthValidation';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleOAuthDiagnostic } from '@/hooks/integrations/useGoogleSync';

interface DiagnosticResult {
  success: boolean;
  diagnostic: boolean;
  timestamp: string;
  configuration: {
    clientIdConfigured: boolean;
    clientIdPreview: string;
    clientIdLength: number;
    clientIdEndsCorrectly: boolean;
    clientSecretConfigured: boolean;
    clientSecretLength: number;
    supabaseUrlConfigured: boolean;
    redirectUri: string;
    scopes: string[];
  };
  testAuthUrl: string;
  instructions: string;
}

export const GoogleOAuthValidator = () => {
  const { validateConfiguration, validation, loading, getStatusColor, getStatusIcon, getOverallStatusColor } = useGoogleOAuthValidation();
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  const diagnosticMutation = useGoogleOAuthDiagnostic();

  const runDiagnostic = () => {
    diagnosticMutation.mutate(undefined, {
      onSuccess: (data) => {
        setDiagnostic(data as DiagnosticResult);
      }
    });
  };

  const copyTestUrl = async () => {
    if (diagnostic?.testAuthUrl) {
      await navigator.clipboard.writeText(diagnostic.testAuthUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const openTestUrl = () => {
    if (diagnostic?.testAuthUrl && diagnostic.testAuthUrl !== 'NOT_AVAILABLE') {
      window.open(diagnostic.testAuthUrl, '_blank');
    }
  };

  const toggleCheck = (checkName: string) => {
    const newExpanded = new Set(expandedChecks);
    if (newExpanded.has(checkName)) {
      newExpanded.delete(checkName);
    } else {
      newExpanded.add(checkName);
    }
    setExpandedChecks(newExpanded);
  };

  const getStatusBadgeVariant = (status: CheckStatus) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'manual': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: CheckStatus) => {
    switch (status) {
      case 'success': return 'OK';
      case 'error': return 'Erro';
      case 'warning': return 'Atenção';
      case 'manual': return 'Manual';
      default: return 'Desconhecido';
    }
  };

  // Verifica se secrets e redirect URI estão OK
  const isReadyToConnect = () => {
    if (!validation) return false;
    
    const secretsCheck = validation.results.find(r => 
      r.check.includes('Secrets') || r.check.includes('GOOGLE_CLIENT')
    );
    const redirectCheck = validation.results.find(r => 
      r.check.includes('Redirect URI')
    );
    
    return secretsCheck?.status === 'success' && redirectCheck?.status === 'success';
  };

  const handleConnectGoogle = async () => {
    setConnectingOAuth(true);

    try {
      // Usar edge function customizada em vez de Supabase Auth nativo
      const { data, error } = await supabase.functions.invoke('google-oauth-start', {
        body: {}
      });

      if (error) {
        throw error;
      }

      if (!data?.authUrl) {
        throw new Error('URL de autorização não retornada pelo servidor');
      }

      // Abrir em nova aba para evitar bloqueio em iframes (preview do Lovable)
      window.open(data.authUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectingOAuth(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Validação OAuth Google
            </CardTitle>
            <CardDescription>
              Verificação completa da configuração de integração
            </CardDescription>
          </div>
          <Button
            onClick={() => validateConfiguration()}
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Validar Configuração
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Botão de Diagnóstico */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Diagnóstico de Client ID
              </h4>
              <p className="text-sm text-muted-foreground">
                Verifica se o Client ID configurado corresponde ao do Google Cloud Console
              </p>
            </div>
            <Button
              onClick={runDiagnostic}
              disabled={diagnosticMutation.isPending}
              variant="outline"
              size="sm"
            >
              {diagnosticMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Executar Diagnóstico
                </>
              )}
            </Button>
          </div>

          {/* Resultado do Diagnóstico */}
          {diagnostic && (
            <div className="space-y-3 mt-4 p-3 bg-background rounded border">
              <div className="text-sm font-medium">Resultado do Diagnóstico:</div>
              
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Client ID Preview:</span>
                  <code className="bg-background px-2 py-1 rounded text-xs">
                    {diagnostic.configuration.clientIdPreview}
                  </code>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Tamanho do Client ID:</span>
                  <span>{diagnostic.configuration.clientIdLength} caracteres</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Formato correto:</span>
                  {diagnostic.configuration.clientIdEndsCorrectly ? (
                    <Badge variant="default" className="bg-green-600">✓ Válido</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Inválido</Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Client Secret:</span>
                  {diagnostic.configuration.clientSecretConfigured ? (
                    <Badge variant="default" className="bg-green-600">✓ Configurado ({diagnostic.configuration.clientSecretLength} chars)</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Não configurado</Badge>
                  )}
                </div>
                
                <div className="p-2 bg-muted rounded">
                  <span className="font-medium">Redirect URI:</span>
                  <code className="block mt-1 text-xs bg-background p-2 rounded break-all">
                    {diagnostic.configuration.redirectUri}
                  </code>
                </div>
              </div>

              {/* Botões para testar URL manualmente */}
              {diagnostic.testAuthUrl !== 'NOT_AVAILABLE' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyTestUrl}
                    className="flex-1"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar URL de Teste
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={openTestUrl}
                    className="flex-1"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Testar no Navegador
                  </Button>
                </div>
              )}

              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Compare</strong> o "Client ID Preview" acima com o Client ID no 
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mx-1"
                  >
                    Google Cloud Console
                  </a>
                  - eles devem começar igual!
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {!validation && !loading && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Pronto para validar</AlertTitle>
            <AlertDescription>
              Clique em "Validar Configuração" para verificar se a integração com o Google está configurada corretamente.
            </AlertDescription>
          </Alert>
        )}

        {validation && (
          <div className="space-y-6">
            {/* Status Geral */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Status Geral</h3>
                <Badge className={getOverallStatusColor(validation.overallStatus)}>
                  {validation.overallStatus === 'ready' && '✓ Pronto'}
                  {validation.overallStatus === 'needs_attention' && '⚠ Atenção'}
                  {validation.overallStatus === 'critical_issues' && '✗ Problemas'}
                  {validation.overallStatus === 'needs_configuration' && 'ℹ Configuração'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {validation.overallMessage}
              </p>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {validation.summary.success}
                </div>
                <div className="text-xs text-muted-foreground">Sucesso</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {validation.summary.warnings}
                </div>
                <div className="text-xs text-muted-foreground">Avisos</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {validation.summary.errors}
                </div>
                <div className="text-xs text-muted-foreground">Erros</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {validation.summary.manual}
                </div>
                <div className="text-xs text-muted-foreground">Manual</div>
              </div>
            </div>

            {/* Botão de Conexão */}
            {isReadyToConnect() && (
              <div className="flex justify-center">
                <Button 
                  onClick={handleConnectGoogle}
                  disabled={connectingOAuth}
                  size="lg"
                  className="w-full max-w-md"
                >
                  {connectingOAuth ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Conectar Conta Google
                    </>
                  )}
                </Button>
              </div>
            )}

            <Separator />

            {/* Próximos Passos */}
            {validation.nextSteps.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Próximos Passos</h3>
                <ul className="space-y-1">
                  {validation.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Resultados Detalhados */}
            <div className="space-y-2">
              <h3 className="font-semibold">Verificações Detalhadas</h3>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-3">
                  {validation.results.map((result, index) => {
                    const isExpanded = expandedChecks.has(result.check);
                    
                    return (
                      <div 
                        key={index}
                        className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => toggleCheck(result.check)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="mt-0.5">{getStatusIcon(result.status)}</span>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{result.check}</p>
                              {!isExpanded && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {result.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(result.status)}>
                            {getStatusLabel(result.status)}
                          </Badge>
                        </div>
                        
                        {isExpanded && (
                          <div className="pl-6 space-y-2">
                            <p className="text-sm text-muted-foreground">{result.message}</p>
                            {result.details && (
                              <div className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
                                {typeof result.details === 'string' 
                                  ? result.details 
                                  : JSON.stringify(result.details, null, 2)
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
