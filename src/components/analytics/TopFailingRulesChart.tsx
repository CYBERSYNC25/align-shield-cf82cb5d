import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RuleTrend } from '@/hooks/useAdvancedAnalytics';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TopFailingRulesChartProps {
  data: RuleTrend[];
  onExport: (ref: React.RefObject<HTMLDivElement>, filename: string) => void;
}

const TrendIcon = ({ trend }: { trend: RuleTrend['trend'] }) => {
  switch (trend) {
    case 'improving':
      return <TrendingDown className="h-4 w-4 text-emerald-500" />;
    case 'worsening':
      return <TrendingUp className="h-4 w-4 text-destructive" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTrendBadgeVariant = (trend: RuleTrend['trend']) => {
  switch (trend) {
    case 'improving':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'worsening':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
};

export function TopFailingRulesChart({ data, onExport }: TopFailingRulesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const improvingCount = data.filter(r => r.trend === 'improving').length;
  const worseningCount = data.filter(r => r.trend === 'worsening').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Top 10 Regras Falhando</CardTitle>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Regras com mais falhas no período selecionado.</p>
              <p>Compara com o período anterior para mostrar tendência.</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onExport(chartRef, 'top-failing-rules')}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={chartRef}>
          {/* Summary badges */}
          <div className="flex gap-2 mb-4">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="h-3 w-3 mr-1" />
              {improvingCount} melhorando
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive">
              <TrendingUp className="h-3 w-3 mr-1" />
              {worseningCount} piorando
            </Badge>
          </div>

          <ScrollArea className="h-[280px]">
            <div className="space-y-2 pr-4">
              {data.map((rule, index) => (
                <div 
                  key={rule.ruleId}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm">{rule.ruleTitle}</p>
                      <p className="text-xs text-muted-foreground">{rule.integrationName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={cn("flex items-center gap-1", getTrendBadgeVariant(rule.trend))}
                    >
                      <TrendIcon trend={rule.trend} />
                      <span>{Math.abs(rule.percentChange)}%</span>
                    </Badge>
                    
                    <div className="text-right text-sm w-20">
                      <span className="text-muted-foreground">{rule.previousPeriodFails}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className={cn(
                        "font-semibold",
                        rule.trend === 'improving' ? 'text-emerald-500' : 
                        rule.trend === 'worsening' ? 'text-destructive' : 'text-foreground'
                      )}>
                        {rule.currentPeriodFails}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-emerald-500" />
              <span>Melhorando</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-destructive" />
              <span>Piorando</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span>Estável</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
