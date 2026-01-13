import { 
  History, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAllCheckHistory, ComplianceCheckHistory } from '@/hooks/useCheckHistory';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function CheckHistoryItem({ check }: { check: ComplianceCheckHistory }) {
  const hasDrift = check.drift_detected;
  const scoreColor = check.score >= 80 ? 'text-success' : check.score >= 60 ? 'text-warning' : 'text-danger';

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-colors",
      hasDrift 
        ? "border-warning/50 bg-warning/5" 
        : "border-border/50 bg-muted/20"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {hasDrift ? (
            <AlertTriangle className="h-5 w-5 text-warning" />
          ) : (
            <CheckCircle className="h-5 w-5 text-success" />
          )}
          <div>
            <p className="font-medium text-sm">
              Verificação #{check.id.slice(0, 8)}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(check.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", scoreColor)}>
            {check.score}%
          </div>
          <Badge variant="outline" className="text-[10px]">
            {check.triggered_by === 'scheduled' ? 'Automática' : 'Manual'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 rounded bg-success/10">
          <p className="text-lg font-semibold text-success">{check.passing_count}</p>
          <p className="text-[10px] text-muted-foreground">Aprovados</p>
        </div>
        <div className="text-center p-2 rounded bg-danger/10">
          <p className="text-lg font-semibold text-danger">{check.failing_count}</p>
          <p className="text-[10px] text-muted-foreground">Reprovados</p>
        </div>
        <div className="text-center p-2 rounded bg-muted/50">
          <p className="text-lg font-semibold">{check.total_rules_checked}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </div>

      {check.integrations_checked && check.integrations_checked.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {check.integrations_checked.map((integration) => (
            <Badge key={integration} variant="secondary" className="text-[10px]">
              {integration}
            </Badge>
          ))}
        </div>
      )}

      {hasDrift && check.drift_details && check.drift_details.length > 0 && (
        <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/30">
          <p className="text-xs font-medium text-warning flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3" />
            Drift Detectado
          </p>
          {check.drift_details.map((drift, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              • {drift.title}: {drift.previousStatus} → {drift.newStatus}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditorVerificationHistory() {
  const { checkHistory, isLoading } = useAllCheckHistory(10);

  // Calculate stats
  const totalChecks = checkHistory.length;
  const checksWithDrift = checkHistory.filter(c => c.drift_detected).length;
  const averageScore = totalChecks > 0 
    ? Math.round(checkHistory.reduce((acc, c) => acc + c.score, 0) / totalChecks)
    : 0;
  const lastCheck = checkHistory[0];

  // Score trend (compare last 2 checks)
  const scoreTrend = checkHistory.length >= 2 
    ? checkHistory[0].score - checkHistory[1].score 
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Histórico de Verificações
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <RefreshCw className="h-3 w-3 mr-1" />
            Monitoramento Automático
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          O sistema executa verificações periódicas de compliance em todas as integrações conectadas.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalChecks}</p>
            <p className="text-xs text-muted-foreground">Verificações</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className={cn(
              "flex items-center justify-center gap-1 text-2xl font-bold",
              averageScore >= 80 ? "text-success" : averageScore >= 60 ? "text-warning" : "text-danger"
            )}>
              {averageScore}%
              {scoreTrend > 0 && <TrendingUp className="h-4 w-4" />}
              {scoreTrend < 0 && <TrendingDown className="h-4 w-4" />}
            </div>
            <p className="text-xs text-muted-foreground">Score Médio</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <AlertTriangle className={cn(
              "h-5 w-5 mx-auto mb-1",
              checksWithDrift > 0 ? "text-warning" : "text-muted-foreground"
            )} />
            <p className="text-2xl font-bold">{checksWithDrift}</p>
            <p className="text-xs text-muted-foreground">Com Drift</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-medium">
              {lastCheck 
                ? formatDistanceToNow(new Date(lastCheck.created_at), { addSuffix: true, locale: ptBR })
                : 'N/A'
              }
            </p>
            <p className="text-xs text-muted-foreground">Última Verificação</p>
          </div>
        </div>

        <Separator />

        {/* Timeline */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Timeline de Verificações
          </h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : checkHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma verificação registrada ainda</p>
              <p className="text-xs mt-1">As verificações serão exibidas aqui após a sincronização das integrações</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {checkHistory.map((check) => (
                  <CheckHistoryItem key={check.id} check={check} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer note */}
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            <Shield className="h-3 w-3 inline mr-1" />
            Este histórico comprova que o sistema realiza monitoramento contínuo e automático dos controles de segurança.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
