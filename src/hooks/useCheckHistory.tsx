import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ComplianceCheckHistory {
  id: string;
  user_id: string;
  check_type: string;
  total_rules_checked: number;
  passing_count: number;
  failing_count: number;
  risk_accepted_count: number;
  score: number;
  integrations_checked: string[];
  rules_results: RuleResult[];
  drift_detected: boolean;
  drift_details: DriftDetail[];
  triggered_by: string;
  created_at: string;
}

interface RuleResult {
  ruleId: string;
  title: string;
  severity: string;
  status: 'pass' | 'fail';
  affectedCount: number;
  integration: string;
}

interface DriftDetail {
  ruleId: string;
  title: string;
  previousStatus: string;
  newStatus: string;
}

export function useCheckHistory(limit: number = 10) {
  const { user } = useAuth();

  const { data: checkHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['compliance-check-history', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('compliance_check_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        integrations_checked: (item.integrations_checked as unknown as string[]) || [],
        rules_results: (item.rules_results as unknown as RuleResult[]) || [],
        drift_details: (item.drift_details as unknown as DriftDetail[]) || [],
      })) as ComplianceCheckHistory[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Computed stats
  const totalChecks = checkHistory.length;
  const checksWithDrift = checkHistory.filter(c => c.drift_detected).length;
  const averageScore = totalChecks > 0 
    ? Math.round(checkHistory.reduce((acc, c) => acc + c.score, 0) / totalChecks)
    : 0;
  
  const lastCheck = checkHistory[0] || null;

  return {
    checkHistory,
    totalChecks,
    checksWithDrift,
    averageScore,
    lastCheck,
    isLoading,
    refetch,
  };
}

// Hook for auditor view - can see all users' check history
export function useAllCheckHistory(limit: number = 20) {
  const { data: checkHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['all-compliance-check-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_check_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        integrations_checked: (item.integrations_checked as unknown as string[]) || [],
        rules_results: (item.rules_results as unknown as RuleResult[]) || [],
        drift_details: (item.drift_details as unknown as DriftDetail[]) || [],
      })) as ComplianceCheckHistory[];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    checkHistory,
    isLoading,
    refetch,
  };
}
