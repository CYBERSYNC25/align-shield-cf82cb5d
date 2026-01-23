import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  include_activity_logs?: boolean;
}

// Campos sensíveis que devem ser removidos da exportação
const SENSITIVE_FIELDS = [
  'configuration', 'credentials', 'access_token', 'refresh_token',
  'api_key', 'secret_key', 'password', 'token', 'private_key',
  'client_secret', 'webhook_secret'
];

function removeSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => removeSensitiveData(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        cleaned[key] = '[REDACTED]';
      } else {
        cleaned[key] = removeSensitiveData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Cliente com permissões do usuário para autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente com service role para buscar todos os dados
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: ExportRequest = await req.json().catch(() => ({}));
    const includeActivityLogs = body.include_activity_logs ?? true;

    console.log(`Starting data export for user ${user.id}`);

    // Criar registro de exportação
    const { data: exportRequest, error: exportError } = await adminClient
      .from('data_export_requests')
      .insert({
        user_id: user.id,
        request_type: 'export',
        status: 'processing',
        metadata: { include_activity_logs: includeActivityLogs }
      })
      .select()
      .single();

    if (exportError) {
      console.error('Error creating export request:', exportError);
      throw new Error('Failed to create export request');
    }

    // Buscar profile e org_id
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const orgId = profile?.org_id;

    // Buscar dados de todas as tabelas relevantes
    const exportData: Record<string, any> = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
        organization_id: orgId,
        lgpd_compliance: true,
        format_version: "1.0",
        export_request_id: exportRequest.id
      }
    };

    // Profile
    exportData.profile = removeSensitiveData(profile);

    // Organization
    if (orgId) {
      const { data: org } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      exportData.organization = removeSensitiveData(org);
    }

    // User Roles
    const { data: userRoles } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
    exportData.user_roles = userRoles || [];

    // Frameworks
    const { data: frameworks } = await adminClient
      .from('frameworks')
      .select('*')
      .eq('user_id', user.id);
    exportData.frameworks = frameworks || [];

    // Controls
    const { data: controls } = await adminClient
      .from('controls')
      .select('*')
      .eq('user_id', user.id);
    exportData.controls = controls || [];

    // Control Tests
    const { data: controlTests } = await adminClient
      .from('control_tests')
      .select('*')
      .eq('user_id', user.id);
    exportData.control_tests = controlTests || [];

    // Compliance Alerts
    const { data: alerts } = await adminClient
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', user.id);
    exportData.compliance_alerts = alerts || [];

    // Risks
    const { data: risks } = await adminClient
      .from('risks')
      .select('*')
      .eq('user_id', user.id);
    exportData.risks = risks || [];

    // Risk Assessments
    const { data: riskAssessments } = await adminClient
      .from('risk_assessments')
      .select('*')
      .eq('user_id', user.id);
    exportData.risk_assessments = riskAssessments || [];

    // Risk Acceptances
    const { data: riskAcceptances } = await adminClient
      .from('risk_acceptances')
      .select('*')
      .eq('user_id', user.id);
    exportData.risk_acceptances = riskAcceptances || [];

    // Vendors
    const { data: vendors } = await adminClient
      .from('vendors')
      .select('*')
      .eq('user_id', user.id);
    exportData.vendors = vendors || [];

    // Audits
    const { data: audits } = await adminClient
      .from('audits')
      .select('*')
      .eq('user_id', user.id);
    exportData.audits = audits || [];

    // Evidence
    const { data: evidence } = await adminClient
      .from('evidence')
      .select('*')
      .eq('user_id', user.id);
    exportData.evidence = evidence || [];

    // Policies
    const { data: policies } = await adminClient
      .from('policies')
      .select('*')
      .eq('user_id', user.id);
    exportData.policies = policies || [];

    // Tasks
    const { data: tasks } = await adminClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    exportData.tasks = tasks || [];

    // Incidents
    const { data: incidents } = await adminClient
      .from('incidents')
      .select('*')
      .eq('user_id', user.id);
    exportData.incidents = incidents || [];

    // Incident Playbooks
    const { data: playbooks } = await adminClient
      .from('incident_playbooks')
      .select('*')
      .eq('user_id', user.id);
    exportData.incident_playbooks = playbooks || [];

    // BCP Plans
    const { data: bcpPlans } = await adminClient
      .from('bcp_plans')
      .select('*')
      .eq('user_id', user.id);
    exportData.bcp_plans = bcpPlans || [];

    // Integrations (sem credenciais)
    const { data: integrations } = await adminClient
      .from('integrations')
      .select('id, user_id, provider, name, status, last_sync_at, created_at, updated_at')
      .eq('user_id', user.id);
    exportData.integrations = integrations || [];

    // Integration Status
    const { data: integrationStatus } = await adminClient
      .from('integration_status')
      .select('*')
      .eq('user_id', user.id);
    exportData.integration_status = removeSensitiveData(integrationStatus) || [];

    // Collected Data
    const { data: collectedData } = await adminClient
      .from('integration_collected_data')
      .select('*')
      .eq('user_id', user.id);
    exportData.collected_resources = removeSensitiveData(collectedData) || [];

    // Notifications
    const { data: notifications } = await adminClient
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);
    exportData.notifications = notifications || [];

    // Security Questionnaires
    const { data: questionnaires } = await adminClient
      .from('security_questionnaires')
      .select('*')
      .eq('user_id', user.id);
    exportData.security_questionnaires = questionnaires || [];

    // Questionnaire Questions
    if (questionnaires && questionnaires.length > 0) {
      const questionnaireIds = questionnaires.map(q => q.id);
      const { data: questions } = await adminClient
        .from('questionnaire_questions')
        .select('*')
        .in('questionnaire_id', questionnaireIds);
      exportData.questionnaire_questions = questions || [];
    }

    // Activity Logs (opcional)
    if (includeActivityLogs) {
      const { data: auditLogs } = await adminClient
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      exportData.activity_logs = auditLogs || [];
    }

    // Calcular total de registros
    let totalRecords = 0;
    for (const [key, value] of Object.entries(exportData)) {
      if (key !== 'export_metadata' && Array.isArray(value)) {
        totalRecords += value.length;
      } else if (key !== 'export_metadata' && value) {
        totalRecords += 1;
      }
    }
    exportData.export_metadata.total_records = totalRecords;

    // Gerar JSON
    const jsonContent = JSON.stringify(exportData, null, 2);
    const fileName = `${user.id}/export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // Upload para Storage
    const { error: uploadError } = await adminClient.storage
      .from('data-exports')
      .upload(fileName, jsonContent, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading export:', uploadError);
      await adminClient
        .from('data_export_requests')
        .update({ 
          status: 'failed', 
          error_message: uploadError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', exportRequest.id);
      throw new Error('Failed to upload export file');
    }

    // Gerar URL assinada (24 horas)
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from('data-exports')
      .createSignedUrl(fileName, 60 * 60 * 24); // 24 hours

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
    }

    const fileUrl = signedUrlData?.signedUrl || null;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Atualizar status para completed
    await adminClient
      .from('data_export_requests')
      .update({ 
        status: 'completed',
        file_url: fileUrl,
        expires_at: expiresAt,
        completed_at: new Date().toISOString(),
        metadata: {
          ...exportRequest.metadata,
          total_records: totalRecords,
          file_name: fileName
        }
      })
      .eq('id', exportRequest.id);

    console.log(`Export completed for user ${user.id}: ${totalRecords} records`);

    return new Response(
      JSON.stringify({
        success: true,
        export_id: exportRequest.id,
        download_url: fileUrl,
        expires_at: expiresAt,
        total_records: totalRecords,
        message: 'Exportação concluída com sucesso. O link expira em 24 horas.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Error in export-user-data:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
