import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { useCreateJob, useJobStatus } from '@/hooks/useJobQueue';
import { useState, useEffect } from 'react';

export interface DatadogMonitor {
  id: number;
  name: string;
  type: string;
  query: string;
  overall_state: string;
  priority: number | null;
  tags: string[];
  creator: { name: string; email: string };
  created: string;
  modified: string;
  options: {
    notify_no_data: boolean;
    notify_audit: boolean;
  };
  is_security_monitor: boolean;
  has_critical_tag: boolean;
}

export interface DatadogSecuritySignal {
  id: string;
  title: string;
  status: string;
  severity: string;
  timestamp: number;
  rule_id: string;
  rule_name: string;
  tags: string[];
  is_open: boolean;
  is_critical: boolean;
}

export interface DatadogLogPipeline {
  id: string;
  name: string;
  is_enabled: boolean;
  filter_query: string;
  processor_count: number;
  type: string;
  has_sensitive_data_processor: boolean;
}

export interface DatadogSynthetic {
  public_id: string;
  name: string;
  type: string;
  subtype?: string;
  status: string;
  locations: string[];
  tags: string[];
  overall_state: number;
  is_live: boolean;
  is_passing: boolean;
  is_failing: boolean;
}

export interface DatadogResourcesData {
  monitors: DatadogMonitor[];
  securitySignals: DatadogSecuritySignal[];
  logPipelines: DatadogLogPipeline[];
  synthetics: DatadogSynthetic[];
  timestamp: string;
}

export function useDatadogSync(integrationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<DatadogResourcesData> => {
      // Get stored credentials for this integration
      const { data: integration, error: fetchError } = await supabase
        .from('integrations')
        .select('configuration')
        .eq('id', integrationId)
        .single();

      if (fetchError || !integration?.configuration) {
        throw new Error('Integração não encontrada ou sem credenciais');
      }

      // Call the datadog-integration edge function with stored credentials
      const { data, error } = await supabase.functions.invoke('datadog-integration', {
        body: {
          action: 'sync',
          credentials: integration.configuration,
        },
      });

      if (error) {
        console.error('[useDatadogSync] Error:', error);
        throw new Error(error.message || 'Erro ao sincronizar Datadog');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na sincronização');
      }

      // Fetch the collected data from DB
      const { data: collectedData, error: collectError } = await supabase
        .from('integration_collected_data')
        .select('resource_type, resource_data')
        .eq('integration_name', 'datadog');

      if (collectError) {
        console.error('[useDatadogSync] Error fetching collected data:', collectError);
      }

      // Group by resource type
      const monitors: DatadogMonitor[] = [];
      const securitySignals: DatadogSecuritySignal[] = [];
      const logPipelines: DatadogLogPipeline[] = [];
      const synthetics: DatadogSynthetic[] = [];

      (collectedData || []).forEach((item) => {
        const resourceData = item.resource_data as Record<string, any>;
        
        switch (item.resource_type) {
          case 'monitor':
            monitors.push(resourceData as DatadogMonitor);
            break;
          case 'security_signal':
            securitySignals.push(resourceData as DatadogSecuritySignal);
            break;
          case 'log_pipeline':
            logPipelines.push(resourceData as DatadogLogPipeline);
            break;
          case 'synthetic':
            synthetics.push(resourceData as DatadogSynthetic);
            break;
        }
      });

      return {
        monitors,
        securitySignals,
        logPipelines,
        synthetics,
        timestamp: new Date().toISOString(),
      };
    },
    onSuccess: (data) => {
      toast.success('Datadog sincronizado', {
        description: `${data.monitors.length} monitors, ${data.securitySignals.length} signals, ${data.logPipelines.length} pipelines, ${data.synthetics.length} synthetics`,
      });
      
      // Invalidate queries to refresh compliance status
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationData });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
    },
    onError: (error: Error) => {
      toast.error('Erro ao sincronizar Datadog', {
        description: error.message,
      });
    },
  });
}

// New: Async sync via job queue
export function useDatadogSyncAsync(integrationId: string) {
  const [jobId, setJobId] = useState<string | null>(null);
  const createJob = useCreateJob();
  const { data: jobStatus } = useJobStatus(jobId);

  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      const timer = setTimeout(() => setJobId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [jobStatus?.status]);

  const enqueue = () => {
    createJob.mutate(
      {
        jobType: 'sync_integration',
        payload: { provider: 'datadog', integration_id: integrationId },
        priority: 4,
        metadata: { triggered_by: 'user_action' }
      },
      { onSuccess: (id) => setJobId(id) }
    );
  };

  return {
    enqueue,
    isEnqueuing: createJob.isPending,
    jobId,
    jobStatus,
    isProcessing: jobStatus?.status === 'pending' || jobStatus?.status === 'processing',
  };
}
