/**
 * Dynamic API Connector
 * 
 * Componente que permite aos usuários fazer requisições customizadas para APIs
 * externas usando tokens OAuth armazenados de forma segura.
 * 
 * FUNCIONALIDADES:
 * - Selecionar integração conectada (Google, AWS, Azure, etc.)
 * - Configurar endpoint, método HTTP, headers e body customizados
 * - Adicionar query parameters dinamicamente
 * - Visualizar resposta formatada (JSON, texto, headers)
 * - Ver status HTTP, tempo de resposta e erros
 * - Histórico automático de requisições
 * 
 * USO:
 * 1. Usuário conecta conta via OAuth (ex: Google Workspace)
 * 2. Escolhe a integração no dropdown
 * 3. Configura endpoint (ex: https://www.googleapis.com/admin/directory/v1/users)
 * 4. Seleciona método HTTP (GET, POST, PUT, DELETE, PATCH)
 * 5. Adiciona headers e body opcionais
 * 6. Clica em "Send Request"
 * 7. Visualiza resposta formatada e status
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Code,
  FileText
} from "lucide-react";

interface IntegrationToken {
  id: string;
  integration_name: string;
  created_at: string;
  expires_at: string;
}

interface HeaderParam {
  key: string;
  value: string;
}

interface QueryParam {
  key: string;
  value: string;
}

interface ApiResponse {
  success: boolean;
  status_code: number;
  status_text: string;
  duration_ms: number;
  content_type: string;
  data: any;
  headers: Record<string, string>;
}

export function DynamicApiConnector() {
  const { toast } = useToast();
  
  // Integration selection
  const [integrations, setIntegrations] = useState<IntegrationToken[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  
  // Request configuration
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">("GET");
  const [headers, setHeaders] = useState<HeaderParam[]>([{ key: "", value: "" }]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  
  // Response state
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [responseTab, setResponseTab] = useState("body");

  // Load user's connected integrations
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('integration_oauth_tokens')
        .select('id, integration_name, created_at, expires_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas integrações.",
        variant: "destructive"
      });
    }
  };

  // Header management
  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Query params management
  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "" }]);
  };

  const updateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...queryParams];
    updated[index][field] = value;
    setQueryParams(updated);
  };

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  // Send API request
  const sendRequest = async () => {
    if (!selectedIntegration) {
      toast({
        title: "Integração não selecionada",
        description: "Selecione uma integração antes de enviar a requisição.",
        variant: "destructive"
      });
      return;
    }

    if (!endpoint) {
      toast({
        title: "Endpoint obrigatório",
        description: "Insira a URL do endpoint que deseja chamar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Build headers object (only non-empty)
      const customHeaders: Record<string, string> = {};
      headers.forEach(h => {
        if (h.key && h.value) {
          customHeaders[h.key] = h.value;
        }
      });

      // Build query params object (only non-empty)
      const queryParamsObj: Record<string, string> = {};
      queryParams.forEach(q => {
        if (q.key && q.value) {
          queryParamsObj[q.key] = q.value;
        }
      });

      // Parse body if provided
      let parsedBody = undefined;
      if (body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          toast({
            title: "Body inválido",
            description: "O body deve ser um JSON válido.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      console.log('Sending API request:', {
        integration_name: selectedIntegration,
        endpoint,
        method,
        headers: customHeaders,
        query_params: queryParamsObj,
        body: parsedBody
      });

      const { data, error } = await supabase.functions.invoke('proxy-api-request', {
        body: {
          integration_name: selectedIntegration,
          endpoint,
          method,
          headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          query_params: Object.keys(queryParamsObj).length > 0 ? queryParamsObj : undefined,
          body: parsedBody
        }
      });

      if (error) throw error;

      setResponse(data);
      
      toast({
        title: data.success ? "Requisição bem-sucedida" : "Requisição falhou",
        description: `Status: ${data.status_code} ${data.status_text} (${data.duration_ms}ms)`,
        variant: data.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Erro na requisição",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy response to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência."
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Request Configuration Panel */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Configuração da Requisição</h3>
            
            {/* Integration Selection */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="integration">Integração</Label>
              <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                <SelectTrigger id="integration">
                  <SelectValue placeholder="Selecione uma integração conectada" />
                </SelectTrigger>
                <SelectContent>
                  {integrations.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhuma integração conectada
                    </div>
                  ) : (
                    integrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.integration_name}>
                        {integration.integration_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {integrations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Conecte uma integração OAuth primeiro (ex: Google Workspace)
                </p>
              )}
            </div>

            {/* Method and Endpoint */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="col-span-3"
              />
            </div>

            <Separator className="my-4" />

            {/* Query Parameters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Query Parameters</Label>
                <Button variant="ghost" size="sm" onClick={addQueryParam}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {queryParams.map((param, index) => (
                <div key={index} className="grid grid-cols-5 gap-2">
                  <Input
                    placeholder="key"
                    value={param.key}
                    onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                    className="col-span-2"
                  />
                  <Input
                    placeholder="value"
                    value={param.value}
                    onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                    className="col-span-2"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeQueryParam(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headers Customizados</Label>
                <Button variant="ghost" size="sm" onClick={addHeader}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Authorization header é adicionado automaticamente
              </p>
              {headers.map((header, index) => (
                <div key={index} className="grid grid-cols-5 gap-2">
                  <Input
                    placeholder="Header-Name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    className="col-span-2"
                  />
                  <Input
                    placeholder="value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    className="col-span-2"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeHeader(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Body */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div className="space-y-2">
                <Label htmlFor="body">Body (JSON)</Label>
                <Textarea
                  id="body"
                  placeholder='{"key": "value"}'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
            )}
          </div>

          <Button 
            onClick={sendRequest} 
            disabled={loading || !selectedIntegration || !endpoint}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Enviando..." : "Enviar Requisição"}
          </Button>
        </div>
      </Card>

      {/* Response Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resposta</h3>
        
        {!response && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Code className="w-12 h-12 mb-2 opacity-50" />
            <p>A resposta aparecerá aqui</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
            <p>Enviando requisição...</p>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
              {response.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={response.success ? "default" : "destructive"}>
                    {response.status_code} {response.status_text}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {response.duration_ms}ms
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {response.content_type}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Response Tabs */}
            <Tabs value={responseTab} onValueChange={setResponseTab}>
              <TabsList className="w-full">
                <TabsTrigger value="body" className="flex-1">Body</TabsTrigger>
                <TabsTrigger value="headers" className="flex-1">Headers</TabsTrigger>
              </TabsList>

              <TabsContent value="body" className="mt-4">
                <div className="rounded-lg border bg-muted/50 p-4 max-h-96 overflow-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {typeof response.data === 'object' 
                      ? JSON.stringify(response.data, null, 2)
                      : response.data
                    }
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="headers" className="mt-4">
                <div className="space-y-2">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 p-2 rounded border text-sm">
                      <span className="font-mono text-muted-foreground">{key}</span>
                      <span className="col-span-2 font-mono break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Card>
    </div>
  );
}
