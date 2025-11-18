import { useState, useEffect } from 'react';

interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STORAGE_KEY = 'complice-integrations-tour-completed';

export const useOnboardingTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user has already completed the tour
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (completed === 'true') {
      setHasCompleted(true);
    } else {
      // Auto-start tour for first-time users after a brief delay
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const skipTour = () => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setHasCompleted(true);
  };

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setHasCompleted(true);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompleted(false);
    setCurrentStep(0);
  };

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      target: 'integrations-stats',
      title: 'Bem-vindo ao Hub de Integrações! 👋',
      description: 'Aqui você conecta suas ferramentas para automatizar coleta de evidências e monitoramento de compliance.',
      position: 'bottom',
    },
    {
      id: 'catalog',
      target: 'catalog-tab',
      title: 'Catálogo de Integrações 📚',
      description: 'Navegue por mais de 50 integrações disponíveis. Escolha as que sua empresa usa.',
      position: 'bottom',
    },
    {
      id: 'my-integrations',
      target: 'connect-tab',
      title: 'Minhas Integrações 🔌',
      description: 'Veja e gerencie todas as suas integrações ativas. Pause, edite ou desconecte conforme necessário.',
      position: 'bottom',
    },
    {
      id: 'test',
      target: 'test-tab',
      title: 'Testar Conexões ✅',
      description: 'Valide se suas integrações OAuth estão funcionando corretamente antes de usar.',
      position: 'bottom',
    },
    {
      id: 'monitor',
      target: 'monitor-tab',
      title: 'Monitorar em Tempo Real 📊',
      description: 'Acompanhe logs, webhooks e o status de todas as suas integrações.',
      position: 'bottom',
    },
  ];

  return {
    isActive,
    currentStep,
    hasCompleted,
    tourSteps,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
};
