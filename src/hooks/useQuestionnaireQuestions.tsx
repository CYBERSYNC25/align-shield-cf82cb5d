import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-keys';

export interface QuestionnaireQuestion {
  id: string;
  questionnaire_id: string;
  question_number: string;
  question_text: string;
  question_type: string | null;
  category: string | null;
  subcategory: string | null;
  answer_text: string | null;
  answer_status: string | null;
  confidence_score: number | null;
  ai_reasoning: string | null;
  evidence_links: string[] | null;
  related_controls: string[] | null;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionInput {
  questionnaire_id: string;
  question_number: string;
  question_text: string;
  question_type?: string;
  category?: string;
  subcategory?: string;
}

export interface UpdateQuestionInput {
  id: string;
  answer_text?: string;
  answer_status?: string;
  reviewer_notes?: string;
  evidence_links?: string[];
  related_controls?: string[];
}

export interface QuestionStats {
  total: number;
  pending: number;
  aiGenerated: number;
  reviewed: number;
  approved: number;
  progressPercent: number;
}

export function useQuestionnaireQuestions(questionnaireId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.questionnaireQuestions(questionnaireId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('questionnaire_id', questionnaireId)
        .order('question_number');

      if (error) throw error;
      return data as QuestionnaireQuestion[];
    },
    enabled: !!questionnaireId
  });

  const stats: QuestionStats = {
    total: questions.length,
    pending: questions.filter(q => q.answer_status === 'pending' || !q.answer_status).length,
    aiGenerated: questions.filter(q => q.answer_status === 'ai_generated').length,
    reviewed: questions.filter(q => q.answer_status === 'reviewed').length,
    approved: questions.filter(q => q.answer_status === 'approved').length,
    progressPercent: questions.length > 0 
      ? Math.round((questions.filter(q => q.answer_status === 'approved').length / questions.length) * 100)
      : 0
  };

  const createMutation = useMutation({
    mutationFn: async (input: CreateQuestionInput) => {
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .insert({
          questionnaire_id: input.questionnaire_id,
          question_number: input.question_number,
          question_text: input.question_text,
          question_type: input.question_type || 'text',
          category: input.category || null,
          subcategory: input.subcategory || null,
          answer_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data as QuestionnaireQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaireQuestions(questionnaireId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar pergunta',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const createBulkMutation = useMutation({
    mutationFn: async (inputs: CreateQuestionInput[]) => {
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .insert(inputs.map(input => ({
          questionnaire_id: input.questionnaire_id,
          question_number: input.question_number,
          question_text: input.question_text,
          question_type: input.question_type || 'text',
          category: input.category || null,
          subcategory: input.subcategory || null,
          answer_status: 'pending'
        })))
        .select();

      if (error) throw error;

      // Update questions_count in questionnaire
      await supabase
        .from('security_questionnaires')
        .update({ questions_count: inputs.length })
        .eq('id', questionnaireId);

      return data as QuestionnaireQuestion[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaireQuestions(questionnaireId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
      toast({
        title: 'Perguntas adicionadas',
        description: `${data.length} perguntas foram adicionadas ao questionário.`
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar perguntas',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateQuestionInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as QuestionnaireQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaireQuestions(questionnaireId) });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ ids, status, reviewedBy }: { ids: string[]; status: string; reviewedBy?: string }) => {
      const updates: Record<string, unknown> = {
        answer_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'reviewed' || status === 'approved') {
        updates.reviewed_at = new Date().toISOString();
        if (reviewedBy) updates.reviewed_by = reviewedBy;
      }

      const { error } = await supabase
        .from('questionnaire_questions')
        .update(updates)
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaireQuestions(questionnaireId) });
      toast({
        title: 'Status atualizado',
        description: `${variables.ids.length} perguntas foram atualizadas para ${variables.status}.`
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('questionnaire_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaireQuestions(questionnaireId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    questions,
    stats,
    isLoading,
    refetch,
    create: createMutation.mutateAsync,
    createBulk: createBulkMutation.mutateAsync,
    isCreating: createMutation.isPending || createBulkMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutateAsync,
    isBulkUpdating: bulkUpdateStatusMutation.isPending,
    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}
