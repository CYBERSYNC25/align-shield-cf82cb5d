import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useTasks } from '@/hooks/useTasks';
import { useAudits } from '@/hooks/useAudits';
import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

const PerformanceKPIs = () => {
  const { frameworks } = useFrameworks();
  const { tasks } = useTasks();
  const { audits } = useAudits();

  const kpis = useMemo(() => {
    const avgCompliance = frameworks.length > 0 
      ? Math.round(frameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / frameworks.length)
      : 0;
    
    const completionRate = tasks.length > 0 
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0;

    const completedAudits = audits.filter(a => a.status === 'completed').length;
    const auditRate = audits.length > 0 ? Math.round((completedAudits / audits.length) * 100) : 0;

    return { avgCompliance, completionRate, auditRate, totalAudits: audits.length, completedAudits };
  }, [frameworks, tasks, audits]);

  const hasData = frameworks.length > 0 || tasks.length > 0 || audits.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPIs de Performance</CardTitle>
        <Badge variant="secondary" className="w-fit">
          Indicadores chave
        </Badge>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Sem dados suficientes</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Cadastre frameworks, tarefas e auditorias para visualizar os KPIs de performance.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{kpis.avgCompliance}%</div>
              <div className="text-xs text-muted-foreground mt-1">Compliance Médio</div>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{kpis.completionRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Tarefas Concluídas</div>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-info">{kpis.completedAudits}/{kpis.totalAudits}</div>
              <div className="text-xs text-muted-foreground mt-1">Auditorias</div>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">{kpis.auditRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Taxa Auditorias</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceKPIs;
