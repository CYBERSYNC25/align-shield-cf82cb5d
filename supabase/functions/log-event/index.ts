import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogEventPayload {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  source: 'frontend' | 'edge_function' | 'webhook' | 'scheduled_job' | 'database';
  message: string;
  metadata?: Record<string, unknown>;
  stack_trace?: string;
  function_name?: string;
  component_name?: string;
  request_id?: string;
}

const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'critical'];
const VALID_SOURCES = ['frontend', 'edge_function', 'webhook', 'scheduled_job', 'database'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload: LogEventPayload = await req.json();

    // Validate required fields
    if (!payload.level || !payload.source || !payload.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: level, source, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate level
    if (!VALID_LEVELS.includes(payload.level)) {
      return new Response(
        JSON.stringify({ error: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate source
    if (!VALID_SOURCES.includes(payload.source)) {
      return new Response(
        JSON.stringify({ error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user from JWT if present
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let orgId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          // Get org_id from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('user_id', user.id)
            .single();
          orgId = profile?.org_id || null;
        }
      } catch (authError) {
        // Continue without user context if auth fails
        console.warn('Failed to extract user from token:', authError);
      }
    }

    // Truncate message and stack_trace if too long
    const truncatedMessage = payload.message?.substring(0, 10000) || '';
    const truncatedStackTrace = payload.stack_trace?.substring(0, 50000) || null;

    // Insert log with service role (bypasses RLS)
    const { error } = await supabase
      .from('system_logs')
      .insert({
        org_id: orgId,
        user_id: userId,
        level: payload.level,
        source: payload.source,
        message: truncatedMessage,
        metadata: payload.metadata || {},
        stack_trace: truncatedStackTrace,
        function_name: payload.function_name?.substring(0, 255) || null,
        component_name: payload.component_name?.substring(0, 255) || null,
        request_id: payload.request_id?.substring(0, 255) || null,
      });

    if (error) {
      console.error('Failed to insert log:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in log-event:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to log event' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
