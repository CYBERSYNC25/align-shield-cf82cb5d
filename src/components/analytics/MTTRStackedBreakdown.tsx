import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Info } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MTTRDataPoint } from '@/hooks/useAdvancedAnalytics';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MTTRStackedBreakdownProps {
  data: MTTRDataPoint[];
  onExport: (ref: React.RefObject<HTMLDivElement>, filename: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const dataPoint = entry.payload;
            const countKey = `${entry.dataKey}Count` as keyof MTTRDataPoint;
            const count = dataPoint[countKey] || 0;
            
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-muted-foreground">{entry.name}:</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{entry.value}h</span>
                  <span className="text-muted-foreground ml-1">({count} alertas)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-center gap-6 mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function MTTRStackedBreakdown({ data, onExport }: MTTRStackedBreakdownProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Calculate overall MTTR
  const totalMTTR = data.reduce((sum, d) => {
    const totalHours = d.critical + d.high + d.medium + d.low;
    const totalCount = d.criticalCount + d.highCount + d.mediumCount + d.lowCount;
    return sum + (totalCount > 0 ? totalHours / totalCount : 0);
  }, 0);
  const avgMTTR = data.length > 0 ? Math.round(totalMTTR / data.length) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">MTTR por Severidade</CardTitle>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Mean Time To Resolve (MTTR) médio em horas,</p>
              <p>agrupado por semana e severidade.</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Média: <span className="font-semibold text-foreground">{avgMTTR}h</span>
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onExport(chartRef, 'mttr-breakdown')}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="week" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(value) => `${value}h`}
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Bar 
                dataKey="critical" 
                stackId="a" 
                fill="hsl(0 84.2% 60.2%)" 
                name="Crítico"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="high" 
                stackId="a" 
                fill="hsl(24.6 95% 53.1%)" 
                name="Alto"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="medium" 
                stackId="a" 
                fill="hsl(47.9 95.8% 53.1%)" 
                name="Médio"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="low" 
                stackId="a" 
                fill="hsl(142.1 76.2% 36.3%)" 
                name="Baixo"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
