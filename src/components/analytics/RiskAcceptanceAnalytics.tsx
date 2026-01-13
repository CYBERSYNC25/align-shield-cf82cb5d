import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRiskAcceptances } from '@/hooks/useRiskAcceptances';
import { useMemo } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldOff, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AcceptanceStats {
  total: number;
  byDuration: { name: string; value: number; color: string }[];
  expiringSoon: number;
  pending: number;
  approved: number;
}

const DURATION_COLORS: Record<string, string> = {
  '3_months': '#22c55e',
  '6_months': '#3b82f6',
  '12_months': '#f59e0b',
  'permanent': '#ef4444',
};

const DURATION_LABELS: Record<string, string> = {
  '3_months': '3 meses',
  '6_months': '6 meses',
  '12_months': '12 meses',
  'permanent': 'Permanente',
};

export function RiskAcceptanceAnalytics() {
  const { acceptances, pendingApprovals, isLoading } = useRiskAcceptances();

  const stats: AcceptanceStats = useMemo(() => {
    if (!acceptances || acceptances.length === 0) {
      return {
        total: 0,
        byDuration: [],
        expiringSoon: 0,
        pending: pendingApprovals?.length || 0,
        approved: 0,
      };
    }

    // Count by duration
    const durationCounts = acceptances.reduce((acc, item) => {
      acc[item.duration] = (acc[item.duration] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byDuration = Object.entries(durationCounts).map(([duration, count]) => ({
      name: DURATION_LABELS[duration] || duration,
      value: count,
      color: DURATION_COLORS[duration] || '#6b7280',
    }));

    // Count expiring soon (within 30 days)
    const expiringSoon = acceptances.filter(a => {
      if (!a.expiresAt || a.duration === 'permanent') return false;
      const daysUntilExpiry = differenceInDays(parseISO(a.expiresAt), new Date());
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    const approved = acceptances.filter(a => a.approvalStatus === 'approved').length;

    return {
      total: acceptances.length,
      byDuration,
      expiringSoon,
      pending: pendingApprovals?.length || 0,
      approved,
    };
  }, [acceptances, pendingApprovals]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse" />
            Carregando análise de riscos aceitos...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-primary" />
            Análise de Riscos Aceitos
          </CardTitle>
          <p className="text-sm text-muted-foreground">Exceções de compliance documentadas</p>
        </div>
        <Badge variant="outline">{stats.total} total</Badge>
      </CardHeader>
      <CardContent>
        {stats.total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum risco aceito registrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byDuration}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.byDuration.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-2">
                            <p className="text-sm font-medium">{payload[0]?.name}</p>
                            <p className="text-sm text-muted-foreground">{payload[0]?.value} riscos</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Cards */}
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Expirando em 30 dias</span>
                  </div>
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                    {stats.expiringSoon}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Aguardando Aprovação</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                    {stats.pending}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Aprovados</span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/30">
                    {stats.approved}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Acceptances List */}
        {acceptances && acceptances.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Riscos Aceitos Recentes</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {acceptances.slice(0, 5).map((acceptance) => (
                <div key={acceptance.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                  <div className="flex-1 truncate">
                    <span className="font-medium">{acceptance.ruleId}</span>
                    <span className="text-muted-foreground ml-2">
                      ({acceptance.integrationName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {DURATION_LABELS[acceptance.duration] || acceptance.duration}
                    </Badge>
                    {acceptance.expiresAt && (
                      <span className="text-xs text-muted-foreground">
                        até {format(parseISO(acceptance.expiresAt), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RiskAcceptanceAnalytics;
