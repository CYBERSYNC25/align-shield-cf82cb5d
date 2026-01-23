import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCreateJob, useJobStatus } from '@/hooks/useJobQueue';
import { JobStatusIcon } from '@/components/jobs/JobStatusBadge';
import { useState, useEffect } from 'react';

interface SyncIntegrationButtonProps {
  provider: string;
  integrationId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
}

export function SyncIntegrationButton({ 
  provider, 
  integrationId,
  variant = 'outline',
  size = 'sm',
  showLabel = true 
}: SyncIntegrationButtonProps) {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const createJob = useCreateJob();
  const { data: jobStatus } = useJobStatus(currentJobId);

  // Clear job ID when completed or failed
  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      const timer = setTimeout(() => setCurrentJobId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [jobStatus?.status]);

  const handleSync = () => {
    createJob.mutate(
      {
        jobType: 'sync_integration',
        payload: { provider, integration_id: integrationId },
        priority: 4, // High priority for manual actions
        metadata: { triggered_by: 'user_action' }
      },
      {
        onSuccess: (jobId) => {
          setCurrentJobId(jobId);
        }
      }
    );
  };

  const isProcessing = createJob.isPending || 
    jobStatus?.status === 'pending' || 
    jobStatus?.status === 'processing';

  const getButtonLabel = () => {
    if (createJob.isPending) return 'Agendando...';
    if (jobStatus?.status === 'pending') return 'Na fila...';
    if (jobStatus?.status === 'processing') return 'Sincronizando...';
    return 'Sincronizar';
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        handleSync();
      }}
      disabled={isProcessing}
      className="gap-2"
    >
      {jobStatus && (jobStatus.status === 'pending' || jobStatus.status === 'processing') ? (
        <JobStatusIcon status={jobStatus.status} className="h-4 w-4" />
      ) : (
        <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
      )}
      {showLabel && getButtonLabel()}
    </Button>
  );
}
