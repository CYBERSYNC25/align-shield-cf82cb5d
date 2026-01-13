import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { Timer, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface Alert {
  id: string;
  severity: string;
  sla_hours: number | null;
  time_to_resolve_hours: number | null;
  resolved: boolean;
  is_overdue: boolean | null;
}

interface SLAMetrics {
  severity: string;
  total: number;
  withinSLA: number;
  breached: number;
  complianceRate: number;
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const SEVERITY_LABELS = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
};

export function SLAComplianceReport() {
  const { user } = useAuth();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['compliance-alerts-sla', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('id, severity, sla_hours, time_to_resolve_hours, resolved, is_overdue')
        .eq('user_id', user!.id)
        .eq('resolved', true);

      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const metrics: SLAMetrics[] = useMemo(() => {
    if (!alerts || alerts.length === 0) {
      // Sample data
      return [
        { severity: 'critical', total: 15, withinSLA: 12, breached: 3, complianceRate: 80 },
        { severity: 'high', total: 28, withinSLA: 25, breached: 3, complianceRate: 89 },
        { severity: 'medium', total: 45, withinSLA: 42, breached: 3, complianceRate: 93 },
        { severity: 'low', total: 20, withinSLA: 19, breached: 1, complianceRate: 95 },
      ];
    }

    const grouped = alerts.reduce((acc, alert) => {
      const severity = alert.severity || 'medium';
      if (!acc[severity]) {
        acc[severity] = { total: 0, withinSLA: 0, breached: 0 };
      }
      
      acc[severity].total++;
      
      // Check if resolved within SLA
      if (alert.time_to_resolve_hours !== null && alert.sla_hours !== null) {
        if (alert.time_to_resolve_hours <= alert.sla_hours) {
          acc[severity].withinSLA++;
        } else {
          acc[severity].breached++;
        }
      } else if (alert.is_overdue) {
        acc[severity].breached++;
      } else {
        acc[severity].withinSLA++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; withinSLA: number; breached: number }>);

    return Object.entries(grouped).map(([severity, data]) => ({
      severity,
      ...data,
      complianceRate: data.total > 0 ? Math.round((data.withinSLA / data.total) * 100) : 0,
    }));
  }, [alerts]);

  const overallComplianceRate = useMemo(() => {
    const totals = metrics.reduce((acc, m) => {
      acc.total += m.total;
      acc.withinSLA += m.withinSLA;
      return acc;
    }, { total: 0, withinSLA: 0 });
    
    return totals.total > 0 ? Math.round((totals.withinSLA / totals.total) * 100) : 100;
  }, [metrics]);

  const chartData = metrics.map(m => ({
    name: SEVERITY_LABELS[m.severity as keyof typeof SEVERITY_LABELS] || m.severity,
    'Dentro do SLA': m.withinSLA,
    'Fora do SLA': m.breached,
    color: SEVERITY_COLORS[m.severity as keyof typeof SEVERITY_COLORS] || '#6b7280',
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Conformidade com SLA
          </CardTitle>
          <p className="text-sm text-muted-foreground">Taxa de resolução dentro do prazo</p>
        </div>
        <Badge 
          className={`text-lg ${
            overallComplianceRate >= 90 ? 'bg-green-500' : 
            overallComplianceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        >
          {overallComplianceRate}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const total = (payload[0]?.value as number || 0) + (payload[1]?.value as number || 0);
                      const withinSLA = payload[0]?.value as number || 0;
                      const rate = total > 0 ? Math.round((withinSLA / total) * 100) : 0;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                          <p className="font-medium mb-2">{label}</p>
                          <p className="text-sm text-green-600">Dentro do SLA: {payload[0]?.value}</p>
                          <p className="text-sm text-red-500">Fora do SLA: {payload[1]?.value}</p>
                          <p className="text-sm font-medium mt-1">Taxa: {rate}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="Dentro do SLA" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Fora do SLA" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats by Severity */}
          <div className="space-y-3">
            {metrics.map((m) => (
              <div 
                key={m.severity}
                className="p-3 rounded-lg border"
                style={{ borderLeftColor: SEVERITY_COLORS[m.severity as keyof typeof SEVERITY_COLORS], borderLeftWidth: 3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {SEVERITY_LABELS[m.severity as keyof typeof SEVERITY_LABELS] || m.severity}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={m.complianceRate >= 90 ? 'text-green-500' : m.complianceRate >= 70 ? 'text-yellow-500' : 'text-red-500'}
                  >
                    {m.complianceRate}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {m.withinSLA} no prazo
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {m.breached} atrasados
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${m.complianceRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Reference */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Referência de SLA por Severidade
          </h4>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Crítico: 24 horas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Alto: 7 dias
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Médio: 30 dias
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Baixo: 90 dias
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SLAComplianceReport;
