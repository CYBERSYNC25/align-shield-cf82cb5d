import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRisks } from '@/hooks/useRisks';
import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

const RiskEvolution = () => {
  const { risks } = useRisks();

  const currentData = useMemo(() => {
    const counts = risks.reduce((acc, risk) => {
      acc[risk.level] = (acc[risk.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (risks.length === 0) return [];

    return [{
      month: 'Atual',
      alto: counts.high || 0,
      medio: counts.medium || 0,
      baixo: counts.low || 0
    }];
  }, [risks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução dos Riscos</CardTitle>
        <Badge variant="secondary" className="w-fit">
          Dados atuais
        </Badge>
      </CardHeader>
      <CardContent>
        {currentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Sem dados de riscos</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Cadastre riscos para visualizar a evolução ao longo do tempo.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
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
              <Line type="monotone" dataKey="alto" stroke="#ef4444" strokeWidth={2} name="Alto Risco" dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} />
              <Line type="monotone" dataKey="medio" stroke="#f59e0b" strokeWidth={2} name="Médio Risco" dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} />
              <Line type="monotone" dataKey="baixo" stroke="#22c55e" strokeWidth={2} name="Baixo Risco" dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskEvolution;
