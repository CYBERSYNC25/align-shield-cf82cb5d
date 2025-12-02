import { useState } from 'react';
import { Activity, AlertTriangle, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

// Mock data for chart - 24 hours
const generateChartData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    const baseSuccess = Math.floor(Math.random() * 800) + 200;
    const baseErrors = Math.floor(Math.random() * 50) + 5;
    data.push({
      time: hour,
      success: baseSuccess,
      errors: baseErrors,
    });
  }
  return data;
};

// Mock data for logs
const generateLogsData = () => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const endpoints = [
    '/api/users',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/controls',
    '/api/risks',
    '/api/integrations',
    '/api/audits',
    '/api/policies',
    '/api/reports',
    '/api/notifications',
  ];
  const statusCodes = [200, 200, 200, 200, 201, 204, 400, 401, 403, 404, 500, 502, 503];
  
  const logs = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - i * 30000); // 30 seconds apart
    logs.push({
      id: i + 1,
      timestamp: timestamp.toLocaleTimeString('pt-BR'),
      method: methods[Math.floor(Math.random() * methods.length)],
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      status: statusCodes[Math.floor(Math.random() * statusCodes.length)],
      latency: Math.floor(Math.random() * 400) + 20,
    });
  }
  return logs;
};

// Helper functions for conditional colors
const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (status >= 400 && status < 500) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  return 'bg-red-500/10 text-red-600 border-red-500/20';
};

const getMethodColor = (method: string) => {
  const colors: Record<string, string> = {
    GET: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    POST: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    PUT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
    PATCH: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };
  return colors[method] || 'bg-muted text-muted-foreground';
};

const ApiMonitor = () => {
  const [timeFilter, setTimeFilter] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartData] = useState(generateChartData);
  const [logsData] = useState(generateLogsData);

  // Calculate KPIs from mock data
  const totalRequests = chartData.reduce((acc, curr) => acc + curr.success + curr.errors, 0);
  const totalErrors = chartData.reduce((acc, curr) => acc + curr.errors, 0);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(1);
  const avgLatency = Math.floor(logsData.reduce((acc, curr) => acc + curr.latency, 0) / logsData.length);
  const systemStatus = parseFloat(errorRate) < 5 ? 'online' : 'degraded';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">API Monitor</h1>
              <p className="text-muted-foreground mt-1">
                Monitore o tráfego e performance das suas APIs em tempo real
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Última hora</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Requisições
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRequests.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +12% em relação ao período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Erro
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errorRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalErrors.toLocaleString('pt-BR')} erros no período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Latência Média
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgLatency}ms</div>
                <p className="text-xs text-muted-foreground mt-1">
                  p95: {Math.floor(avgLatency * 1.8)}ms | p99: {Math.floor(avgLatency * 2.5)}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Status do Sistema
                </CardTitle>
                {systemStatus === 'online' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      systemStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-2xl font-bold capitalize">
                    {systemStatus === 'online' ? 'Online' : 'Degradado'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uptime: 99.97% nos últimos 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tráfego de Requisições</CardTitle>
              <CardDescription>
                Volume de chamadas por hora nas últimas 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="success"
                      name="Sucesso"
                      stroke="hsl(142, 76%, 36%)"
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      name="Erros"
                      stroke="hsl(0, 84%, 60%)"
                      fillOpacity={1}
                      fill="url(#colorErrors)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Logs Recentes</CardTitle>
              <CardDescription>
                Últimas requisições processadas pela API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Timestamp</TableHead>
                      <TableHead className="w-20">Método</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-24 text-right">Latência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.slice(0, 20).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {log.timestamp}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getMethodColor(log.method)}>
                            {log.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {log.latency}ms
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ApiMonitor;
