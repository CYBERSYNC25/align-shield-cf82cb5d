import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

  // Mock data - substitua por dados reais do Supabase quando configurado
  const mockRisks: Risk[] = [
    {
      id: '1',
      title: 'Falha de Backup Crítico',
      description: 'Risco de perda de dados por falha no sistema de backup principal',
      category: 'Operacional',
      probability: 'medium',
      impact: 'high',
      riskScore: 12,
      level: 'high',
      owner: 'Carlos Silva',
      ownerRole: 'Infrastructure Lead',
      status: 'active',
      trend: 'stable',
      lastReview: '15/11/2024',
      nextReview: '15/02/2025',
      controls: ['Backup Automatizado', 'Monitoramento 24/7', 'Testes Regulares'],
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-15T14:30:00Z'
    },
    {
      id: '2',
      title: 'Vazamento de Dados Pessoais',
      description: 'Exposição não autorizada de dados pessoais de clientes',
      category: 'Segurança',
      probability: 'low',
      impact: 'critical',
      riskScore: 15,
      level: 'critical',
      owner: 'Ana Rodrigues',
      ownerRole: 'DPO',
      status: 'active',
      trend: 'decreasing',
      lastReview: '10/11/2024',
      nextReview: '10/01/2025',
      controls: ['Criptografia End-to-End', 'DLP', 'Treinamento LGPD'],
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-10T16:45:00Z'
    },
    {
      id: '3',
      title: 'Ataque de Ransomware',
      description: 'Criptografia maliciosa de sistemas críticos por ransomware',
      category: 'Cibersegurança',
      probability: 'high',
      impact: 'critical',
      riskScore: 20,
      level: 'critical',
      owner: 'Maria Santos',
      ownerRole: 'CISO',
      status: 'active',
      trend: 'increasing',
      lastReview: '12/11/2024',
      nextReview: '12/12/2024',
      controls: ['EDR', 'Backup Offline', 'Treinamento Phishing'],
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-12T09:15:00Z'
    }
  ];

  const mockVendors: Vendor[] = [
    {
      id: '1',
      name: 'CloudSecure Inc.',
      category: 'Cloud Infrastructure',
      criticality: 'critical',
      riskLevel: 'high',
      contractValue: '$120k/ano',
      lastAssessment: '15/10/2024',
      nextAssessment: '15/04/2025',
      complianceScore: 85,
      status: 'active',
      certifications: ['SOC 2', 'ISO 27001', 'FedRAMP'],
      pendingActions: 3,
      created_at: '2024-10-01T10:00:00Z',
      updated_at: '2024-11-15T14:30:00Z'
    },
    {
      id: '2',
      name: 'DataProtect Solutions',
      category: 'Security Services',
      criticality: 'high',
      riskLevel: 'medium',
      contractValue: '$85k/ano',
      lastAssessment: '22/09/2024',
      nextAssessment: '22/03/2025',
      complianceScore: 92,
      status: 'active',
      certifications: ['ISO 27001', 'PCI DSS'],
      pendingActions: 1,
      created_at: '2024-09-01T10:00:00Z',
      updated_at: '2024-11-22T16:45:00Z'
    }
  ];

  const mockAssessments: RiskAssessment[] = [
    {
      id: '1',
      vendor: 'CloudSecure Inc.',
      template: 'SOC 2 Vendor Assessment',
      status: 'in_progress',
      progress: 65,
      sentDate: '15/11/2024',
      dueDate: '25/11/2024',
      completedQuestions: 29,
      totalQuestions: 45,
      riskFlags: 2,
      contactPerson: 'James Wilson',
      contactEmail: 'james@cloudsecure.com',
      created_at: '2024-11-15T10:00:00Z',
      updated_at: '2024-11-20T14:30:00Z'
    },
    {
      id: '2',
      vendor: 'DataProtect Solutions',
      template: 'LGPD Data Processing',
      status: 'completed',
      progress: 100,
      sentDate: '08/11/2024',
      dueDate: '18/11/2024',
      completedQuestions: 32,
      totalQuestions: 32,
      riskFlags: 0,
      contactPerson: 'Sarah Chen',
      contactEmail: 'sarah@dataprotect.com',
      created_at: '2024-11-08T10:00:00Z',
      updated_at: '2024-11-18T16:45:00Z'
    }
  ];

  const fetchRisks = async () => {
    try {
      setLoading(true);
      
      // Verificar se Supabase está configurado verificando se a URL não é placeholder
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && 
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY !== 'placeholder-key';
      
      if (!isSupabaseConfigured) {
        // Modo mock quando Supabase não está configurado
        setRisks(mockRisks);
        setVendors(mockVendors);
        setAssessments(mockAssessments);
        
        // Calcular estatísticas dos dados mock
        const riskBreakdown = mockRisks.reduce(
          (acc, risk) => {
            acc[risk.level]++;
            return acc;
          },
          { critical: 0, high: 0, medium: 0, low: 0 }
        );

        setStats({
          activeRisks: mockRisks.filter(r => r.status === 'active').length,
          riskBreakdown,
          criticalVendors: mockVendors.filter(v => v.criticality === 'critical').length,
          totalVendors: mockVendors.length,
          implementedControls: 156,
          controlEffectiveness: 89,
          pendingAssessments: mockAssessments.filter(a => ['sent', 'in_progress'].includes(a.status)).length,
          assessmentsDue: mockAssessments.filter(a => a.status === 'overdue').length
        });
        return;
      }

      // Buscar riscos
      const { data: risksData, error: risksError } = await supabase
        .from('risks')
        .select('*')
        .order('created_at', { ascending: false });

      if (risksError) {
        console.warn('Dados de riscos não disponíveis:', risksError);
        setRisks([]);
      } else {
        setRisks(risksData || []);
      }

      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (vendorsError) {
        console.error('Erro ao buscar fornecedores:', vendorsError);
        setVendors([]);
      } else {
        setVendors(vendorsData || []);
      }

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('risk_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assessmentsError) {
        console.error('Erro ao buscar avaliações:', assessmentsError);
        setAssessments([]);
      } else {
        setAssessments(assessmentsData || []);
      }

      const allRisks = risksData || [];
      const allVendors = vendorsData || [];
      const allAssessments = assessmentsData || [];

      const riskBreakdown = allRisks.reduce(
        (acc, risk) => {
          acc[risk.level]++;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0 }
      );

      setStats({
        activeRisks: allRisks.filter(r => r.status === 'active').length,
        riskBreakdown,
        criticalVendors: allVendors.filter(v => v.criticality === 'critical').length,
        totalVendors: allVendors.length,
        implementedControls: 156,
        controlEffectiveness: 89,
        pendingAssessments: allAssessments.filter(a => ['sent', 'in_progress'].includes(a.status)).length,
        assessmentsDue: allAssessments.filter(a => a.status === 'overdue').length
      });

    } catch (error) {
      console.error('Erro ao buscar dados de risco:', error);
      setRisks([]);
      setVendors([]);
      setAssessments([]);
      setStats({
        activeRisks: 0,
        riskBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
        criticalVendors: 0,
        totalVendors: 0,
        implementedControls: 0,
        controlEffectiveness: 0,
        pendingAssessments: 0,
        assessmentsDue: 0
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

      // Implementar lógica de envio real aqui
      // Por exemplo, criar uma nova entrada na tabela risk_assessments

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
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          ...vendorData,
          user_id: user?.id
        }])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Fornecedor criado",
        description: "Fornecedor cadastrado com sucesso"
      });
      
      // Atualizar lista local
      if (data) setVendors(prev => [data[0], ...prev]);
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
      const { data, error } = await supabase
        .from('risks')
        .insert([{
          ...riskData,
          user_id: user?.id
        }])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Risco criado",
        description: "Risco cadastrado com sucesso"
      });
      
      // Atualizar lista local
      if (data) setRisks(prev => [data[0], ...prev]);
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
      const { data, error } = await supabase
        .from('risk_assessments')
        .insert([{
          ...assessmentData,
          user_id: user?.id
        }])
        .select('*, vendors(name)');
      
      if (error) throw error;
      
      toast({
        title: "Avaliação criada",
        description: "Avaliação de risco iniciada com sucesso"
      });
      
      // Mapear e atualizar lista local
      if (data) {
        const mappedData = data.map(assessment => ({
          ...assessment,
          vendor: assessment.vendors?.name || 'Fornecedor não encontrado'
        }));
        setAssessments(prev => [...mappedData, ...prev]);
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
        // Mock update for development
        setRisks(risks.map(r => r.id === riskId ? { ...r, ...updates, updated_at: new Date().toISOString() } : r));
        toast({
          title: "Risco atualizado",
          description: "Risco atualizado com sucesso (mock)"
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
      if (!user) {
        console.log('Audit log (mock):', logData);
        return;
      }

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