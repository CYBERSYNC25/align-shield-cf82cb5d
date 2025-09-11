import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/lib/supabase';

type Audit = Database['public']['Tables']['audits']['Row'];
type AuditInsert = Database['public']['Tables']['audits']['Insert'];
type AuditUpdate = Database['public']['Tables']['audits']['Update'];

type Evidence = Database['public']['Tables']['evidence']['Row'];
type EvidenceInsert = Database['public']['Tables']['evidence']['Insert'];

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
      title: 'Auditoria SOC 2 Type II - Q4 2024',
      description: 'Auditoria anual de controles internos para certificação SOC 2 Type II',
      framework: 'SOC 2',
      status: 'in_progress',
      auditor_name: 'Maria Auditora',
      auditor_email: 'maria@auditoria.com',
      start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      evidence_count: 847,
      findings_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    },
    {
      id: '2',
      title: 'Revisão ISO 27001:2022',
      description: 'Auditoria de manutenção para certificação ISO 27001',
      framework: 'ISO 27001',
      status: 'review',
      auditor_name: 'João Certificador',
      auditor_email: 'joao@certificadora.com',
      start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      evidence_count: 1204,
      findings_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    }
  ];

  const getMockEvidence = (): Evidence[] => [
    {
      id: '1',
      title: 'AWS CloudTrail - Dezembro 2024',
      source: 'AWS CloudTrail',
      file_type: 'JSON',
      file_size: 456 * 1024 * 1024, // 456 MB in bytes
      file_path: '/evidence/aws/cloudtrail-dec-2024.json',
      integrity_hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      collection_date: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      controls_mapped: ['AC-2', 'AC-3', 'SC-8'],
      framework: 'SOC 2',
      status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    },
    {
      id: '2',
      title: 'Okta System Logs - Dezembro 2024',
      source: 'Okta System Logs',
      file_type: 'CSV',
      file_size: 234 * 1024 * 1024, // 234 MB in bytes
      file_path: '/evidence/okta/system-logs-dec-2024.csv',
      integrity_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      collection_date: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      controls_mapped: ['IA-2', 'IA-5', 'AC-2'],
      framework: 'SOC 2',
      status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    }
  ];

  // Fetch audits
  const fetchAudits = async () => {
    if (!user) {
      setAudits([]);
      setLoading(false);
      return;
    }

    // Se não há configuração real do Supabase, usar dados mocados
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setAudits(getMockAudits());
      setEvidence(getMockEvidence());
      setLoading(false);
      return;
    }

    try {
      const [auditsResponse, evidenceResponse] = await Promise.all([
        supabase.from('audits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('evidence').select('*').eq('user_id', user.id).order('collection_date', { ascending: false })
      ]);

      if (auditsResponse.error) throw auditsResponse.error;
      if (evidenceResponse.error) throw evidenceResponse.error;

      setAudits(auditsResponse.data || []);
      setEvidence(evidenceResponse.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados de auditoria:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de auditoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create audit
  const createAudit = async (auditData: Omit<AuditInsert, 'user_id'>) => {
    if (!user) return null;

    if (!import.meta.env.VITE_SUPABASE_URL) {
      const newAudit: Audit = {
        id: Date.now().toString(),
        ...auditData,
        evidence_count: 0,
        findings_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };
      setAudits(prev => [newAudit, ...prev]);
      toast({
        title: "Auditoria criada",
        description: "Nova auditoria foi criada com sucesso"
      });
      return newAudit;
    }

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

      setAudits(prev => [data, ...prev]);
      toast({
        title: "Auditoria criada",
        description: "Nova auditoria foi criada com sucesso"
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao criar auditoria:', error);
      toast({
        title: "Erro ao criar auditoria",
        description: "Não foi possível criar a auditoria",
        variant: "destructive"
      });
      return null;
    }
  };

  // Create evidence
  const createEvidence = async (evidenceData: Omit<EvidenceInsert, 'user_id'>) => {
    if (!user) return null;

    if (!import.meta.env.VITE_SUPABASE_URL) {
      const newEvidence: Evidence = {
        id: Date.now().toString(),
        ...evidenceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };
      setEvidence(prev => [newEvidence, ...prev]);
      toast({
        title: "Evidência adicionada",
        description: "Nova evidência foi adicionada com sucesso"
      });
      return newEvidence;
    }

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

      setEvidence(prev => [data, ...prev]);
      toast({
        title: "Evidência adicionada",
        description: "Nova evidência foi adicionada com sucesso"
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar evidência:', error);
      toast({
        title: "Erro ao adicionar evidência",
        description: "Não foi possível adicionar a evidência",
        variant: "destructive"
      });
      return null;
    }
  };

  // Update audit status
  const updateAuditStatus = async (id: string, status: Audit['status']) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setAudits(prev => prev.map(audit => 
        audit.id === id ? { ...audit, status, updated_at: new Date().toISOString() } : audit
      ));
      toast({
        title: "Status atualizado",
        description: "Status da auditoria foi atualizado"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('audits')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setAudits(prev => prev.map(audit => 
        audit.id === id ? { ...audit, status } : audit
      ));

      toast({
        title: "Status atualizado",
        description: "Status da auditoria foi atualizado"
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [user]);

  const stats = {
    totalEvidence: evidence.length,
    totalSize: evidence.reduce((acc, e) => acc + e.file_size, 0),
    activeAudits: audits.filter(a => a.status === 'in_progress').length,
    completedAudits: audits.filter(a => a.status === 'completed').length
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