import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSLACountdown, SLA_LABELS, SeverityLevel } from '@/hooks/useSLATracking';
import { cn } from '@/lib/utils';

interface SLACountdownProps {
  deadline: Date | string | null;
  severity?: SeverityLevel;
  triggeredAt?: Date | string | null;
  slaHours?: number | null;
  compact?: boolean;
}

export function SLACountdown({ 
  deadline, 
  severity = 'medium',
  triggeredAt,
  slaHours,
  compact = false 
}: SLACountdownProps) {
  // Calculate deadline if not provided
  let actualDeadline = deadline;
  if (!actualDeadline && triggeredAt && severity) {
    const slaHoursValue = slaHours || {
      critical: 24,
      high: 168,
      medium: 720,
      low: 2160,
    }[severity] || 720;
    
    const triggered = typeof triggeredAt === 'string' ? new Date(triggeredAt) : triggeredAt;
    actualDeadline = new Date(triggered.getTime() + slaHoursValue * 60 * 60 * 1000);
  }

  const { timeRemaining, isOverdue } = useSLACountdown(actualDeadline);

  // Calculate urgency based on percentage of SLA used
  const getUrgencyStyle = () => {
    if (isOverdue) {
      return 'bg-destructive text-destructive-foreground animate-pulse';
    }

    if (!actualDeadline) return 'bg-muted text-muted-foreground';

    const deadlineDate = typeof actualDeadline === 'string' ? new Date(actualDeadline) : actualDeadline;
    const now = Date.now();
    const timeRemainingMs = deadlineDate.getTime() - now;
    const slaMs = (slaHours || {
      critical: 24,
      high: 168,
      medium: 720,
      low: 2160,
    }[severity] || 720) * 60 * 60 * 1000;
    
    const percentageUsed = 1 - (timeRemainingMs / slaMs);

    if (percentageUsed >= 0.9) {
      return 'bg-destructive/20 text-destructive border-destructive/30';
    }
    if (percentageUsed >= 0.75) {
      return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
    }
    return 'bg-muted text-muted-foreground border-border';
  };

  if (!actualDeadline) {
    return null;
  }

  const formattedDeadline = typeof actualDeadline === 'string' 
    ? new Date(actualDeadline).toLocaleString('pt-BR') 
    : actualDeadline.toLocaleString('pt-BR');

  if (isOverdue) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className={cn(
                'gap-1 cursor-default',
                getUrgencyStyle(),
                compact && 'text-xs px-1.5 py-0.5'
              )}
            >
              <AlertTriangle className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />
              {compact ? 'ATRASADO' : timeRemaining}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              <strong>SLA Expirado</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Prazo: {formattedDeadline}
            </p>
            <p className="text-xs text-muted-foreground">
              SLA: {SLA_LABELS[severity]}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline"
            className={cn(
              'gap-1 cursor-default',
              getUrgencyStyle(),
              compact && 'text-xs px-1.5 py-0.5'
            )}
          >
            <Clock className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />
            {timeRemaining}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            <strong>Prazo de Correção</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Vence em: {formattedDeadline}
          </p>
          <p className="text-xs text-muted-foreground">
            SLA ({severity}): {SLA_LABELS[severity]}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
