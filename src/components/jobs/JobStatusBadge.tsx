import { Clock, Loader2, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { JobStatus } from '@/hooks/useJobQueue';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
  showLabel?: boolean;
}

const statusConfig: Record<JobStatus, {
  label: string;
  icon: typeof Clock;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-600 bg-yellow-50',
  },
  processing: {
    label: 'Processando',
    icon: Loader2,
    variant: 'secondary',
    className: 'border-blue-500 text-blue-600 bg-blue-50',
  },
  completed: {
    label: 'Concluído',
    icon: CheckCircle2,
    variant: 'default',
    className: 'border-green-500 text-green-600 bg-green-50',
  },
  failed: {
    label: 'Falhou',
    icon: XCircle,
    variant: 'destructive',
    className: 'border-red-500 text-red-600 bg-red-50',
  },
  cancelled: {
    label: 'Cancelado',
    icon: Ban,
    variant: 'outline',
    className: 'border-gray-400 text-gray-500 bg-gray-50',
  },
};

export function JobStatusBadge({ 
  status, 
  className,
  showLabel = true 
}: JobStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === 'processing';

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'gap-1.5 font-medium',
        config.className,
        className
      )}
    >
      <Icon 
        className={cn(
          'h-3.5 w-3.5',
          isAnimated && 'animate-spin'
        )} 
      />
      {showLabel && config.label}
    </Badge>
  );
}

// Compact version for inline use
export function JobStatusIcon({ 
  status, 
  className 
}: { 
  status: JobStatus; 
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === 'processing';

  const statusColors: Record<JobStatus, string> = {
    pending: 'text-warning',
    processing: 'text-primary',
    completed: 'text-success',
    failed: 'text-destructive',
    cancelled: 'text-muted-foreground',
  };

  return (
    <Icon 
      className={cn(
        'h-4 w-4',
        statusColors[status],
        isAnimated && 'animate-spin',
        className
      )} 
    />
  );
}
