import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logEventSchema, parseAndValidate } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate with Zod schema
    const parsed = parseAndValidate(logEventSchema, body, corsHeaders);
    if (!parsed.success) {
      return parsed.response;
    }

    const payload = parsed.data;

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
          const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('user_id', user.id)
            .single();
          orgId = profile?.org_id || null;
        }
      } catch (authError) {
        console.warn('Failed to extract user from token:', authError);
      }
    }

    // Truncate message and stack_trace if too long (already validated by schema, but extra safety)
    const truncatedMessage = payload.message.substring(0, 10000);
    const truncatedStackTrace = payload.stack_trace?.substring(0, 50000) || null;

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
