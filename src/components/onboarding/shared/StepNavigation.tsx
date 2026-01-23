import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isUpdating: boolean;
  onNext: () => void;
  onPrev: () => void;
  onComplete?: () => void;
  nextLabel?: string;
  showBack?: boolean;
}

const StepNavigation = ({
  currentStep,
  totalSteps,
  canProceed,
  isUpdating,
  onNext,
  onPrev,
  onComplete,
  nextLabel,
  showBack = true,
}: StepNavigationProps) => {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto mt-8 px-4">
      <div>
        {showBack && !isFirstStep && (
          <Button
            variant="ghost"
            onClick={onPrev}
            disabled={isUpdating}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        )}
      </div>

      <Button
        onClick={handleNext}
        disabled={!canProceed || isUpdating}
        className="gap-2 min-w-[140px]"
      >
        {isUpdating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            {nextLabel || (isLastStep ? 'Ir para Dashboard' : 'Continuar')}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </>
        )}
      </Button>
    </div>
  );
};

export default StepNavigation;
