import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-keys';

export interface ScanResults {
  score: number;
  passing: number;
  failing: number;
}

export interface OnboardingData {
  selectedFrameworks: string[];
  connectedIntegration: string | null;
  firstScanCompleted: boolean;
  firstScanResults: ScanResults | null;
  completedNextSteps: string[];
}

export interface OnboardingWizardState {
  currentStep: number;
  isActive: boolean;
  isLoading: boolean;
  hasCompleted: boolean;
  wasSkipped: boolean;
  data: OnboardingData;
}

const TOTAL_STEPS = 5;

const defaultData: OnboardingData = {
  selectedFrameworks: [],
  connectedIntegration: null,
  firstScanCompleted: false,
  firstScanResults: null,
  completedNextSteps: [],
};

export const useOnboardingWizard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  // Buscar estado do onboarding do banco
  const { data: profile, isLoading } = useQuery({
    queryKey: ['onboarding-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step, onboarding_data, onboarding_skipped, onboarding_completed_at')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Sincronizar step local com banco
  useEffect(() => {
    if (profile?.onboarding_step !== undefined) {
      setCurrentStep(profile.onboarding_step);
    }
  }, [profile?.onboarding_step]);

  // Mutation para atualizar progresso
  const updateProgressMutation = useMutation({
    mutationFn: async (updates: {
      step?: number;
      data?: Partial<OnboardingData>;
      completed?: boolean;
      skipped?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const rawData = profile?.onboarding_data as Record<string, unknown> | undefined;
      const currentData: OnboardingData = rawData ? {
        selectedFrameworks: (rawData.selectedFrameworks as string[]) || [],
        connectedIntegration: (rawData.connectedIntegration as string | null) || null,
        firstScanCompleted: (rawData.firstScanCompleted as boolean) || false,
        firstScanResults: (rawData.firstScanResults as ScanResults | null) || null,
        completedNextSteps: (rawData.completedNextSteps as string[]) || [],
      } : defaultData;
      
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.step !== undefined) {
        updatePayload.onboarding_step = updates.step;
      }

      if (updates.data) {
        updatePayload.onboarding_data = { ...currentData, ...updates.data };
      }

      if (updates.completed) {
        updatePayload.onboarding_completed = true;
        updatePayload.onboarding_completed_at = new Date().toISOString();
      }

      if (updates.skipped) {
        updatePayload.onboarding_skipped = true;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-profile', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating onboarding:', error);
      toast({
        title: 'Erro ao salvar progresso',
        description: 'Não foi possível salvar seu progresso. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Navegação
  const nextStep = useCallback(async () => {
    const next = Math.min(currentStep + 1, TOTAL_STEPS - 1);
    setCurrentStep(next);
    await updateProgressMutation.mutateAsync({ step: next });
  }, [currentStep, updateProgressMutation]);

  const prevStep = useCallback(() => {
    const prev = Math.max(currentStep - 1, 0);
    setCurrentStep(prev);
    updateProgressMutation.mutate({ step: prev });
  }, [currentStep, updateProgressMutation]);

  const goToStep = useCallback((step: number) => {
    const validStep = Math.max(0, Math.min(step, TOTAL_STEPS - 1));
    setCurrentStep(validStep);
    updateProgressMutation.mutate({ step: validStep });
  }, [updateProgressMutation]);

  // Ações
  const skipOnboarding = useCallback(async () => {
    await updateProgressMutation.mutateAsync({ skipped: true });
    toast({
      title: 'Onboarding pulado',
      description: 'Você pode refazer o tutorial em Configurações a qualquer momento.',
    });
  }, [updateProgressMutation, toast]);

  const completeOnboarding = useCallback(async () => {
    await updateProgressMutation.mutateAsync({ completed: true });
    toast({
      title: '🎉 Onboarding concluído!',
      description: 'Você está pronto para usar o Compliance Sync.',
    });
  }, [updateProgressMutation, toast]);

  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return;

    const resetData = {
      selectedFrameworks: [],
      connectedIntegration: null,
      firstScanCompleted: false,
      firstScanResults: null,
      completedNextSteps: [],
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: false,
        onboarding_skipped: false,
        onboarding_step: 0,
        onboarding_data: resetData,
        onboarding_completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Erro ao resetar',
        description: 'Não foi possível resetar o onboarding.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentStep(0);
    queryClient.invalidateQueries({ queryKey: ['onboarding-profile', user?.id] });
    toast({
      title: 'Onboarding resetado',
      description: 'Vamos começar novamente!',
    });
  }, [user?.id, queryClient, toast]);

  // Atualizar dados do onboarding
  const updateData = useCallback(async (data: Partial<OnboardingData>) => {
    await updateProgressMutation.mutateAsync({ data });
  }, [updateProgressMutation]);

  // Estado derivado
  const rawOnboardingData = profile?.onboarding_data as Record<string, unknown> | undefined;
  const onboardingData: OnboardingData = rawOnboardingData ? {
    selectedFrameworks: (rawOnboardingData.selectedFrameworks as string[]) || [],
    connectedIntegration: (rawOnboardingData.connectedIntegration as string | null) || null,
    firstScanCompleted: (rawOnboardingData.firstScanCompleted as boolean) || false,
    firstScanResults: (rawOnboardingData.firstScanResults as ScanResults | null) || null,
    completedNextSteps: (rawOnboardingData.completedNextSteps as string[]) || [],
  } : defaultData;
  const hasCompleted = profile?.onboarding_completed ?? false;
  const wasSkipped = profile?.onboarding_skipped ?? false;
  const isActive = !hasCompleted && !wasSkipped && !!user;

  // Verificar se pode avançar baseado no step atual
  const canProceed = (() => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Frameworks
        return onboardingData.selectedFrameworks.length > 0;
      case 2: // Integration (pode pular)
        return true;
      case 3: // First Scan
        return onboardingData.firstScanCompleted;
      case 4: // Next Steps
        return true;
      default:
        return true;
    }
  })();

  const stepProgress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return {
    state: {
      currentStep,
      isActive,
      isLoading,
      hasCompleted,
      wasSkipped,
      data: onboardingData,
    },
    nextStep,
    prevStep,
    goToStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    updateData,
    canProceed,
    stepProgress,
    totalSteps: TOTAL_STEPS,
    isUpdating: updateProgressMutation.isPending,
  };
};
