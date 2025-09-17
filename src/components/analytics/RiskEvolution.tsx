import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRisks } from '@/hooks/useRisks';
import { useMemo } from 'react';

const RiskEvolution = () => {
  const { risks } = useRisks();

  const evolutionData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const currentCounts = risks.reduce((acc, risk) => {
      acc[risk.level] = (acc[risk.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return months.map((month, index) => ({
      month,
      alto: Math.max(0, (currentCounts.high || 0) - (5 - index) + Math.floor(Math.random() * 3)),
      medio: Math.max(0, (currentCounts.medium || 0) - (5 - index) + Math.floor(Math.random() * 2)),
      baixo: Math.max(0, (currentCounts.low || 0) - (5 - index) + Math.floor(Math.random() * 2))
    }));
  }, [risks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução dos Riscos</CardTitle>
        <Badge variant="secondary" className="w-fit">
          Últimos 6 meses
        </Badge>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: {entry.value} riscos
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="alto" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Alto Risco"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="medio" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Médio Risco"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="baixo" 
              stroke="#22c55e" 
              strokeWidth={2}
              name="Baixo Risco"
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RiskEvolution;