import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HourlyData } from '@/hooks/useJobsStats';
import { Skeleton } from '@/components/ui/skeleton';

interface JobsProcessedChartProps {
  data?: HourlyData[];
  isLoading: boolean;
}

const JobsProcessedChart = ({ data, isLoading }: JobsProcessedChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs Processados por Hora (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs Processados por Hora (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="completed" 
              name="Concluídos"
              stroke="hsl(var(--success))" 
              fillOpacity={1} 
              fill="url(#colorCompleted)" 
              stackId="1"
            />
            <Area 
              type="monotone" 
              dataKey="failed" 
              name="Falhos"
              stroke="hsl(var(--destructive))" 
              fillOpacity={1} 
              fill="url(#colorFailed)" 
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default JobsProcessedChart;
