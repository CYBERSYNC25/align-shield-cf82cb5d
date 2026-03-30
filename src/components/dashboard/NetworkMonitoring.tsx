import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Cpu, Router, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useNetworkAlerts } from '@/hooks/useNetworkAlerts';

interface DeviceLog {
  id: string;
  device_id: string;
  router_name: string;
  cpu_usage: number;
  version: string;
  created_at: string;
}

interface ChartData {
  time: string;
  cpu: number;
  fullTime: Date;
}

const OFFLINE_THRESHOLD_SECONDS = 90;

const NetworkMonitoring = () => {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestLogTimestamp, setLatestLogTimestamp] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Calculate online status based on latest log timestamp
  const isOnline = useMemo(() => {
    if (!latestLogTimestamp) return false;
    const secondsSinceLastLog = (currentTime.getTime() - latestLogTimestamp.getTime()) / 1000;
    return secondsSinceLastLog < OFFLINE_THRESHOLD_SECONDS;
  }, [latestLogTimestamp, currentTime]);

  // Monitoramento automático de alertas (Online ↔ Offline)
  useNetworkAlerts(isOnline);

  const fetchLogs = async () => {
    try {
      // Fetch logs from last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('device_logs')
        .select('*')
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching device logs:', error);
        return;
      }

      if (data) {
        setLogs(data);
        
        // Set latest log timestamp for online/offline detection
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setLatestLogTimestamp(new Date(latest.created_at));
        }
        
        // Transform data for chart
        const transformed = data.map((log) => ({
          time: format(new Date(log.created_at), 'HH:mm:ss'),
          cpu: log.cpu_usage,
          fullTime: new Date(log.created_at)
        }));
        
        setChartData(transformed);
      }
    } catch (error) {
      console.error('Error in fetchLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Refresh data every 10 seconds
    const dataInterval = setInterval(fetchLogs, 10000);
    
    // Update current time every second for accurate online/offline status
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('device_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_logs'
        },
        () => {
          console.log('New device log detected, refreshing...');
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const latestLog = logs[logs.length - 1];
  const averageCpu = logs.length > 0 
    ? Math.round(logs.reduce((sum, log) => sum + log.cpu_usage, 0) / logs.length)
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Monitoramento de Rede (Tempo Real)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 30 minutos • Atualiza a cada 10s
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Online/Offline Status Badge */}
            {isOnline ? (
              <Badge 
                className="bg-success/10 text-success border-success/20 animate-pulse"
              >
                <span className="mr-1.5 inline-block w-2 h-2 rounded-full bg-success animate-ping" />
                Online
              </Badge>
            ) : (
              <Badge 
                variant="destructive"
                className="bg-destructive/10 text-destructive border-destructive/20"
              >
                <span className="mr-1.5 inline-block w-2 h-2 rounded-full bg-destructive" />
                Offline
              </Badge>
            )}
            
            {latestLog && (
              <Badge variant="outline" className="bg-muted/50 hidden sm:flex">
                <Router className="h-3 w-3 mr-1" />
                {latestLog.router_name}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Offline Warning Alert */}
        {!isOnline && !loading && (
          <Alert variant="default" className="mb-4 border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              O agente parou de enviar dados. Verifique se o computador está ligado e conectado à internet.
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Router className="h-12 w-12 text-muted-foreground opacity-50" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Nenhum dado disponível</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando métricas do agente Compliance Sync
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Cpu className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">CPU Atual</p>
                  <p className="text-lg font-bold text-foreground">
                    {latestLog?.cpu_usage}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">CPU Média</p>
                  <p className="text-lg font-bold text-foreground">
                    {averageCpu}%
                  </p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                    label={{ 
                      value: 'CPU %', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                    }}
                  />
                  
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#cpuGradient)"
                    name="CPU"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Device info */}
            {latestLog && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <span className="text-muted-foreground">
                    Dispositivo: <span className="text-foreground font-medium">{latestLog.device_id.substring(0, 12)}...</span>
                  </span>
                  <span className="text-muted-foreground">
                    Versão: <span className="text-foreground font-medium">{latestLog.version}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Último sinal: <span className="text-foreground font-medium">
                      {latestLogTimestamp ? format(latestLogTimestamp, 'HH:mm:ss') : '-'}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {logs.length} registros
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkMonitoring;
