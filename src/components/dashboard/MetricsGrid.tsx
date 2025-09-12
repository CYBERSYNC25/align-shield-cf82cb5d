import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users,
  Target,
  TrendingUp 
} from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useRisks } from '@/hooks/useRisks';
import { useAudits } from '@/hooks/useAudits';
import { useTasks } from '@/hooks/useTasks';
import { usePolicies } from '@/hooks/usePolicies';
import { useMemo } from 'react';

const MetricsGrid = () => {
  const { frameworks } = useFrameworks();
  const { risks } = useRisks();
  const { audits } = useAudits();
  const { tasks } = useTasks();
  const { policies } = usePolicies();

  const metricsData = useMemo(() => {
    // Calculate active controls from frameworks
    const totalControls = frameworks.reduce((sum, framework) => sum + (framework.total_controls || 0), 0);
    
    // Calculate completed audits
    const completedAudits = audits.filter(audit => audit.status === 'completed').length;
    const auditProgress = audits.length > 0 ? Math.round((completedAudits / audits.length) * 100) : 0;
    
    // Calculate pending tasks
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const taskProgress = tasks.length > 0 ? Math.round(((tasks.length - pendingTasks) / tasks.length) * 100) : 0;
    
    // Calculate active policies
    const activePolicies = policies.filter(policy => policy.status === 'active').length;
    const policyProgress = policies.length > 0 ? Math.round((activePolicies / policies.length) * 100) : 0;
    
    // Risk distribution
    const highRisks = risks.filter(risk => risk.level === 'high').length;
    const riskProgress = risks.length > 0 ? Math.max(0, 100 - Math.round((highRisks / risks.length) * 100)) : 100;

    return [
      {
        title: "Controles Ativos",
        value: totalControls.toString(),
        change: "+12%",
        icon: Shield,
        color: "text-success",
        bgColor: "bg-success/10",
        progress: Math.min(100, Math.round((totalControls / 200) * 100)) // Assuming 200 is target
      },
      {
        title: "Riscos Identificados", 
        value: risks.length.toString(),
        change: highRisks > 0 ? "+8%" : "-5%",
        icon: AlertTriangle,
        color: highRisks > 0 ? "text-danger" : "text-warning",
        bgColor: highRisks > 0 ? "bg-danger/10" : "bg-warning/10",
        progress: riskProgress
      },
      {
        title: "Auditorias Concluídas",
        value: completedAudits.toString(),
        change: "+25%", 
        icon: CheckCircle,
        color: "text-success",
        bgColor: "bg-success/10",
        progress: auditProgress
      },
      {
        title: "Tarefas Pendentes",
        value: pendingTasks.toString(),
        change: pendingTasks > 10 ? "+5%" : "-12%",
        icon: Clock,
        color: pendingTasks > 10 ? "text-danger" : "text-success",
        bgColor: pendingTasks > 10 ? "bg-danger/10" : "bg-success/10", 
        progress: taskProgress
      },
      {
        title: "Políticas Ativas",
        value: activePolicies.toString(),
        change: "+3%",
        icon: FileText,
        color: "text-primary",
        bgColor: "bg-primary/10",
        progress: policyProgress
      },
      {
        title: "Taxa de Compliance",
        value: frameworks.length > 0 ? 
          Math.round(frameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / frameworks.length) + "%" : 
          "0%",
        change: "+15%",
        icon: Target,
        color: "text-success",
        bgColor: "bg-success/10",
        progress: frameworks.length > 0 ? 
          Math.round(frameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / frameworks.length) : 0
      }
    ];
  }, [frameworks, risks, audits, tasks, policies]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricsData.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden hover-glow transition-all duration-200">
          <div className={`absolute inset-0 ${metric.bgColor} opacity-50`} />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          
          <CardContent className="relative">
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <Badge 
                variant={metric.change.startsWith('+') ? "default" : "destructive"}
                className="text-xs"
              >
                {metric.change}
              </Badge>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{metric.progress}%</span>
              </div>
              <Progress value={metric.progress} className="h-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsGrid;