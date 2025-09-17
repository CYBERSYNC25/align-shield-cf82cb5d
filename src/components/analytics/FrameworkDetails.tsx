import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useMemo } from 'react';

const FrameworkDetails = () => {
  const { frameworks } = useFrameworks();

  const frameworkData = useMemo(() => {
    return frameworks.map(framework => ({
      name: framework.name,
      compliance: framework.compliance_score || 0,
      controls: Math.floor(Math.random() * 50) + 20,
      completed: Math.floor(Math.random() * 30) + 15
    }));
  }, [frameworks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento de Frameworks</CardTitle>
        <Badge variant="secondary" className="w-fit">
          {frameworks.length} frameworks ativos
        </Badge>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={frameworkData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
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
                      <p className="text-primary">
                        Compliance: {payload[0].value}%
                      </p>
                      <p className="text-secondary-foreground">
                        Controles: {payload[1].value}
                      </p>
                      <p className="text-accent-foreground">
                        Concluídos: {payload[2].value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="compliance" fill="hsl(var(--primary))" name="Compliance %" />
            <Bar dataKey="controls" fill="hsl(var(--secondary))" name="Total Controles" />
            <Bar dataKey="completed" fill="hsl(var(--accent))" name="Concluídos" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FrameworkDetails;