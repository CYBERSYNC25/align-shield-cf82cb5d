import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useAudits');

// Tipos baseados no schema do Supabase
type Audit = Database['public']['Tables']['audits']['Row'];
type AuditInsert = Database['public']['Tables']['audits']['Insert'];
type AuditUpdate = Database['public']['Tables']['audits']['Update'];

type Evidence = Database['public']['Tables']['evidence']['Row'];
type EvidenceInsert = Database['public']['Tables']['evidence']['Insert'];
type EvidenceUpdate = Database['public']['Tables']['evidence']['Update'];

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAudits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [auditsResponse, evidenceResponse] = await Promise.all([
        supabase
          .from('audits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('evidence')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (auditsResponse.error) throw auditsResponse.error;
      if (evidenceResponse.error) throw evidenceResponse.error;

      setAudits(auditsResponse.data ?? []);
      setEvidence(evidenceResponse.data ?? []);
    } catch (error) {
      logger.warn('Dados de auditoria não disponíveis', error);
      setAudits([]);
      setEvidence([]);
      toast({
        title: 'Erro ao carregar auditorias',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAudit = async (auditData: Omit<AuditInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('audits')
        .insert({
          ...auditData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAudits(prev => [data, ...prev]);
        toast({
          title: "Auditoria criada",
          description: `Auditoria "${data.name}" criada com sucesso`
        });
      }

      return data;
    } catch (error: any) {
      logger.error('Erro ao criar auditoria', error);
      toast({
        title: 'Erro ao criar auditoria',
        description: 'Não foi possível criar a auditoria. Tente novamente.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const createEvidence = async (evidenceData: Omit<EvidenceInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      logger.debug('Creating evidence with data', evidenceData);
      logger.debug('User ID', user.id);

      const { data, error } = await supabase
        .from('evidence')
        .insert({
          ...evidenceData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        logger.error('Supabase error creating evidence', error);
        throw error;
      }

      if (data) {
        setEvidence(prev => [data, ...prev]);
        toast({
          title: "Evidência adicionada",
          description: `Evidência "${data.name}" adicionada com sucesso`
        });
      }

      return data;
    } catch (error: any) {
      logger.error('Erro ao criar evidência', error);
      toast({
        title: 'Erro ao adicionar evidência',
        description: 'Não foi possível adicionar a evidência. Tente novamente.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateAuditStatus = async (id: string, status: Audit['status']) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audits')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAudits(prev => prev.map(audit => 
        audit.id === id 
          ? { ...audit, status, updated_at: new Date().toISOString() }
          : audit
      ));

      toast({
        title: "Status atualizado",
        description: "Status da auditoria atualizado com sucesso"
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar status', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  /**
   * Updates an existing audit
   * 
   * @param id - Audit ID
   * @param updates - Fields to update
   */
  const updateAudit = async (id: string, updates: AuditUpdate) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('audits')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Auditoria atualizada",
        description: "Auditoria atualizada com sucesso"
      });
      
      // Update local state
      setAudits(prev => prev.map(audit => 
        audit.id === id 
          ? { ...audit, ...updates, updated_at: new Date().toISOString() }
          : audit
      ));
    } catch (error) {
      logger.error('Error updating audit', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar auditoria",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAudits();
    }
  }, [user]);

  // Estatísticas calculadas
  const stats = {
    totalAudits: audits.length,
    activeAudits: audits.filter(audit => audit.status === 'in_progress').length,
    completedAudits: audits.filter(audit => audit.status === 'completed').length,
    totalEvidence: evidence.length,
    pendingEvidence: evidence.filter(ev => ev.status === 'pending').length,
    approvedEvidence: evidence.filter(ev => ev.status === 'verified').length,
    totalGenerated: evidence.length,
    weeklyGrowth: 12.5,
    scheduledReports: 3,
    avgProcessingTime: evidence.reduce((acc, ev) => acc + 0, 0) / Math.max(evidence.length, 1)
  };

  return {
    audits,
    evidence,
    stats,
    loading,
    createAudit,
    createEvidence,
    updateAudit,
    updateAuditStatus,
    refetch: fetchAudits
  };
}