import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('ProcessJobQueue');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface Job {
  id: string;
  org_id: string | null;
  user_id: string | null;
  job_type: string;
  payload: Record<string, unknown>;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  metadata: Record<string, unknown>;
}

interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  resourcesCollected?: number;
}

// Job handlers by type
async function handleSyncIntegration(
  job: Job, 
  supabase: ReturnType<typeof createClient>
): Promise<JobResult> {
  const { provider, integration_id } = job.payload as { provider?: string; integration_id?: string };
  
  if (!provider) {
    return { success: false, error: 'Provider not specified in payload' };
  }

  logger.info(`Syncing integration: ${provider}`, { integration_id, job_id: job.id });

  // Call the existing sync-integration-data function logic
  // For now, we invoke the existing edge function
  const { data, error } = await supabase.functions.invoke('sync-integration-data', {
    body: { provider, integration_id }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    data,
    resourcesCollected: data?.resourcesCollected || 0
  };
}

async function handleComplianceCheck(
  job: Job, 
  supabase: ReturnType<typeof createClient>
): Promise<JobResult> {
  const { framework_id, control_ids } = job.payload as { 
    framework_id?: string; 
    control_ids?: string[];
  };

  logger.info(`Running compliance check`, { framework_id, job_id: job.id });

  // Call check-compliance-drift
  const { data, error } = await supabase.functions.invoke('check-compliance-drift', {
    body: { framework_id, control_ids }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    data 
  };
}

async function handleGenerateReport(
  job: Job, 
  supabase: ReturnType<typeof createClient>
): Promise<JobResult> {
  const { report_type, report_config } = job.payload as { 
    report_type?: string; 
    report_config?: Record<string, unknown>;
  };

  logger.info(`Generating report: ${report_type}`, { job_id: job.id });

  // Report generation logic would go here
  // For now, just simulate success
  return { 
    success: true, 
    data: { 
      report_type,
      generated_at: new Date().toISOString(),
      config: report_config
    } 
  };
}

async function handleSendNotification(
  job: Job, 
  supabase: ReturnType<typeof createClient>
): Promise<JobResult> {
  const { user_id, title, message, type } = job.payload as { 
    user_id?: string; 
    title?: string;
    message?: string;
    type?: string;
  };

  if (!user_id || !title || !message) {
    return { success: false, error: 'Missing required notification fields' };
  }

  logger.info(`Sending notification to user`, { user_id, job_id: job.id });

  // Create notification in database
  const { error } = await supabase.rpc('create_notification', {
    p_user_id: user_id,
    p_title: title,
    p_message: message,
    p_type: type || 'info'
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { sent_to: user_id } };
}

async function handleCleanupData(
  job: Job, 
  supabase: ReturnType<typeof createClient>
): Promise<JobResult> {
  const { table, older_than_days } = job.payload as { 
    table?: string; 
    older_than_days?: number;
  };

  logger.info(`Cleanup data task`, { table, older_than_days, job_id: job.id });

  // This would be implemented based on specific cleanup needs
  // For now, return success
  return { 
    success: true, 
    data: { 
      table,
      older_than_days,
      cleaned_at: new Date().toISOString()
    } 
  };
}

// Main job processor
async function processJob(
  job: Job, 
  supabase: ReturnType<typeof createClient>
): Promise<JobResult> {
  switch (job.job_type) {
    case 'sync_integration':
      return handleSyncIntegration(job, supabase);
    case 'run_compliance_check':
      return handleComplianceCheck(job, supabase);
    case 'generate_report':
      return handleGenerateReport(job, supabase);
    case 'send_notification':
      return handleSendNotification(job, supabase);
    case 'cleanup_data':
      return handleCleanupData(job, supabase);
    default:
      return { success: false, error: `Unknown job type: ${job.job_type}` };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role to bypass RLS for job processing
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Parse request body for options
    let options: { limit?: number; reset_stuck?: boolean } = {};
    try {
      if (req.method === 'POST') {
        options = await req.json();
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    const limit = options.limit || 5;
    const resetStuck = options.reset_stuck !== false;

    // Reset stuck jobs first (if enabled)
    if (resetStuck) {
      const { data: stuckCount } = await supabase.rpc('reset_stuck_jobs');
      if (stuckCount && stuckCount > 0) {
        logger.warn(`Reset ${stuckCount} stuck jobs`);
      }
    }

    // Claim pending jobs
    const { data: jobs, error: claimError } = await supabase.rpc('claim_pending_jobs', {
      p_limit: limit
    });

    if (claimError) {
      logger.error('Failed to claim jobs', claimError);
      return new Response(
        JSON.stringify({ success: false, error: claimError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobs || jobs.length === 0) {
      logger.info('No pending jobs to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending jobs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info(`Processing ${jobs.length} jobs`);

    // Process each job
    const results: Array<{
      job_id: string;
      job_type: string;
      success: boolean;
      attempt: number;
      error?: string;
    }> = [];

    for (const job of jobs as Job[]) {
      logger.info(`Processing job`, { 
        job_id: job.id, 
        type: job.job_type, 
        attempt: job.attempts 
      });

      try {
        const result = await processJob(job, supabase);

        if (result.success) {
          // Mark as completed
          await supabase.rpc('complete_job', {
            p_job_id: job.id,
            p_result: result.data || {}
          });

          logger.info(`Job completed successfully`, { job_id: job.id });

          // Send notification to user if job completed
          if (job.user_id) {
            await supabase.rpc('create_notification', {
              p_user_id: job.user_id,
              p_title: 'Job concluído',
              p_message: `${job.job_type.replace('_', ' ')} finalizado com sucesso`,
              p_type: 'success',
              p_metadata: { job_id: job.id, job_type: job.job_type }
            });
          }

          results.push({
            job_id: job.id,
            job_type: job.job_type,
            success: true,
            attempt: job.attempts
          });
        } else {
          // Mark as failed (will retry if attempts < max)
          await supabase.rpc('fail_job', {
            p_job_id: job.id,
            p_error_message: result.error || 'Unknown error'
          });

          logger.warn(`Job failed`, { 
            job_id: job.id, 
            error: result.error,
            attempt: job.attempts,
            max_attempts: job.max_attempts
          });

          results.push({
            job_id: job.id,
            job_type: job.job_type,
            success: false,
            attempt: job.attempts,
            error: result.error
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
        
        // Mark as failed
        await supabase.rpc('fail_job', {
          p_job_id: job.id,
          p_error_message: errorMessage
        });

        logger.error(`Job threw exception`, err, { job_id: job.id });

        results.push({
          job_id: job.id,
          job_type: job.job_type,
          success: false,
          attempt: job.attempts,
          error: errorMessage
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    logger.info(`Batch complete`, { 
      total: results.length, 
      success: successCount, 
      failed: failedCount 
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: successCount,
        failed: failedCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Queue processor error', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
