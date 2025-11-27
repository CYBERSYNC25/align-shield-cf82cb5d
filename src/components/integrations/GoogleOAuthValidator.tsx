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
  ChevronRight
} from 'lucide-react';
import { useGoogleOAuthValidation, ValidationResult, CheckStatus } from '@/hooks/useGoogleOAuthValidation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const GoogleOAuthValidator = () => {
  const { validateConfiguration, validation, loading, getStatusColor, getStatusIcon, getOverallStatusColor } = useGoogleOAuthValidation();
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const { toast } = useToast();

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
          redirectTo: `${window.location.origin}/integrations`
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: 'Erro na Conexão',
        description: error instanceof Error ? error.message : 'Não foi possível iniciar a conexão com o Google',
        variant: 'destructive'
      });
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
                            <span className={`text-lg ${getStatusColor(result.status)}`}>
                              {getStatusIcon(result.status)}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium">{result.check}</div>
                              <div className="text-sm text-muted-foreground">{result.message}</div>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(result.status)} className="ml-2">
                            {getStatusLabel(result.status)}
                          </Badge>
                        </div>

                        {isExpanded && (result.details || result.recommendation || result.link) && (
                          <div className="pl-7 space-y-2 mt-2">
                            {result.details && (
                              <div className="text-xs bg-muted p-2 rounded">
                                <strong>Detalhes:</strong> {result.details}
                              </div>
                            )}
                            {result.recommendation && (
                              <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                                <strong>Recomendação:</strong> {result.recommendation}
                              </div>
                            )}
                            {result.link && (
                              <a
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Abrir no Google Cloud Console
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Configuração Atual */}
            <details className="space-y-2">
              <summary className="font-semibold cursor-pointer hover:text-primary">
                Ver Configuração Técnica
              </summary>
              <div className="text-xs space-y-1 p-3 bg-muted rounded mt-2">
                <div><strong>Project ID:</strong> {validation.configuration.projectId}</div>
                <div><strong>Redirect URI:</strong> {validation.configuration.redirectUri}</div>
                <div><strong>Escopos:</strong> {validation.configuration.configuredScopes.length}</div>
                <div className="pl-4 space-y-0.5 text-muted-foreground">
                  {validation.configuration.configuredScopes.map((scope, i) => (
                    <div key={i}>• {scope}</div>
                  ))}
                </div>
              </div>
            </details>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground text-center">
              Última validação: {new Date(validation.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
