import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Info } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { IntegrationHealthPoint } from '@/hooks/useAdvancedAnalytics';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IntegrationHealthTimeSeriesProps {
  data: IntegrationHealthPoint[];
  onExport: (ref: React.RefObject<HTMLDivElement>, filename: string) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  AWS: '#FF9900',
  Azure: '#0078D4',
  Google: '#4285F4',
  GitHub: '#24292F',
  Okta: '#007DC1',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-foreground mb-2">
          {format(parseISO(label), 'dd/MM/yyyy')}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-semibold">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function IntegrationHealthTimeSeries({ data, onExport }: IntegrationHealthTimeSeriesProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set());

  const providers = Object.keys(PROVIDER_COLORS);

  const toggleProvider = (provider: string) => {
    setHiddenProviders(prev => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  // Calculate average health
  const avgHealth = data.length > 0
    ? Math.round(
        data.reduce((sum, point) => {
          const values = providers
            .filter(p => !hiddenProviders.has(p))
            .map(p => (point[p] as number) || 0);
          return sum + (values.reduce((s, v) => s + v, 0) / values.length);
        }, 0) / data.length
      )
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Saúde das Integrações</CardTitle>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Health score das integrações ao longo do tempo.</p>
              <p>Clique na legenda para ocultar/mostrar linhas.</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Média: <span className="font-semibold text-foreground">{avgHealth}%</span>
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onExport(chartRef, 'integration-health')}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
              
              {providers.map((provider) => (
                <Line
                  key={provider}
                  type="monotone"
                  dataKey={provider}
                  name={provider}
                  stroke={PROVIDER_COLORS[provider]}
                  strokeWidth={2}
                  dot={false}
                  hide={hiddenProviders.has(provider)}
                  activeDot={{ r: 4, fill: PROVIDER_COLORS[provider], stroke: 'white', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          {providers.map((provider) => (
            <button
              key={provider}
              onClick={() => toggleProvider(provider)}
              className={cn(
                "flex items-center gap-2 text-sm px-2 py-1 rounded-md transition-colors",
                hiddenProviders.has(provider) 
                  ? "opacity-40 hover:opacity-60" 
                  : "hover:bg-accent"
              )}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: PROVIDER_COLORS[provider] }}
              />
              <span className={hiddenProviders.has(provider) ? 'line-through' : ''}>
                {provider}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
