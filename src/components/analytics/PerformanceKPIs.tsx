import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useTasks } from '@/hooks/useTasks';
import { useAudits } from '@/hooks/useAudits';
import { useMemo } from 'react';

const PerformanceKPIs = () => {
  const { frameworks } = useFrameworks();
  const { tasks } = useTasks();
  const { audits } = useAudits();

  const kpiData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    
    const avgCompliance = frameworks.length > 0 
      ? frameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / frameworks.length
      : 0;
    
    const completionRate = tasks.length > 0 
      ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
      : 0;

    return months.map((month, index) => ({
      month,
      compliance: Math.max(0, avgCompliance - (5 - index) * 2 + Math.random() * 5),
      taskCompletion: Math.max(0, completionRate - (5 - index) * 3 + Math.random() * 8),
      audits: Math.floor(Math.random() * 10) + 5,
      efficiency: Math.max(60, 95 - (5 - index) * 2 + Math.random() * 10)
    }));
  }, [frameworks, tasks, audits]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPIs de Performance</CardTitle>
        <Badge variant="secondary" className="w-fit">
          Indicadores chave
        </Badge>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={kpiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis 
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
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
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                          {entry.name === 'compliance' && `Compliance: ${Math.round(entry.value as number)}%`}
                          {entry.name === 'taskCompletion' && `Conclusão Tarefas: ${Math.round(entry.value as number)}%`}
                          {entry.name === 'audits' && `Auditorias: ${entry.value}`}
                          {entry.name === 'efficiency' && `Eficiência: ${Math.round(entry.value as number)}%`}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              yAxisId="right"
              dataKey="audits" 
              fill="hsl(var(--muted))" 
              name="Auditorias"
              opacity={0.7}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="compliance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              name="Compliance %"
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="taskCompletion" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              name="Conclusão Tarefas %"
              dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="efficiency" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              name="Eficiência %"
              dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceKPIs;