import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatadogCredentials {
  apiKey: string;
  appKey: string;
  site?: string; // datadoghq.com, datadoghq.eu, us3.datadoghq.com, etc.
}

interface DatadogMonitor {
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
    include_tags: boolean;
    evaluation_delay?: number;
    escalation_message?: string;
  };
}

interface DatadogSecuritySignal {
  id: string;
  type: string;
  attributes: {
    title: string;
    status: string;
    severity: string;
    timestamp: number;
    rule: { id: string; name: string };
    tags: string[];
  };
}

interface DatadogLogPipeline {
  id: string;
  name: string;
  is_enabled: boolean;
  filter: { query: string };
  processors: Array<{
    type: string;
    name: string;
    is_enabled: boolean;
  }>;
  type: string;
}

interface DatadogSynthetic {
  public_id: string;
  name: string;
  type: string;
  subtype?: string;
  status: string;
  locations: string[];
  tags: string[];
  overall_state: number;
  monitor_id?: number;
}

// =============================================================================
// Test Connection
// =============================================================================

async function testDatadogConnection(credentials: DatadogCredentials) {
  console.log('[Datadog] Testing connection...');
  
  const site = credentials.site || 'datadoghq.com';
  const baseUrl = `https://api.${site}`;
  
  const headers = {
    'DD-API-KEY': credentials.apiKey,
    'DD-APPLICATION-KEY': credentials.appKey,
    'Content-Type': 'application/json',
  };

  // Test with validate endpoint
  const validateResponse = await fetch(`${baseUrl}/api/v1/validate`, { headers });
  
  if (!validateResponse.ok) {
    const errorData = await validateResponse.json().catch(() => ({}));
    throw new Error(errorData.errors?.[0] || 'Credenciais Datadog inválidas');
  }

  const validateData = await validateResponse.json();
  
  if (!validateData.valid) {
    throw new Error('API Key ou Application Key inválida');
  }

  // Get monitor count for preview
  const monitorsResponse = await fetch(`${baseUrl}/api/v1/monitor?page=0&per_page=1`, { headers });
  const monitorsCount = monitorsResponse.ok 
    ? parseInt(monitorsResponse.headers.get('x-total-count') || '0') 
    : 0;

  console.log('[Datadog] Connection successful, monitors:', monitorsCount);
  
  return { 
    success: true, 
    resources: { 
      monitors: monitorsCount,
      valid: true
    } 
  };
}

// =============================================================================
// Data Collection
// =============================================================================

async function collectDatadogData(
  credentials: DatadogCredentials, 
  userId: string, 
  supabaseAdmin: any
) {
  console.log('[Datadog] Collecting data for user:', userId);
  
  const site = credentials.site || 'datadoghq.com';
  const baseUrl = `https://api.${site}`;
  
  const headers = {
    'DD-API-KEY': credentials.apiKey,
    'DD-APPLICATION-KEY': credentials.appKey,
    'Content-Type': 'application/json',
  };

  let monitorsCollected = 0;
  let signalsCollected = 0;
  let pipelinesCollected = 0;
  let syntheticsCollected = 0;

  // =============================================================================
  // Collect Monitors
  // =============================================================================
  try {
    console.log('[Datadog] Fetching monitors...');
    const monitorsResponse = await fetch(`${baseUrl}/api/v1/monitor?page=0&per_page=100`, { headers });
    
    if (monitorsResponse.ok) {
      const monitors: DatadogMonitor[] = await monitorsResponse.json();
      console.log('[Datadog] Monitors fetched:', monitors.length);
      
      for (const monitor of monitors) {
        const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'datadog',
          resource_type: 'monitor',
          resource_id: monitor.id.toString(),
          resource_data: {
            id: monitor.id,
            name: monitor.name,
            type: monitor.type,
            query: monitor.query,
            overall_state: monitor.overall_state,
            priority: monitor.priority,
            tags: monitor.tags || [],
            creator: monitor.creator,
            created: monitor.created,
            modified: monitor.modified,
            options: {
              notify_no_data: monitor.options?.notify_no_data ?? false,
              notify_audit: monitor.options?.notify_audit ?? false,
              include_tags: monitor.options?.include_tags ?? true,
              evaluation_delay: monitor.options?.evaluation_delay,
              escalation_message: monitor.options?.escalation_message,
            },
            // Derived fields for compliance checks
            is_security_monitor: monitor.type === 'security' || 
                                 monitor.tags?.some(t => t.includes('security')),
            has_critical_tag: monitor.tags?.some(t => 
              t.includes('critical') || t.includes('sev:critical') || t.includes('sev:1')
            ),
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });

        if (!error) monitorsCollected++;
        else console.error('[Datadog] UPSERT ERROR for monitor:', monitor.id, error);
      }
    } else {
      console.warn('[Datadog] Failed to fetch monitors:', monitorsResponse.status);
    }
  } catch (e) {
    console.error('[Datadog] Error fetching monitors:', e);
  }

  // =============================================================================
  // Collect Security Signals (last 24h)
  // =============================================================================
  try {
    console.log('[Datadog] Fetching security signals...');
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const signalsResponse = await fetch(
      `${baseUrl}/api/v2/security_monitoring/signals?filter[from]=${oneDayAgo}&filter[to]=${now}&page[limit]=100`, 
      { headers }
    );
    
    if (signalsResponse.ok) {
      const signalsData = await signalsResponse.json();
      const signals: DatadogSecuritySignal[] = signalsData.data || [];
      console.log('[Datadog] Security signals fetched:', signals.length);
      
      for (const signal of signals) {
        const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'datadog',
          resource_type: 'security_signal',
          resource_id: signal.id,
          resource_data: {
            id: signal.id,
            type: signal.type,
            title: signal.attributes?.title,
            status: signal.attributes?.status,
            severity: signal.attributes?.severity,
            timestamp: signal.attributes?.timestamp,
            rule_id: signal.attributes?.rule?.id,
            rule_name: signal.attributes?.rule?.name,
            tags: signal.attributes?.tags || [],
            // Derived fields
            is_open: signal.attributes?.status === 'open',
            is_critical: signal.attributes?.severity === 'critical',
            is_high: signal.attributes?.severity === 'high',
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });

        if (!error) signalsCollected++;
        else console.error('[Datadog] UPSERT ERROR for signal:', signal.id, error);
      }
    } else if (signalsResponse.status === 403) {
      console.log('[Datadog] Security signals API not available (may require security monitoring license)');
    } else {
      console.warn('[Datadog] Failed to fetch security signals:', signalsResponse.status);
    }
  } catch (e) {
    console.error('[Datadog] Error fetching security signals:', e);
  }

  // =============================================================================
  // Collect Log Pipelines
  // =============================================================================
  try {
    console.log('[Datadog] Fetching log pipelines...');
    const pipelinesResponse = await fetch(`${baseUrl}/api/v1/logs/config/pipelines`, { headers });
    
    if (pipelinesResponse.ok) {
      const pipelines: DatadogLogPipeline[] = await pipelinesResponse.json();
      console.log('[Datadog] Log pipelines fetched:', pipelines.length);
      
      for (const pipeline of pipelines) {
        // Check for sensitive data processors
        const processors = pipeline.processors || [];
        const hasSensitiveDataProcessor = processors.some(p => 
          p.type === 'sensitive-data-scanner' || 
          p.type === 'attribute-remapper' ||
          p.name?.toLowerCase().includes('pii') ||
          p.name?.toLowerCase().includes('mask') ||
          p.name?.toLowerCase().includes('redact')
        );

        const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'datadog',
          resource_type: 'log_pipeline',
          resource_id: pipeline.id,
          resource_data: {
            id: pipeline.id,
            name: pipeline.name,
            is_enabled: pipeline.is_enabled,
            filter_query: pipeline.filter?.query,
            processors: processors.map(p => ({
              type: p.type,
              name: p.name,
              is_enabled: p.is_enabled,
            })),
            processor_count: processors.length,
            type: pipeline.type,
            // Derived fields for compliance
            has_sensitive_data_processor: hasSensitiveDataProcessor,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });

        if (!error) pipelinesCollected++;
        else console.error('[Datadog] UPSERT ERROR for pipeline:', pipeline.id, error);
      }
    } else if (pipelinesResponse.status === 403) {
      console.log('[Datadog] Log pipelines API not available (may require log management license)');
    } else {
      console.warn('[Datadog] Failed to fetch log pipelines:', pipelinesResponse.status);
    }
  } catch (e) {
    console.error('[Datadog] Error fetching log pipelines:', e);
  }

  // =============================================================================
  // Collect Synthetic Tests
  // =============================================================================
  try {
    console.log('[Datadog] Fetching synthetic tests...');
    const syntheticsResponse = await fetch(`${baseUrl}/api/v1/synthetics/tests`, { headers });
    
    if (syntheticsResponse.ok) {
      const syntheticsData = await syntheticsResponse.json();
      const synthetics: DatadogSynthetic[] = syntheticsData.tests || [];
      console.log('[Datadog] Synthetic tests fetched:', synthetics.length);
      
      for (const test of synthetics) {
        const { error } = await supabaseAdmin.from('integration_collected_data').upsert({
          user_id: userId,
          integration_name: 'datadog',
          resource_type: 'synthetic',
          resource_id: test.public_id,
          resource_data: {
            public_id: test.public_id,
            name: test.name,
            type: test.type,
            subtype: test.subtype,
            status: test.status,
            locations: test.locations || [],
            tags: test.tags || [],
            overall_state: test.overall_state,
            monitor_id: test.monitor_id,
            // Derived fields
            is_live: test.status === 'live',
            is_passing: test.overall_state === 0,
            is_failing: test.overall_state === 2,
            location_count: test.locations?.length || 0,
          },
          collected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });

        if (!error) syntheticsCollected++;
        else console.error('[Datadog] UPSERT ERROR for synthetic:', test.public_id, error);
      }
    } else if (syntheticsResponse.status === 403) {
      console.log('[Datadog] Synthetics API not available (may require synthetics license)');
    } else {
      console.warn('[Datadog] Failed to fetch synthetic tests:', syntheticsResponse.status);
    }
  } catch (e) {
    console.error('[Datadog] Error fetching synthetic tests:', e);
  }

  console.log('[Datadog] Data collection completed:', {
    monitors: monitorsCollected,
    securitySignals: signalsCollected,
    logPipelines: pipelinesCollected,
    synthetics: syntheticsCollected,
  });

  return {
    monitors: monitorsCollected,
    securitySignals: signalsCollected,
    logPipelines: pipelinesCollected,
    synthetics: syntheticsCollected,
  };
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, testOnly } = await req.json();
    
    console.log(`[datadog-integration] Action: ${action}, testOnly: ${testOnly}`);

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('[datadog-integration] Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[datadog-integration] User authenticated: ${user.id}`);

    // Test connection
    if (action === 'test' || testOnly) {
      const testResult = await testDatadogConnection(credentials as DatadogCredentials);
      return new Response(
        JSON.stringify(testResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Full sync
    if (action === 'sync') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const result = await collectDatadogData(
        credentials as DatadogCredentials,
        user.id,
        supabaseAdmin
      );

      // Update integration status
      await supabaseAdmin.from('integration_status').upsert({
        user_id: user.id,
        integration_name: 'datadog',
        status: 'healthy',
        health_score: 100,
        last_sync_at: new Date().toISOString(),
        metadata: result,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name' });

      return new Response(
        JSON.stringify({ success: true, resources: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[datadog-integration] Error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao processar requisição' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
