/**
 * Supabase Edge Function: send-digest-email
 * 
 * Generates and sends daily/weekly digest emails with compliance summaries.
 * Should be invoked by a cron job.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestRequest {
  type: 'daily' | 'weekly';
  org_id?: string; // If not provided, process all orgs
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error('[send-digest-email] RESEND_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const resend = new Resend(RESEND_API_KEY);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { type, org_id }: DigestRequest = await req.json();
    const isDaily = type === 'daily';
    const periodHours = isDaily ? 24 : 168; // 24h or 7 days
    const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

    console.log(`[send-digest-email] Processing ${type} digest`, { org_id, periodStart });

    // Build query for notification settings
    let settingsQuery = supabase
      .from('notification_settings')
      .select('*, organizations(name, slug)')
      .eq(isDaily ? 'digest_daily_enabled' : 'digest_weekly_enabled', true);

    if (org_id) {
      settingsQuery = settingsQuery.eq('org_id', org_id);
    }

    const { data: allSettings, error: settingsError } = await settingsQuery;

    if (settingsError) {
      throw new Error(`Failed to fetch settings: ${settingsError.message}`);
    }

    if (!allSettings || allSettings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No organizations with digest enabled',
          processed: 0,
          timestamp: new Date().toISOString() 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const settings of allSettings) {
      try {
        results.processed++;
        const currentOrgId = settings.org_id;

        // Get compliance alerts for the period
        const { data: alerts } = await supabase
          .from('compliance_alerts')
          .select('*')
          .eq('org_id', currentOrgId)
          .gte('created_at', periodStart);

        // Count issues by severity
        const issuesBySeverity = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };

        (alerts || []).forEach(alert => {
          const severity = alert.severity.toLowerCase() as keyof typeof issuesBySeverity;
          if (severity in issuesBySeverity) {
            issuesBySeverity[severity]++;
          }
        });

        // Get recent compliance check for score
        const { data: recentCheck } = await supabase
          .from('compliance_check_history')
          .select('score, created_at')
          .eq('org_id', currentOrgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const currentScore = recentCheck?.score || 0;

        // Get previous score for comparison
        const { data: previousCheck } = await supabase
          .from('compliance_check_history')
          .select('score')
          .eq('org_id', currentOrgId)
          .lt('created_at', periodStart)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const previousScore = previousCheck?.score || currentScore;
        const scoreDiff = currentScore - previousScore;

        // Count resolved issues
        const resolvedCount = (alerts || []).filter(a => a.resolved).length;

        // Get users in the organization
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('org_id', currentOrgId);

        const userIds = (profiles || []).map(p => p.user_id);

        // Send email to each user
        for (const userId of userIds) {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            const email = userData?.user?.email;

            if (!email) continue;

            const orgName = (settings as unknown as { organizations: { name: string } }).organizations?.name || 'Sua Organização';
            const periodLabel = isDaily ? 'Últimas 24 horas' : 'Última semana';
            const digestTitle = isDaily ? 'Resumo Diário' : 'Resumo Semanal';

            const scoreChangeHtml = scoreDiff > 0 
              ? `<span style="color: #22c55e;">↑${scoreDiff}%</span>` 
              : scoreDiff < 0 
                ? `<span style="color: #ef4444;">↓${Math.abs(scoreDiff)}%</span>`
                : '<span style="color: #6b7280;">sem alteração</span>';

            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0;">📊 ${digestTitle} de Compliance</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">${periodLabel} - ${orgName}</p>
                </div>
                
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                  <!-- Score Section -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #1e40af; margin: 0 0 10px;">Compliance Score</h2>
                    <div style="font-size: 48px; font-weight: bold; color: ${currentScore >= 80 ? '#22c55e' : currentScore >= 60 ? '#f59e0b' : '#ef4444'};">
                      ${currentScore}%
                    </div>
                    <p style="color: #6b7280; margin: 5px 0 0;">
                      ${scoreChangeHtml} vs período anterior
                    </p>
                  </div>
                  
                  <!-- Issues Summary -->
                  <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #374151; margin: 0 0 15px;">Issues Detectados</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                      <div style="flex: 1; min-width: 100px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${issuesBySeverity.critical}</div>
                        <div style="color: #6b7280; font-size: 14px;">Críticos</div>
                      </div>
                      <div style="flex: 1; min-width: 100px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${issuesBySeverity.high}</div>
                        <div style="color: #6b7280; font-size: 14px;">Altos</div>
                      </div>
                      <div style="flex: 1; min-width: 100px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #eab308;">${issuesBySeverity.medium}</div>
                        <div style="color: #6b7280; font-size: 14px;">Médios</div>
                      </div>
                      <div style="flex: 1; min-width: 100px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #6b7280;">${issuesBySeverity.low}</div>
                        <div style="color: #6b7280; font-size: 14px;">Baixos</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Resolved -->
                  <div style="background: #ecfdf5; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #166534;">
                      <strong>✅ ${resolvedCount} issues resolvidos</strong> no período
                    </p>
                  </div>
                  
                  <!-- CTA -->
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://align-shield.lovable.app/dashboard" 
                       style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                      Ver Dashboard Completo →
                    </a>
                  </div>
                </div>
                
                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                    Você está recebendo este email porque habilitou o digest ${isDaily ? 'diário' : 'semanal'} em suas configurações.
                    <br>
                    <a href="https://align-shield.lovable.app/settings" style="color: #3b82f6;">Gerenciar preferências</a>
                  </p>
                </div>
              </div>
            `;

            await resend.emails.send({
              from: "ComplianceSync <onboarding@resend.dev>",
              to: [email],
              subject: `📊 ${digestTitle} de Compliance - ${orgName}`,
              html,
            });

            results.sent++;
          } catch (emailError) {
            console.error('[send-digest-email] Failed to send to user', { userId, error: emailError });
          }
        }

      } catch (orgError) {
        const errorMessage = orgError instanceof Error ? orgError.message : 'Unknown error';
        results.errors.push(`Org ${settings.org_id}: ${errorMessage}`);
        results.failed++;
      }
    }

    console.log('[send-digest-email] Digest completed', results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error('[send-digest-email] Error:', error);
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
