/**
 * Webhook Configuration Modal
 * 
 * Complete webhook management interface including:
 * - Unique webhook URL per integration
 * - Step-by-step configuration instructions
 * - Event toggles with compliance rule mapping
 * - Test webhook functionality
 * - Recent webhook history with retry
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWebhookMonitor } from '@/hooks/useWebhookMonitor';
import { supabase } from '@/integrations/supabase/client';
import { getProviderInstructions } from '@/lib/webhook-instructions';
import { getTestPayload } from '@/lib/webhook-test-payloads';
import { getProviderEvents, WebhookEvent } from '@/lib/webhook-events';
import {
  Copy,
  Check,
  ExternalLink,
  Play,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  BookOpen,
  Bell,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WebhookConfigurationModalProps {
  integrationName: string;
  integrationId?: string;
}

const WebhookConfigurationModal = ({
  integrationName,
  integrationId,
}: WebhookConfigurationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { webhooks, retryWebhook, filterByIntegration, loading: webhooksLoading } = useWebhookMonitor();
  
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [enabledEvents, setEnabledEvents] = useState<Set<string>>(new Set());

  // Generate unique webhook URL
  const webhookUrl = `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook-handler?provider=${integrationName.toLowerCase()}&user_id=${user?.id || 'unknown'}`;

  // Get provider-specific data
  const instructions = getProviderInstructions(integrationName);
  const testPayload = getTestPayload(integrationName);
  const events = getProviderEvents(integrationName);
  const recentWebhooks = filterByIntegration(integrationName.toLowerCase()).slice(0, 10);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({
        title: 'URL copiada!',
        description: 'URL do webhook copiada para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar a URL.',
        variant: 'destructive',
      });
    }
  }, [webhookUrl, toast]);

  const handleTestWebhook = useCallback(async () => {
    if (!testPayload) {
      toast({
        title: 'Teste não disponível',
        description: 'Payload de teste não configurado para esta integração.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('integration-webhook-handler', {
        body: {
          integration: integrationName.toLowerCase(),
          event_type: testPayload.event_type,
          payload: testPayload.payload,
          idempotency_key: `test-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;

      setTestResult('success');
      toast({
        title: 'Teste bem-sucedido!',
        description: `Evento ${testPayload.event_type} processado com sucesso.`,
      });
    } catch (error) {
      setTestResult('error');
      toast({
        title: 'Teste falhou',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  }, [integrationName, testPayload, toast]);

  const handleToggleEvent = useCallback((eventId: string) => {
    setEnabledEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const handleRetryWebhook = useCallback(async (webhookId: string) => {
    await retryWebhook(webhookId);
  }, [retryWebhook]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Processado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Webhook URL Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            URL do Webhook
          </CardTitle>
          <CardDescription>
            Configure esta URL no painel do {integrationName} para receber eventos em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={webhookUrl}
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              variant={copied ? 'default' : 'outline'}
              onClick={handleCopyUrl}
              className={copied ? 'bg-success hover:bg-success/90' : ''}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta URL é única para sua conta e integração. Não compartilhe com terceiros.
          </p>
        </CardContent>
      </Card>

      {/* Instructions Section */}
      {instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {instructions.title}
            </CardTitle>
            <CardDescription>
              Siga os passos abaixo para configurar o webhook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="steps">
              <AccordionItem value="steps" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2">
                  Ver instruções passo-a-passo
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-3 mt-2">
                    {instructions.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                  
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Content-Type: <code className="bg-muted px-1 rounded">{instructions.contentType}</code>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={instructions.docUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Documentação
                      </a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Events Section */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Eventos Suportados
            </CardTitle>
            <CardDescription>
              Selecione os eventos que deseja monitorar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {events.map((event: WebhookEvent) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.name}</span>
                        {event.triggersComplianceRule && (
                          <Badge
                            variant="outline"
                            className={
                              event.severity === 'critical'
                                ? 'border-destructive/50 text-destructive'
                                : event.severity === 'high'
                                ? 'border-warning/50 text-warning'
                                : 'border-muted-foreground/50'
                            }
                          >
                            <Zap className="h-2.5 w-2.5 mr-1" />
                            {event.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                    <Switch
                      checked={enabledEvents.has(event.id)}
                      onCheckedChange={() => handleToggleEvent(event.id)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4" />
            Testar Webhook
          </CardTitle>
          <CardDescription>
            Envie um payload de exemplo para validar a configuração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testPayload && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Evento de teste: {testPayload.event_type}</p>
              <p className="text-xs text-muted-foreground">{testPayload.description}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleTestWebhook}
              disabled={testing || !testPayload}
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
            
            {testResult === 'success' && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Teste bem-sucedido</span>
              </div>
            )}
            
            {testResult === 'error' && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Teste falhou</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Webhooks
            {recentWebhooks.length > 0 && (
              <Badge variant="secondary">{recentWebhooks.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Últimos 10 webhooks recebidos desta integração
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentWebhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum webhook recebido ainda</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentWebhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-mono text-xs">
                        {webhook.event_type}
                      </TableCell>
                      <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(webhook.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {webhook.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRetryWebhook(webhook.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookConfigurationModal;
