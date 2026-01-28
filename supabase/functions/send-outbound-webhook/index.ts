/**
 * Supabase Edge Function: send-outbound-webhook
 * 
 * Sends webhook payloads to configured external URLs with HMAC signing,
 * retry logic, and comprehensive SSRF protection.
 * 
 * SECURITY:
 * - SSRF validation on all webhook URLs
 * - 10 second timeout
 * - No automatic redirects
 * - Full logging of attempts
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { validateWebhookUrl } from "../_shared/ssrf-validator.ts";
import { secureFetch } from "../_shared/secure-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutboundPayload {
  webhook_id: string;
  event_type: string;
  data: Record<string, unknown>;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function generateHmacSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${signatureHex}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload: OutboundPayload = await req.json();

    console.log('[send-outbound-webhook] Processing webhook', { 
      webhook_id: payload.webhook_id, 
      event_type: payload.event_type 
    });

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('outbound_webhooks')
      .select('*')
      .eq('id', payload.webhook_id)
      .single();

    if (webhookError || !webhook) {
      throw new Error(`Webhook not found: ${payload.webhook_id}`);
    }

    if (!webhook.enabled) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: 'Webhook is disabled',
          timestamp: new Date().toISOString() 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if event is in the webhook's event list
    if (!webhook.events.includes(payload.event_type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: `Event ${payload.event_type} not configured for this webhook`,
          timestamp: new Date().toISOString() 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SSRF Protection: Validate webhook URL before proceeding
    const ssrfCheck = validateWebhookUrl(webhook.url);
    if (!ssrfCheck.valid) {
      console.error(`[send-outbound-webhook] SSRF blocked: ${webhook.url} - ${ssrfCheck.blockedReason}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL blocked by security policy',
          reason: ssrfCheck.blockedReason,
          timestamp: new Date().toISOString() 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prepare payload
    const webhookPayload = {
      event: payload.event_type,
      timestamp: new Date().toISOString(),
      org_id: webhook.org_id,
      data: payload.data,
    };
    const payloadString = JSON.stringify(webhookPayload);

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'APOC-Webhook/1.0',
      ...(webhook.custom_headers || {}),
    };

    // Add HMAC signature if secret is configured
    if (webhook.secret) {
      headers['X-Webhook-Signature'] = await generateHmacSignature(webhook.secret, payloadString);
    }

    // Create log entry
    const { data: logEntry, error: logError } = await supabase
      .from('outbound_webhook_logs')
      .insert({
        webhook_id: payload.webhook_id,
        event_type: payload.event_type,
        payload: webhookPayload,
        status: 'pending',
        attempts: 0,
      })
      .select()
      .single();

    if (logError) {
      console.error('[send-outbound-webhook] Failed to create log entry', logError);
    }

    // Send webhook with retry logic
    const maxAttempts = 3;
    let lastError: Error | null = null;
    let statusCode: number | null = null;
    let responseBody: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[send-outbound-webhook] Attempt ${attempt}/${maxAttempts}`);
        
        // Use secureFetch with SSRF protection, timeout, and no redirects
        const result = await secureFetch({
          url: webhook.url,
          method: 'POST',
          headers,
          body: payloadString,
          timeoutMs: 10000,
          followRedirects: false,
          logAttempt: true,
          functionName: 'send-outbound-webhook',
        });

        statusCode = result.statusCode || null;
        responseBody = result.responseBody || null;

        if (result.blocked) {
          lastError = new Error(`SSRF blocked: ${result.blockedReason}`);
          break; // Don't retry SSRF blocks
        }

        if (result.success) {
          // Update log entry as success
          if (logEntry) {
            await supabase
              .from('outbound_webhook_logs')
              .update({
                status: 'success',
                status_code: statusCode,
                response_body: responseBody.substring(0, 1000),
                attempts: attempt,
                completed_at: new Date().toISOString(),
              })
              .eq('id', logEntry.id);
          }

          // Update webhook counters
          await supabase
            .from('outbound_webhooks')
            .update({
              last_triggered_at: new Date().toISOString(),
              success_count: webhook.success_count + 1,
            })
            .eq('id', webhook.id);

          console.log('[send-outbound-webhook] Success', { statusCode });

          return new Response(
            JSON.stringify({
              success: true,
              status_code: statusCode,
              attempts: attempt,
              timestamp: new Date().toISOString(),
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        lastError = new Error(`HTTP ${statusCode}: ${responseBody}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[send-outbound-webhook] Attempt ${attempt} failed`, lastError.message);
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All attempts failed
    if (logEntry) {
      await supabase
        .from('outbound_webhook_logs')
        .update({
          status: 'failed',
          status_code: statusCode,
          response_body: responseBody?.substring(0, 1000),
          error_message: lastError?.message,
          attempts: maxAttempts,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    // Update webhook failure counter
    await supabase
      .from('outbound_webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        failure_count: webhook.failure_count + 1,
      })
      .eq('id', webhook.id);

    console.error('[send-outbound-webhook] All attempts failed', { lastError });

    return new Response(
      JSON.stringify({
        success: false,
        error: lastError?.message || 'Unknown error',
        attempts: maxAttempts,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error('[send-outbound-webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
