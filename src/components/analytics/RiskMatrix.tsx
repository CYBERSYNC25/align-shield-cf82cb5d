import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRisks } from '@/hooks/useRisks';
import { useMemo } from 'react';

const RiskMatrix = () => {
  const { risks } = useRisks();

  const riskMatrixData = useMemo(() => {
    return risks.map((risk, index) => {
      const probabilityMap = { low: 1, medium: 2, high: 3 };
      const impactMap = { low: 1, medium: 2, high: 3 };
      
      return {
        id: index,
        title: risk.title,
        probability: probabilityMap[risk.probability as keyof typeof probabilityMap] || 2,
        impact: impactMap[risk.impact as keyof typeof impactMap] || 2,
        level: risk.level,
        color: risk.level === 'high' ? '#ef4444' : risk.level === 'medium' ? '#f59e0b' : '#22c55e'
      };
    });
  }, [risks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Riscos</CardTitle>
        <Badge variant="secondary" className="w-fit">
          Impacto vs Probabilidade
        </Badge>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number" 
              dataKey="probability" 
              name="Probabilidade"
              domain={[0.5, 3.5]}
              tickCount={4}
              tickFormatter={(value) => {
                const labels = { 1: 'Baixa', 2: 'Média', 3: 'Alta' };
                return labels[value as keyof typeof labels] || '';
              }}
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis 
              type="number" 
              dataKey="impact" 
              name="Impacto"
              domain={[0.5, 3.5]}
              tickCount={4}
              tickFormatter={(value) => {
                const labels = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };
                return labels[value as keyof typeof labels] || '';
              }}
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Nível: {data.level === 'high' ? 'Alto' : data.level === 'medium' ? 'Médio' : 'Baixo'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={riskMatrixData} fill="hsl(var(--primary))">
              {riskMatrixData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex justify-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs">Alto Risco</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs">Médio Risco</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs">Baixo Risco</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMatrix;