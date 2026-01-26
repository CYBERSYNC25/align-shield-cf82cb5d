/**
 * Check Token Expiration Edge Function
 * 
 * This function should be scheduled to run daily via cron.
 * It performs the following tasks:
 * 
 * 1. Detect tokens expiring in 7 days and notify users
 * 2. Mark expired tokens with status 'expired'
 * 3. Identify credentials inactive for 90+ days and schedule revocation
 * 4. Execute revocation for credentials past the 14-day grace period
 * 
 * SECURITY: Only accessible via service_role or internal cron
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is a service role request (cron or internal)
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader?.includes(serviceRoleKey || '')) {
      // Also check if request comes from internal cron
      const cronSecret = req.headers.get('x-cron-secret');
      if (cronSecret !== Deno.env.get('CRON_SECRET')) {
        console.warn('[TokenExpiration] Unauthorized access attempt');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: corsHeaders }
        );
      }
    }

    console.log('[TokenExpiration] Starting token expiration check...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const stats = {
      tokensExpiringSoon: 0,
      tokensExpired: 0,
      integrationsInactive: 0,
      integrationsRevoked: 0,
      notificationsSent: 0,
    };

    // =========================================================================
    // 1. Find OAuth tokens expiring within 7 days
    // =========================================================================
    console.log('[TokenExpiration] Checking for tokens expiring soon...');
    
    const { data: expiringTokens, error: expiringError } = await supabaseAdmin
      .from('integration_oauth_tokens')
      .select('id, user_id, integration_name, expires_at')
      .lt('expires_at', sevenDaysFromNow.toISOString())
      .gt('expires_at', now.toISOString());

    if (expiringError) {
      console.error('[TokenExpiration] Error fetching expiring tokens:', expiringError);
    } else if (expiringTokens && expiringTokens.length > 0) {
      console.log(`[TokenExpiration] Found ${expiringTokens.length} tokens expiring soon`);
      stats.tokensExpiringSoon = expiringTokens.length;

      for (const token of expiringTokens) {
        const expiresAt = new Date(token.expires_at);
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        // Create notification for user
        const { error: notifError } = await supabaseAdmin.rpc('create_notification', {
          p_user_id: token.user_id,
          p_title: 'Token de integração expirando',
          p_message: `Seu token para ${token.integration_name} expira em ${daysUntilExpiry} dias. Reconecte a integração para evitar interrupções.`,
          p_type: 'warning',
          p_priority: daysUntilExpiry <= 2 ? 'high' : 'normal',
          p_action_url: '/settings/integrations',
          p_action_label: 'Reconectar',
          p_metadata: {
            integration_name: token.integration_name,
            expires_at: token.expires_at,
            days_until_expiry: daysUntilExpiry,
          },
        });

        if (!notifError) {
          stats.notificationsSent++;
        }
      }
    }

    // =========================================================================
    // 2. Mark expired tokens
    // =========================================================================
    console.log('[TokenExpiration] Checking for expired tokens...');
    
    const { data: expiredTokens, error: expiredError } = await supabaseAdmin
      .from('integration_oauth_tokens')
      .select('id, user_id, integration_name')
      .lt('expires_at', now.toISOString());

    if (expiredError) {
      console.error('[TokenExpiration] Error fetching expired tokens:', expiredError);
    } else if (expiredTokens && expiredTokens.length > 0) {
      console.log(`[TokenExpiration] Found ${expiredTokens.length} expired tokens`);
      stats.tokensExpired = expiredTokens.length;

      for (const token of expiredTokens) {
        // Update integration status to expired
        await supabaseAdmin.from('integration_status').upsert({
          user_id: token.user_id,
          integration_name: token.integration_name,
          status: 'expired',
          health_score: 0,
          updated_at: now.toISOString(),
          metadata: {
            expired_at: now.toISOString(),
            reason: 'oauth_token_expired',
          },
        }, { onConflict: 'user_id,integration_name' });

        // Notify user
        await supabaseAdmin.rpc('create_notification', {
          p_user_id: token.user_id,
          p_title: 'Token de integração expirado',
          p_message: `Seu token para ${token.integration_name} expirou. Reconecte a integração para continuar sincronizando dados.`,
          p_type: 'error',
          p_priority: 'high',
          p_action_url: '/settings/integrations',
          p_action_label: 'Reconectar',
        });
      }
    }

    // =========================================================================
    // 3. Find inactive integrations (not used in 90 days)
    // =========================================================================
    console.log('[TokenExpiration] Checking for inactive integrations...');
    
    const { data: inactiveIntegrations, error: inactiveError } = await supabaseAdmin
      .from('integrations')
      .select('id, user_id, provider, name, last_used_at, metadata')
      .eq('status', 'connected')
      .lt('last_used_at', ninetyDaysAgo.toISOString());

    if (inactiveError) {
      console.error('[TokenExpiration] Error fetching inactive integrations:', inactiveError);
    } else if (inactiveIntegrations && inactiveIntegrations.length > 0) {
      console.log(`[TokenExpiration] Found ${inactiveIntegrations.length} inactive integrations`);
      stats.integrationsInactive = inactiveIntegrations.length;

      for (const integration of inactiveIntegrations) {
        // Check if already scheduled for revocation
        const metadata = integration.metadata as Record<string, unknown> || {};
        if (metadata.revocation_scheduled_at) {
          continue; // Already scheduled
        }

        const revocationDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        // Mark for revocation with 14-day grace period
        await supabaseAdmin.from('integrations').update({
          status: 'pending_revocation',
          metadata: {
            ...metadata,
            revocation_scheduled_at: revocationDate.toISOString(),
            inactive_since: integration.last_used_at,
          },
          updated_at: now.toISOString(),
        }).eq('id', integration.id);

        // Notify user
        await supabaseAdmin.rpc('create_notification', {
          p_user_id: integration.user_id,
          p_title: 'Integração inativa será revogada',
          p_message: `${integration.name} não é usada há 90 dias e será desconectada em 14 dias. Use a integração ou reconecte-a para mantê-la ativa.`,
          p_type: 'warning',
          p_priority: 'normal',
          p_action_url: '/settings/integrations',
          p_action_label: 'Manter Integração',
          p_metadata: {
            integration_id: integration.id,
            provider: integration.provider,
            revocation_date: revocationDate.toISOString(),
          },
        });

        stats.notificationsSent++;
      }
    }

    // =========================================================================
    // 4. Execute revocation for integrations past grace period
    // =========================================================================
    console.log('[TokenExpiration] Checking for integrations to revoke...');
    
    const { data: pendingRevocation, error: revocationError } = await supabaseAdmin
      .from('integrations')
      .select('id, user_id, provider, name, metadata')
      .eq('status', 'pending_revocation');

    if (revocationError) {
      console.error('[TokenExpiration] Error fetching pending revocations:', revocationError);
    } else if (pendingRevocation && pendingRevocation.length > 0) {
      for (const integration of pendingRevocation) {
        const metadata = integration.metadata as Record<string, unknown> || {};
        const scheduledAt = metadata.revocation_scheduled_at as string;
        
        if (!scheduledAt) continue;
        
        const revocationDate = new Date(scheduledAt);
        if (revocationDate > now) {
          continue; // Not yet time to revoke
        }

        console.log(`[TokenExpiration] Revoking integration ${integration.id} (${integration.provider})`);

        // Revoke the integration
        await supabaseAdmin.from('integrations').update({
          status: 'revoked',
          configuration: {}, // Clear encrypted credentials
          metadata: {
            ...metadata,
            revoked_at: now.toISOString(),
            revoke_reason: 'inactivity_90_days',
          },
          updated_at: now.toISOString(),
        }).eq('id', integration.id);

        // Update status
        await supabaseAdmin.from('integration_status').upsert({
          user_id: integration.user_id,
          integration_name: integration.provider,
          status: 'revoked',
          health_score: 0,
          updated_at: now.toISOString(),
          metadata: {
            revoked_at: now.toISOString(),
            reason: 'inactivity',
          },
        }, { onConflict: 'user_id,integration_name' });

        // Delete OAuth tokens
        await supabaseAdmin
          .from('integration_oauth_tokens')
          .delete()
          .eq('user_id', integration.user_id)
          .eq('integration_name', integration.provider);

        // Final notification
        await supabaseAdmin.rpc('create_notification', {
          p_user_id: integration.user_id,
          p_title: 'Integração revogada por inatividade',
          p_message: `${integration.name} foi desconectada por estar inativa há mais de 90 dias. Você pode reconectar a qualquer momento.`,
          p_type: 'info',
          p_priority: 'low',
          p_action_url: '/settings/integrations',
          p_action_label: 'Reconectar',
        });

        stats.integrationsRevoked++;

        // Log to audit
        await supabaseAdmin.from('system_audit_logs').insert({
          user_id: integration.user_id,
          action_type: 'integration_auto_revoked',
          action_category: 'security',
          resource_type: 'integration',
          resource_id: integration.id,
          description: `Integration ${integration.provider} auto-revoked due to 90+ days inactivity`,
          metadata: {
            provider: integration.provider,
            inactive_since: metadata.inactive_since,
            revoke_reason: 'inactivity_90_days',
          },
        });
      }
    }

    console.log('[TokenExpiration] Check completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TokenExpiration] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
