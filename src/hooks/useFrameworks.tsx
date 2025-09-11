import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/lib/supabase';

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

  // Mock data para desenvolvimento
  const getMockFrameworks = (): Framework[] => [
    {
      id: '1',
      name: 'SOC 2 Type II',
      description: 'System and Organization Controls 2 Type II - Auditoria de controles internos',
      version: '2023.1',
      compliance_score: 89,
      status: 'active',
      total_controls: 64,
      passed_controls: 57,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    },
    {
      id: '2',
      name: 'ISO 27001:2022',
      description: 'Sistema de Gestão de Segurança da Informação',
      version: '2022',
      compliance_score: 92,
      status: 'active',
      total_controls: 114,
      passed_controls: 105,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    },
    {
      id: '3',
      name: 'LGPD',
      description: 'Lei Geral de Proteção de Dados Pessoais - Brasil',
      version: '2020',
      compliance_score: 76,
      status: 'active',
      total_controls: 42,
      passed_controls: 32,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || 'mock-user'
    }
  ];

  const getMockControls = (): FrameworkControl[] => [
    {
      id: '1',
      code: 'CC6.1',
      title: 'Logical and Physical Access Controls',
      category: 'Common Criteria',
      description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.',
      status: 'passed',
      evidence_count: 12,
      owner: 'Carlos Silva',
      last_verified: '15/11/2024',
      next_review: '15/02/2025',
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: '2',
      code: 'CC6.2',
      title: 'Authentication and Authorization',
      category: 'Common Criteria',
      description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.',
      status: 'passed',
      evidence_count: 8,
      owner: 'Ana Rodrigues',
      last_verified: '12/11/2024',
      next_review: '12/02/2025',
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: '3',
      code: 'CC6.3',
      title: 'System Access Removal',
      category: 'Common Criteria',
      description: 'The entity removes system access when access is no longer required or appropriate.',
      status: 'failed',
      evidence_count: 3,
      owner: 'Roberto Lima',
      last_verified: '10/11/2024',
      next_review: '25/11/2024',
      findings: ['Processo manual de revogação', 'Delay na remoção de ex-funcionários'],
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: '4',
      code: 'CC7.1',
      title: 'System Monitoring',
      category: 'Common Criteria',
      description: 'The entity monitors system components for anomalies that are indicative of malicious acts, natural disasters, and errors.',
      status: 'pending',
      evidence_count: 5,
      owner: 'Maria Santos',
      last_verified: '08/11/2024',
      next_review: '30/11/2024',
      framework_id: '1',
      user_id: user?.id || 'mock-user'
    },
    {
      id: '5',
      code: 'A1.1',
      title: 'Availability Processing Integrity',
      category: 'Availability',
      description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components.',
      status: 'passed',
      evidence_count: 15,
      owner: 'Fernanda Costa',
      last_verified: '20/11/2024',
      next_review: '20/02/2025',
      framework_id: '1',
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

    // Se não há configuração real do Supabase, usar dados mocados
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setFrameworks(getMockFrameworks());
      setControls(getMockControls());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('frameworks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFrameworks(data || []);
      // Note: Em um sistema real, você teria uma tabela de controls
      setControls(getMockControls());
    } catch (error) {
      console.error('Erro ao buscar frameworks:', error);
      toast({
        title: "Erro ao carregar frameworks",
        description: "Não foi possível carregar os frameworks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create framework
  const createFramework = async (frameworkData: Omit<FrameworkInsert, 'user_id'>) => {
    if (!user) return null;

    if (!import.meta.env.VITE_SUPABASE_URL) {
      const newFramework: Framework = {
        id: Date.now().toString(),
        ...frameworkData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };
      setFrameworks(prev => [newFramework, ...prev]);
      toast({
        title: "Framework criado",
        description: "Novo framework foi criado com sucesso"
      });
      return newFramework;
    }

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
      toast({
        title: "Erro ao criar framework",
        description: "Não foi possível criar o framework",
        variant: "destructive"
      });
      return null;
    }
  };

  // Update framework
  const updateFramework = async (id: string, updates: FrameworkUpdate) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setFrameworks(prev => prev.map(framework => 
        framework.id === id ? { ...framework, ...updates, updated_at: new Date().toISOString() } : framework
      ));
      toast({
        title: "Framework atualizado",
        description: "Framework foi atualizado com sucesso"
      });
      return;
    }

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
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o framework",
        variant: "destructive"
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

  return {
    frameworks,
    controls,
    loading,
    createFramework,
    updateFramework,
    updateControlStatus,
    getFrameworkStats,
    refetch: fetchData
  };
}