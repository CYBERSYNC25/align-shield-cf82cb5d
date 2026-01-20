/**
 * Integration Details Modal
 * 
 * Displays comprehensive details about a specific integration including:
 * - Connection status and health metrics
 * - OAuth tokens and credentials (masked)
 * - Webhook configuration and history
 * - Configuration options
 * - Connect/Disconnect actions
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import WebhookConfigurationModal from './WebhookConfigurationModal';
import {
  Link,
  Unlink,
  Key,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Loader2,
  Webhook,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  health: 'healthy' | 'degraded' | 'unhealthy';
  logo: string;
  description: string;
  connectedAt?: string;
  lastSync?: string;
  webhookCount?: number;
  failedWebhooks?: number;
}

interface IntegrationDetailsModalProps {
  integration: Integration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const IntegrationDetailsModal = ({
  integration,
  open,
  onOpenChange,
  onConnect,
  onDisconnect,
}: IntegrationDetailsModalProps) => {
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!integration) return null;

  const handleConnect = async () => {
    setLoading(true);
    try {
      if (onConnect) {
        await onConnect();
      }
      toast({
        title: 'Integração conectada',
        description: `${integration.name} foi conectado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao conectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      if (onDisconnect) {
        await onDisconnect();
      }
      toast({
        title: 'Integração desconectada',
        description: `${integration.name} foi desconectado.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao desconectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'disconnected':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img src={integration.logo} alt={integration.name} className="h-10 w-10" />
            <div>
              <DialogTitle>{integration.name}</DialogTitle>
              <DialogDescription>{integration.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Status da Integração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(integration.status)} variant="outline">
                    {integration.status === 'connected' ? 'Conectado' : 
                     integration.status === 'disconnected' ? 'Desconectado' : 'Erro'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Saúde</p>
                  <div className="flex items-center gap-2">
                    {getHealthIcon(integration.health)}
                    <span className="text-sm font-medium capitalize">{integration.health}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Webhooks</p>
                  <p className="text-sm font-medium">
                    {integration.webhookCount || 0} total
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-sm font-medium text-red-500">
                    {integration.failedWebhooks || 0}
                  </p>
                </div>
              </div>

              {integration.connectedAt && (
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  Conectado em: {new Date(integration.connectedAt).toLocaleString()}
                </div>
              )}

              {integration.lastSync && (
                <div className="text-sm text-muted-foreground">
                  Última sincronização: {new Date(integration.lastSync).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">Credenciais</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="config">Configuração</TabsTrigger>
            </TabsList>

            {/* Credentials Tab */}
            <TabsContent value="credentials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Tokens OAuth
                  </CardTitle>
                  <CardDescription>
                    Tokens de acesso e refresh armazenados de forma segura
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {integration.status === 'connected' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Access Token</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            {showToken ? 'ya29.a0AfH6SMB...' : '••••••••••••••••'}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowToken(!showToken)}
                          >
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard('token-masked')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Refresh Token</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            ••••••••••••••••
                          </div>
                          <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Importante</AlertTitle>
                        <AlertDescription>
                          Nunca compartilhe seus tokens com terceiros. Eles fornecem acesso total aos seus dados.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Integração não conectada</AlertTitle>
                      <AlertDescription>
                        Conecte a integração para visualizar as credenciais.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-4">
              <WebhookConfigurationModal
                integrationName={integration.name}
                integrationId={integration.id}
              />
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </CardTitle>
                  <CardDescription>
                    Opções de configuração da integração
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL do Webhook</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                        https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard('https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Configure este URL no painel da integração para receber eventos em tempo real
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Escopo de Permissões</label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">read:users</Badge>
                      <Badge variant="outline">read:groups</Badge>
                      <Badge variant="outline">read:audit_logs</Badge>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Documentação</AlertTitle>
                    <AlertDescription>
                      <Button variant="link" className="h-auto p-0" asChild>
                        <a href="/docs/OAUTH_FLOW_DOCUMENTATION.md" target="_blank">
                          Ver documentação completa do OAuth 2.0
                        </a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <div className="flex gap-2">
              {integration.status === 'connected' ? (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-2" />
                  )}
                  Desconectar
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Conectar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntegrationDetailsModal;
