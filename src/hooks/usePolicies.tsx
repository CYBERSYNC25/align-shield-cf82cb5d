import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('usePolicies');

type Policy = Database['public']['Tables']['policies']['Row'];
type PolicyInsert = Database['public']['Tables']['policies']['Insert'];
type PolicyUpdate = Database['public']['Tables']['policies']['Update'];

export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPolicies = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPolicies(data ?? []);
    } catch (error) {
      logger.warn('Dados de políticas não disponíveis', error);
      setPolicies([]);
      toast({
        title: 'Erro ao carregar políticas',
        description: 'Não foi possível carregar as políticas. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: Omit<PolicyInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('policies')
        .insert({
          ...policyData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPolicies(prev => [data, ...prev]);
        toast({
          title: "Política criada",
          description: `Política "${data.name}" criada com sucesso`
        });
      }

      return data;
    } catch (error: any) {
      logger.error('Erro ao criar política', error);
      toast({
        title: 'Erro ao criar política',
        description: 'Não foi possível criar a política. Tente novamente.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updatePolicy = async (id: string, updates: PolicyUpdate) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('policies')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPolicies(prev => prev.map(policy => 
        policy.id === id 
          ? { ...policy, ...updates, updated_at: new Date().toISOString() }
          : policy
      ));

      toast({
        title: "Política atualizada",
        description: "Política atualizada com sucesso"
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar política', error);
      toast({
        title: 'Erro ao atualizar política',
        description: 'Não foi possível atualizar. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deletePolicy = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPolicies(prev => prev.filter(policy => policy.id !== id));

      toast({
        title: "Política removida",
        description: "Política removida com sucesso"
      });
    } catch (error: any) {
      logger.error('Erro ao deletar política', error);
      toast({
        title: 'Erro ao remover política',
        description: 'Não foi possível remover. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPolicies();
    }
  }, [user]);

  // Estatísticas calculadas
  const stats = {
    totalPolicies: policies.length,
    activePolicies: policies.filter(policy => policy.status === 'active').length,
    draftPolicies: policies.filter(policy => policy.status === 'draft').length,
    reviewPolicies: policies.filter(policy => policy.status === 'review').length,
    archivedPolicies: policies.filter(policy => policy.status === 'archived').length,
    policiesDueSoon: policies.filter(policy => {
      if (!policy.next_review) return false;
      const nextReview = new Date(policy.next_review);
      const now = new Date();
      const daysUntilReview = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilReview <= 30 && daysUntilReview > 0;
    }).length,
    policiesOverdue: policies.filter(policy => {
      if (!policy.next_review) return false;
      const nextReview = new Date(policy.next_review);
      const now = new Date();
      return nextReview < now;
    }).length
  };

  return {
    policies,
    stats,
    loading,
    createPolicy,
    updatePolicy,
    deletePolicy,
    refetch: fetchPolicies
  };
}