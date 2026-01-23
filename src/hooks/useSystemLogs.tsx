/**
 * useSystemLogs Hook
 * 
 * Provides access to system logs for admin users.
 * Includes filtering, pagination, and export functionality.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { toast } from 'sonner';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogSource = 'frontend' | 'edge_function' | 'webhook' | 'scheduled_job' | 'database';

export interface SystemLog {
  id: string;
  org_id: string | null;
  user_id: string | null;
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata: Record<string, unknown>;
  stack_trace: string | null;
  function_name: string | null;
  component_name: string | null;
  request_id: string | null;
  created_at: string;
}

export interface LogFilters {
  level?: LogLevel | 'all';
  source?: LogSource | 'all';
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogStatistics {
  level: string;
  count: number;
  latest_at: string | null;
}

const DEFAULT_LIMIT = 50;

export function useSystemLogs(filters: LogFilters = {}) {
  const queryClient = useQueryClient();
  const {
    level = 'all',
    source = 'all',
    startDate,
    endDate,
    search,
    limit = DEFAULT_LIMIT,
    offset = 0,
  } = filters;

  // Build query key with all filters
  const queryKey = [
    QUERY_KEYS.SYSTEM_LOGS,
    { level, source, startDate: startDate?.toISOString(), endDate: endDate?.toISOString(), search, limit, offset }
  ];

  // Fetch logs with filters
  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply level filter
      if (level && level !== 'all') {
        query = query.eq('level', level);
      }

      // Apply source filter
      if (source && source !== 'all') {
        query = query.eq('source', source);
      }

      // Apply date range filters
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      // Apply search filter
      if (search && search.trim()) {
        query = query.ilike('message', `%${search.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SystemLog[];
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch log statistics (counts by level)
  const {
    data: statistics,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: [QUERY_KEYS.SYSTEM_LOGS, 'statistics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_log_statistics', {
        p_org_id: null,
        p_hours: 24,
      });

      if (error) throw error;
      return data as LogStatistics[];
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch total count for pagination
  const {
    data: totalCount,
  } = useQuery({
    queryKey: [QUERY_KEYS.SYSTEM_LOGS, 'count', { level, source, startDate, endDate, search }],
    queryFn: async () => {
      let query = supabase
        .from('system_logs')
        .select('id', { count: 'exact', head: true });

      if (level && level !== 'all') {
        query = query.eq('level', level);
      }
      if (source && source !== 'all') {
        query = query.eq('source', source);
      }
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }
      if (search && search.trim()) {
        query = query.ilike('message', `%${search.trim()}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000,
  });

  // Export logs
  const exportLogs = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      // Fetch all matching logs (up to 1000)
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (level && level !== 'all') {
        query = query.eq('level', level);
      }
      if (source && source !== 'all') {
        query = query.eq('source', source);
      }
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }
      if (search && search.trim()) {
        query = query.ilike('message', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const logs = data as SystemLog[];

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV format
        const headers = ['id', 'level', 'source', 'message', 'component_name', 'function_name', 'created_at'];
        const rows = logs.map(log => [
          log.id,
          log.level,
          log.source,
          `"${(log.message || '').replace(/"/g, '""')}"`,
          log.component_name || '',
          log.function_name || '',
          log.created_at,
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      return logs.length;
    },
    onSuccess: (count, format) => {
      toast.success(`Exportados ${count} logs em formato ${format.toUpperCase()}`);
    },
    onError: (error) => {
      console.error('Export failed:', error);
      toast.error('Falha ao exportar logs');
    },
  });

  // Invalidate cache
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SYSTEM_LOGS] });
  };

  return {
    logs: logs || [],
    isLoading,
    error,
    refetch,
    refresh,
    statistics: statistics || [],
    statsLoading,
    totalCount: totalCount || 0,
    exportLogs: exportLogs.mutate,
    isExporting: exportLogs.isPending,
  };
}

export default useSystemLogs;
