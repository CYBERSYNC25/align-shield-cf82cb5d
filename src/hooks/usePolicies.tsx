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

  // Mock data para desenvolvimento
  const getMockPolicies = (): Policy[] => [
    {
      id: '1',
      name: 'Política de Segurança da Informação',
      description: 'Define diretrizes e responsabilidades para proteger as informações organizacionais',
      category: 'seguranca',
      version: '2.1',
      status: 'active',
      owner: 'Carlos Silva',
      approver: 'Maria Diretora',
      effective_date: '2024-01-01',
      review_date: '2024-11-15',
      next_review: '2025-01-01',
      tags: ['seguranca', 'informacao', 'gdpr', 'lgpd'],
      file_url: '/policies/security-policy-v2.1.pdf',
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id',
      approval_status: 'approved',
      approved_by: 'mock-approver-id',
      approved_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
      version_history: [],
      org_id: null
    },
    {
      id: '2',
      name: 'Política de Controle de Acesso',
      description: 'Estabelece procedimentos para gestão de identidades e controle de acesso',
      category: 'seguranca',
      version: '1.5',
      status: 'active',
      owner: 'Ana Rodrigues',
      approver: 'Carlos Silva',
      effective_date: '2024-03-01',
      review_date: '2024-10-20',
      next_review: '2025-03-01',
      tags: ['acesso', 'identidade', 'autenticacao'],
      file_url: '/policies/access-control-v1.5.pdf',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id',
      approval_status: 'approved',
      approved_by: 'mock-approver-id',
      approved_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      version_history: [],
      org_id: null
    },
    {
      id: '3',
      name: 'Política de Backup e Recuperação',
      description: 'Define procedimentos para backup de dados e recuperação de desastres',
      category: 'ti',
      version: '1.0',
      status: 'review',
      owner: 'Roberto Lima',
      approver: 'Maria Diretora',
      effective_date: '2024-06-01',
      review_date: '2024-11-30',
      next_review: '2025-06-01',
      tags: ['backup', 'recuperacao', 'continuidade'],
      file_url: '/policies/backup-policy-v1.0.pdf',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id',
      approval_status: 'pending',
      approved_by: null,
      approved_at: null,
      version_history: [],
      org_id: null
    }
  ];

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

      setPolicies(data || []);
    } catch (error) {
      logger.warn('Dados de políticas não disponíveis', error);
      setPolicies([]);
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
      
      // Fallback para dados mocados
      const newPolicy: Policy = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        id: crypto.randomUUID(),
        name: policyData.name,
        description: policyData.description || null,
        category: policyData.category,
        version: policyData.version || '1.0',
        status: policyData.status || 'draft',
        owner: policyData.owner || null,
        approver: policyData.approver || null,
        effective_date: policyData.effective_date || null,
        review_date: policyData.review_date || null,
        next_review: policyData.next_review || null,
        tags: policyData.tags || null,
        file_url: policyData.file_url || null,
        approval_status: 'draft',
        approved_by: null,
        approved_at: null,
        version_history: [],
        org_id: null
      };

      setPolicies(prev => [newPolicy, ...prev]);
      
      toast({
        title: "Política criada (modo offline)",
        description: `Política "${newPolicy.name}" criada com sucesso`
      });

      return newPolicy;
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
      
      // Fallback para atualização local
      setPolicies(prev => prev.map(policy => 
        policy.id === id 
          ? { ...policy, ...updates, updated_at: new Date().toISOString() }
          : policy
      ));
      
      toast({
        title: "Política atualizada (modo offline)",
        description: "Política atualizada localmente"
      });
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
      
      // Fallback para remoção local
      setPolicies(prev => prev.filter(policy => policy.id !== id));
      
      toast({
        title: "Política removida (modo offline)",
        description: "Política removida localmente"
      });
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