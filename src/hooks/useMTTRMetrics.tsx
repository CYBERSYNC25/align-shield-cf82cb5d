import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

export interface MTTRData {
  overall: string;
  overallHours: number;
  critical: string;
  criticalHours: number;
  high: string;
  highHours: number;
  medium: string;
  mediumHours: number;
  resolvedCount: number;
  overdueCount: number;
  slaComplianceRate: number;
  totalAlerts: number;
  averageHours: number;
}

function formatHours(hours: number): string {
  if (hours === 0 || isNaN(hours)) return '-';
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);

  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${Math.round(hours)}h`;
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    groups[value] = groups[value] || [];
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function useMTTRMetrics() {
  const { user } = useAuth();

  const { data: mttrData, isLoading, error } = useQuery({
    queryKey: ['mttr-metrics', user?.id],
    queryFn: async (): Promise<MTTRData> => {
      if (!user?.id) {
        return getEmptyMTTRData();
      }

      // Fetch all alerts (resolved and unresolved)
      const { data: allAlerts, error: alertsError } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false });

      if (alertsError) throw alertsError;

      if (!allAlerts || allAlerts.length === 0) {
        return getEmptyMTTRData();
      }

      // Filter resolved alerts that have time_to_resolve_hours
      const resolvedAlerts = allAlerts.filter(a => a.resolved === true);
      
      // Calculate MTTR for resolved alerts
      const alertsWithMTTR = resolvedAlerts.filter(a => a.time_to_resolve_hours !== null);
      
      // Group by severity
      const bySeverity = groupBy(alertsWithMTTR, 'severity');

      const calculateAvg = (alerts: typeof alertsWithMTTR): number => {
        if (!alerts || alerts.length === 0) return 0;
        const total = alerts.reduce((sum, a) => sum + (a.time_to_resolve_hours || 0), 0);
        return total / alerts.length;
      };

      // Count overdue alerts
      const overdueCount = allAlerts.filter(a => a.is_overdue === true).length;
      
      // Calculate SLA compliance rate (resolved within SLA)
      const resolvedWithinSLA = resolvedAlerts.filter(a => a.is_overdue !== true).length;
      const slaRate = resolvedAlerts.length > 0 
        ? Math.round((resolvedWithinSLA / resolvedAlerts.length) * 100) 
        : 100;

      const overallAvg = calculateAvg(alertsWithMTTR);

      return {
        overall: formatHours(overallAvg),
        overallHours: overallAvg,
        critical: formatHours(calculateAvg(bySeverity.critical || [])),
        criticalHours: calculateAvg(bySeverity.critical || []),
        high: formatHours(calculateAvg(bySeverity.high || [])),
        highHours: calculateAvg(bySeverity.high || []),
        medium: formatHours(calculateAvg(bySeverity.medium || [])),
        mediumHours: calculateAvg(bySeverity.medium || []),
        resolvedCount: resolvedAlerts.length,
        overdueCount,
        slaComplianceRate: slaRate,
        totalAlerts: allAlerts.length,
        averageHours: overallAvg,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    mttrData: mttrData || getEmptyMTTRData(),
    isLoading,
    error,
  };
}

function getEmptyMTTRData(): MTTRData {
  return {
    overall: '-',
    overallHours: 0,
    critical: '-',
    criticalHours: 0,
    high: '-',
    highHours: 0,
    medium: '-',
    mediumHours: 0,
    resolvedCount: 0,
    overdueCount: 0,
    slaComplianceRate: 100,
    totalAlerts: 0,
    averageHours: 0,
  };
}
