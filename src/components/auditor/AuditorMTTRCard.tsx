import { Timer, TrendingDown, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useMTTRMetrics } from '@/hooks/useMTTRMetrics';

export function AuditorMTTRCard() {
  const { mttrData, isLoading } = useMTTRMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSLAComplianceColor = (rate: number) => {
    if (rate >= 90) return 'bg-success text-success-foreground';
    if (rate >= 70) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getSLAProgressColor = (rate: number) => {
    if (rate >= 90) return 'bg-success';
    if (rate >= 70) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <CardTitle>Tempo Médio de Reparo (MTTR)</CardTitle>
        </div>
        <CardDescription>
          Métrica que demonstra a agilidade da organização na correção de vulnerabilidades detectadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MTTR by Severity */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
            <TrendingDown className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{mttrData.overall}</div>
            <div className="text-xs text-muted-foreground">MTTR Geral</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <Clock className="h-4 w-4 text-destructive mx-auto mb-2" />
            <div className="text-xl font-bold text-destructive">{mttrData.critical}</div>
            <div className="text-xs text-muted-foreground">Críticos</div>
            <div className="text-[10px] text-muted-foreground mt-1">SLA: 24h</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <Clock className="h-4 w-4 text-orange-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-orange-500">{mttrData.high}</div>
            <div className="text-xs text-muted-foreground">Altos</div>
            <div className="text-[10px] text-muted-foreground mt-1">SLA: 7 dias</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/20">
            <Clock className="h-4 w-4 text-warning mx-auto mb-2" />
            <div className="text-xl font-bold text-warning">{mttrData.medium}</div>
            <div className="text-xs text-muted-foreground">Médios</div>
            <div className="text-[10px] text-muted-foreground mt-1">SLA: 30 dias</div>
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Taxa de Cumprimento do SLA</span>
            </div>
            <Badge className={getSLAComplianceColor(mttrData.slaComplianceRate)}>
              {mttrData.slaComplianceRate}%
            </Badge>
          </div>
          <Progress 
            value={mttrData.slaComplianceRate} 
            className={`h-2 ${getSLAProgressColor(mttrData.slaComplianceRate)}`} 
          />
          <p className="text-xs text-muted-foreground mt-2">
            {mttrData.resolvedCount} alertas resolvidos • {mttrData.overdueCount} atrasados
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold text-foreground">{mttrData.totalAlerts}</div>
            <div className="text-xs text-muted-foreground">Total de Alertas</div>
          </div>
          <div className="p-3 rounded-lg bg-success/10">
            <div className="text-lg font-semibold text-success">{mttrData.resolvedCount}</div>
            <div className="text-xs text-muted-foreground">Resolvidos</div>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10">
            <div className="text-lg font-semibold text-destructive">{mttrData.overdueCount}</div>
            <div className="text-xs text-muted-foreground">Atrasados</div>
          </div>
        </div>

        {/* Explanation for Auditors */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p className="font-medium mb-1">📊 Sobre esta Métrica:</p>
          <p>
            O MTTR (Mean Time To Repair) indica o tempo médio que a organização leva para corrigir 
            vulnerabilidades após sua detecção. Valores menores indicam maior agilidade na resposta 
            a incidentes de segurança. A taxa de cumprimento do SLA mostra o percentual de alertas 
            resolvidos dentro do prazo estabelecido para cada severidade.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AuditorMTTRCard;
