import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-keys';

export interface GenerateAnswersResult {
  success: boolean;
  questionnaire_id: string;
  total_questions: number;
  pending_before: number;
  generated: number;
  failed: number;
  processing_time_ms: number;
  questions: Array<{
    id: string;
    question_number: string;
    success: boolean;
    confidence_score?: number;
    error?: string;
  }>;
}

export function useGenerateAnswers(questionnaireId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (questionIds?: string[]): Promise<GenerateAnswersResult> => {
      setProgress(0);

      const { data, error } = await supabase.functions.invoke<GenerateAnswersResult>(
        'generate-questionnaire-answers',
        {
          body: {
            questionnaire_id: questionnaireId,
            question_ids: questionIds
          }
        }
      );

      if (error) {
        throw new Error(error.message || 'Erro ao gerar respostas');
      }

      if (!data?.success) {
        const errorData = data as { error?: string; code?: string; help?: string };
        if (errorData?.code === 'MISSING_SECRET') {
          throw new Error('ANTHROPIC_API_KEY não configurada. Adicione o secret para usar geração por IA.');
        }
        throw new Error(errorData?.error || 'Erro desconhecido');
      }

      return data;
    },
    onSuccess: (data) => {
      setProgress(100);
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.questionnaireQuestions(questionnaireId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.questionnaires 
      });

      toast({
        title: 'Respostas geradas com sucesso',
        description: `${data.generated} respostas foram geradas em ${Math.round(data.processing_time_ms / 1000)}s.`
      });
    },
    onError: (error: Error) => {
      setProgress(0);
      
      const isMissingSecret = error.message.includes('ANTHROPIC_API_KEY');
      
      toast({
        title: isMissingSecret ? 'Configuração necessária' : 'Erro na geração',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    generate: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    progress,
    result: mutation.data,
    error: mutation.error
  };
}
