import { Bell, AlertTriangle, CheckCircle, Clock, ShieldAlert, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useComplianceAlerts, ComplianceAlert } from '@/hooks/useComplianceAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const severityConfig = {
  critical: {
    color: 'bg-danger text-danger-foreground',
    icon: ShieldAlert,
    label: 'Crítico',
  },
  high: {
    color: 'bg-warning text-warning-foreground',
    icon: AlertTriangle,
    label: 'Alto',
  },
  medium: {
    color: 'bg-amber-500 text-white',
    icon: Clock,
    label: 'Médio',
  },
  low: {
    color: 'bg-muted text-muted-foreground',
    icon: Bell,
    label: 'Baixo',
  },
};

function AlertItem({ 
  alert, 
  onAcknowledge 
}: { 
  alert: ComplianceAlert; 
  onAcknowledge: (id: string) => void;
}) {
  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-colors",
      alert.acknowledged 
        ? "bg-muted/30 border-border/50" 
        : "bg-background border-danger/30 hover:border-danger/50"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-1.5 rounded-md", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{alert.rule_title}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {alert.integration_name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {alert.affected_resources} recurso(s) afetado(s)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(alert.triggered_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </p>
        </div>
        {!alert.acknowledged && (
          <Button 
            size="sm" 
            variant="outline" 
            className="shrink-0 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onAcknowledge(alert.id);
            }}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            OK
          </Button>
        )}
      </div>
    </div>
  );
}

export function ComplianceAlertsBadge() {
  const navigate = useNavigate();
  const { 
    unacknowledgedAlerts, 
    criticalCount, 
    unacknowledgedCount,
    acknowledgeAlert,
    isAcknowledging,
  } = useComplianceAlerts();

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
  };

  const hasCritical = criticalCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative hover-scale",
            hasCritical && "text-danger hover:text-danger"
          )}
        >
          <ShieldAlert className={cn("h-5 w-5", hasCritical && "animate-pulse")} />
          {unacknowledgedCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full",
              hasCritical 
                ? "bg-danger text-danger-foreground" 
                : "bg-warning text-warning-foreground"
            )}>
              {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-surface-elevated/95 backdrop-blur-sm border-card-border/50 shadow-lg"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-danger" />
            <span>Alertas de Compliance</span>
          </div>
          {hasCritical && (
            <Badge variant="destructive" className="text-[10px]">
              {criticalCount} crítico(s)
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {unacknowledgedCount === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
            <p className="text-sm font-medium">Nenhum alerta pendente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Todos os controles estão em conformidade
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-2">
              {unacknowledgedAlerts.slice(0, 5).map((alert) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={handleAcknowledge}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {unacknowledgedCount > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center justify-center text-primary cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              Ver todos os {unacknowledgedCount} alertas
              <ChevronRight className="h-4 w-4 ml-1" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
