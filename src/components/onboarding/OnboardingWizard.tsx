import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOnboardingWizard } from '@/hooks/useOnboardingWizard';
import OnboardingProgress from './OnboardingProgress';
import StepNavigation from './shared/StepNavigation';
import SkipButton from './shared/SkipButton';
import WelcomeStep from './steps/WelcomeStep';
import FrameworksStep from './steps/FrameworksStep';
import IntegrationStep from './steps/IntegrationStep';
import FirstScanStep from './steps/FirstScanStep';
import NextStepsStep from './steps/NextStepsStep';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const {
    state,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    updateData,
    canProceed,
    stepProgress,
    totalSteps,
    isUpdating,
  } = useOnboardingWizard();

  const handleSkip = async () => {
    await skipOnboarding();
    navigate('/dashboard');
  };

  const handleComplete = async () => {
    await completeOnboarding();
    navigate('/dashboard');
  };

  const handleFrameworkSelect = (frameworks: string[]) => {
    updateData({ selectedFrameworks: frameworks });
  };

  const handleIntegrationConnect = (integrationId: string) => {
    updateData({ connectedIntegration: integrationId });
  };

  const handleScanComplete = (results: { score: number; passing: number; failing: number }) => {
    updateData({
      firstScanCompleted: true,
      firstScanResults: results,
    });
  };

  const handleToggleNextStep = (stepId: string) => {
    const current = state.data.completedNextSteps || [];
    const updated = current.includes(stepId)
      ? current.filter((id) => id !== stepId)
      : [...current, stepId];
    updateData({ completedNextSteps: updated });
  };

  if (state.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <WelcomeStep key="welcome" />;
      case 1:
        return (
          <FrameworksStep
            key="frameworks"
            selectedFrameworks={state.data.selectedFrameworks}
            onSelect={handleFrameworkSelect}
          />
        );
      case 2:
        return (
          <IntegrationStep
            key="integration"
            connectedIntegration={state.data.connectedIntegration}
            onConnect={handleIntegrationConnect}
          />
        );
      case 3:
        return (
          <FirstScanStep
            key="scan"
            scanCompleted={state.data.firstScanCompleted}
            scanResults={state.data.firstScanResults}
            onScanComplete={handleScanComplete}
          />
        );
      case 4:
        return (
          <NextStepsStep
            key="next-steps"
            completedSteps={state.data.completedNextSteps || []}
            onToggleStep={handleToggleNextStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      {/* Skip button */}
      <SkipButton onSkip={handleSkip} isUpdating={isUpdating} />

      {/* Container */}
      <div className="min-h-screen flex flex-col">
        {/* Progress bar */}
        <div className="pt-16 pb-4">
          <OnboardingProgress
            currentStep={state.currentStep}
            progress={stepProgress}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="pb-8">
          <StepNavigation
            currentStep={state.currentStep}
            totalSteps={totalSteps}
            canProceed={canProceed}
            isUpdating={isUpdating}
            onNext={nextStep}
            onPrev={prevStep}
            onComplete={handleComplete}
            nextLabel={state.currentStep === 0 ? 'Começar' : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
