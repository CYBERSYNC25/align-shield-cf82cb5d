import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useComplianceStatus } from '@/hooks/useComplianceStatus';

const AuditorComplianceSummary = () => {
  const { 
    score, 
    failingTests, 
    passingTests, 
    notConfiguredTests,
    riskAcceptedTests,
    totalTests, 
    isLoading 
  } = useComplianceStatus();

  if (isLoading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-success';
    if (s >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBgColor = (s: number) => {
    if (s >= 80) return 'bg-success/10 border-success/20';
    if (s >= 60) return 'bg-warning/10 border-warning/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excelente';
    if (s >= 80) return 'Bom';
    if (s >= 60) return 'Atenção';
    return 'Crítico';
  };

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Dashboard de Conformidade
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Compliance Score - Large Visual */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Score Circle */}
          <div className={`relative w-36 h-36 rounded-full border-4 ${getScoreBgColor(score)} flex items-center justify-center flex-shrink-0`}>
            <div className="text-center">
              <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score}%
              </span>
              <p className={`text-sm font-medium ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </p>
            </div>
          </div>

          {/* Progress and Stats */}
          <div className="flex-1 w-full space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso Geral</span>
                <span className="font-medium text-foreground">{passingTests.length} de {totalTests} testes</span>
              </div>
              <Progress value={score} className="h-3" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Passing */}
              <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
                <CheckCircle className="h-5 w-5 text-success mx-auto mb-1" />
                <div className="text-xl font-bold text-success">{passingTests.length}</div>
                <div className="text-xs text-muted-foreground">Passando</div>
              </div>

              {/* Failing */}
              <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                <div className="text-xl font-bold text-destructive">{failingTests.length}</div>
                <div className="text-xs text-muted-foreground">Falhando</div>
              </div>

              {/* Risk Accepted */}
              <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-1" />
                <div className="text-xl font-bold text-warning">{riskAcceptedTests.length}</div>
                <div className="text-xs text-muted-foreground">Risco Aceito</div>
              </div>

              {/* Not Configured */}
              <div className="text-center p-3 rounded-lg bg-muted/30 border border-border">
                <Activity className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-xl font-bold text-muted-foreground">{notConfiguredTests.length}</div>
                <div className="text-xs text-muted-foreground">Não Config.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Failing Tests List - Read Only */}
        {failingTests.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Testes Falhando ({failingTests.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {failingTests.map((test) => (
                <div 
                  key={test.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={
                        test.severity === 'critical' 
                          ? 'bg-destructive/10 text-destructive border-destructive/20' 
                          : test.severity === 'high'
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      }
                    >
                      {test.severity === 'critical' ? 'Crítico' : test.severity === 'high' ? 'Alto' : 'Médio'}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{test.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {test.affectedItems.length} afetados
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Passing Message */}
        {failingTests.length === 0 && passingTests.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-medium text-success">Todos os Testes Passando</p>
              <p className="text-sm text-muted-foreground">
                {passingTests.length} verificações de segurança concluídas com sucesso.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditorComplianceSummary;
