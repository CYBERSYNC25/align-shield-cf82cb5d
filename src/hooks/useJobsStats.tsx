import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { JobStatus, JobType } from './useJobQueue';

export interface JobsCounts {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface HourlyData {
  hour: string;
  completed: number;
  failed: number;
  total: number;
}

export interface JobsStats {
  counts: JobsCounts;
  hourlyData: HourlyData[];
  avgPerHour: number;
}

export function useJobsStats() {
  return useQuery({
    queryKey: [...queryKeys.jobQueue, 'stats'],
    queryFn: async (): Promise<JobsStats> => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch all counts in parallel
      const [pendingRes, processingRes, completedRes, failedRes, cancelledRes, hourlyRes] = await Promise.all([
        supabase.from('job_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('job_queue').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
        supabase.from('job_queue').select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('completed_at', last24h.toISOString()),
        supabase.from('job_queue').select('*', { count: 'exact', head: true })
          .eq('status', 'failed')
          .gte('completed_at', last24h.toISOString()),
        supabase.from('job_queue').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('job_queue')
          .select('created_at, status, completed_at')
          .gte('created_at', last24h.toISOString())
          .order('created_at', { ascending: true })
      ]);

      const counts: JobsCounts = {
        pending: pendingRes.count || 0,
        processing: processingRes.count || 0,
        completed: completedRes.count || 0,
        failed: failedRes.count || 0,
        cancelled: cancelledRes.count || 0
      };

      // Process hourly data
      const hourlyMap = new Map<string, { completed: number; failed: number; total: number }>();
      
      // Initialize all 24 hours
      for (let i = 0; i < 24; i++) {
        const hourDate = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        const hourKey = hourDate.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        hourlyMap.set(hourKey, { completed: 0, failed: 0, total: 0 });
      }

      // Aggregate jobs by hour
      (hourlyRes.data || []).forEach((job) => {
        const hourKey = new Date(job.created_at).toISOString().slice(0, 13);
        const existing = hourlyMap.get(hourKey);
        if (existing) {
          existing.total++;
          if (job.status === 'completed') existing.completed++;
          if (job.status === 'failed') existing.failed++;
        }
      });

      const hourlyData: HourlyData[] = Array.from(hourlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, data]) => ({
          hour: new Date(hour + ':00:00Z').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          ...data
        }));

      // Calculate average per hour
      const totalProcessed = counts.completed + counts.failed;
      const avgPerHour = Math.round(totalProcessed / 24);

      return { counts, hourlyData, avgPerHour };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useFilteredJobs(options?: {
  status?: JobStatus | 'all';
  jobType?: JobType | 'all';
  period?: '24h' | '7d' | '30d';
  limit?: number;
}) {
  const { status = 'all', jobType = 'all', period = '24h', limit = 50 } = options || {};

  return useQuery({
    queryKey: [...queryKeys.jobQueue, 'filtered', status, jobType, period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      let query = supabase
        .from('job_queue')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (jobType !== 'all') {
        query = query.eq('job_type', jobType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
