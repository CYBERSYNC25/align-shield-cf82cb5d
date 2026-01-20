import { useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Info } from 'lucide-react';
import { HeatmapCell } from '@/hooks/useAdvancedAnalytics';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ComplianceHeatmapProps {
  data: HeatmapCell[];
  onExport: (ref: React.RefObject<HTMLDivElement>, filename: string) => void;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getHeatColor = (count: number, maxCount: number): string => {
  if (count === 0) return 'hsl(var(--muted) / 0.3)';
  
  const intensity = count / maxCount;
  
  if (intensity < 0.25) {
    return 'hsl(142.1 76.2% 36.3% / 0.4)'; // Green
  } else if (intensity < 0.5) {
    return 'hsl(47.9 95.8% 53.1% / 0.6)'; // Yellow
  } else if (intensity < 0.75) {
    return 'hsl(24.6 95% 53.1% / 0.7)'; // Orange
  } else {
    return 'hsl(0 84.2% 60.2% / 0.8)'; // Red
  }
};

export function ComplianceHeatmap({ data, onExport }: ComplianceHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const { maxCount, totalAlerts, peakHour, peakDay } = useMemo(() => {
    const max = Math.max(...data.map(d => d.count), 1);
    const total = data.reduce((sum, d) => sum + d.count, 0);
    
    // Find peak
    const peak = data.reduce((max, cell) => cell.count > max.count ? cell : max, { count: 0, day: 0, hour: 0 });
    
    return { 
      maxCount: max, 
      totalAlerts: total,
      peakHour: peak.hour,
      peakDay: DAYS[peak.day],
    };
  }, [data]);

  // Group data by hour for rendering
  const heatmapGrid = useMemo(() => {
    const grid: HeatmapCell[][] = [];
    for (let hour = 0; hour < 24; hour++) {
      grid[hour] = [];
      for (let day = 0; day < 7; day++) {
        const cell = data.find(d => d.hour === hour && d.day === day);
        grid[hour][day] = cell || { hour, day, count: 0 };
      }
    }
    return grid;
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Heatmap de Alertas</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Distribuição de alertas por dia da semana e hora.</p>
              <p>Cores mais intensas indicam maior concentração.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Pico: <span className="font-semibold text-foreground">{peakDay} {peakHour}h</span>
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onExport(chartRef, 'compliance-heatmap')}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="space-y-2">
          {/* Header - Days */}
          <div className="flex">
            <div className="w-10 flex-shrink-0" /> {/* Spacer for hour labels */}
            <div className="flex-1 grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="flex flex-col gap-0.5">
            {HOURS.filter(h => h % 3 === 0).map((hour) => (
              <div key={hour} className="flex items-center gap-1">
                <div className="w-10 text-right text-xs text-muted-foreground flex-shrink-0">
                  {String(hour).padStart(2, '0')}h
                </div>
                <div className="flex-1 grid grid-cols-7 gap-0.5">
                  {DAYS.map((_, dayIndex) => {
                    // Aggregate 3 hours
                    const cells = [
                      heatmapGrid[hour]?.[dayIndex],
                      heatmapGrid[hour + 1]?.[dayIndex],
                      heatmapGrid[hour + 2]?.[dayIndex],
                    ].filter(Boolean);
                    const count = cells.reduce((sum, c) => sum + (c?.count || 0), 0);
                    
                    return (
                      <Tooltip key={`${hour}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "h-6 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1",
                            )}
                            style={{ 
                              backgroundColor: getHeatColor(count, maxCount * 3),
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{DAYS[dayIndex]} {hour}h - {hour + 2}h</p>
                          <p className="text-muted-foreground">{count} alertas</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Menos</span>
              <div className="flex gap-0.5">
                {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                  <div 
                    key={intensity}
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: getHeatColor(intensity * maxCount, maxCount) }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Mais</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{totalAlerts} alertas</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
