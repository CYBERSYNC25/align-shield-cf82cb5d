/**
 * Supabase Edge Function: send-notification
 * 
 * Central notification dispatcher that sends alerts through multiple channels
 * (email, in-app, Slack) based on user preferences.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  org_id: string;
  user_ids?: string[];
  type: 'critical_issue' | 'score_drop' | 'sla_expiring' | 'sync_failed' | 'new_user' | 'weekly_report' | 'issue_remediated';
  title: string;
  message: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

interface ChannelConfig {
  email: boolean;
  in_app: boolean;
  slack: boolean;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload: NotificationPayload = await req.json();

    console.log('[send-notification] Processing notification', { 
      type: payload.type, 
      org_id: payload.org_id 
    });

    // Get notification settings for the org
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('org_id', payload.org_id)
      .maybeSingle();

    // Get users to notify
    let userIds = payload.user_ids;
    if (!userIds || userIds.length === 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('org_id', payload.org_id);
      
      userIds = (profiles || []).map((p) => p.user_id);
    }

    // Determine which channels to use based on alert type
    const alertKey = `alert_${payload.type}` as keyof typeof settings;
    const channelConfig: ChannelConfig = settings?.[alertKey] as ChannelConfig || {
      email: true,
      in_app: true,
      slack: false,
    };

    const results = {
      email: { sent: 0, failed: 0 },
      in_app: { sent: 0, failed: 0 },
      slack: { sent: false, error: null as string | null },
      webhooks: { triggered: 0, failed: 0 },
    };

    // Send In-App notifications
    if (settings?.in_app_enabled !== false && channelConfig.in_app) {
      for (const userId of userIds) {
        try {
          await supabase.from('notifications').insert({
            user_id: userId,
            title: payload.title,
            message: payload.message,
            type: payload.type,
            priority: payload.priority || 'normal',
            metadata: payload.data,
          });
          results.in_app.sent++;
        } catch (error) {
          console.error('[send-notification] In-app notification failed', { userId, error });
          results.in_app.failed++;
        }
      }
    }

    // Send Email notifications
    if (settings?.email_enabled !== false && channelConfig.email) {
      for (const userId of userIds) {
        try {
          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          if (userData?.user?.email) {
            // Invoke send-notification-email function
            await supabase.functions.invoke('send-notification-email', {
              body: {
                to: userData.user.email,
                type: payload.type,
                data: {
                  title: payload.title,
                  message: payload.message,
                  ...payload.data,
                },
              },
            });
            results.email.sent++;
          }
        } catch (error) {
          console.error('[send-notification] Email notification failed', { userId, error });
          results.email.failed++;
        }
      }
    }

    // Send Slack notification
    if (settings?.slack_enabled && settings?.slack_webhook_url && channelConfig.slack) {
      try {
        const slackPayload = {
          text: `*${payload.title}*\n${payload.message}`,
          attachments: [{
            color: payload.priority === 'high' ? '#dc2626' : 
                   payload.priority === 'normal' ? '#f59e0b' : '#3b82f6',
            fields: Object.entries(payload.data || {}).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true,
            })),
          }],
        };

        const slackResponse = await fetch(settings.slack_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload),
        });

        if (!slackResponse.ok) {
          throw new Error(`Slack responded with ${slackResponse.status}`);
        }
        results.slack.sent = true;
      } catch (error) {
        console.error('[send-notification] Slack notification failed', error);
        results.slack.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Trigger outbound webhooks
    const { data: webhooks } = await supabase
      .from('outbound_webhooks')
      .select('*')
      .eq('org_id', payload.org_id)
      .eq('enabled', true)
      .contains('events', [payload.type]);

    for (const webhook of webhooks || []) {
      try {
        await supabase.functions.invoke('send-outbound-webhook', {
          body: {
            webhook_id: webhook.id,
            event_type: payload.type,
            data: {
              title: payload.title,
              message: payload.message,
              ...payload.data,
            },
          },
        });
        results.webhooks.triggered++;
      } catch (error) {
        console.error('[send-notification] Outbound webhook failed', { webhook_id: webhook.id, error });
        results.webhooks.failed++;
      }
    }

    console.log('[send-notification] Notification completed', results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    console.error('[send-notification] Error:', error);
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
