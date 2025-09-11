import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceScoreCardProps {
  framework: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  totalControls: number;
  passedControls: number;
}

const statusConfig = {
  excellent: { 
    color: 'compliance-excellent', 
    bgColor: 'success-bg',
    label: 'Excelente'
  },
  good: { 
    color: 'compliance-good', 
    bgColor: 'success-bg',
    label: 'Bom'
  },
  fair: { 
    color: 'compliance-fair', 
    bgColor: 'warning-bg',
    label: 'Regular'
  },
  poor: { 
    color: 'compliance-poor', 
    bgColor: 'danger-bg',
    label: 'Ruim'
  },
  critical: { 
    color: 'compliance-critical', 
    bgColor: 'danger-bg',
    label: 'Crítico'
  }
};

const ComplianceScoreCard: React.FC<ComplianceScoreCardProps> = ({
  framework,
  score,
  trend,
  trendValue,
  status,
  totalControls,
  passedControls
}) => {
  const config = statusConfig[status];
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'muted-foreground';

  return (
    <Card className="border-card-border shadow-card hover:shadow-elevated transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{framework}</CardTitle>
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            `bg-${config.bgColor} text-${config.color}`
          )}>
            {config.label}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-foreground">
            {score}%
          </div>
          <div className={cn(
            'flex items-center space-x-1 text-sm font-medium',
            `text-${trendColor}`
          )}>
            <TrendIcon className="h-4 w-4" />
            <span>{trendValue > 0 ? '+' : ''}{trendValue}%</span>
          </div>
        </div>

        <Progress 
          value={score} 
          className="h-2"
          style={{
            background: `hsl(var(--${config.bgColor}))`,
          }}
        />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{passedControls} de {totalControls} controles</span>
          <span>{((passedControls / totalControls) * 100).toFixed(0)}% completos</span>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Última atualização</span>
            <span>2 min atrás</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceScoreCard;