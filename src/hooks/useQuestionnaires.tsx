import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-keys';

export interface Questionnaire {
  id: string;
  user_id: string;
  name: string;
  source: string;
  status: string;
  questions_count: number | null;
  due_date: string | null;
  requester_name: string | null;
  requester_email: string | null;
  completed_at: string | null;
  notes: string | null;
  version: string | null;
  shared_with: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionnaireInput {
  name: string;
  source: string;
  due_date?: string;
  requester_name?: string;
  requester_email?: string;
  notes?: string;
}

export interface QuestionnaireStats {
  total: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
}

export function useQuestionnaires() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questionnaires = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.questionnaires,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('security_questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Questionnaire[];
    },
    enabled: !!user
  });

  const stats: QuestionnaireStats = {
    total: questionnaires.length,
    inProgress: questionnaires.filter(q => q.status === 'in_progress').length,
    pendingReview: questionnaires.filter(q => q.status === 'pending_review').length,
    completed: questionnaires.filter(q => q.status === 'completed').length
  };

  const createMutation = useMutation({
    mutationFn: async (input: CreateQuestionnaireInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('security_questionnaires')
        .insert({
          user_id: user.id,
          name: input.name,
          source: input.source,
          due_date: input.due_date || null,
          requester_name: input.requester_name || null,
          requester_email: input.requester_email || null,
          notes: input.notes || null,
          status: 'draft',
          questions_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data as Questionnaire;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
      toast({
        title: 'Questionário criado',
        description: 'O questionário foi criado com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar questionário',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Questionnaire> & { id: string }) => {
      const { data, error } = await supabase
        .from('security_questionnaires')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Questionnaire;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete all questions
      const { error: questionsError } = await supabase
        .from('questionnaire_questions')
        .delete()
        .eq('questionnaire_id', id);

      if (questionsError) throw questionsError;

      // Then delete the questionnaire
      const { error } = await supabase
        .from('security_questionnaires')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
      toast({
        title: 'Questionário excluído',
        description: 'O questionário foi removido com sucesso.'
      });
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
    questionnaires,
    stats,
    isLoading,
    refetch,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}

export function useQuestionnaireById(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.questionnaireById(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_questionnaires')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Questionnaire;
    },
    enabled: !!user && !!id
  });
}

export function useQuestionnaireTemplates() {
  return useQuery({
    queryKey: queryKeys.questionnaireTemplates,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questionnaire_templates')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (error) throw error;
      return data;
    }
  });
}
