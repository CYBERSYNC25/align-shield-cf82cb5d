/**
 * API Request History
 * 
 * Componente que exibe o histórico de requisições feitas através do
 * Dynamic API Connector, permitindo visualizar detalhes de cada chamada.
 * 
 * FUNCIONALIDADES:
 * - Lista todas as requisições do usuário autenticado
 * - Exibe status, endpoint, método, timestamp e duração
 * - Permite expandir para ver request e response completos
 * - Filtra por integração e status
 * - Ordenação por data (mais recentes primeiro)
 * - Indicadores visuais de sucesso/erro
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WebhookRecord {
  id: string;
  integration_name: string;
  event_type: string;
  status: string;
  error_message: string | null;
  payload: any;
  created_at: string;
  processed_at: string | null;
}

export function ApiRequestHistory() {
  const { toast } = useToast();
  const [history, setHistory] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterIntegration, setFilterIntegration] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('integration_webhooks')
        .select('*')
        .eq('event_type', 'api_request')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter to only show current user's requests
      const userRequests = (data || []).filter(
        (record: WebhookRecord) => record.payload?.user_id === user.id
      );

      setHistory(userRequests);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'default' : 'destructive';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-500/10 text-blue-500',
      POST: 'bg-green-500/10 text-green-500',
      PUT: 'bg-yellow-500/10 text-yellow-500',
      PATCH: 'bg-orange-500/10 text-orange-500',
      DELETE: 'bg-red-500/10 text-red-500',
    };
    return colors[method] || 'bg-muted text-muted-foreground';
  };

  const filteredHistory = history.filter(record => {
    if (filterIntegration !== "all" && record.integration_name !== filterIntegration) {
      return false;
    }
    if (filterStatus !== "all" && record.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const integrationNames = Array.from(new Set(history.map(r => r.integration_name)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <Select value={filterIntegration} onValueChange={setFilterIntegration}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas integrações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas integrações</SelectItem>
              {integrationNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Todos status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="failed">Falha</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={loadHistory} className="ml-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </Card>

      {/* History List */}
      {loading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Nenhuma requisição encontrada</p>
            <p className="text-sm mt-1">
              Faça sua primeira requisição usando o conector acima
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredHistory.map((record) => {
            const isExpanded = expandedId === record.id;
            const payload = record.payload || {};
            const method = payload.method || 'GET';
            const endpoint = payload.endpoint || 'Unknown endpoint';
            const statusCode = payload.status_code || 0;
            const duration = payload.duration_ms || 0;
            const timestamp = formatDistanceToNow(new Date(record.created_at), {
              addSuffix: true,
              locale: ptBR
            });

            return (
              <Collapsible
                key={record.id}
                open={isExpanded}
                onOpenChange={() => setExpandedId(isExpanded ? null : record.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      {record.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      )}

                      {/* Method Badge */}
                      <Badge className={`${getMethodColor(method)} font-mono flex-shrink-0`}>
                        {method}
                      </Badge>

                      {/* Endpoint */}
                      <div className="flex-1 text-left">
                        <p className="font-mono text-sm truncate">{endpoint}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{record.integration_name}</span>
                          <span>•</span>
                          <span>{timestamp}</span>
                          {duration > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {duration}ms
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Code */}
                      {statusCode > 0 && (
                        <Badge variant={record.status === 'success' ? 'default' : 'destructive'}>
                          {statusCode}
                        </Badge>
                      )}

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t p-4 bg-muted/30 space-y-4">
                      {/* Request Details */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Request</h4>
                        <div className="rounded-lg border bg-card p-3 space-y-2 text-sm">
                          {payload.request?.headers && Object.keys(payload.request.headers).length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Headers:</span>
                              <pre className="font-mono text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(payload.request.headers, null, 2)}
                              </pre>
                            </div>
                          )}
                          {payload.request?.query_params && Object.keys(payload.request.query_params).length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Query Params:</span>
                              <pre className="font-mono text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(payload.request.query_params, null, 2)}
                              </pre>
                            </div>
                          )}
                          {payload.request?.body && (
                            <div>
                              <span className="text-muted-foreground">Body:</span>
                              <pre className="font-mono text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(payload.request.body, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Response Details */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Response</h4>
                        <div className="rounded-lg border bg-card p-3">
                          {record.error_message && (
                            <div className="text-sm text-destructive mb-2">
                              <strong>Error:</strong> {record.error_message}
                            </div>
                          )}
                          <pre className="font-mono text-xs overflow-x-auto max-h-64">
                            {JSON.stringify(payload.response || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
