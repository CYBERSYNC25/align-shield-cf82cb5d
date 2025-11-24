import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { agent_token, router_name, cpu, version } = await req.json();

    // Validate required fields
    if (!agent_token || !router_name || cpu === undefined || !version) {
      console.error('Missing required fields:', { agent_token, router_name, cpu, version });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['agent_token', 'router_name', 'cpu', 'version'] 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate CPU value
    if (typeof cpu !== 'number' || cpu < 0 || cpu > 100) {
      console.error('Invalid CPU value:', cpu);
      return new Response(
        JSON.stringify({ error: 'CPU usage must be a number between 0 and 100' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Ingesting metrics:', { agent_token, router_name, cpu, version });

    // Insert device log into database
    const { data, error } = await supabase
      .from('device_logs')
      .insert({
        device_id: agent_token,
        router_name: router_name,
        cpu_usage: cpu,
        version: version
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert metrics', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Metrics ingested successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Metrics ingested successfully',
        id: data.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ingest-metrics function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
