import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

export interface ReportIncidentInput {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impactLevel?: 'low' | 'medium' | 'high';
  affectedSystems: string;
  assignedTo: string;
}

export const useIncidents = () => {
  console.log('useIncidents hook initialized');
  const { user } = useAuth();
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

  const emptyStats: IncidentStats = {
    activeIncidents: 0,
    incidentBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    mttr: '0h',
    mttrTarget: '6h',
    mttrProgress: 0,
    availability: '0%',
    availabilityChange: '0%',
    bcpTests: 0,
    scheduledTests: 0
  };

  const mapRowToIncident = (row: Record<string, unknown>): Incident => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    severity: (row.severity as Incident['severity']) ?? 'medium',
    status: (row.status as Incident['status']) ?? 'investigating',
    reportedAt: (row.reported_by as string) ?? (row.created_at as string) ?? '',
    assignedTo: (row.assigned_to as string) ?? '',
    assignedRole: '',
    affectedSystems: Array.isArray(row.affected_systems) ? (row.affected_systems as string[]) : [],
    impactLevel: 'medium',
    estimatedResolution: '',
    updates: 0,
    watchers: 0,
    playbook: '',
    created_at: (row.created_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? '',
  });

  const fetchIncidents = async () => {
    try {
      setLoading(true);

      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (incidentsError) {
        console.warn('Dados de incidentes não disponíveis:', incidentsError);
        setIncidents([]);
      } else {
        const rows = incidentsData ?? [];
        setIncidents(rows.map((row) => mapRowToIncident(row as Record<string, unknown>)));
      }

      const { data: playbooksData, error: playbooksError } = await supabase
        .from('incident_playbooks')
        .select('*')
        .order('usage_count', { ascending: false });

      if (playbooksError) {
        setPlaybooks([]);
      } else {
        setPlaybooks((playbooksData ?? []) as IncidentPlaybook[]);
      }

      const { data: bcpData, error: bcpError } = await supabase
        .from('bcp_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (bcpError) {
        setBcpPlans([]);
      } else {
        setBcpPlans((bcpData ?? []) as BCPPlan[]);
      }

      const allIncidents = incidentsData ?? [];
      const allBcpPlans = (bcpData ?? []) as BCPPlan[];

      const incidentBreakdown = allIncidents.reduce(
        (acc, incident) => {
          const sev = (incident as { severity?: string }).severity ?? 'medium';
          acc[sev as keyof typeof acc] = (acc[sev as keyof typeof acc] ?? 0) + 1;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0 }
      );

      setStats({
        activeIncidents: allIncidents.filter((i: { status?: string }) => ['investigating', 'identified', 'resolving'].includes(i.status ?? '')).length,
        incidentBreakdown,
        mttr: '0h',
        mttrTarget: '6h',
        mttrProgress: 0,
        availability: '0%',
        availabilityChange: '0%',
        bcpTests: allBcpPlans.filter((p: BCPPlan) => p.status === 'tested').length,
        scheduledTests: allBcpPlans.filter((p: BCPPlan) => p.status === 'scheduled').length
      });
    } catch (error) {
      console.error('Erro ao buscar dados de incidentes:', error);
      setIncidents([]);
      setPlaybooks([]);
      setBcpPlans([]);
      setStats(emptyStats);
      toast({
        title: 'Erro ao carregar incidentes',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: Incident['status']) => {
    try {
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

  const createIncident = async (input: ReportIncidentInput) => {
    try {
      const affectedSystemsArray = input.affectedSystems
        ? input.affectedSystems.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [];

      const insertPayload = {
        title: input.title,
        description: input.description || null,
        severity: input.severity,
        status: 'investigating',
        affected_systems: affectedSystemsArray.length > 0 ? affectedSystemsArray : null,
        assigned_to: input.assignedTo || null,
        user_id: user?.id || null,
        reported_by: user?.email || user?.user_metadata?.display_name || null,
      };

      const { data, error } = await supabase
        .from('incidents')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Incidente reportado',
        description: `"${input.title}" foi registrado com sucesso.`,
      });
      fetchIncidents();
      return { data, error: null };
    } catch (err: unknown) {
      console.error('Erro ao reportar incidente:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o incidente. Tente novamente.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    console.log('useIncidents useEffect called');
    fetchIncidents();
  }, []);

  return {
    incidents: incidents || [],
    playbooks: playbooks || [],
    bcpPlans: bcpPlans || [],
    stats,
    loading,
    createIncident,
    updateIncidentStatus,
    escalateIncident,
    executePlaybook,
    runBcpTest,
    refetch: fetchIncidents
  };
};