import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
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
    bgColor: 'success/10',
    textColor: 'success',
    borderColor: 'success/20',
    label: 'Excelente'
  },
  good: { 
    color: 'compliance-good', 
    bgColor: 'success/10',
    textColor: 'success',
    borderColor: 'success/20',
    label: 'Bom'
  },
  fair: { 
    color: 'compliance-fair', 
    bgColor: 'warning/10',
    textColor: 'warning',
    borderColor: 'warning/20',
    label: 'Regular'
  },
  poor: { 
    color: 'compliance-poor', 
    bgColor: 'danger/10',
    textColor: 'danger',
    borderColor: 'danger/20',
    label: 'Ruim'
  },
  critical: { 
    color: 'compliance-critical', 
    bgColor: 'danger/10',
    textColor: 'danger',
    borderColor: 'danger/20',
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
    <Card className="border-card-border/50 shadow-card hover:shadow-elevated hover-lift bg-surface-elevated/80 backdrop-blur-sm transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {framework}
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              'font-medium border rounded-full px-3 py-1',
              `bg-${config.bgColor} text-${config.textColor} border-${config.borderColor}`
            )}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Score & Trend */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-4xl font-black text-foreground">
              {score}
              <span className="text-lg text-muted-foreground font-semibold">%</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Score de Conformidade
            </p>
          </div>
          <div className={cn(
            'flex items-center space-x-1 px-3 py-2 rounded-full font-semibold text-sm',
            trend === 'up' && 'bg-success/10 text-success',
            trend === 'down' && 'bg-danger/10 text-danger',
            trend === 'stable' && 'bg-muted/20 text-muted-foreground'
          )}>
            <TrendIcon className="h-4 w-4" />
            <span>{trendValue > 0 ? '+' : ''}{trendValue}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={score} 
            className={cn(
              "h-3 bg-muted/30",
              status === 'excellent' && "[&>div]:bg-gradient-to-r [&>div]:from-success [&>div]:to-success-light",
              status === 'good' && "[&>div]:bg-gradient-to-r [&>div]:from-success [&>div]:to-success-light",
              status === 'fair' && "[&>div]:bg-gradient-to-r [&>div]:from-warning [&>div]:to-warning-light",
              (status === 'poor' || status === 'critical') && "[&>div]:bg-gradient-to-r [&>div]:from-danger [&>div]:to-danger-light"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>{passedControls} aprovados</span>
            <span>{totalControls - passedControls} pendentes</span>
          </div>
        </div>

        {/* Controls Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
          <div className="text-center space-y-1">
            <div className="text-lg font-bold text-foreground">
              {totalControls}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Total de Controles
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-lg font-bold text-success">
              {((passedControls / totalControls) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Taxa de Aprovação
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center pt-2">
          <div className="text-xs text-muted-foreground">
            Atualizado há <span className="font-medium text-foreground">2 min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceScoreCard;