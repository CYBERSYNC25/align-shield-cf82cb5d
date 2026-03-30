import { motion } from 'framer-motion';
import { Users, Clock, Plug, FileText, Calendar, Check, ExternalLink, PartyPopper } from 'lucide-react';
import StepContainer from '../shared/StepContainer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

const nextSteps: NextStep[] = [
  {
    id: 'invite-team',
    title: 'Convide sua Equipe',
    description: 'Adicione membros para colaborar na conformidade',
    icon: Users,
    link: '/settings?tab=permissions',
    action: 'Convidar Membros',
    priority: 'high',
  },
  {
    id: 'configure-slas',
    title: 'Configure SLAs',
    description: 'Defina prazos de remediação por severidade',
    icon: Clock,
    link: '/settings?tab=system',
    action: 'Configurar',
    priority: 'medium',
  },
  {
    id: 'more-integrations',
    title: 'Conecte Mais Integrações',
    description: 'Quanto mais integrações, maior a visibilidade',
    icon: Plug,
    link: '/integrations',
    action: 'Ver Catálogo',
    priority: 'medium',
  },
  {
    id: 'review-policies',
    title: 'Revise Políticas',
    description: 'Personalize políticas de segurança da empresa',
    icon: FileText,
    link: '/policies',
    action: 'Ver Políticas',
    priority: 'low',
  },
  {
    id: 'schedule-audit',
    title: 'Agende uma Auditoria',
    description: 'Prepare-se para certificações com auditorias internas',
    icon: Calendar,
    link: '/audit',
    action: 'Agendar',
    priority: 'low',
  },
];

const priorityColors = {
  high: 'border-l-primary',
  medium: 'border-l-yellow-500',
  low: 'border-l-muted-foreground',
};

interface NextStepsStepProps {
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
}

const NextStepsStep = ({ completedSteps, onToggleStep }: NextStepsStepProps) => {
  const navigate = useNavigate();

  const handleAction = (link: string) => {
    // Navega para a página correspondente
    navigate(link);
  };

  return (
    <StepContainer>
      {/* Celebration header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          <PartyPopper className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-2">Você está quase lá! 🎉</h2>
        <p className="text-muted-foreground">
          Complete estas tarefas para aproveitar ao máximo o Compliance Sync
        </p>
      </motion.div>

      {/* Checklist */}
      <div className="w-full max-w-2xl space-y-3">
        {nextSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 border-l-4 transition-all',
                priorityColors[step.priority],
                isCompleted
                  ? 'bg-muted/50 border-muted'
                  : 'bg-card border-border hover:border-primary/30'
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggleStep(step.id)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                  isCompleted
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground hover:border-primary'
                )}
              >
                {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    'w-4 h-4',
                    isCompleted ? 'text-muted-foreground' : 'text-primary'
                  )} />
                  <h3 className={cn(
                    'font-medium',
                    isCompleted && 'line-through text-muted-foreground'
                  )}>
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>

              {/* Action button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(step.link)}
                className="flex-shrink-0 gap-1"
                disabled={isCompleted}
              >
                {step.action}
                <ExternalLink className="w-3 h-3" />
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {completedSteps.length} de {nextSteps.length} tarefas concluídas
        </p>
        <div className="w-48 h-2 bg-muted rounded-full mx-auto mt-2 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedSteps.length / nextSteps.length) * 100}%` }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </div>
      </motion.div>
    </StepContainer>
  );
};

export default NextStepsStep;
