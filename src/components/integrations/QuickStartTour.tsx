import { useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

export const QuickStartTour = () => {
  const { 
    isActive, 
    currentStep, 
    tourSteps, 
    nextStep, 
    prevStep, 
    skipTour, 
    completeTour 
  } = useOnboardingTour();
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const currentTourStep = tourSteps[currentStep];
    if (!currentTourStep) return;

    const targetElement = document.querySelector(`[data-tour="${currentTourStep.target}"]`);
    if (!targetElement || !tooltipRef.current) return;

    // Get target position
    const targetRect = targetElement.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    
    // Calculate tooltip position based on step position preference
    let top = 0;
    let left = 0;

    switch (currentTourStep.position) {
      case 'bottom':
        top = targetRect.bottom + 16;
        left = targetRect.left + (targetRect.width / 2);
        break;
      case 'top':
        top = targetRect.top - tooltip.offsetHeight - 16;
        left = targetRect.left + (targetRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.left - tooltip.offsetWidth - 16;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.right + 16;
        break;
      default:
        top = targetRect.bottom + 16;
        left = targetRect.left + (targetRect.width / 2);
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.transform = 'translateX(-50%)';

    // Highlight target element
    targetElement.classList.add('tour-highlight');
    
    // Scroll target into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return () => {
      targetElement.classList.remove('tour-highlight');
    };
  }, [isActive, currentStep, tourSteps]);

  if (!isActive) return null;

  const currentTourStep = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  };

  return (
    <>
      {/* Overlay with backdrop */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-modal-backdrop"
        onClick={skipTour}
      />
      
      {/* Tooltip Card */}
      <Card 
        ref={tooltipRef}
        className="fixed z-modal w-96 shadow-xl border-2 border-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{currentTourStep?.title}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={skipTour}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          <p className="text-body-sm leading-relaxed">
            {currentTourStep?.description}
          </p>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep 
                    ? 'w-6 bg-primary' 
                    : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} de {tourSteps.length}
            </Badge>
            
            {!isFirstStep && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={prevStep}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
            
            <Button 
              size="sm"
              onClick={handleNext}
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Tour highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 1041;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3);
          border-radius: var(--radius);
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px hsl(var(--primary) / 0.2);
          }
        }
      `}</style>
    </>
  );
};
