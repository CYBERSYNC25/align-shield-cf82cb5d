import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { PeriodMetric } from '@/hooks/useAdvancedAnalytics';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PeriodComparisonChartProps {
  data: PeriodMetric[];
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  onExport: (ref: React.RefObject<HTMLDivElement>, filename: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const metric = payload[0].payload as PeriodMetric;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-foreground mb-2">{metric.metric}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Período atual:</span>
            <span className="font-semibold text-primary">
              {metric.currentValue}{metric.unit || ''}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Período anterior:</span>
            <span className="text-muted-foreground">
              {metric.previousValue}{metric.unit || ''}
            </span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-border">
            <span className="text-muted-foreground">Variação:</span>
            <span className={cn(
              "font-semibold",
              metric.changeType === 'better' ? 'text-emerald-500' : 
              metric.changeType === 'worse' ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const getChangeIcon = (changeType: PeriodMetric['changeType']) => {
  switch (changeType) {
    case 'better':
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case 'worse':
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function PeriodComparisonChart({ 
  data, 
  currentPeriodLabel, 
  previousPeriodLabel,
  onExport 
}: PeriodComparisonChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Prepare chart data with normalized values for visual comparison
  const chartData = data.map(metric => ({
    ...metric,
    name: metric.metric,
    currentNormalized: metric.currentValue,
    previousNormalized: metric.previousValue,
  }));

  const betterCount = data.filter(m => m.changeType === 'better').length;
  const worseCount = data.filter(m => m.changeType === 'worse').length;

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">
            Comparação: {currentPeriodLabel} vs {previousPeriodLabel}
          </CardTitle>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Comparação de métricas entre dois períodos.</p>
              <p>Verde indica melhoria, vermelho indica piora.</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {betterCount} melhoraram
          </Badge>
          <Badge variant="outline" className="bg-destructive/10 text-destructive">
            {worseCount} pioraram
          </Badge>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onExport(chartRef, 'period-comparison')}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef}>
          <div className="h-[200px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="currentNormalized" 
                  name={currentPeriodLabel}
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-current-${index}`} 
                      fill="hsl(var(--primary))"
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey="previousNormalized" 
                  name={previousPeriodLabel}
                  fill="hsl(var(--muted))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed metrics cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.map((metric) => (
              <div 
                key={metric.metric}
                className={cn(
                  "p-4 rounded-lg border",
                  metric.changeType === 'better' 
                    ? 'border-emerald-500/20 bg-emerald-500/5' 
                    : metric.changeType === 'worse'
                    ? 'border-destructive/20 bg-destructive/5'
                    : 'border-border bg-muted/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{metric.metric}</span>
                  {getChangeIcon(metric.changeType)}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {metric.currentValue}{metric.unit || ''}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    metric.changeType === 'better' ? 'text-emerald-500' : 
                    metric.changeType === 'worse' ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Anterior: {metric.previousValue}{metric.unit || ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
