import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, TrendingUp, Info } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScoreDataPoint, EventAnnotation } from '@/hooks/useAdvancedAnalytics';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ComplianceScoreTimeSeriesProps {
  data: ScoreDataPoint[];
  annotations: EventAnnotation[];
  onDataPointClick: (date: string) => void;
  onExport: (ref: React.RefObject<HTMLDivElement>, filename: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-foreground mb-2">
          {format(parseISO(label), "dd 'de' MMMM", { locale: ptBR })}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Score:</span>
            <span className="font-semibold text-primary">{data.score}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Passando:</span>
            <span className="text-emerald-500">{data.passing}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Falhando:</span>
            <span className="text-destructive">{data.failing}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Risco Aceito:</span>
            <span className="text-warning">{data.riskAccepted}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
          Clique para ver alertas deste dia
        </p>
      </div>
    );
  }
  return null;
};

const getAnnotationColor = (type: EventAnnotation['type']) => {
  switch (type) {
    case 'integration_added':
      return 'hsl(var(--primary))';
    case 'major_fix':
      return 'hsl(142.1 76.2% 36.3%)';
    case 'drift':
    case 'score_drop':
      return 'hsl(var(--destructive))';
    case 'breach_detected':
      return 'hsl(0 84.2% 60.2%)';
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

export function ComplianceScoreTimeSeries({ 
  data, 
  annotations, 
  onDataPointClick,
  onExport 
}: ComplianceScoreTimeSeriesProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.date) {
      onDataPointClick(data.activePayload[0].payload.date);
    }
  };

  // Calculate trend
  const recentData = data.slice(-7);
  const olderData = data.slice(-14, -7);
  const recentAvg = recentData.length > 0 
    ? recentData.reduce((sum, d) => sum + d.score, 0) / recentData.length 
    : 0;
  const olderAvg = olderData.length > 0 
    ? olderData.reduce((sum, d) => sum + d.score, 0) / olderData.length 
    : recentAvg;
  const trend = recentAvg - olderAvg;

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Compliance Score - Últimos 90 Dias</CardTitle>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Evolução do score de compliance ao longo do tempo.</p>
              <p>Clique em um ponto para ver alertas daquele dia.</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex items-center gap-2">
          {trend !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}% esta semana</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onExport(chartRef, 'compliance-score')}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
              />
              
              {/* Event annotations */}
              {annotations.map((annotation, index) => {
                const dataPoint = data.find(d => d.date === annotation.date);
                if (!dataPoint) return null;
                
                return (
                  <ReferenceDot
                    key={index}
                    x={annotation.date}
                    y={dataPoint.score}
                    r={8}
                    fill={getAnnotationColor(annotation.type)}
                    stroke="white"
                    strokeWidth={2}
                    label={{
                      value: annotation.label,
                      position: 'top',
                      fill: 'hsl(var(--foreground))',
                      fontSize: 11,
                      offset: 15,
                    }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend for annotations */}
        {annotations.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">Eventos:</span>
            {annotations.map((annotation, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getAnnotationColor(annotation.type) }}
                />
                <span>{annotation.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
