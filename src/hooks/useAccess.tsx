import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useIntegratedSystems } from './useIntegratedSystems';

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

export const useAccess = () => {
  const [campaigns, setCampaigns] = useState<AccessCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const { 
    systems: integratedSystems, 
    anomalies: detectedAnomalies, 
    isLoading: integrationLoading,
    hasRealData 
  } = useIntegratedSystems();

  const systems = useMemo(() => integratedSystems, [integratedSystems]);
  const anomalies = useMemo(() => detectedAnomalies, [detectedAnomalies]);

  const fetchCampaigns = async () => {
    if (!user) {
      setCampaigns([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('access_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data ?? []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setCampaigns([]);
      setError('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Omit<AccessCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('access_campaigns')
        .insert([{ ...campaignData, user_id: user.id }])
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
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('access_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
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
    try {
      const { data, error } = await supabase
        .from('access_anomalies')
        .update({ ...resolution, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Anomalia atualizada com sucesso');
    } catch (err) {
      console.error('Error resolving anomaly:', err);
      toast.error('Erro ao atualizar anomalia');
      throw err;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user?.id]);

  return {
    campaigns,
    systems,
    anomalies,
    loading: loading || integrationLoading,
    error,
    hasRealData,
    createCampaign,
    updateCampaign,
    resolveAnomaly,
    refetch: () => {
      fetchCampaigns();
    }
  };
};
