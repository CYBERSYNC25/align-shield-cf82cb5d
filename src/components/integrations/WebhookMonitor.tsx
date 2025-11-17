/**
 * Webhook Monitor Component
 * 
 * Real-time dashboard for monitoring webhook events and integration health
 * Displays webhook logs, integration status, and provides management actions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebhookMonitor } from '@/hooks/useWebhookMonitor';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const WebhookMonitor = () => {
  const {
    webhooks,
    integrationStatus,
    loading,
    retryWebhook,
    getFailedWebhooks,
    getPendingWebhooks,
    refresh,
  } = useWebhookMonitor();

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'unhealthy':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredWebhooks = selectedIntegration
    ? webhooks.filter(w => w.integration_name === selectedIntegration)
    : webhooks;

  const failedCount = getFailedWebhooks().length;
  const pendingCount = getPendingWebhooks().length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Monitor de Webhooks
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real de eventos e status das integrações
              </CardDescription>
            </div>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {failedCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Webhooks com Falha</AlertTitle>
          <AlertDescription>
            {failedCount} webhook(s) falharam no processamento. Verifique os logs abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Integration Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {integrationStatus.map((status) => (
          <Card
            key={status.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedIntegration === status.integration_name ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() =>
              setSelectedIntegration(
                selectedIntegration === status.integration_name
                  ? null
                  : status.integration_name
              )
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {status.integration_name.replace(/_/g, ' ').toUpperCase()}
                </CardTitle>
                <Badge className={getStatusColor(status.status)} variant="outline">
                  {status.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Score de Saúde</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{status.health_score}%</span>
                    {status.health_score >= 90 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Webhooks</span>
                  <span className="font-medium">{status.total_webhooks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Falhas</span>
                  <span className="font-medium text-red-500">{status.failed_webhooks}</span>
                </div>
                {status.last_webhook_at && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Último webhook: {new Date(status.last_webhook_at).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Webhook Logs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({webhooks.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Falhas ({failedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Logs de Webhooks
                {selectedIntegration && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Filtrando: {selectedIntegration})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Histórico completo de eventos recebidos das integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredWebhooks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum webhook recebido ainda
                    </p>
                  ) : (
                    filteredWebhooks.map((webhook) => (
                      <Card key={webhook.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(webhook.status)}
                              <Badge variant="outline">
                                {webhook.integration_name}
                              </Badge>
                              <span className="text-sm font-medium">
                                {webhook.event_type}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>ID: {webhook.id}</div>
                              <div>
                                Recebido: {new Date(webhook.created_at).toLocaleString()}
                              </div>
                              {webhook.processed_at && (
                                <div>
                                  Processado: {new Date(webhook.processed_at).toLocaleString()}
                                </div>
                              )}
                              {webhook.error_message && (
                                <div className="text-red-500 mt-1">
                                  Erro: {webhook.error_message}
                                </div>
                              )}
                            </div>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Ver payload
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(webhook.payload, null, 2)}
                              </pre>
                            </details>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge
                              variant={
                                webhook.status === 'processed'
                                  ? 'default'
                                  : webhook.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {webhook.status}
                            </Badge>
                            {webhook.status === 'failed' && webhook.retry_count < 3 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryWebhook(webhook.id)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retentar
                              </Button>
                            )}
                            {webhook.retry_count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Tentativa {webhook.retry_count}/3
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks Pendentes</CardTitle>
              <CardDescription>
                Webhooks aguardando processamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {getPendingWebhooks().map((webhook) => (
                    <Card key={webhook.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <Badge variant="outline">{webhook.integration_name}</Badge>
                            <span className="text-sm">{webhook.event_type}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Recebido: {new Date(webhook.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="secondary">Pendente</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks com Falha</CardTitle>
              <CardDescription>
                Webhooks que falharam no processamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {getFailedWebhooks().map((webhook) => (
                    <Card key={webhook.id} className="p-4 border-red-500/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <Badge variant="outline">{webhook.integration_name}</Badge>
                            <span className="text-sm">{webhook.event_type}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryWebhook(webhook.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retentar
                          </Button>
                        </div>
                        <div className="text-xs text-red-500">
                          Erro: {webhook.error_message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tentativas: {webhook.retry_count}/3
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhookMonitor;
