import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, isServiceRole, rateLimitExceededResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRule {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  integrationId: string;
  resourceType: string;
  checkFn: (data: any) => boolean;
}

// Same rules as useComplianceStatus
const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'github-public-repo',
    title: 'Repositório Público Detectado',
    severity: 'critical',
    integrationId: 'github',
    resourceType: 'repository',
    checkFn: (data) => data?.private === false || data?.visibility === 'public',
  },
  {
    id: 'github-no-branch-protection',
    title: 'Branch Principal sem Proteção',
    severity: 'high',
    integrationId: 'github',
    resourceType: 'repository',
    checkFn: (data) => data?.default_branch_protected === false,
  },
  {
    id: 'cloudflare-no-https',
    title: 'HTTPS Não Forçado',
    severity: 'critical',
    integrationId: 'cloudflare',
    resourceType: 'zone',
    checkFn: (data) => data?.always_use_https === false || data?.ssl?.mode === 'off',
  },
  {
    id: 'cloudflare-no-waf',
    title: 'WAF Desativado',
    severity: 'high',
    integrationId: 'cloudflare',
    resourceType: 'zone',
    checkFn: (data) => data?.waf_enabled === false,
  },
  {
    id: 'slack-admin-no-mfa',
    title: 'Admin Slack sem MFA',
    severity: 'critical',
    integrationId: 'slack',
    resourceType: 'user',
    checkFn: (data) => data?.is_admin === true && data?.has_2fa === false,
  },
  {
    id: 'slack-inactive-user',
    title: 'Usuário Slack Inativo',
    severity: 'medium',
    integrationId: 'slack',
    resourceType: 'user',
    checkFn: (data) => {
      if (!data?.updated) return false;
      const lastActivity = new Date(data.updated * 1000);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity > 90 && data?.deleted !== true;
    },
  },
  {
    id: 'intune-noncompliant-device',
    title: 'Dispositivo Não Conforme',
    severity: 'critical',
    integrationId: 'intune',
    resourceType: 'device',
    checkFn: (data) => data?.complianceState !== 'compliant' && data?.complianceState !== undefined,
  },
  {
    id: 'intune-unencrypted-device',
    title: 'Dispositivo sem Criptografia',
    severity: 'high',
    integrationId: 'intune',
    resourceType: 'device',
    checkFn: (data) => data?.isEncrypted === false,
  },
  {
    id: 'aws-public-bucket',
    title: 'Bucket S3 Público',
    severity: 'critical',
    integrationId: 'aws',
    resourceType: 'bucket',
    checkFn: (data) => data?.public_access === true || data?.publicAccessBlock?.BlockPublicAcls === false,
  },
  {
    id: 'aws-unencrypted-bucket',
    title: 'Bucket sem Criptografia',
    severity: 'high',
    integrationId: 'aws',
    resourceType: 'bucket',
    checkFn: (data) => data?.encryption_enabled === false,
  },
  {
    id: 'google-user-no-mfa',
    title: 'Usuário Google sem MFA',
    severity: 'high',
    integrationId: 'google-workspace',
    resourceType: 'user',
    checkFn: (data) => data?.isEnrolledIn2Sv === false && data?.suspended !== true,
  },
  {
    id: 'google-admin-no-mfa',
    title: 'Admin Google sem MFA',
    severity: 'critical',
    integrationId: 'google-workspace',
    resourceType: 'user',
    checkFn: (data) => data?.isAdmin === true && data?.isEnrolledIn2Sv === false,
  },
  {
    id: 'auth0-no-mfa',
    title: 'MFA não Configurado',
    severity: 'high',
    integrationId: 'auth0',
    resourceType: 'guardian',
    checkFn: (data) => data?.enabled === false,
  },
  {
    id: 'okta-user-no-mfa',
    title: 'Usuário Okta sem MFA',
    severity: 'high',
    integrationId: 'okta',
    resourceType: 'user',
    checkFn: (data) => data?.status === 'ACTIVE' && (data?.mfaEnabled === false || data?.enrolledFactors?.length === 0),
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get optional user_id from request body (for targeted check)
    let targetUserId: string | null = null;
    let triggeredBy = 'scheduled';
    
    try {
      const body = await req.json();
      targetUserId = body?.user_id || null;
      triggeredBy = body?.triggered_by || 'scheduled';
    } catch {
      // No body provided, check all users
    }

    // Rate limiting - bypass for service_role (internal/scheduled calls)
    // Lower limit (5 req/min) as this is a heavy batch operation
    const authHeader = req.headers.get('Authorization');
    if (!isServiceRole(authHeader)) {
      const rateLimitId = targetUserId || req.headers.get('x-forwarded-for') || 'anonymous';

      const rateLimit = await checkRateLimit(rateLimitId, 'check-compliance-drift', 5, 60);
      if (!rateLimit.allowed) {
        return rateLimitExceededResponse(rateLimit, corsHeaders);
      }
    }

    // Get all users with integrations
    let usersQuery = supabase
      .from('integrations')
      .select('user_id')
      .eq('status', 'connected');
    
    if (targetUserId) {
      usersQuery = usersQuery.eq('user_id', targetUserId);
    }

    const { data: integrationUsers, error: usersError } = await usersQuery;
    
    if (usersError) throw usersError;

    const uniqueUserIds = [...new Set(integrationUsers?.map(i => i.user_id) || [])];
    
    console.log(`Processing ${uniqueUserIds.length} users for compliance drift check`);

    const results: any[] = [];
    const alertsCreated: any[] = [];

    for (const userId of uniqueUserIds) {
      // Get all collected resources for this user
      const { data: resources, error: resourcesError } = await supabase
        .from('integration_collected_data')
        .select('*')
        .eq('user_id', userId);

      if (resourcesError) {
        console.error(`Error fetching resources for user ${userId}:`, resourcesError);
        continue;
      }

      // Get last compliance check for comparison
      const { data: lastCheck } = await supabase
        .from('compliance_check_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousResults: Record<string, string> = {};
      if (lastCheck?.rules_results) {
        (lastCheck.rules_results as any[]).forEach((r: any) => {
          previousResults[r.ruleId] = r.status;
        });
      }

      // Process each rule
      const currentResults: any[] = [];
      const integrationsChecked = new Set<string>();
      let passingCount = 0;
      let failingCount = 0;
      const driftDetails: any[] = [];

      for (const rule of COMPLIANCE_RULES) {
        // Filter resources for this rule
        const relevantResources = resources?.filter(
          r => r.integration_name === rule.integrationId && r.resource_type === rule.resourceType
        ) || [];

        if (relevantResources.length === 0) continue;

        integrationsChecked.add(rule.integrationId);

        // Check which resources fail
        const failingResources = relevantResources.filter(r => rule.checkFn(r.resource_data));
        const status = failingResources.length > 0 ? 'fail' : 'pass';

        if (status === 'pass') passingCount++;
        else failingCount++;

        currentResults.push({
          ruleId: rule.id,
          title: rule.title,
          severity: rule.severity,
          status,
          affectedCount: failingResources.length,
          integration: rule.integrationId,
        });

        // Check for drift (pass → fail)
        const previousStatus = previousResults[rule.id];
        if (previousStatus === 'pass' && status === 'fail') {
          console.log(`Drift detected for rule ${rule.id}: pass → fail`);

          driftDetails.push({
            ruleId: rule.id,
            title: rule.title,
            previousStatus: 'pass',
            newStatus: 'fail',
          });

          // Calculate SLA deadline based on severity
          const SLA_HOURS: Record<string, number> = {
            critical: 24,
            high: 168,
            medium: 720,
            low: 2160,
          };
          const slaHours = SLA_HOURS[rule.severity] || 720;
          const remediationDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

          // Create compliance alert with SLA fields
          const { data: alertData, error: alertError } = await supabase
            .from('compliance_alerts')
            .insert({
              user_id: userId,
              rule_id: rule.id,
              rule_title: rule.title,
              previous_status: 'pass',
              new_status: 'fail',
              severity: rule.severity,
              integration_name: rule.integrationId,
              affected_resources: failingResources.length,
              affected_items: failingResources.map(r => r.resource_id || r.id).slice(0, 10),
              sla_hours: slaHours,
              remediation_deadline: remediationDeadline.toISOString(),
              metadata: {
                triggered_by: triggeredBy,
                check_timestamp: new Date().toISOString(),
              },
            })
            .select()
            .single();

          if (alertError) {
            console.error(`Error creating alert for rule ${rule.id}:`, alertError);
          } else {
            alertsCreated.push(alertData);

            // Create notification for user
            await supabase.rpc('create_notification', {
              p_user_id: userId,
              p_title: `⚠️ Alerta de Compliance: ${rule.title}`,
              p_message: `Um controle de segurança mudou de APROVADO para REPROVADO. ${failingResources.length} recurso(s) afetado(s).`,
              p_type: 'alert',
              p_priority: rule.severity === 'critical' ? 'urgent' : 'high',
              p_action_url: '/dashboard',
              p_action_label: 'Ver Detalhes',
              p_related_table: 'compliance_alerts',
              p_related_id: alertData.id,
              p_metadata: { rule_id: rule.id, severity: rule.severity },
            });
          }
        }
      }

      // Calculate score
      const totalTests = currentResults.length;
      const score = totalTests > 0 ? Math.round((passingCount / totalTests) * 100) : 100;

      // Save check history
      const { error: historyError } = await supabase
        .from('compliance_check_history')
        .insert({
          user_id: userId,
          check_type: 'automated',
          total_rules_checked: totalTests,
          passing_count: passingCount,
          failing_count: failingCount,
          risk_accepted_count: 0, // Would need to check risk_acceptances table
          score,
          integrations_checked: [...integrationsChecked],
          rules_results: currentResults,
          drift_detected: driftDetails.length > 0,
          drift_details: driftDetails,
          triggered_by: triggeredBy,
        });

      if (historyError) {
        console.error(`Error saving check history for user ${userId}:`, historyError);
      }

      // Log to system_audit_logs
      await supabase.from('system_audit_logs').insert({
        user_id: userId,
        action_type: 'compliance_check_completed',
        action_category: 'compliance',
        resource_type: 'compliance_check',
        description: `Verificação de compliance concluída: ${passingCount}/${totalTests} testes aprovados (${score}%)`,
        metadata: {
          score,
          passing: passingCount,
          failing: failingCount,
          integrations: [...integrationsChecked],
          drift_detected: driftDetails.length > 0,
        },
      });

      results.push({
        userId,
        score,
        passingCount,
        failingCount,
        totalTests,
        driftDetected: driftDetails.length > 0,
        alertsCreated: alertsCreated.filter(a => a.user_id === userId).length,
      });
    }

    console.log(`Compliance drift check completed. ${alertsCreated.length} alerts created.`);

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: uniqueUserIds.length,
        alertsCreated: alertsCreated.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-compliance-drift:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
