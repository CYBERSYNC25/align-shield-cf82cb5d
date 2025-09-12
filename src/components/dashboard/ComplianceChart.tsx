import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useRisks } from '@/hooks/useRisks';
import { useMemo } from 'react';

const ComplianceChart = () => {
  const { frameworks } = useFrameworks();
  const { risks } = useRisks();

  // Generate timeline data for compliance score
  const timelineData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const currentScore = frameworks.length > 0 
      ? Math.round(frameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / frameworks.length)
      : 0;

    return months.map((month, index) => ({
      month,
      score: Math.max(0, currentScore - (5 - index) * 3 + Math.random() * 10)
    }));
  }, [frameworks]);

  // Risk distribution data
  const riskData = useMemo(() => {
    const riskCounts = risks.reduce((acc, risk) => {
      acc[risk.level] = (acc[risk.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Alto', value: riskCounts.high || 0, color: '#ef4444' },
      { name: 'Médio', value: riskCounts.medium || 0, color: '#f59e0b' },
      { name: 'Baixo', value: riskCounts.low || 0, color: '#22c55e' }
    ].filter(item => item.value > 0);
  }, [risks]);

  const COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Compliance Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolução do Compliance
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Últimos 6 meses
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                domain={[0, 100]}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-primary">
                          Score: {Math.round(payload[0].value as number)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
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
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
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
                          <p className="font-medium" style={{ color: data.color }}>
                            Risco {data.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data.value} riscos identificados
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-4 mt-4">
            {riskData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">({item.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceChart;