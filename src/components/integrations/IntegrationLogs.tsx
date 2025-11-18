import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  RefreshCw,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface IntegrationLog {
  id: string;
  integration_name: string;
  event_type: string;
  status: string;
  payload: any;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

interface IntegrationLogsProps {
  integrationName?: string;
}

export const IntegrationLogs = ({ integrationName }: IntegrationLogsProps) => {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('integration_webhooks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (integrationName) {
        query = query.eq('integration_name', integrationName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('integration_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_webhooks',
          filter: integrationName ? `integration_name=eq.${integrationName}` : undefined
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [integrationName]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline'> = {
      success: 'default',
      error: 'destructive',
      pending: 'outline'
    };
    return variants[status] || 'outline';
  };

  const filteredLogs = logs.filter(log => 
    log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.integration_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Histórico de Atividades</h3>
            <p className="text-sm text-muted-foreground">
              {filteredLogs.length} registro(s) encontrado(s)
            </p>
          </div>
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por evento, integração ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(log.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{log.event_type}</span>
                    <Badge variant={getStatusBadge(log.status)} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log.integration_name} • {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-red-500 mt-1 truncate">{log.error_message}</p>
                  )}
                </div>

                <Button variant="ghost" size="sm">
                  Detalhes
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Integração</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.integration_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo de Evento</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.event_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadge(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data/Hora</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <Label className="text-sm font-medium text-red-500">Mensagem de Erro</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedLog.error_message}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Payload</Label>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <label className={className}>{children}</label>
);
