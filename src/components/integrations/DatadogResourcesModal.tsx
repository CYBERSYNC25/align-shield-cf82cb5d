import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Activity, 
  ShieldAlert, 
  FileText, 
  TestTube2,
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  AlertTriangle,
  Search,
  Dog
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatadogSync, DatadogResourcesData } from '@/hooks/integrations/useDatadogSync';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DatadogResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationId: string;
  integrationName?: string;
}

const MONITOR_STATE_COLORS: Record<string, string> = {
  'OK': 'hsl(var(--chart-2))',
  'Alert': 'hsl(var(--destructive))',
  'Warn': 'hsl(var(--chart-4))',
  'No Data': 'hsl(var(--muted-foreground))',
};

const SEVERITY_COLORS: Record<string, string> = {
  'critical': 'hsl(var(--destructive))',
  'high': 'hsl(var(--chart-4))',
  'medium': 'hsl(var(--chart-3))',
  'low': 'hsl(var(--chart-2))',
  'info': 'hsl(var(--muted-foreground))',
};

export function DatadogResourcesModal({ open, onOpenChange, integrationId, integrationName }: DatadogResourcesModalProps) {
  const [data, setData] = useState<DatadogResourcesData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const syncMutation = useDatadogSync(integrationId);

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (result) => {
        setData(result);
      }
    });
  };

  const formatDate = (dateStr: string | number) => {
    try {
      const date = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return String(dateStr);
    }
  };

  // Compute chart data
  const monitorStateData = useMemo(() => {
    if (!data?.monitors) return [];
    const counts: Record<string, number> = {};
    data.monitors.forEach(m => {
      const state = m.overall_state || 'No Data';
      counts[state] = (counts[state] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: MONITOR_STATE_COLORS[name] || 'hsl(var(--muted))'
    }));
  }, [data?.monitors]);

  const signalSeverityData = useMemo(() => {
    if (!data?.securitySignals) return [];
    const counts: Record<string, number> = {};
    data.securitySignals.forEach(s => {
      const severity = s.severity || 'info';
      counts[severity] = (counts[severity] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: SEVERITY_COLORS[name] || 'hsl(var(--muted))'
    }));
  }, [data?.securitySignals]);

  // Filter monitors by search
  const filteredMonitors = useMemo(() => {
    if (!data?.monitors) return [];
    if (!searchQuery) return data.monitors;
    const query = searchQuery.toLowerCase();
    return data.monitors.filter(m => 
      m.name?.toLowerCase().includes(query) ||
      m.type?.toLowerCase().includes(query) ||
      m.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [data?.monitors, searchQuery]);

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'OK':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>;
      case 'Alert':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Alert</Badge>;
      case 'Warn':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Warn</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />No Data</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-600 border-red-500/30',
      high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      low: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      info: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    };
    return <Badge className={colors[severity] || colors.info}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'live') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Live</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Dog className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle>Recursos Datadog</SheetTitle>
              <SheetDescription>
                {integrationName || 'Datadog Monitoring'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
          {/* Sync Button */}
          <div className="flex items-center justify-between">
            <Button 
              onClick={handleSync} 
              disabled={syncMutation.isPending} 
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
            {data && (
              <span className="text-xs text-muted-foreground">
                Última sync: {formatDate(data.timestamp)}
              </span>
            )}
          </div>

          {/* Error State */}
          {syncMutation.isError && !syncMutation.isPending && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-4">
                <p className="text-sm text-destructive">{syncMutation.error?.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique se a API Key e Application Key estão corretas e têm as permissões necessárias.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {syncMutation.isPending && !data && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-60" />
            </div>
          )}

          {/* Data Display */}
          {data && (
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-3">
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Monitors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.monitors?.length || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.securitySignals?.length || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Pipelines
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.logPipelines?.length || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <TestTube2 className="h-3.5 w-3.5" />
                        Synthetics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.synthetics?.length || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs for each resource type */}
                <Tabs defaultValue="monitors" className="w-full">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="monitors">Monitors</TabsTrigger>
                    <TabsTrigger value="signals">Security Signals</TabsTrigger>
                    <TabsTrigger value="pipelines">Log Pipelines</TabsTrigger>
                    <TabsTrigger value="synthetics">Synthetics</TabsTrigger>
                  </TabsList>

                  {/* Monitors Tab */}
                  <TabsContent value="monitors" className="space-y-4">
                    {/* Monitor States Chart */}
                    {monitorStateData.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Distribuição de Estados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={monitorStateData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={2}
                                  dataKey="value"
                                  label={({ name, value }) => `${name}: ${value}`}
                                >
                                  {monitorStateData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar monitors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Monitors Table */}
                    <Card>
                      <CardContent className="pt-4">
                        {filteredMonitors.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum monitor encontrado
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Tags</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredMonitors.slice(0, 20).map((monitor) => (
                                <TableRow key={monitor.id}>
                                  <TableCell className="font-medium max-w-[200px] truncate">
                                    {monitor.name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{monitor.type}</Badge>
                                  </TableCell>
                                  <TableCell>{getStateBadge(monitor.overall_state)}</TableCell>
                                  <TableCell className="max-w-[150px]">
                                    <div className="flex flex-wrap gap-1">
                                      {(monitor.tags || []).slice(0, 2).map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {(monitor.tags?.length || 0) > 2 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{(monitor.tags?.length || 0) - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        {filteredMonitors.length > 20 && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Mostrando 20 de {filteredMonitors.length} monitors
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Security Signals Tab */}
                  <TabsContent value="signals" className="space-y-4">
                    {/* Severity Chart */}
                    {signalSeverityData.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Distribuição por Severidade</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={signalSeverityData} layout="vertical">
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Signals Table */}
                    <Card>
                      <CardContent className="pt-4">
                        {(data.securitySignals?.length || 0) === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum security signal nas últimas 24h
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Severidade</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.securitySignals?.slice(0, 20).map((signal) => (
                                <TableRow key={signal.id}>
                                  <TableCell className="font-medium max-w-[200px] truncate">
                                    {signal.title}
                                  </TableCell>
                                  <TableCell>{getSeverityBadge(signal.severity)}</TableCell>
                                  <TableCell>
                                    <Badge variant={signal.status === 'open' ? 'destructive' : 'secondary'}>
                                      {signal.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {formatDate(signal.timestamp)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Log Pipelines Tab */}
                  <TabsContent value="pipelines" className="space-y-4">
                    <Card>
                      <CardContent className="pt-4">
                        {(data.logPipelines?.length || 0) === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum log pipeline configurado
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Processadores</TableHead>
                                <TableHead>PII Mask</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.logPipelines?.map((pipeline) => (
                                <TableRow key={pipeline.id}>
                                  <TableCell className="font-medium">{pipeline.name}</TableCell>
                                  <TableCell>
                                    {pipeline.is_enabled ? (
                                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                        Ativo
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">Inativo</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{pipeline.processor_count || 0}</TableCell>
                                  <TableCell>
                                    {pipeline.has_sensitive_data_processor ? (
                                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Sim
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Não
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Synthetics Tab */}
                  <TabsContent value="synthetics" className="space-y-4">
                    <Card>
                      <CardContent className="pt-4">
                        {(data.synthetics?.length || 0) === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum synthetic test configurado
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.synthetics?.map((test) => (
                                <TableRow key={test.public_id}>
                                  <TableCell className="font-medium max-w-[200px] truncate">
                                    {test.name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{test.type}</Badge>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(test.status)}</TableCell>
                                  <TableCell>
                                    {test.is_passing ? (
                                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        OK
                                      </Badge>
                                    ) : test.is_failing ? (
                                      <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Failing
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        N/A
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {!syncMutation.isPending && !data && !syncMutation.isError && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <Dog className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Sincronize seus recursos</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Clique em "Sincronizar Agora" para buscar monitors, security signals, log pipelines e synthetic tests do Datadog.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
