import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay, getDay, getHours, differenceInDays } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ScoreDataPoint {
  date: string;
  score: number;
  passing: number;
  failing: number;
  riskAccepted: number;
}

export interface EventAnnotation {
  date: string;
  score: number;
  label: string;
  type: 'integration_added' | 'breach_detected' | 'major_fix' | 'drift' | 'score_drop' | 'score_jump';
}

export interface MTTRDataPoint {
  week: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface RuleTrend {
  ruleId: string;
  ruleTitle: string;
  integrationName: string;
  currentPeriodFails: number;
  previousPeriodFails: number;
  trend: 'improving' | 'worsening' | 'stable';
  percentChange: number;
}

export interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export interface IntegrationHealthPoint {
  date: string;
  [key: string]: number | string;
}

export interface PeriodMetric {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changeType: 'better' | 'worse' | 'neutral';
  unit?: string;
  lowerIsBetter?: boolean;
}

export function useAdvancedAnalytics(dateRange: DateRange) {
  const { user } = useAuth();

  // Query compliance check history
  const { data: checkHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['advanced-analytics-history', user?.id, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_check_history')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!dateRange.from && !!dateRange.to,
  });

  // Query compliance alerts
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['advanced-analytics-alerts', user?.id, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!dateRange.from && !!dateRange.to,
  });

  // Query integration status for health tracking
  const { data: integrationStatus, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['advanced-analytics-integrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_status')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Process score time series with annotations
  const { scoreTimeSeries, annotations } = useMemo(() => {
    if (!checkHistory || checkHistory.length === 0) {
      return { scoreTimeSeries: [] as ScoreDataPoint[], annotations: [] as EventAnnotation[] };
    }

    // Process real data
    const dataByDate = new Map<string, ScoreDataPoint>();
    const eventAnnotations: EventAnnotation[] = [];
    let previousScore: number | null = null;

    checkHistory.forEach((check) => {
      const date = format(new Date(check.created_at), 'yyyy-MM-dd');
      const score = check.score ?? 0;
      
      dataByDate.set(date, {
        date,
        score,
        passing: check.passing_count ?? 0,
        failing: check.failing_count ?? 0,
        riskAccepted: check.risk_accepted_count ?? 0,
      });

      // Detect significant events
      if (previousScore !== null) {
        if (score - previousScore >= 10) {
          eventAnnotations.push({
            date,
            score,
            label: 'Melhoria Significativa',
            type: 'major_fix',
          });
        } else if (previousScore - score >= 10) {
          eventAnnotations.push({
            date,
            score,
            label: 'Queda Detectada',
            type: 'score_drop',
          });
        }
      }

      if (check.drift_detected) {
        eventAnnotations.push({
          date,
          score,
          label: 'Drift Detectado',
          type: 'drift',
        });
      }

      previousScore = score;
    });

    return {
      scoreTimeSeries: Array.from(dataByDate.values()),
      annotations: eventAnnotations,
    };
  }, [checkHistory, dateRange]);

  // Process MTTR breakdown by severity
  const mttrBreakdown = useMemo((): MTTRDataPoint[] => {
    if (!alerts || alerts.length === 0) return [];

    // Group by week and severity
    const weeklyData = new Map<string, MTTRDataPoint>();
    
    alerts.forEach((alert) => {
      const weekNum = Math.floor(differenceInDays(new Date(alert.created_at), dateRange.from) / 7) + 1;
      const weekKey = `Sem ${weekNum}`;
      const mttr = alert.time_to_resolve_hours ?? 0;
      const severity = alert.severity?.toLowerCase() || 'medium';

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          week: weekKey,
          critical: 0, high: 0, medium: 0, low: 0,
          criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0,
        });
      }

      const data = weeklyData.get(weekKey)!;
      if (severity === 'critical') {
        data.critical += mttr;
        data.criticalCount++;
      } else if (severity === 'high') {
        data.high += mttr;
        data.highCount++;
      } else if (severity === 'medium') {
        data.medium += mttr;
        data.mediumCount++;
      } else {
        data.low += mttr;
        data.lowCount++;
      }
    });

    // Calculate averages
    weeklyData.forEach((data) => {
      if (data.criticalCount > 0) data.critical = Math.round(data.critical / data.criticalCount);
      if (data.highCount > 0) data.high = Math.round(data.high / data.highCount);
      if (data.mediumCount > 0) data.medium = Math.round(data.medium / data.mediumCount);
      if (data.lowCount > 0) data.low = Math.round(data.low / data.lowCount);
    });

    return Array.from(weeklyData.values()).slice(0, 4);
  }, [alerts, dateRange]);

  // Calculate top failing rules with trends
  const topFailingRules = useMemo((): RuleTrend[] => {
    if (!alerts || alerts.length === 0) return [];

    const midPoint = new Date((dateRange.from.getTime() + dateRange.to.getTime()) / 2);
    const ruleStats = new Map<string, { current: number; previous: number; title: string; integration: string }>();

    alerts.forEach((alert) => {
      const key = alert.rule_id;
      if (!ruleStats.has(key)) {
        ruleStats.set(key, { current: 0, previous: 0, title: alert.rule_title, integration: alert.integration_name });
      }
      const stats = ruleStats.get(key)!;
      if (new Date(alert.created_at) >= midPoint) {
        stats.current++;
      } else {
        stats.previous++;
      }
    });

    return Array.from(ruleStats.entries())
      .map(([ruleId, stats]) => {
        const percentChange = stats.previous === 0 
          ? (stats.current > 0 ? 100 : 0)
          : Math.round(((stats.current - stats.previous) / stats.previous) * 100);
        
        return {
          ruleId,
          ruleTitle: stats.title,
          integrationName: stats.integration,
          currentPeriodFails: stats.current,
          previousPeriodFails: stats.previous,
          trend: percentChange < -10 ? 'improving' : percentChange > 10 ? 'worsening' : 'stable',
          percentChange,
        } as RuleTrend;
      })
      .sort((a, b) => b.currentPeriodFails - a.currentPeriodFails)
      .slice(0, 10);
  }, [alerts, dateRange]);

  // Generate heatmap data (day x hour) from real alerts only
  const heatmapData = useMemo((): HeatmapCell[] => {
    const cells: HeatmapCell[] = [];
    const counts = new Map<string, number>();

    if (alerts?.length) {
      alerts.forEach((alert) => {
        const date = new Date(alert.created_at);
        const day = getDay(date);
        const hour = getHours(date);
        const key = `${day}-${hour}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    }

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        cells.push({
          day,
          hour,
          count: counts.get(`${day}-${hour}`) || 0,
        });
      }
    }
    return cells;
  }, [alerts]);

  // Integration health over time (from real integration_status when available)
  const integrationHealthHistory = useMemo((): IntegrationHealthPoint[] => {
    if (!integrationStatus?.length) return [];

    const byDate = new Map<string, Record<string, number>>();
    integrationStatus.forEach((row: Record<string, unknown>) => {
      const createdAt = row.created_at as string;
      const date = createdAt ? format(new Date(createdAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      if (!byDate.has(date)) byDate.set(date, { date });
      const point = byDate.get(date)!;
      const name = (row.integration_name || row.name || 'default') as string;
      point[name] = Number(row.health_score ?? row.score ?? 0);
    });
    return Array.from(byDate.values()).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  }, [integrationStatus]);

  // Period comparison metrics (current period only when no historical data)
  const periodComparison = useMemo((): PeriodMetric[] => {
    const currentAvgScore = scoreTimeSeries.length > 0
      ? Math.round(scoreTimeSeries.reduce((sum, d) => sum + d.score, 0) / scoreTimeSeries.length)
      : 0;
    const currentAlerts = alerts?.length ?? 0;
    const resolvedAlerts = alerts?.filter((a: { resolved?: boolean }) => a.resolved)?.length ?? 0;
    const currentMTTR = alerts?.length
      ? Math.round(alerts.reduce((sum: number, a: { time_to_resolve_hours?: number }) => sum + (a.time_to_resolve_hours || 0), 0) / alerts.length)
      : 0;

    return [
      {
        metric: 'Score Médio',
        currentValue: currentAvgScore,
        previousValue: 0,
        change: 0,
        changeType: 'neutral',
        unit: '%',
      },
      {
        metric: 'Total de Alertas',
        currentValue: currentAlerts,
        previousValue: 0,
        change: 0,
        changeType: 'neutral',
        lowerIsBetter: true,
      },
      {
        metric: 'Alertas Resolvidos',
        currentValue: resolvedAlerts,
        previousValue: 0,
        change: 0,
        changeType: 'neutral',
      },
      {
        metric: 'MTTR Médio',
        currentValue: currentMTTR,
        previousValue: 0,
        change: 0,
        changeType: 'neutral',
        unit: 'h',
        lowerIsBetter: true,
      },
    ];
  }, [scoreTimeSeries, alerts]);

  // Get alerts for a specific date (for drill-down)
  const getAlertsForDate = async (date: Date) => {
    if (!user?.id) return [];
    
    const startOfTargetDay = startOfDay(date);
    const endOfTargetDay = new Date(startOfTargetDay);
    endOfTargetDay.setDate(endOfTargetDay.getDate() + 1);

    const { data, error } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startOfTargetDay.toISOString())
      .lt('created_at', endOfTargetDay.toISOString())
      .order('severity', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  return {
    scoreTimeSeries,
    annotations,
    mttrBreakdown,
    topFailingRules,
    heatmapData,
    integrationHealthHistory,
    periodComparison,
    getAlertsForDate,
    isLoading: isLoadingHistory || isLoadingAlerts || isLoadingIntegrations,
  };
}
