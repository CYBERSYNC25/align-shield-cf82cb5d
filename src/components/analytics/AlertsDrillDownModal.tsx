import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  rule_id: string;
  rule_title: string;
  integration_name: string;
  severity: string;
  new_status: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
  time_to_resolve_hours?: number;
}

interface AlertsDrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  fetchAlerts: (date: Date) => Promise<Alert[]>;
}

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-yellow-500 text-black';
    case 'low':
      return 'bg-emerald-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function AlertsDrillDownModal({ 
  open, 
  onOpenChange, 
  date,
  fetchAlerts
}: AlertsDrillDownModalProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && date) {
      setIsLoading(true);
      fetchAlerts(date)
        .then(setAlerts)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [open, date, fetchAlerts]);

  const criticalCount = alerts.filter(a => a.severity?.toLowerCase() === 'critical').length;
  const highCount = alerts.filter(a => a.severity?.toLowerCase() === 'high').length;
  const mediumCount = alerts.filter(a => a.severity?.toLowerCase() === 'medium').length;
  const lowCount = alerts.filter(a => a.severity?.toLowerCase() === 'low').length;
  const resolvedCount = alerts.filter(a => a.resolved).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Alertas de {date && format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-border">
              {criticalCount > 0 && (
                <Badge className={getSeverityColor('critical')}>
                  {criticalCount} Crítico{criticalCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {highCount > 0 && (
                <Badge className={getSeverityColor('high')}>
                  {highCount} Alto{highCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {mediumCount > 0 && (
                <Badge className={getSeverityColor('medium')}>
                  {mediumCount} Médio{mediumCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge className={getSeverityColor('low')}>
                  {lowCount} Baixo{lowCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="outline" className="ml-auto">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {resolvedCount}/{alerts.length} resolvidos
              </Badge>
            </div>

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold">Nenhum alerta neste dia</h3>
                <p className="text-muted-foreground">
                  Não foram registrados alertas de compliance nesta data.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-4 rounded-lg border transition-colors",
                        alert.resolved 
                          ? "border-emerald-500/20 bg-emerald-500/5" 
                          : "border-border bg-card hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                              {alert.severity}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolvido
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm">{alert.rule_title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.integration_name}
                          </p>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(alert.created_at), 'HH:mm')}
                          </p>
                          {alert.time_to_resolve_hours && alert.resolved && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{alert.time_to_resolve_hours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button asChild>
                <a href="/readiness" className="flex items-center gap-2">
                  Ver Todos os Alertas
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
