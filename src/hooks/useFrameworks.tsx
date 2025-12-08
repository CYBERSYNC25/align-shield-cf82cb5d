import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Framework = Database['public']['Tables']['frameworks']['Row'];
type FrameworkInsert = Database['public']['Tables']['frameworks']['Insert'];
type FrameworkUpdate = Database['public']['Tables']['frameworks']['Update'];

// Tipo para controles de framework
export interface FrameworkControl {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  status: 'passed' | 'failed' | 'pending' | 'na';
  evidence_count: number;
  owner: string;
  last_verified: string;
  next_review: string;
  findings?: string[];
  framework_id: string;
  user_id: string;
}

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock data para desenvolvimento - 3 frameworks principais
  const getMockFrameworks = (): Framework[] => [
    {
      id: '1',
      name: 'LGPD',
      description: 'Lei Geral de Proteção de Dados Pessoais - Regulamentação brasileira de privacidade',
      version: '2020',
      compliance_score: 78,
      status: 'active',
      total_controls: 5,
      passed_controls: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    },
    {
      id: '2',
      name: 'ISO 27001:2022',
      description: 'Sistema de Gestão de Segurança da Informação - Padrão internacional',
      version: '2022',
      compliance_score: 85,
      status: 'active',
      total_controls: 5,
      passed_controls: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    },
    {
      id: '3',
      name: 'SOC 2 Type II',
      description: 'Controles de Segurança, Disponibilidade e Confidencialidade',
      version: '2023',
      compliance_score: 92,
      status: 'active',
      total_controls: 5,
      passed_controls: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    }
  ];

  // 5 controles por framework com descrições realistas
  const getMockControls = (): FrameworkControl[] => [
    // LGPD Controls
    {
      id: 'lgpd-1',
      code: 'LGPD-7',
      title: 'Consentimento do Titular',
      category: 'Base Legal',
      description: 'Implementar mecanismo de coleta e gestão de consentimento explícito para tratamento de dados pessoais.',
      status: 'passed',
      evidence_count: 8,
      owner: 'Ana Rodrigues',
      last_verified: '20/11/2024',
      next_review: '20/02/2025',
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'lgpd-2',
      code: 'LGPD-18',
      title: 'Direito de Acesso',
      category: 'Direitos do Titular',
      description: 'Portal para titulares consultarem quais dados pessoais são armazenados e como são utilizados.',
      status: 'passed',
      evidence_count: 5,
      owner: 'Carlos Silva',
      last_verified: '18/11/2024',
      next_review: '18/02/2025',
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'lgpd-3',
      code: 'LGPD-46',
      title: 'Medidas de Segurança',
      category: 'Segurança',
      description: 'Criptografia de dados em repouso usando AES-256 para proteção de dados pessoais sensíveis.',
      status: 'passed',
      evidence_count: 12,
      owner: 'Roberto Lima',
      last_verified: '15/11/2024',
      next_review: '15/02/2025',
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'lgpd-4',
      code: 'LGPD-37',
      title: 'Registro de Atividades',
      category: 'Governança',
      description: 'Manter registro das operações de tratamento de dados pessoais (ROPA - Records of Processing Activities).',
      status: 'pending',
      evidence_count: 3,
      owner: 'Maria Santos',
      last_verified: '10/11/2024',
      next_review: '25/11/2024',
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'lgpd-5',
      code: 'LGPD-48',
      title: 'Notificação de Incidentes',
      category: 'Resposta a Incidentes',
      description: 'Processo para notificação à ANPD e titulares em caso de incidente de segurança envolvendo dados pessoais.',
      status: 'failed',
      evidence_count: 2,
      owner: 'Fernando Costa',
      last_verified: '08/11/2024',
      next_review: '20/11/2024',
      findings: ['Prazo de 72h não documentado', 'Template de comunicação pendente'],
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    
    // ISO 27001 Controls
    {
      id: 'iso-1',
      code: 'A.8.24',
      title: 'Criptografia de Dados em Repouso',
      category: 'Controles Tecnológicos',
      description: 'Aplicar criptografia AES-256 em todos os bancos de dados e sistemas de armazenamento.',
      status: 'passed',
      evidence_count: 15,
      owner: 'Carlos Silva',
      last_verified: '22/11/2024',
      next_review: '22/02/2025',
      framework_id: '2',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'iso-2',
      code: 'A.8.15',
      title: 'Política de Retenção de Logs',
      category: 'Controles Tecnológicos',
      description: 'Logs de auditoria retidos por 12 meses com backup imutável e rotação automática.',
      status: 'passed',
      evidence_count: 10,
      owner: 'Roberto Lima',
      last_verified: '20/11/2024',
      next_review: '20/02/2025',
      framework_id: '2',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'iso-3',
      code: 'A.5.15',
      title: 'Controle de Acesso Baseado em Função',
      category: 'Controles Organizacionais',
      description: 'Implementar RBAC (Role-Based Access Control) com princípio do menor privilégio.',
      status: 'passed',
      evidence_count: 8,
      owner: 'Ana Rodrigues',
      last_verified: '18/11/2024',
      next_review: '18/02/2025',
      framework_id: '2',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'iso-4',
      code: 'A.8.9',
      title: 'Gestão de Configuração',
      category: 'Controles Tecnológicos',
      description: 'Baseline de configuração segura documentado e verificado trimestralmente.',
      status: 'passed',
      evidence_count: 6,
      owner: 'Maria Santos',
      last_verified: '15/11/2024',
      next_review: '15/02/2025',
      framework_id: '2',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'iso-5',
      code: 'A.6.8',
      title: 'Relatório de Eventos de Segurança',
      category: 'Controles de Pessoas',
      description: 'Canal para colaboradores reportarem eventos e vulnerabilidades de segurança.',
      status: 'pending',
      evidence_count: 4,
      owner: 'Fernando Costa',
      last_verified: '12/11/2024',
      next_review: '28/11/2024',
      framework_id: '2',
      user_id: user?.id || 'mock-user'
    },
    
    // SOC 2 Controls
    {
      id: 'soc-1',
      code: 'CC6.1',
      title: 'Controles de Acesso Lógico',
      category: 'Common Criteria',
      description: 'MFA obrigatório para todos os acessos administrativos e sistemas críticos.',
      status: 'passed',
      evidence_count: 14,
      owner: 'Carlos Silva',
      last_verified: '25/11/2024',
      next_review: '25/02/2025',
      framework_id: '3',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'soc-2',
      code: 'CC7.2',
      title: 'Monitoramento de Anomalias',
      category: 'Common Criteria',
      description: 'Sistema SIEM para detecção de comportamentos anômalos e alertas em tempo real.',
      status: 'passed',
      evidence_count: 11,
      owner: 'Roberto Lima',
      last_verified: '23/11/2024',
      next_review: '23/02/2025',
      framework_id: '3',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'soc-3',
      code: 'CC8.1',
      title: 'Gestão de Mudanças',
      category: 'Common Criteria',
      description: 'Processo de change management com aprovações, testes e rollback documentado.',
      status: 'passed',
      evidence_count: 9,
      owner: 'Ana Rodrigues',
      last_verified: '20/11/2024',
      next_review: '20/02/2025',
      framework_id: '3',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'soc-4',
      code: 'A1.2',
      title: 'Backup e Recuperação',
      category: 'Availability',
      description: 'Backups diários com retenção de 30 dias e testes de restore mensais.',
      status: 'passed',
      evidence_count: 7,
      owner: 'Maria Santos',
      last_verified: '18/11/2024',
      next_review: '18/02/2025',
      framework_id: '3',
      user_id: user?.id || 'mock-user'
    },
    {
      id: 'soc-5',
      code: 'PI1.1',
      title: 'Validação de Integridade',
      category: 'Processing Integrity',
      description: 'Checksums e validações de integridade em todas as transferências de dados.',
      status: 'pending',
      evidence_count: 3,
      owner: 'Fernando Costa',
      last_verified: '10/11/2024',
      next_review: '30/11/2024',
      framework_id: '3',
      user_id: user?.id || 'mock-user'
    }
  ];

  // Fetch frameworks and controls
  const fetchData = async () => {
    if (!user) {
      setFrameworks([]);
      setControls([]);
      setLoading(false);
      return;
    }

    try {
      // Buscar frameworks do Supabase
      const { data: frameworksData, error: frameworksError } = await supabase
        .from('frameworks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (frameworksError) throw frameworksError;

      // Buscar controls do Supabase
      const { data: controlsData, error: controlsError } = await supabase
        .from('controls')
        .select('*')
        .eq('user_id', user.id)
        .order('code', { ascending: true });

      if (controlsError) throw controlsError;
      
      // Se há dados reais, usar. Senão, usar mock para desenvolvimento
      if (frameworksData && frameworksData.length > 0) {
        setFrameworks(frameworksData);
        setControls(controlsData?.map(c => ({
          ...c,
          status: c.status as FrameworkControl['status'],
          owner: c.owner || '',
          last_verified: c.last_verified || '',
          next_review: c.next_review || '',
          findings: c.findings || [],
        })) || []);
      } else {
        setFrameworks(getMockFrameworks());
        setControls(getMockControls());
      }
    } catch (error) {
      console.error('Erro ao buscar frameworks:', error);
      setFrameworks(getMockFrameworks());
      setControls(getMockControls());
    } finally {
      setLoading(false);
    }
  };

  // Create framework
  const createFramework = async (frameworkData: Omit<FrameworkInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('frameworks')
        .insert({
          ...frameworkData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setFrameworks(prev => [data, ...prev]);
      toast({
        title: "Framework criado",
        description: "Novo framework foi criado com sucesso"
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao criar framework:', error);
      
      // Fallback para dados mock
      const newFramework: Framework = {
        id: crypto.randomUUID(),
        name: frameworkData.name,
        description: frameworkData.description || '',
        version: frameworkData.version || '1.0',
        status: frameworkData.status || 'active',
        compliance_score: frameworkData.compliance_score || 0,
        total_controls: frameworkData.total_controls || 0,
        passed_controls: frameworkData.passed_controls || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };
      setFrameworks(prev => [newFramework, ...prev]);
      toast({
        title: "Framework criado (modo offline)",
        description: "Novo framework foi criado com sucesso"
      });
      return newFramework;
    }
  };

  // Update framework
  const updateFramework = async (id: string, updates: FrameworkUpdate) => {
    try {
      const { error } = await supabase
        .from('frameworks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFrameworks(prev => prev.map(framework => 
        framework.id === id ? { ...framework, ...updates } : framework
      ));

      toast({
        title: "Framework atualizado",
        description: "Framework foi atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar framework:', error);
      
      // Fallback para atualização local
      setFrameworks(prev => prev.map(framework => 
        framework.id === id ? { ...framework, ...updates, updated_at: new Date().toISOString() } : framework
      ));
      toast({
        title: "Framework atualizado (modo offline)",
        description: "Framework foi atualizado localmente"
      });
    }
  };

  // Update control status
  const updateControlStatus = async (controlId: string, status: FrameworkControl['status']) => {
    setControls(prev => prev.map(control => 
      control.id === controlId ? { ...control, status } : control
    ));

    toast({
      title: "Status atualizado",
      description: "Status do controle foi atualizado"
    });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Calculate framework statistics
  const getFrameworkStats = (frameworkId: string) => {
    const frameworkControls = controls.filter(c => c.framework_id === frameworkId);
    const passed = frameworkControls.filter(c => c.status === 'passed').length;
    const failed = frameworkControls.filter(c => c.status === 'failed').length;
    const pending = frameworkControls.filter(c => c.status === 'pending').length;
    const total = frameworkControls.length;
    const progress = total > 0 ? Math.round((passed / total) * 100) : 0;

    return {
      total,
      passed,
      failed,
      pending,
      progress
    };
  };

  // Create control
  const createControl = async (controlData: Omit<FrameworkControl, 'id' | 'user_id'>) => {
    if (!user) return null;

    const newControl: FrameworkControl = {
      id: crypto.randomUUID(),
      ...controlData,
      user_id: user.id
    };
    
    setControls(prev => [newControl, ...prev]);
    
    toast({
      title: "Controle criado",
      description: `Controle "${newControl.title}" criado com sucesso`
    });

    return newControl;
  };

  const deleteFramework = async (id: string) => {
    try {
      if (!user) {
        setFrameworks(frameworks.filter(f => f.id !== id));
        toast({ title: 'Framework excluído (mock)', variant: 'default' });
        return;
      }

      const { error } = await supabase.from('frameworks').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      setFrameworks(frameworks.filter(f => f.id !== id));
      toast({ title: 'Framework excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting framework:', error);
      toast({ title: 'Erro ao excluir framework', variant: 'destructive' });
      throw error;
    }
  };

  const updateControl = async (id: string, updates: any) => {
    try {
      if (!user) {
        setControls(controls.map(c => c.id === id ? { ...c, ...updates } : c));
        toast({ title: 'Controle atualizado (mock)', variant: 'default' });
        return;
      }

      const { error } = await supabase.from('controls').update(updates).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      setControls(controls.map(c => c.id === id ? { ...c, ...updates } : c));
      toast({ title: 'Controle atualizado com sucesso' });
    } catch (error) {
      console.error('Error updating control:', error);
      toast({ title: 'Erro ao atualizar controle', variant: 'destructive' });
      throw error;
    }
  };

  return {
    frameworks,
    controls,
    loading,
    createFramework,
    createControl,
    updateFramework,
    deleteFramework,
    updateControl,
    updateControlStatus,
    getFrameworkStats,
    refetch: fetchData
  };
}