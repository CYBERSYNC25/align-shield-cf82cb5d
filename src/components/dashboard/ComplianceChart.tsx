import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useRisks } from '@/hooks/useRisks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ComplianceChart = () => {
  const { frameworks } = useFrameworks();
  const { risks } = useRisks();
  const { user } = useAuth();

  const { data: history } = useQuery({
    queryKey: ['compliance-history-chart', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_check_history')
        .select('created_at, score')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const timelineData = useMemo(() => {
    if (history && history.length > 0) {
      return history.map(h => ({
        month: format(parseISO(h.created_at), 'dd/MM', { locale: ptBR }),
        score: h.score || 0
      }));
    }

    // Show only current score as single point if no history
    const currentScore = frameworks.length > 0 
      ? Math.round(frameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / frameworks.length)
      : 0;

    if (currentScore === 0) return [];
    return [{ month: 'Atual', score: currentScore }];
  }, [history, frameworks]);

  const riskData = useMemo(() => {
    const riskCounts = risks.reduce((acc, risk) => {
      acc[risk.level] = (acc[risk.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Alto', value: riskCounts.high || 0, color: 'hsl(var(--destructive))' },
      { name: 'Médio', value: riskCounts.medium || 0, color: 'hsl(var(--warning))' },
      { name: 'Baixo', value: riskCounts.low || 0, color: 'hsl(var(--success))' }
    ].filter(item => item.value > 0);
  }, [risks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolução do Compliance
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {timelineData.length > 1 ? 'Histórico' : 'Atual'}
          </Badge>
        </CardHeader>
        <CardContent>
          {timelineData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-[250px]">
              <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Execute verificações de compliance para gerar histórico.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-primary">Score: {Math.round(payload[0].value as number)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Distribuição de Riscos
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {risks.length} total
          </Badge>
        </CardHeader>
        <CardContent>
          {riskData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-[250px]">
              <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum risco cadastrado.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium" style={{ color: data.color }}>Risco {data.name}</p>
                              <p className="text-sm text-muted-foreground">{data.value} riscos identificados</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                {riskData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceChart;
