import { motion } from 'framer-motion';
import { Check, Sparkles, Layers, Plug, Search, CheckSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: 'welcome', title: 'Bem-vindo', icon: Sparkles },
  { id: 'frameworks', title: 'Frameworks', icon: Layers },
  { id: 'integration', title: 'Integração', icon: Plug },
  { id: 'scan', title: 'Primeiro Scan', icon: Search },
  { id: 'next-steps', title: 'Próximos Passos', icon: CheckSquare },
];

interface OnboardingProgressProps {
  currentStep: number;
  progress: number;
}

const OnboardingProgress = ({ currentStep, progress }: OnboardingProgressProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Steps indicator */}
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <motion.div
              key={step.id}
              className="flex flex-col items-center gap-2 flex-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary/20 border-2 border-primary text-primary',
                  isPending && 'bg-muted text-muted-foreground'
                )}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs font-medium hidden md:block text-center',
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Connecting lines */}
      <div className="relative mb-2">
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-full" />
        <motion.div
          className="absolute top-0 left-0 h-1 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Progress text */}
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Passo {currentStep + 1} de {steps.length}</span>
        <span>{Math.round(progress)}% completo</span>
      </div>
    </div>
  );
};

export default OnboardingProgress;
