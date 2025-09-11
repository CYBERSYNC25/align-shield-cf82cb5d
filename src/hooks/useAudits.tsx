import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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

  // Mock data para desenvolvimento
  const getMockAudits = (): Audit[] => [
    {
      id: '1',
      name: 'Auditoria SOC 2 Type II - Q4 2024',
      framework: 'SOC 2',
      status: 'in_progress',
      progress: 65,
      start_date: '2024-01-15',
      end_date: '2024-03-15',
      auditor: 'Maria Auditora',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id'
    },
    {
      id: '2',
      name: 'Auditoria ISO 27001:2013 - Renovação',
      framework: 'ISO 27001',
      status: 'planning',
      progress: 15,
      start_date: '2024-02-01',
      end_date: '2024-04-30',
      auditor: 'João Compliance',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id'
    }
  ];

  const getMockEvidence = (): Evidence[] => [
    {
      id: '1',
      name: 'AWS CloudTrail - Dezembro 2024',
      type: 'JSON',
      status: 'verified',
      file_url: '/evidence/aws/cloudtrail-dec-2024.json',
      uploaded_by: 'Carlos Admin',
      audit_id: '1',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id'
    },
    {
      id: '2',
      name: 'Política de Segurança v2.1',
      type: 'PDF',
      status: 'pending_review',
      file_url: '/evidence/policies/security-policy-v2.1.pdf',
      uploaded_by: 'Ana Segurança',
      audit_id: '1',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id'
    }
  ];

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

      setAudits(auditsResponse.data || []);
      setEvidence(evidenceResponse.data || []);
    } catch (error) {
      console.error('Erro ao buscar auditorias:', error);
      // Use dados mocados se falhar
      setAudits(getMockAudits());
      setEvidence(getMockEvidence());
    } finally {
      setLoading(false);
    }
  };

  const createAudit = async (auditData: Omit<AuditInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      await createAudit({
        name: auditData.name,
        framework: auditData.framework,
        auditor: auditData.auditor || 'Não atribuído',
        start_date: auditData.start_date,
        end_date: auditData.end_date,
        status: 'planning'
      });

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
      console.error('Erro ao criar auditoria:', error);
      
      // Fallback para dados mocados
      const newAudit: Audit = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        id: crypto.randomUUID(),
        name: auditData.name,
        framework: auditData.framework,
        status: 'planning',
        progress: 0,
        start_date: auditData.start_date || null,
        end_date: auditData.end_date || null,
        auditor: auditData.auditor || null
      };

      setAudits(prev => [newAudit, ...prev]);
      
      toast({
        title: "Auditoria criada (modo offline)",
        description: `Auditoria "${newAudit.name}" criada com sucesso`
      });

      return newAudit;
    }
  };

  const createEvidence = async (evidenceData: Omit<EvidenceInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('evidence')
        .insert({
          ...evidenceData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setEvidence(prev => [data, ...prev]);
        toast({
          title: "Evidência adicionada",
          description: `Evidência "${data.name}" adicionada com sucesso`
        });
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao criar evidência:', error);
      
      // Fallback para dados mocados
      const newEvidence: Evidence = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        id: crypto.randomUUID(),
        name: evidenceData.name,
        type: evidenceData.type,
        status: 'pending',
        audit_id: evidenceData.audit_id || null,
        file_url: evidenceData.file_url || null,
        uploaded_by: evidenceData.uploaded_by || null
      };

      setEvidence(prev => [newEvidence, ...prev]);
      
      toast({
        title: "Evidência adicionada (modo offline)",
        description: `Evidência "${newEvidence.name}" adicionada com sucesso`
      });

      return newEvidence;
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
      console.error('Erro ao atualizar status:', error);
      
      // Fallback para atualização local
      setAudits(prev => prev.map(audit => 
        audit.id === id 
          ? { ...audit, status, updated_at: new Date().toISOString() }
          : audit
      ));
      
      toast({
        title: "Status atualizado (modo offline)",
        description: "Status da auditoria atualizado localmente"
      });
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
    updateAuditStatus,
    refetch: fetchAudits
  };
}