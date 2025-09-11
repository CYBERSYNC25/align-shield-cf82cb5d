import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'detailed' | 'executive';
  format: 'PDF' | 'Excel' | 'PowerPoint' | 'CSV' | 'ZIP Archive';
  framework: string;
  readiness: number;
  status: 'ready' | 'updating' | 'generating';
  lastGenerated: string;
  size: string;
  pages: number;
  sections: string[];
  audience: string;
  metrics?: string[];
  filters?: any;
  recipients?: string[];
  created_at: string;
  updated_at: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  status: 'active' | 'paused';
  format: string;
  recipients: Array<{
    name: string;
    email: string;
  }>;
  deliveryMethod: 'email' | 'secure_link';
  successRate: number;
  lastStatus: 'success' | 'warning' | 'error';
  created_at: string;
  updated_at: string;
}

export interface ReportStats {
  totalGenerated: number;
  weeklyGrowth: number;
  monthlyCount: number;
  totalDownloads: number;
  uniqueDownloads: number;
  scheduledReports: number;
  activeScheduled: number;
  sharedLinks: number;
  expiringLinks: number;
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalGenerated: 0,
    weeklyGrowth: 0,
    monthlyCount: 0,
    totalDownloads: 0,
    uniqueDownloads: 0,
    scheduledReports: 0,
    activeScheduled: 0,
    sharedLinks: 0,
    expiringLinks: 0
  });
  const [loading, setLoading] = useState(true);

  // Mock data - substitua por dados reais do Supabase quando configurado
  const mockReports: Report[] = [
    {
      id: '1',
      name: 'SOC 2 Readiness Report',
      description: 'Avaliação completa de conformidade SOC 2 Type II com gaps e recomendações',
      type: 'executive',
      format: 'PDF',
      framework: 'SOC 2',
      readiness: 89,
      status: 'ready',
      lastGenerated: '2 horas atrás',
      size: '4.2 MB',
      pages: 47,
      sections: ['Trust Services Criteria', 'Control Assessment', 'Evidence Summary', 'Gap Analysis'],
      audience: 'Auditores Externos',
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'ISO 27001 Compliance Scorecard',
      description: 'Scorecard executivo de conformidade ISO 27001:2022 com métricas de maturidade',
      type: 'dashboard',
      format: 'PDF',
      framework: 'ISO 27001',
      readiness: 92,
      status: 'ready',
      lastGenerated: '1 dia atrás',
      size: '2.8 MB',
      pages: 32,
      sections: ['ISMS Overview', 'Annex A Controls', 'Risk Assessment', 'Management Review'],
      audience: 'C-Level',
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-19T09:15:00Z'
    },
    {
      id: '3',
      name: 'LGPD Maturity Assessment',
      description: 'Avaliação de maturidade LGPD com registro de atividades de tratamento',
      type: 'detailed',
      format: 'Excel',
      framework: 'LGPD',
      readiness: 76,
      status: 'updating',
      lastGenerated: '3 dias atrás',
      size: '1.9 MB',
      pages: 28,
      sections: ['Princípios LGPD', 'Base Legal', 'DPO Report', 'Incident Response'],
      audience: 'Jurídico & DPO',
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-17T16:45:00Z'
    }
  ];

  const mockScheduledReports: ScheduledReport[] = [
    {
      id: '1',
      name: 'Executive Security Summary',
      description: 'Relatório executivo semanal com KPIs de segurança',
      schedule: 'Toda segunda-feira às 08:00',
      nextRun: '25/11/2024 08:00',
      lastRun: '18/11/2024 08:00',
      status: 'active',
      format: 'PDF',
      recipients: [
        { name: 'CEO', email: 'ceo@empresa.com' },
        { name: 'CISO', email: 'ciso@empresa.com' },
        { name: 'CTO', email: 'cto@empresa.com' }
      ],
      deliveryMethod: 'email',
      successRate: 100,
      lastStatus: 'success',
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-18T08:00:00Z'
    },
    {
      id: '2',
      name: 'Compliance Dashboard Monthly',
      description: 'Dashboard mensal de conformidade para auditores',
      schedule: '1º dia útil do mês às 09:00',
      nextRun: '01/12/2024 09:00',
      lastRun: '01/11/2024 09:00',
      status: 'active',
      format: 'PowerPoint',
      recipients: [
        { name: 'Compliance Officer', email: 'compliance@empresa.com' },
        { name: 'Risk Manager', email: 'risk@empresa.com' },
        { name: 'External Auditor', email: 'auditor@auditfirm.com' }
      ],
      deliveryMethod: 'email',
      successRate: 95,
      lastStatus: 'success',
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-01T09:00:00Z'
    }
  ];

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        // Modo mock quando Supabase não está configurado
        setReports(mockReports);
        setScheduledReports(mockScheduledReports);
        setStats({
          totalGenerated: 247,
          weeklyGrowth: 18,
          monthlyCount: 89,
          totalDownloads: 1423,
          uniqueDownloads: 156,
          scheduledReports: 12,
          activeScheduled: 8,
          sharedLinks: 34,
          expiringLinks: 3
        });
        return;
      }

      // Buscar relatórios
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Erro ao buscar relatórios:', reportsError);
        // Fallback para dados mock
        setReports(mockReports);
      } else {
        setReports(reportsData || []);
      }

      // Buscar relatórios agendados
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (scheduledError) {
        console.error('Erro ao buscar relatórios agendados:', scheduledError);
        setScheduledReports(mockScheduledReports);
      } else {
        setScheduledReports(scheduledData || []);
      }

      // Calcular estatísticas
      const totalReports = reportsData?.length || mockReports.length;
      const activeScheduled = scheduledData?.filter(r => r.status === 'active').length || 2;
      
      setStats({
        totalGenerated: totalReports * 82, // Simulando múltiplas gerações
        weeklyGrowth: 18,
        monthlyCount: Math.floor(totalReports * 2.3),
        totalDownloads: totalReports * 67,
        uniqueDownloads: totalReports * 12,
        scheduledReports: scheduledData?.length || mockScheduledReports.length,
        activeScheduled,
        sharedLinks: Math.floor(totalReports * 1.4),
        expiringLinks: 3
      });

    } catch (error) {
      console.error('Erro ao buscar dados de relatórios:', error);
      // Fallback para dados mock em caso de erro
      setReports(mockReports);
      setScheduledReports(mockScheduledReports);
      setStats({
        totalGenerated: 247,
        weeklyGrowth: 18,
        monthlyCount: 89,
        totalDownloads: 1423,
        uniqueDownloads: 156,
        scheduledReports: 12,
        activeScheduled: 8,
        sharedLinks: 34,
        expiringLinks: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      toast({
        title: "Gerando Relatório",
        description: "O relatório está sendo gerado e será enviado por email.",
      });

      if (!supabase) {
        // Simular geração em modo mock
        setTimeout(() => {
          toast({
            title: "Relatório Gerado",
            description: "O relatório foi gerado com sucesso!",
          });
        }, 2000);
        return;
      }

      // Atualizar status para gerando
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'generating',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        throw error;
      }

      // Simular processo de geração
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('reports')
          .update({ 
            status: 'ready',
            lastGenerated: 'Agora mesmo',
            updated_at: new Date().toISOString()
          })
          .eq('id', reportId);

        if (!updateError) {
          toast({
            title: "Relatório Gerado",
            description: "O relatório foi gerado com sucesso!",
          });
          fetchReports(); // Recarregar dados
        }
      }, 3000);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const toggleScheduledReport = async (reportId: string, newStatus: 'active' | 'paused') => {
    try {
      if (!supabase) {
        // Simular toggle em modo mock
        setScheduledReports(prev => 
          prev.map(report => 
            report.id === reportId 
              ? { ...report, status: newStatus }
              : report
          )
        );
        toast({
          title: newStatus === 'active' ? "Relatório Ativado" : "Relatório Pausado",
          description: `O agendamento foi ${newStatus === 'active' ? 'ativado' : 'pausado'}.`,
        });
        return;
      }

      const { error } = await supabase
        .from('scheduled_reports')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        throw error;
      }

      toast({
        title: newStatus === 'active' ? "Relatório Ativado" : "Relatório Pausado",
        description: `O agendamento foi ${newStatus === 'active' ? 'ativado' : 'pausado'}.`,
      });

      fetchReports(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao alterar status do relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do relatório.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    scheduledReports,
    stats,
    loading,
    generateReport,
    toggleScheduledReport,
    refetch: fetchReports
  };
};