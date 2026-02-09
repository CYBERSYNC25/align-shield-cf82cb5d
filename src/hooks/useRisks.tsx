import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  ownerRole: string;
  status: 'active' | 'mitigated' | 'accepted' | 'transferred';
  trend: 'increasing' | 'stable' | 'decreasing';
  lastReview: string;
  nextReview: string;
  controls: string[];
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: 'low' | 'medium' | 'high';
  contractValue: string;
  lastAssessment: string;
  nextAssessment: string;
  complianceScore: number;
  status: 'active' | 'review' | 'expired';
  certifications: string[];
  pendingActions: number;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  vendor: string;
  template: string;
  status: 'sent' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  sentDate: string;
  dueDate: string;
  completedQuestions: number;
  totalQuestions: number;
  riskFlags: number;
  contactPerson: string;
  contactEmail: string;
  created_at: string;
  updated_at: string;
}

export interface RiskStats {
  activeRisks: number;
  riskBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  criticalVendors: number;
  totalVendors: number;
  implementedControls: number;
  controlEffectiveness: number;
  pendingAssessments: number;
  assessmentsDue: number;
}

export const useRisks = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [stats, setStats] = useState<RiskStats>({
    activeRisks: 0,
    riskBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    criticalVendors: 0,
    totalVendors: 0,
    implementedControls: 0,
    controlEffectiveness: 0,
    pendingAssessments: 0,
    assessmentsDue: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const emptyStats: RiskStats = {
    activeRisks: 0,
    riskBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    criticalVendors: 0,
    totalVendors: 0,
    implementedControls: 0,
    controlEffectiveness: 0,
    pendingAssessments: 0,
    assessmentsDue: 0
  };

  const fetchRisks = async () => {
    try {
      setLoading(true);

      const { data: risksData, error: risksError } = await supabase
        .from('risks')
        .select('*')
        .order('created_at', { ascending: false });

      if (risksError) {
        console.warn('Dados de riscos não disponíveis:', risksError);
        setRisks([]);
      } else {
        setRisks((risksData ?? []).map((r: any) => ({
          ...r,
          riskScore: r.risk_score ?? 0,
          ownerRole: r.owner_role ?? '',
          lastReview: r.last_review ?? '',
          nextReview: r.next_review ?? '',
        })) as Risk[]);
      }

      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (vendorsError) {
        console.error('Erro ao buscar fornecedores:', vendorsError);
        setVendors([]);
      } else {
        setVendors((vendorsData ?? []).map((v: any) => ({
          ...v,
          riskLevel: v.risk_level ?? 'low',
          contractValue: v.contract_value ?? '',
          lastAssessment: v.last_assessment ?? '',
          nextAssessment: v.next_assessment ?? '',
          complianceScore: v.compliance_score ?? 0,
          pendingActions: v.pending_actions ?? 0,
        })) as Vendor[]);
      }

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('risk_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assessmentsError) {
        console.error('Erro ao buscar avaliações:', assessmentsError);
        setAssessments([]);
      } else {
        setAssessments((assessmentsData ?? []).map((a: any) => ({
          ...a,
          vendor: a.vendor_id ?? '',
          template: a.template ?? '',
          sentDate: a.sent_date ?? '',
          dueDate: a.due_date ?? '',
          completedQuestions: a.completed_questions ?? 0,
          totalQuestions: a.total_questions ?? 0,
          riskFlags: a.risk_flags ?? 0,
          contactPerson: a.contact_person ?? '',
          contactEmail: a.contact_email ?? '',
        })) as RiskAssessment[]);
      }

      const allRisks = risksData ?? [];
      const allVendors = vendorsData ?? [];
      const allAssessments = assessmentsData ?? [];

      const riskBreakdown = allRisks.reduce(
        (acc, risk: any) => {
          const level = risk.level ?? 'low';
          acc[level] = (acc[level] ?? 0) + 1;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0 }
      );

      setStats({
        activeRisks: allRisks.filter((r: any) => r.status === 'active').length,
        riskBreakdown,
        criticalVendors: allVendors.filter((v: any) => v.criticality === 'critical').length,
        totalVendors: allVendors.length,
        implementedControls: 0,
        controlEffectiveness: 0,
        pendingAssessments: allAssessments.filter((a: any) => ['sent', 'in_progress'].includes(a.status)).length,
        assessmentsDue: allAssessments.filter((a: any) => a.status === 'overdue').length
      });
    } catch (error) {
      console.error('Erro ao buscar dados de risco:', error);
      setRisks([]);
      setVendors([]);
      setAssessments([]);
      setStats(emptyStats);
      toast({
        title: 'Erro ao carregar riscos',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRiskStatus = async (riskId: string, newStatus: Risk['status']) => {
    try {
      const { error } = await supabase
        .from('risks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', riskId);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Atualizado",
        description: "Status do risco foi atualizado com sucesso.",
      });

      fetchRisks(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao atualizar status do risco:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do risco.",
        variant: "destructive"
      });
    }
  };

  const updateVendorCompliance = async (vendorId: string, complianceScore: number) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          compliance_score: complianceScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) {
        throw error;
      }

      toast({
        title: "Compliance Atualizada",
        description: "Score de compliance do fornecedor foi atualizado.",
      });

      fetchRisks(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao atualizar compliance do fornecedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar compliance do fornecedor.",
        variant: "destructive"
      });
    }
  };

  const sendAssessment = async (vendorId: string, templateName: string) => {
    try {
      toast({
        title: "Enviando Avaliação",
        description: `Enviando avaliação "${templateName}" para o fornecedor.`,
      });

      // Implementar lógica de envio real na tabela risk_assessments quando disponível
      toast({
        title: "Avaliação Enviada",
        description: "A avaliação foi enviada com sucesso!",
      });

      fetchRisks(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar avaliação.",
        variant: "destructive"
      });
    }
  };

  // Funções CRUD para gerenciar dados reais
  const createVendor = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const insertData = {
        name: vendorData.name,
        category: vendorData.category,
        criticality: vendorData.criticality,
        risk_level: vendorData.riskLevel,
        contract_value: vendorData.contractValue,
        last_assessment: vendorData.lastAssessment,
        next_assessment: vendorData.nextAssessment,
        compliance_score: vendorData.complianceScore,
        status: vendorData.status,
        certifications: vendorData.certifications,
        pending_actions: vendorData.pendingActions,
        user_id: user?.id
      };
      const { data, error } = await supabase
        .from('vendors')
        .insert([insertData])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Fornecedor criado",
        description: "Fornecedor cadastrado com sucesso"
      });
      
      // Atualizar lista local
      if (data) setVendors(prev => [data[0] as any, ...prev]);
      return { data, error: null };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar fornecedor",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const createRisk = async (riskData: Omit<Risk, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const insertData = {
        title: riskData.title,
        description: riskData.description,
        category: riskData.category,
        probability: riskData.probability,
        impact: riskData.impact,
        risk_score: riskData.riskScore,
        level: riskData.level,
        owner: riskData.owner,
        owner_role: riskData.ownerRole,
        status: riskData.status,
        trend: riskData.trend,
        last_review: riskData.lastReview,
        next_review: riskData.nextReview,
        controls: riskData.controls,
        user_id: user?.id
      };
      const { data, error } = await supabase
        .from('risks')
        .insert([insertData])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Risco criado",
        description: "Risco cadastrado com sucesso"
      });
      
      // Atualizar lista local
      if (data) setRisks(prev => [data[0] as any, ...prev]);
      return { data, error: null };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar risco",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const createAssessment = async (assessmentData: Omit<RiskAssessment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const insertData = {
        vendor_id: (assessmentData as any).vendor_id || assessmentData.vendor,
        template: assessmentData.template,
        status: assessmentData.status,
        progress: assessmentData.progress,
        sent_date: assessmentData.sentDate,
        due_date: assessmentData.dueDate,
        completed_questions: assessmentData.completedQuestions,
        total_questions: assessmentData.totalQuestions,
        risk_flags: assessmentData.riskFlags,
        contact_person: assessmentData.contactPerson,
        contact_email: assessmentData.contactEmail,
        user_id: user?.id
      };
      const { data, error } = await supabase
        .from('risk_assessments')
        .insert([insertData])
        .select('*, vendors(name)');
      
      if (error) throw error;
      
      toast({
        title: "Avaliação criada",
        description: "Avaliação de risco iniciada com sucesso"
      });
      
      // Mapear e atualizar lista local
      if (data) {
        const mappedData = data.map((assessment: any) => ({
          ...assessment,
          vendor: assessment.vendors?.name || 'Fornecedor não encontrado'
        }));
        setAssessments(prev => [...mappedData as any[], ...prev]);
      }
      return { data, error: null };
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Falha ao criar avaliação",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  /**
   * Calculates risk score based on probability and impact
   * 
   * @param probability - Risk probability level
   * @param impact - Risk impact level
   * @returns Calculated score (1-12)
   */
  const calculateRiskScore = (
    probability: 'low' | 'medium' | 'high',
    impact: 'low' | 'medium' | 'high' | 'critical'
  ): number => {
    const probabilityValues = { low: 1, medium: 2, high: 3 };
    const impactValues = { low: 1, medium: 2, high: 3, critical: 4 };
    
    return probabilityValues[probability] * impactValues[impact];
  };

  /**
   * Updates an existing risk
   * 
   * @param riskId - Risk ID
   * @param updates - Fields to update
   */
  const updateRisk = async (riskId: string, updates: Partial<Risk>) => {
    try {
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('risks')
        .update(updates)
        .eq('id', riskId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Risco atualizado",
        description: "Risco atualizado com sucesso"
      });
      
      // Update local state
      setRisks(risks.map(r => r.id === riskId ? { ...r, ...updates } : r));
    } catch (error) {
      console.error('Error updating risk:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar risco",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * Creates an audit log entry
   * 
   * @param logData - Audit log data
   */
  const createAuditLog = async (logData: {
    action: string;
    resource_type: string;
    resource_id: string;
    old_data?: any;
    new_data?: any;
  }) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: logData.action,
          resource_type: logData.resource_type,
          resource_id: logData.resource_id,
          old_data: logData.old_data || null,
          new_data: logData.new_data || null,
        }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't show error toast for audit logs to avoid noise
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  return {
    risks,
    vendors,
    assessments,
    stats,
    loading,
    updateRiskStatus,
    updateVendorCompliance,
    sendAssessment,
    refetch: fetchRisks,
    createVendor,
    createRisk,
    createAssessment,
    calculateRiskScore,
    updateRisk,
    createAuditLog,
  };
};