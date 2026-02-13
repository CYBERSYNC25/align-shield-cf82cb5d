import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { format, subDays, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, TrendingDown, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface Alert {
  id: string;
  created_at: string;
  severity: string;
  time_to_resolve_hours: number | null;
  resolved: boolean;
  resolved_at: string | null;
}

export function MTTREvolutionChart() {
  const { user } = useAuth();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['compliance-alerts-mttr', user?.id],
    queryFn: async () => {
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('id, created_at, severity, time_to_resolve_hours, resolved, resolved_at')
        .eq('user_id', user!.id)
        .eq('resolved', true)
        .gte('created_at', sixtyDaysAgo)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const chartData = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];

    const groupedByWeek = alerts.reduce((acc, alert) => {
      const weekStart = startOfWeek(parseISO(alert.created_at), { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!acc[weekKey]) acc[weekKey] = { critical: [], high: [], medium: [] };
      const hours = alert.time_to_resolve_hours || 0;
      if (alert.severity === 'critical') acc[weekKey].critical.push(hours);
      else if (alert.severity === 'high') acc[weekKey].high.push(hours);
      else acc[weekKey].medium.push(hours);
      return acc;
    }, {} as Record<string, { critical: number[]; high: number[]; medium: number[] }>);

    return Object.entries(groupedByWeek).map(([week, values]) => ({
      week: format(parseISO(week), 'dd/MM', { locale: ptBR }),
      critical: values.critical.length > 0 ? Math.round(values.critical.reduce((a, b) => a + b, 0) / values.critical.length) : null,
      high: values.high.length > 0 ? Math.round(values.high.reduce((a, b) => a + b, 0) / values.high.length) : null,
      medium: values.medium.length > 0 ? Math.round(values.medium.reduce((a, b) => a + b, 0) / values.medium.length) : null,
    }));
  }, [alerts]);

  const averageMTTR = useMemo(() => {
    if (!alerts || alerts.length === 0) return 0;
    const validAlerts = alerts.filter(a => a.time_to_resolve_hours !== null);
    if (validAlerts.length === 0) return 0;
    return Math.round(validAlerts.reduce((a, b) => a + (b.time_to_resolve_hours || 0), 0) / validAlerts.length);
  }, [alerts]);

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const SLA_CRITICAL = 24;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Evolução do MTTR
          </CardTitle>
          <p className="text-sm text-muted-foreground">Tempo médio de resolução por semana</p>
        </div>
        {chartData.length > 0 && (
          <Badge variant="outline" className="gap-1">
            <TrendingDown className="h-3 w-3" />
            Média: {formatHours(averageMTTR)}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-[300px]">
            <Clock className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Sem dados de MTTR</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Resolva alertas de compliance para gerar dados de tempo médio de resolução.
            </p>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={formatHours} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-3">
                            <p className="font-medium mb-2">Semana de {label}</p>
                            {payload.map((entry: any, index: number) => (
                              entry.value !== null && (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.name}: {formatHours(entry.value)}
                                </p>
                              )
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={SLA_CRITICAL} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'SLA Crítico (24h)', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Line type="monotone" dataKey="critical" name="Crítico" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: 'hsl(var(--destructive))' }} connectNulls />
                  <Line type="monotone" dataKey="high" name="Alto" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))' }} connectNulls />
                  <Line type="monotone" dataKey="medium" name="Médio" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-destructive" /><span>Crítico: SLA 24h</span></div>
              <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-orange-500" /><span>Alto: SLA 7 dias</span></div>
              <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-primary" /><span>Médio: SLA 30 dias</span></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default MTTREvolutionChart;
