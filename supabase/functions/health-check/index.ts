import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: HealthCheck[];
}

const CRITICAL_TABLES = [
  'profiles',
  'compliance_frameworks',
  'compliance_controls',
  'collected_resources',
  'integrations',
  'audit_logs',
  'notifications',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const checks: HealthCheck[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Check 1: Environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    checks.push({
      name: 'environment',
      status: 'unhealthy',
      message: 'Missing required environment variables',
    });
    overallStatus = 'unhealthy';
  } else {
    checks.push({
      name: 'environment',
      status: 'healthy',
      message: 'All required environment variables present',
    });
  }

  // Check 2: Database connectivity
  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const dbStart = Date.now();
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latency = Date.now() - dbStart;
      
      if (error) {
        checks.push({
          name: 'database',
          status: 'unhealthy',
          latency_ms: latency,
          message: `Database query failed: ${error.message}`,
        });
        overallStatus = 'unhealthy';
      } else {
        checks.push({
          name: 'database',
          status: latency > 1000 ? 'degraded' : 'healthy',
          latency_ms: latency,
          message: latency > 1000 ? 'Database responding slowly' : 'Database responding normally',
        });
        if (latency > 1000 && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      }
    } catch (err) {
      checks.push({
        name: 'database',
        status: 'unhealthy',
        message: `Database connection failed: ${err.message}`,
      });
      overallStatus = 'unhealthy';
    }

    // Check 3: Critical tables exist and have data
    for (const table of CRITICAL_TABLES) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          checks.push({
            name: `table_${table}`,
            status: 'unhealthy',
            message: `Table ${table} inaccessible: ${error.message}`,
          });
          if (overallStatus === 'healthy') overallStatus = 'degraded';
        } else {
          const isEmpty = count === 0;
          const isRequired = ['profiles', 'compliance_frameworks', 'compliance_controls'].includes(table);
          
          checks.push({
            name: `table_${table}`,
            status: isEmpty && isRequired ? 'degraded' : 'healthy',
            message: `${count} records${isEmpty && isRequired ? ' (needs seeding)' : ''}`,
          });
          
          if (isEmpty && isRequired && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        }
      } catch (err) {
        checks.push({
          name: `table_${table}`,
          status: 'unhealthy',
          message: `Failed to check table: ${err.message}`,
        });
      }
    }

    // Check 4: Encryption key configured
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
    checks.push({
      name: 'encryption',
      status: encryptionKey ? 'healthy' : 'degraded',
      message: encryptionKey ? 'Encryption key configured' : 'Encryption key not configured',
    });
    if (!encryptionKey && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  }

  const response: HealthResponse = {
    status: overallStatus,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks,
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: overallStatus === 'unhealthy' ? 503 : 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
});
