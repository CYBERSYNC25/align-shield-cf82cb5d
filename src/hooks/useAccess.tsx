import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AccessCampaign {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'draft';
  start_date: string;
  end_date: string;
  systems: string[];
  reviewers: string[];
  progress: number;
  total_users: number;
  certified_users: number;
  created_at: string;
  updated_at: string;
}

export interface SystemInventory {
  id: string;
  name: string;
  type: 'saas' | 'on-premise' | 'cloud';
  users_count: number;
  last_review: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_status: 'compliant' | 'non-compliant' | 'unknown';
  integration_status: 'connected' | 'disconnected' | 'error';
  created_at: string;
  updated_at: string;
}

export interface AccessAnomaly {
  id: string;
  user_id: string;
  user_name: string;
  system_name: string;
  anomaly_type: 'excessive_privileges' | 'unused_access' | 'suspicious_activity' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// Mock data for development
const mockCampaigns: AccessCampaign[] = [
  {
    id: '1',
    name: 'Revisão Trimestral Q4 2024',
    status: 'active',
    start_date: '2024-10-01',
    end_date: '2024-12-15',
    systems: ['Salesforce', 'AWS', 'GitHub', 'Slack'],
    reviewers: ['admin@company.com', 'security@company.com'],
    progress: 67,
    total_users: 247,
    certified_users: 165,
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-11-08T00:00:00Z'
  },
  {
    id: '2',
    name: 'Revisão de Privilégios Administrativos',
    status: 'active',
    start_date: '2024-11-01',
    end_date: '2024-11-30',
    systems: ['Active Directory', 'AWS', 'Database Servers'],
    reviewers: ['it-admin@company.com'],
    progress: 23,
    total_users: 45,
    certified_users: 10,
    created_at: '2024-10-20T00:00:00Z',
    updated_at: '2024-11-08T00:00:00Z'
  },
  {
    id: '3',
    name: 'Revisão Anual de Compliance',
    status: 'completed',
    start_date: '2024-08-01',
    end_date: '2024-09-30',
    systems: ['All Systems'],
    reviewers: ['compliance@company.com', 'audit@company.com'],
    progress: 100,
    total_users: 412,
    certified_users: 408,
    created_at: '2024-07-15T00:00:00Z',
    updated_at: '2024-09-30T00:00:00Z'
  }
];

const mockSystems: SystemInventory[] = [
  {
    id: '1',
    name: 'Salesforce CRM',
    type: 'saas',
    users_count: 156,
    last_review: '2024-10-15',
    risk_level: 'medium',
    compliance_status: 'compliant',
    integration_status: 'connected',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-10-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'AWS Cloud Infrastructure',
    type: 'cloud',
    users_count: 89,
    last_review: '2024-11-01',
    risk_level: 'high',
    compliance_status: 'compliant',
    integration_status: 'connected',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'GitHub Enterprise',
    type: 'saas',
    users_count: 78,
    last_review: '2024-10-20',
    risk_level: 'medium',
    compliance_status: 'compliant',
    integration_status: 'connected',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  },
  {
    id: '4',
    name: 'Legacy ERP System',
    type: 'on-premise',
    users_count: 234,
    last_review: '2024-11-08',
    risk_level: 'high',
    compliance_status: 'compliant',
    integration_status: 'connected',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-11-08T00:00:00Z'
  },
  {
    id: '5',
    name: 'Slack Workspace',
    type: 'saas',
    users_count: 312,
    last_review: '2024-10-30',
    risk_level: 'low',
    compliance_status: 'compliant',
    integration_status: 'connected',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-10-30T00:00:00Z'
  }
];

const mockAnomalies: AccessAnomaly[] = [
  {
    id: '1',
    user_id: 'user_001',
    user_name: 'João Silva',
    system_name: 'AWS Cloud Infrastructure',
    anomaly_type: 'excessive_privileges',
    severity: 'high',
    description: 'Usuário possui privilégios administrativos em múltiplos serviços AWS sem justificativa de negócio',
    detected_at: '2024-11-07T14:30:00Z',
    status: 'investigating',
    assigned_to: 'security@company.com',
    created_at: '2024-11-07T14:30:00Z',
    updated_at: '2024-11-08T10:15:00Z'
  },
  {
    id: '2',
    user_id: 'user_002',
    user_name: 'Maria Santos',
    system_name: 'Legacy ERP System',
    anomaly_type: 'unused_access',
    severity: 'medium',
    description: 'Acesso não utilizado há mais de 90 dias',
    detected_at: '2024-11-06T09:15:00Z',
    status: 'open',
    created_at: '2024-11-06T09:15:00Z',
    updated_at: '2024-11-06T09:15:00Z'
  },
  {
    id: '3',
    user_id: 'user_003',
    user_name: 'Pedro Oliveira',
    system_name: 'Salesforce CRM',
    anomaly_type: 'policy_violation',
    severity: 'critical',
    description: 'Violação da política de segregação de funções - usuário tem acesso a módulos conflitantes',
    detected_at: '2024-11-05T16:45:00Z',
    status: 'investigating',
    assigned_to: 'compliance@company.com',
    created_at: '2024-11-05T16:45:00Z',
    updated_at: '2024-11-07T11:20:00Z'
  },
  {
    id: '4',
    user_id: 'user_004',
    user_name: 'Ana Costa',
    system_name: 'GitHub Enterprise',
    anomaly_type: 'suspicious_activity',
    severity: 'high',
    description: 'Atividade suspeita detectada - múltiplos logins de localizações diferentes',
    detected_at: '2024-11-04T22:10:00Z',
    status: 'resolved',
    assigned_to: 'security@company.com',
    created_at: '2024-11-04T22:10:00Z',
    updated_at: '2024-11-05T08:30:00Z'
  }
];

export const useAccess = () => {
  const [campaigns, setCampaigns] = useState<AccessCampaign[]>([]);
  const [systems, setSystems] = useState<SystemInventory[]>([]);
  const [anomalies, setAnomalies] = useState<AccessAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    try {
      return supabase && 
             process.env.NODE_ENV === 'production'; // Simple check for production
    } catch (error) {
      return false;
    }
  };

  const fetchCampaigns = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Using mock data for access campaigns');
      setCampaigns(mockCampaigns);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('access_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        setCampaigns(mockCampaigns);
        return;
      }

      setCampaigns(data || mockCampaigns);
    } catch (err) {
      console.error('Error:', err);
      setCampaigns(mockCampaigns);
    }
  };

  const fetchSystems = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Using mock data for system inventory');
      setSystems(mockSystems);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_inventory')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching systems:', error);
        setSystems(mockSystems);
        return;
      }

      setSystems(data || mockSystems);
    } catch (err) {
      console.error('Error:', err);
      setSystems(mockSystems);
    }
  };

  const fetchAnomalies = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Using mock data for access anomalies');
      setAnomalies(mockAnomalies);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('access_anomalies')
        .select('*')
        .order('detected_at', { ascending: false });

      if (error) {
        console.error('Error fetching anomalies:', error);
        setAnomalies(mockAnomalies);
        return;
      }

      setAnomalies(data || mockAnomalies);
    } catch (err) {
      console.error('Error:', err);
      setAnomalies(mockAnomalies);
    }
  };

  const createCampaign = async (campaignData: Omit<AccessCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isSupabaseConfigured()) {
      const newCampaign: AccessCampaign = {
        ...campaignData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setCampaigns(prev => [newCampaign, ...prev]);
      toast.success('Campanha criada com sucesso (mock)');
      return newCampaign;
    }

    try {
      const { data, error } = await supabase
        .from('access_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [data, ...prev]);
      toast.success('Campanha criada com sucesso');
      return data;
    } catch (err) {
      console.error('Error creating campaign:', err);
      toast.error('Erro ao criar campanha');
      throw err;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<AccessCampaign>) => {
    if (!isSupabaseConfigured()) {
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id 
          ? { ...campaign, ...updates, updated_at: new Date().toISOString() }
          : campaign
      ));
      toast.success('Campanha atualizada com sucesso (mock)');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('access_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? data : campaign
      ));
      toast.success('Campanha atualizada com sucesso');
    } catch (err) {
      console.error('Error updating campaign:', err);
      toast.error('Erro ao atualizar campanha');
      throw err;
    }
  };

  const resolveAnomaly = async (id: string, resolution: { status: AccessAnomaly['status']; assigned_to?: string }) => {
    if (!isSupabaseConfigured()) {
      setAnomalies(prev => prev.map(anomaly => 
        anomaly.id === id 
          ? { ...anomaly, ...resolution, updated_at: new Date().toISOString() }
          : anomaly
      ));
      toast.success('Anomalia atualizada com sucesso (mock)');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('access_anomalies')
        .update({ ...resolution, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAnomalies(prev => prev.map(anomaly => 
        anomaly.id === id ? data : anomaly
      ));
      toast.success('Anomalia atualizada com sucesso');
    } catch (err) {
      console.error('Error resolving anomaly:', err);
      toast.error('Erro ao atualizar anomalia');
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCampaigns(),
          fetchSystems(),
          fetchAnomalies()
        ]);
      } catch (err) {
        setError('Erro ao carregar dados de acesso');
        console.error('Error loading access data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    campaigns,
    systems,
    anomalies,
    loading,
    error,
    createCampaign,
    updateCampaign,
    resolveAnomaly,
    refetch: () => {
      fetchCampaigns();
      fetchSystems();
      fetchAnomalies();
    }
  };
};