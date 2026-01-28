/**
 * Session Manager Edge Function
 * 
 * Handles session lifecycle: create, update activity, revoke, list.
 * Includes device detection and geolocation.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parseUserAgent } from "../_shared/device-parser.ts";
import { getClientIp, getGeoLocation, formatLocation } from "../_shared/geolocation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();
    
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = claimsData.claims.sub;

    switch (action) {
      case 'create': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Parse device info
        const userAgent = req.headers.get('User-Agent');
        const deviceInfo = parseUserAgent(userAgent);
        
        // Get client IP and geolocation
        const clientIp = getClientIp(req);
        const geoLocation = await getGeoLocation(clientIp);
        
        // Create session via database function
        const { data: sessionResult, error: createError } = await supabaseAdmin
          .rpc('create_user_session', {
            p_user_id: userId,
            p_device_info: deviceInfo.deviceInfo,
            p_browser: deviceInfo.browser,
            p_browser_version: deviceInfo.browserVersion,
            p_os: deviceInfo.os,
            p_os_version: deviceInfo.osVersion,
            p_device_type: deviceInfo.deviceType,
            p_ip_address: clientIp,
            p_city: geoLocation.city,
            p_country: geoLocation.country,
            p_country_code: geoLocation.countryCode,
          });

        if (createError) {
          console.error('Create session error:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const session = sessionResult?.[0];
        
        // Handle new device notification
        if (session?.is_new_device) {
          // Create in-app notification
          await supabaseAdmin.rpc('create_notification', {
            p_user_id: userId,
            p_title: 'Novo login detectado',
            p_message: `Um novo dispositivo (${deviceInfo.deviceInfo}) conectou à sua conta de ${formatLocation(geoLocation.city, geoLocation.country)}.`,
            p_type: 'security',
            p_priority: 'high',
            p_action_url: '/settings/security',
            p_action_label: 'Gerenciar Sessões',
            p_metadata: {
              device: deviceInfo.deviceInfo,
              location: formatLocation(geoLocation.city, geoLocation.country),
              ip: clientIp,
            }
          });
        }
        
        // Handle new country alert
        if (session?.is_new_country && geoLocation.country) {
          await supabaseAdmin.rpc('create_notification', {
            p_user_id: userId,
            p_title: '⚠️ Login de novo país',
            p_message: `Detectamos um login de ${geoLocation.country}. Se não foi você, encerre a sessão imediatamente.`,
            p_type: 'security',
            p_priority: 'urgent',
            p_action_url: '/settings/security',
            p_action_label: 'Verificar Sessões',
            p_metadata: {
              country: geoLocation.country,
              countryCode: geoLocation.countryCode,
              city: geoLocation.city,
              ip: clientIp,
            }
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            sessionId: session?.session_id,
            isNewDevice: session?.is_new_device,
            isNewCountry: session?.is_new_country,
            revokedSessionId: session?.revoked_session_id,
            deviceInfo: deviceInfo.deviceInfo,
            location: formatLocation(geoLocation.city, geoLocation.country),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-activity': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        const sessionId = body.sessionId;

        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'Session ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .rpc('update_session_activity', { p_session_id: sessionId });

        if (updateError) {
          console.error('Update activity error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update activity' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: updated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'revoke': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        const sessionId = body.sessionId;
        const reason = body.reason || 'manual';

        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'Session ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: revoked, error: revokeError } = await supabase
          .rpc('revoke_session', { p_session_id: sessionId, p_reason: reason });

        if (revokeError) {
          console.error('Revoke session error:', revokeError);
          return new Response(
            JSON.stringify({ error: 'Failed to revoke session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: revoked }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'revoke-all-others': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        const currentSessionId = body.currentSessionId;

        if (!currentSessionId) {
          return new Response(
            JSON.stringify({ error: 'Current session ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: count, error: revokeError } = await supabase
          .rpc('revoke_all_other_sessions', { p_current_session_id: currentSessionId });

        if (revokeError) {
          console.error('Revoke all sessions error:', revokeError);
          return new Response(
            JSON.stringify({ error: 'Failed to revoke sessions' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, revokedCount: count }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list': {
        if (req.method !== 'GET') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: sessions, error: listError } = await supabase
          .rpc('get_user_active_sessions');

        if (listError) {
          console.error('List sessions error:', listError);
          return new Response(
            JSON.stringify({ error: 'Failed to list sessions' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ sessions }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Session manager error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
