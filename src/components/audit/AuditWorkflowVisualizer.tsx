import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Clock,
  FileText,
  Upload,
  UserCheck,
  FileCheck,
  PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Audit = Database['public']['Tables']['audits']['Row'];

/**
 * Visual Workflow Visualizer for Audit Process
 * 
 * @component
 * @description
 * Interactive visual representation of the audit workflow showing current status,
 * completed steps, and pending actions with real-time feedback.
 * 
 * **Workflow Stages:**
 * 1. **Planning** (0-25%)
 *    - Define scope
 *    - Assign auditor
 *    - Set timeline
 * 
 * 2. **In Progress** (26-90%)
 *    - Collect evidence
 *    - Review controls
 *    - Document findings
 * 
 * 3. **Review** (91-99%)
 *    - Auditor review
 *    - Stakeholder feedback
 *    - Final adjustments
 * 
 * 4. **Completed** (100%)
 *    - Report generated
 *    - Results delivered
 *    - Archive audit
 * 
 * **Visual Indicators:**
 * - ✅ Green checkmark: Step completed
 * - 🟡 Yellow circle: Current step
 * - ⚪ Gray circle: Pending step
 * - Progress bar: Overall completion
 * 
 * **Example Usage:**
 * ```tsx
 * <AuditWorkflowVisualizer audit={currentAudit} />
 * ```
 */
interface AuditWorkflowVisualizerProps {
  /** The audit to visualize */
  audit: Audit;
  /** Show detailed view */
  detailed?: boolean;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  minProgress: number;
  maxProgress: number;
  status: 'completed' | 'current' | 'pending';
  actions?: string[];
}

const AuditWorkflowVisualizer = ({ audit, detailed = true }: AuditWorkflowVisualizerProps) => {
  const progress = audit.progress || 0;

  /**
   * Determines step status based on progress
   * 
   * @param minProgress - Minimum progress for this step
   * @param maxProgress - Maximum progress for this step
   * @returns Step status
   */
  const getStepStatus = (minProgress: number, maxProgress: number): 'completed' | 'current' | 'pending' => {
    if (progress >= maxProgress) return 'completed';
    if (progress >= minProgress) return 'current';
    return 'pending';
  };

  /**
   * Workflow steps configuration
   */
  const steps: WorkflowStep[] = [
    {
      id: 'planning',
      title: 'Planejamento',
      description: 'Definir escopo e preparar auditoria',
      icon: FileText,
      minProgress: 0,
      maxProgress: 25,
      status: getStepStatus(0, 25),
      actions: [
        'Definir escopo da auditoria',
        'Atribuir auditor responsável',
        'Estabelecer cronograma',
        'Preparar checklist de controles'
      ]
    },
    {
      id: 'in_progress',
      title: 'Execução',
      description: 'Coleta de evidências e verificação',
      icon: PlayCircle,
      minProgress: 26,
      maxProgress: 90,
      status: getStepStatus(26, 90),
      actions: [
        'Upload de evidências',
        'Revisão de controles',
        'Testes de conformidade',
        'Documentação de findings'
      ]
    },
    {
      id: 'review',
      title: 'Revisão',
      description: 'Análise final e validação',
      icon: UserCheck,
      minProgress: 91,
      maxProgress: 99,
      status: getStepStatus(91, 99),
      actions: [
        'Revisão por auditor',
        'Feedback de stakeholders',
        'Ajustes finais',
        'Aprovação de gerência'
      ]
    },
    {
      id: 'completed',
      title: 'Concluída',
      description: 'Relatório final e entrega',
      icon: FileCheck,
      minProgress: 100,
      maxProgress: 100,
      status: getStepStatus(100, 100),
      actions: [
        'Gerar relatório final',
        'Entregar resultados',
        'Arquivar documentação',
        'Agendar próxima auditoria'
      ]
    }
  ];

  /**
   * Gets step icon with appropriate styling
   */
  const getStepIcon = (step: WorkflowStep) => {
    const Icon = step.icon;
    
    if (step.status === 'completed') {
      return <CheckCircle2 className="w-6 h-6 text-success" />;
    }
    if (step.status === 'current') {
      return <Icon className="w-6 h-6 text-primary animate-pulse" />;
    }
    return <Circle className="w-6 h-6 text-muted-foreground" />;
  };

  /**
   * Gets step badge color
   */
  const getStepBadgeColor = (status: string) => {
    const colors = {
      completed: 'bg-success text-success-foreground',
      current: 'bg-primary text-primary-foreground',
      pending: 'bg-muted text-muted-foreground',
    };
    return colors[status as keyof typeof colors];
  };

  /**
   * Gets overall status message
   */
  const getStatusMessage = () => {
    if (progress === 100) return '🎉 Auditoria concluída com sucesso!';
    if (progress >= 90) return '🔍 Em revisão final - quase lá!';
    if (progress >= 50) return '⚡ Ótimo progresso! Continue assim.';
    if (progress >= 25) return '🚀 Auditoria em andamento.';
    return '📋 Fase de planejamento - definindo escopo.';
  };

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Fluxo de Auditoria
          </CardTitle>
          <Badge className={getStepBadgeColor(audit.status || 'planning')}>
            {audit.status === 'planning' && 'Planejamento'}
            {audit.status === 'in_progress' && 'Em Progresso'}
            {audit.status === 'review' && 'Revisão'}
            {audit.status === 'completed' && 'Concluída'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Geral</span>
            <span className="font-bold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {getStatusMessage()}
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              {/* Step Header */}
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn(
                      "font-medium",
                      step.status === 'completed' && "text-success",
                      step.status === 'current' && "text-primary",
                      step.status === 'pending' && "text-muted-foreground"
                    )}>
                      {step.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {step.minProgress}-{step.maxProgress}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>

              {/* Detailed Actions (only for current step if detailed=true) */}
              {detailed && step.status === 'current' && step.actions && (
                <div className="ml-10 pl-4 border-l-2 border-primary space-y-2">
                  <p className="text-xs font-medium text-primary">
                    Ações Necessárias:
                  </p>
                  <ul className="space-y-1">
                    {step.actions.map((action, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {progress < 100 && (
          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Próximas Ações:
            </p>
            <div className="flex gap-2 flex-wrap">
              {progress < 90 && (
                <Button size="sm" variant="outline">
                  <Upload className="w-3 h-3 mr-1" />
                  Upload Evidência
                </Button>
              )}
              {progress >= 90 && progress < 100 && (
                <Button size="sm" variant="outline">
                  <FileCheck className="w-3 h-3 mr-1" />
                  Revisar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditWorkflowVisualizer;
