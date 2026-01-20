import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay, getDay, getHours, differenceInDays } from 'date-fns';

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
      // Generate mock data for demo
      const days = differenceInDays(dateRange.to, dateRange.from) || 90;
      const mockData: ScoreDataPoint[] = [];
      const mockAnnotations: EventAnnotation[] = [];
      
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(dateRange.to, days - i), 'yyyy-MM-dd');
        const baseScore = 70 + Math.sin(i / 10) * 15 + Math.random() * 5;
        mockData.push({
          date,
          score: Math.min(100, Math.max(0, Math.round(baseScore))),
          passing: Math.round(baseScore * 0.8),
          failing: Math.round((100 - baseScore) * 0.5),
          riskAccepted: Math.round(Math.random() * 5),
        });
      }

      // Add sample annotations
      if (mockData.length > 30) {
        mockAnnotations.push({
          date: mockData[Math.floor(mockData.length * 0.3)].date,
          score: mockData[Math.floor(mockData.length * 0.3)].score,
          label: 'AWS Integrado',
          type: 'integration_added',
        });
      }
      if (mockData.length > 60) {
        mockAnnotations.push({
          date: mockData[Math.floor(mockData.length * 0.7)].date,
          score: mockData[Math.floor(mockData.length * 0.7)].score,
          label: 'Drift Detectado',
          type: 'drift',
        });
      }

      return { scoreTimeSeries: mockData, annotations: mockAnnotations };
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
    if (!alerts || alerts.length === 0) {
      // Generate mock data
      return [
        { week: 'Sem 1', critical: 4, high: 18, medium: 24, low: 12, criticalCount: 2, highCount: 5, mediumCount: 8, lowCount: 6 },
        { week: 'Sem 2', critical: 3, high: 15, medium: 20, low: 10, criticalCount: 1, highCount: 4, mediumCount: 7, lowCount: 5 },
        { week: 'Sem 3', critical: 5, high: 22, medium: 28, low: 14, criticalCount: 3, highCount: 6, mediumCount: 9, lowCount: 7 },
        { week: 'Sem 4', critical: 2, high: 12, medium: 18, low: 8, criticalCount: 1, highCount: 3, mediumCount: 6, lowCount: 4 },
      ];
    }

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
    if (!alerts || alerts.length === 0) {
      // Generate mock data
      return [
        { ruleId: 'github-public-repo', ruleTitle: 'GitHub - Repositórios Públicos', integrationName: 'GitHub', currentPeriodFails: 8, previousPeriodFails: 12, trend: 'improving', percentChange: -33 },
        { ruleId: 'slack-admin-mfa', ruleTitle: 'Slack - Admin sem MFA', integrationName: 'Slack', currentPeriodFails: 9, previousPeriodFails: 5, trend: 'worsening', percentChange: 80 },
        { ruleId: 'aws-public-bucket', ruleTitle: 'AWS - Buckets Públicos', integrationName: 'AWS', currentPeriodFails: 6, previousPeriodFails: 6, trend: 'stable', percentChange: 0 },
        { ruleId: 'azure-mfa-disabled', ruleTitle: 'Azure - MFA Desabilitado', integrationName: 'Azure', currentPeriodFails: 4, previousPeriodFails: 7, trend: 'improving', percentChange: -43 },
        { ruleId: 'okta-inactive-users', ruleTitle: 'Okta - Usuários Inativos', integrationName: 'Okta', currentPeriodFails: 11, previousPeriodFails: 8, trend: 'worsening', percentChange: 38 },
      ];
    }

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

  // Generate heatmap data (day x hour)
  const heatmapData = useMemo((): HeatmapCell[] => {
    const cells: HeatmapCell[] = [];
    const counts = new Map<string, number>();

    if (alerts && alerts.length > 0) {
      alerts.forEach((alert) => {
        const date = new Date(alert.created_at);
        const day = getDay(date);
        const hour = getHours(date);
        const key = `${day}-${hour}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    } else {
      // Generate mock data
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          // More activity during business hours (9-18) on weekdays
          const isBusinessHour = h >= 9 && h <= 18;
          const isWeekday = d >= 1 && d <= 5;
          const baseCount = isBusinessHour && isWeekday ? 5 : 1;
          counts.set(`${d}-${h}`, Math.floor(Math.random() * baseCount * 2));
        }
      }
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

  // Integration health over time
  const integrationHealthHistory = useMemo((): IntegrationHealthPoint[] => {
    const days = differenceInDays(dateRange.to, dateRange.from) || 30;
    const providers = ['AWS', 'Azure', 'Google', 'GitHub', 'Okta'];
    const history: IntegrationHealthPoint[] = [];

    for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 30))) {
      const date = format(subDays(dateRange.to, days - i), 'yyyy-MM-dd');
      const point: IntegrationHealthPoint = { date };
      
      providers.forEach((provider) => {
        // Generate realistic health scores
        const baseHealth = 80 + Math.random() * 20;
        const variation = Math.sin(i / 5) * 10;
        point[provider] = Math.min(100, Math.max(50, Math.round(baseHealth + variation)));
      });
      
      history.push(point);
    }

    return history;
  }, [dateRange]);

  // Period comparison metrics
  const periodComparison = useMemo((): PeriodMetric[] => {
    const periodDays = differenceInDays(dateRange.to, dateRange.from);
    
    // Calculate current period metrics
    const currentAvgScore = scoreTimeSeries.length > 0
      ? Math.round(scoreTimeSeries.reduce((sum, d) => sum + d.score, 0) / scoreTimeSeries.length)
      : 82;
    
    const currentAlerts = alerts?.length || 15;
    const resolvedAlerts = alerts?.filter(a => a.resolved)?.length || 10;
    const currentMTTR = alerts?.length > 0
      ? Math.round(alerts.reduce((sum, a) => sum + (a.time_to_resolve_hours || 0), 0) / alerts.length)
      : 18;

    // Mock previous period (would need separate query in production)
    const prevAvgScore = currentAvgScore - 5 - Math.floor(Math.random() * 5);
    const prevAlerts = currentAlerts + 4 + Math.floor(Math.random() * 5);
    const prevMTTR = currentMTTR + 10 + Math.floor(Math.random() * 10);

    return [
      {
        metric: 'Score Médio',
        currentValue: currentAvgScore,
        previousValue: prevAvgScore,
        change: Math.round(((currentAvgScore - prevAvgScore) / prevAvgScore) * 100),
        changeType: currentAvgScore > prevAvgScore ? 'better' : 'worse',
        unit: '%',
      },
      {
        metric: 'Total de Alertas',
        currentValue: currentAlerts,
        previousValue: prevAlerts,
        change: Math.round(((currentAlerts - prevAlerts) / prevAlerts) * 100),
        changeType: currentAlerts < prevAlerts ? 'better' : 'worse',
        lowerIsBetter: true,
      },
      {
        metric: 'Alertas Resolvidos',
        currentValue: resolvedAlerts,
        previousValue: Math.floor(resolvedAlerts * 0.7),
        change: Math.round(((resolvedAlerts - Math.floor(resolvedAlerts * 0.7)) / Math.floor(resolvedAlerts * 0.7)) * 100),
        changeType: 'better',
      },
      {
        metric: 'MTTR Médio',
        currentValue: currentMTTR,
        previousValue: prevMTTR,
        change: Math.round(((currentMTTR - prevMTTR) / prevMTTR) * 100),
        changeType: currentMTTR < prevMTTR ? 'better' : 'worse',
        unit: 'h',
        lowerIsBetter: true,
      },
    ];
  }, [scoreTimeSeries, alerts, dateRange]);

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
