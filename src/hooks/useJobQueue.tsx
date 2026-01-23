import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';

export type JobType = 
  | 'sync_integration' 
  | 'run_compliance_check' 
  | 'generate_report'
  | 'send_notification'
  | 'cleanup_data';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  org_id: string | null;
  user_id: string | null;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  last_error_at: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateJobParams {
  jobType: JobType;
  payload?: Record<string, unknown>;
  priority?: number;
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
}

// Fetch user's jobs with optional filters
export function useJobs(options?: {
  status?: JobStatus | JobStatus[];
  jobType?: JobType;
  limit?: number;
}) {
  const { status, jobType, limit = 50 } = options || {};

  return useQuery({
    queryKey: queryKeys.jobs(status, jobType),
    queryFn: async () => {
      let query = supabase
        .from('job_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      if (jobType) {
        query = query.eq('job_type', jobType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Job[];
    },
  });
}

// Fetch a single job by ID with polling for active jobs
export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.jobStatus(jobId || ''),
    queryFn: async () => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (error) throw error;
      return data as Job | null;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      // Poll every 2 seconds while job is pending/processing
      if (job?.status === 'pending' || job?.status === 'processing') {
        return 2000;
      }
      return false;
    },
  });
}

// Create a new job
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobType,
      payload = {},
      priority = 3,
      scheduledFor,
      metadata = {},
    }: CreateJobParams) => {
      const { data, error } = await supabase.rpc('enqueue_job', {
        p_job_type: jobType,
        p_payload: payload as unknown as Record<string, never>,
        p_priority: priority,
        p_scheduled_for: scheduledFor?.toISOString() || new Date().toISOString(),
        p_metadata: metadata as unknown as Record<string, never>,
      });

      if (error) throw error;
      return data as string; // Returns job ID
    },
    onSuccess: (jobId, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobQueue });
      
      toast.success('Job agendado', {
        description: `${formatJobType(variables.jobType)} será processado em breve`,
        action: {
          label: 'Ver status',
          onClick: () => {
            // Could navigate to job details
          },
        },
      });

      return jobId;
    },
    onError: (error: Error) => {
      toast.error('Erro ao agendar job', {
        description: error.message,
      });
    },
  });
}

// Cancel a pending job
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('job_queue')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .eq('status', 'pending'); // Can only cancel pending jobs

      if (error) throw error;
      return jobId;
    },
    onSuccess: (jobId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobQueue });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobStatus(jobId) });
      
      toast.success('Job cancelado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar job', {
        description: error.message,
      });
    },
  });
}

// Retry a failed job
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      // Get the failed job
      const { data: job, error: fetchError } = await supabase
        .from('job_queue')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'failed')
        .single();

      if (fetchError) throw fetchError;
      if (!job) throw new Error('Job não encontrado ou não está em status failed');

      // Create a new job with same parameters
      const retryMetadata = typeof job.metadata === 'object' && job.metadata !== null
        ? { ...(job.metadata as Record<string, unknown>), retry_of: jobId }
        : { retry_of: jobId };

      const { data: newJobId, error } = await supabase.rpc('enqueue_job', {
        p_job_type: job.job_type,
        p_payload: job.payload as unknown as Record<string, never>,
        p_priority: job.priority,
        p_metadata: retryMetadata as unknown as Record<string, never>,
      });

      if (error) throw error;
      return newJobId as string;
    },
    onSuccess: (newJobId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobQueue });
      
      toast.success('Job reagendado', {
        description: 'Uma nova tentativa foi agendada',
      });

      return newJobId;
    },
    onError: (error: Error) => {
      toast.error('Erro ao reagendar job', {
        description: error.message,
      });
    },
  });
}

// Get pending/processing jobs count
export function usePendingJobsCount() {
  return useQuery({
    queryKey: queryKeys.pendingJobsCount,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('job_queue')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'processing']);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// Helper function to format job type for display
export function formatJobType(jobType: JobType): string {
  const labels: Record<JobType, string> = {
    sync_integration: 'Sincronização de integração',
    run_compliance_check: 'Verificação de compliance',
    generate_report: 'Geração de relatório',
    send_notification: 'Envio de notificação',
    cleanup_data: 'Limpeza de dados',
  };
  return labels[jobType] || jobType;
}

// Helper function to get status color
export function getJobStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    processing: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    cancelled: 'text-gray-600 bg-gray-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}
