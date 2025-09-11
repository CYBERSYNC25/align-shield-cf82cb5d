import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'identified' | 'resolving' | 'resolved';
  reportedAt: string;
  assignedTo: string;
  assignedRole: string;
  affectedSystems: string[];
  impactLevel: 'low' | 'medium' | 'high';
  estimatedResolution: string;
  updates: number;
  watchers: number;
  playbook: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentPlaybook {
  id: string;
  name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  lastUsed: string;
  usageCount: number;
  steps: number;
  roles: string[];
  description: string;
  triggers: string[];
  created_at: string;
  updated_at: string;
}

export interface BCPPlan {
  id: string;
  name: string;
  type: string;
  status: 'tested' | 'updated' | 'scheduled' | 'expired';
  lastTested: string;
  nextTest: string;
  rto: string;
  rpo: string;
  coverage: number;
  criticalSystems: string[];
  testResults: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentStats {
  activeIncidents: number;
  incidentBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  mttr: string;
  mttrTarget: string;
  mttrProgress: number;
  availability: string;
  availabilityChange: string;
  bcpTests: number;
  scheduledTests: number;
}

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [playbooks, setPlaybooks] = useState<IncidentPlaybook[]>([]);
  const [bcpPlans, setBcpPlans] = useState<BCPPlan[]>([]);
  const [stats, setStats] = useState<IncidentStats>({
    activeIncidents: 0,
    incidentBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    mttr: '0h',
    mttrTarget: '6h',
    mttrProgress: 0,
    availability: '99.94%',
    availabilityChange: '+0.02%',
    bcpTests: 0,
    scheduledTests: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock data - substitua por dados reais do Supabase quando configurado
  const mockIncidents: Incident[] = [
    {
      id: 'INC-2024-0087',
      title: 'Falha no Sistema de Backup Principal',
      description: 'Sistema de backup principal apresentando falhas intermitentes',
      severity: 'critical',
      status: 'investigating',
      reportedAt: '2024-11-21 14:23',
      assignedTo: 'Carlos Silva',
      assignedRole: 'Infrastructure Lead',
      affectedSystems: ['Backup Server', 'Database Replication'],
      impactLevel: 'high',
      estimatedResolution: '2 horas',
      updates: 3,
      watchers: 8,
      playbook: 'Backup System Failure Response',
      created_at: '2024-11-21T14:23:00Z',
      updated_at: '2024-11-21T16:45:00Z'
    },
    {
      id: 'INC-2024-0086',
      title: 'Tentativa de Acesso Não Autorizado',
      description: 'Múltiplas tentativas de login com credenciais comprometidas detectadas',
      severity: 'high',
      status: 'investigating',
      reportedAt: '2024-11-21 09:45',
      assignedTo: 'Ana Rodrigues',
      assignedRole: 'Security Analyst',
      affectedSystems: ['Okta Identity', 'VPN Gateway'],
      impactLevel: 'medium',
      estimatedResolution: '4 horas',
      updates: 7,
      watchers: 12,
      playbook: 'Security Breach Response',
      created_at: '2024-11-21T09:45:00Z',
      updated_at: '2024-11-21T15:30:00Z'
    },
    {
      id: 'INC-2024-0085',
      title: 'Lentidão na API de Pagamentos',
      description: 'API apresentando latência elevada durante picos de tráfego',
      severity: 'medium',
      status: 'identified',
      reportedAt: '2024-11-21 08:15',
      assignedTo: 'Roberto Lima',
      assignedRole: 'DevOps Engineer',
      affectedSystems: ['Payment Gateway', 'Database Cluster'],
      impactLevel: 'medium',
      estimatedResolution: '6 horas',
      updates: 5,
      watchers: 6,
      playbook: 'Performance Degradation Response',
      created_at: '2024-11-21T08:15:00Z',
      updated_at: '2024-11-21T14:20:00Z'
    }
  ];

  const mockPlaybooks: IncidentPlaybook[] = [
    {
      id: '1',
      name: 'Security Breach Response',
      category: 'Security',
      severity: 'critical',
      estimatedTime: '2-4 horas',
      lastUsed: '21/11/2024',
      usageCount: 3,
      steps: 12,
      roles: ['CISO', 'Security Analyst', 'IT Manager', 'Communications'],
      description: 'Resposta completa a incidentes de segurança incluindo contenção, investigação e comunicação',
      triggers: ['Tentativa de acesso não autorizado', 'Malware detectado', 'Data exfiltration'],
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-21T09:45:00Z'
    },
    {
      id: '2',
      name: 'Backup System Failure Response',
      category: 'Infrastructure',
      severity: 'high',
      estimatedTime: '1-3 horas',
      lastUsed: '21/11/2024',
      usageCount: 1,
      steps: 8,
      roles: ['Infrastructure Lead', 'DevOps', 'Database Admin'],
      description: 'Procedimentos para falhas no sistema de backup e recuperação de dados',
      triggers: ['Falha no backup automatizado', 'Corrupção de backup', 'Hardware failure'],
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-21T14:23:00Z'
    },
    {
      id: '3',
      name: 'Performance Degradation Response',
      category: 'Performance',
      severity: 'medium',
      estimatedTime: '30min-2h',
      lastUsed: '21/11/2024',
      usageCount: 2,
      steps: 6,
      roles: ['DevOps Engineer', 'SRE', 'Database Admin'],
      description: 'Investigação e resolução de problemas de performance em sistemas críticos',
      triggers: ['API latency elevada', 'Database slowdown', 'Memory/CPU spikes'],
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-21T08:15:00Z'
    }
  ];

  const mockBcpPlans: BCPPlan[] = [
    {
      id: '1',
      name: 'Plano de Recuperação de Desastres',
      type: 'DR Plan',
      status: 'tested',
      lastTested: '15/10/2024',
      nextTest: '15/01/2025',
      rto: '4 horas',
      rpo: '1 hora',
      coverage: 95,
      criticalSystems: ['Database Principal', 'API Gateway', 'Auth Service'],
      testResults: 'Sucesso - RTO atingido em 3.2h',
      created_at: '2024-10-01T10:00:00Z',
      updated_at: '2024-10-15T16:30:00Z'
    },
    {
      id: '2',
      name: 'Continuidade de Operações TI',
      type: 'BCP',
      status: 'updated',
      lastTested: '08/11/2024',
      nextTest: '08/02/2025',
      rto: '2 horas',
      rpo: '30 min',
      coverage: 88,
      criticalSystems: ['Payment System', 'Customer Portal', 'Monitoring'],
      testResults: 'Sucesso - Todos os sistemas restaurados',
      created_at: '2024-09-01T10:00:00Z',
      updated_at: '2024-11-08T14:45:00Z'
    }
  ];

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        // Modo mock quando Supabase não está configurado
        setIncidents(mockIncidents);
        setPlaybooks(mockPlaybooks);
        setBcpPlans(mockBcpPlans);
        
        // Calcular estatísticas dos dados mock
        const incidentBreakdown = mockIncidents.reduce(
          (acc, incident) => {
            acc[incident.severity]++;
            return acc;
          },
          { critical: 0, high: 0, medium: 0, low: 0 }
        );

        setStats({
          activeIncidents: mockIncidents.filter(i => ['investigating', 'identified', 'resolving'].includes(i.status)).length,
          incidentBreakdown,
          mttr: '4.2h',
          mttrTarget: '6h',
          mttrProgress: 70,
          availability: '99.94%',
          availabilityChange: '+0.02%',
          bcpTests: mockBcpPlans.filter(p => p.status === 'tested').length + 12,
          scheduledTests: 3
        });
        return;
      }

      // Buscar incidentes
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (incidentsError) {
        console.error('Erro ao buscar incidentes:', incidentsError);
        setIncidents(mockIncidents);
      } else {
        setIncidents(incidentsData || []);
      }

      // Buscar playbooks
      const { data: playbooksData, error: playbooksError } = await supabase
        .from('incident_playbooks')
        .select('*')
        .order('usage_count', { ascending: false });

      if (playbooksError) {
        console.error('Erro ao buscar playbooks:', playbooksError);
        setPlaybooks(mockPlaybooks);
      } else {
        setPlaybooks(playbooksData || []);
      }

      // Buscar planos BCP
      const { data: bcpData, error: bcpError } = await supabase
        .from('bcp_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (bcpError) {
        console.error('Erro ao buscar planos BCP:', bcpError);
        setBcpPlans(mockBcpPlans);
      } else {
        setBcpPlans(bcpData || []);
      }

      // Calcular estatísticas
      const allIncidents = incidentsData || mockIncidents;
      const allBcpPlans = bcpData || mockBcpPlans;

      const incidentBreakdown = allIncidents.reduce(
        (acc, incident) => {
          acc[incident.severity]++;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0 }
      );

      setStats({
        activeIncidents: allIncidents.filter(i => ['investigating', 'identified', 'resolving'].includes(i.status)).length,
        incidentBreakdown,
        mttr: '4.2h',
        mttrTarget: '6h',
        mttrProgress: 70,
        availability: '99.94%',
        availabilityChange: '+0.02%',
        bcpTests: allBcpPlans.filter(p => p.status === 'tested').length + 12,
        scheduledTests: 3
      });

    } catch (error) {
      console.error('Erro ao buscar dados de incidentes:', error);
      // Fallback para dados mock em caso de erro
      setIncidents(mockIncidents);
      setPlaybooks(mockPlaybooks);
      setBcpPlans(mockBcpPlans);
      setStats({
        activeIncidents: 3,
        incidentBreakdown: { critical: 1, high: 1, medium: 1, low: 0 },
        mttr: '4.2h',
        mttrTarget: '6h',
        mttrProgress: 70,
        availability: '99.94%',
        availabilityChange: '+0.02%',
        bcpTests: 12,
        scheduledTests: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: Incident['status']) => {
    try {
      if (!supabase) {
        // Simular atualização em modo mock
        setIncidents(prev => 
          prev.map(incident => 
            incident.id === incidentId 
              ? { ...incident, status: newStatus, updated_at: new Date().toISOString() }
              : incident
          )
        );
        toast({
          title: "Status Atualizado",
          description: "Status do incidente foi atualizado com sucesso.",
        });
        return;
      }

      const { error } = await supabase
        .from('incidents')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Atualizado",
        description: "Status do incidente foi atualizado com sucesso.",
      });

      fetchIncidents(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao atualizar status do incidente:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do incidente.",
        variant: "destructive"
      });
    }
  };

  const escalateIncident = async (incidentId: string) => {
    try {
      const incident = incidents.find(i => i.id === incidentId);
      if (!incident) return;

      const severityOrder = ['low', 'medium', 'high', 'critical'];
      const currentIndex = severityOrder.indexOf(incident.severity);
      const newSeverity = currentIndex < severityOrder.length - 1 
        ? severityOrder[currentIndex + 1] as Incident['severity']
        : incident.severity;

      if (!supabase) {
        // Simular escalonamento em modo mock
        setIncidents(prev => 
          prev.map(inc => 
            inc.id === incidentId 
              ? { ...inc, severity: newSeverity, updated_at: new Date().toISOString() }
              : inc
          )
        );
        toast({
          title: "Incidente Escalonado",
          description: `Incidente escalonado para severidade ${newSeverity}.`,
        });
        return;
      }

      const { error } = await supabase
        .from('incidents')
        .update({ 
          severity: newSeverity,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) {
        throw error;
      }

      toast({
        title: "Incidente Escalonado",
        description: `Incidente escalonado para severidade ${newSeverity}.`,
      });

      fetchIncidents(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao escalar incidente:', error);
      toast({
        title: "Erro",
        description: "Erro ao escalar incidente.",
        variant: "destructive"
      });
    }
  };

  const executePlaybook = async (playbookId: string) => {
    try {
      const playbook = playbooks.find(p => p.id === playbookId);
      if (!playbook) return;

      toast({
        title: "Executando Playbook",
        description: `Iniciando execução de "${playbook.name}"...`,
      });

      if (!supabase) {
        // Simular execução em modo mock
        setTimeout(() => {
          toast({
            title: "Playbook Iniciado",
            description: "O playbook foi iniciado com sucesso!",
          });
        }, 2000);
        return;
      }

      // Atualizar contador de uso
      const { error } = await supabase
        .from('incident_playbooks')
        .update({ 
          usage_count: playbook.usageCount + 1,
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', playbookId);

      if (error) {
        throw error;
      }

      toast({
        title: "Playbook Iniciado",
        description: "O playbook foi iniciado com sucesso!",
      });

      fetchIncidents(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao executar playbook:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar playbook.",
        variant: "destructive"
      });
    }
  };

  const runBcpTest = async (planId: string) => {
    try {
      const plan = bcpPlans.find(p => p.id === planId);
      if (!plan) return;

      toast({
        title: "Executando Teste BCP",
        description: `Iniciando teste de "${plan.name}"...`,
      });

      if (!supabase) {
        // Simular teste em modo mock
        setTimeout(() => {
          toast({
            title: "Teste BCP Iniciado",
            description: "O teste de continuidade foi iniciado com sucesso!",
          });
        }, 2000);
        return;
      }

      // Atualizar status do plano
      const { error } = await supabase
        .from('bcp_plans')
        .update({ 
          status: 'scheduled',
          last_tested: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        throw error;
      }

      toast({
        title: "Teste BCP Iniciado",
        description: "O teste de continuidade foi iniciado com sucesso!",
      });

      fetchIncidents(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao executar teste BCP:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar teste BCP.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return {
    incidents,
    playbooks,
    bcpPlans,
    stats,
    loading,
    updateIncidentStatus,
    escalateIncident,
    executePlaybook,
    runBcpTest,
    refetch: fetchIncidents
  };
};