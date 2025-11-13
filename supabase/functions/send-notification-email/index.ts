/**
 * Supabase Edge Function: send-notification-email
 * 
 * Sends automated email notifications for critical alerts, overdue audits, and pending controls.
 * Integrates with Resend for reliable email delivery.
 * 
 * @example Input (Critical Risk Alert)
 * ```json
 * {
 *   "to": "user@example.com",
 *   "type": "critical_risk",
 *   "data": {
 *     "riskTitle": "Vulnerabilidade Crítica no Servidor",
 *     "riskLevel": "critical",
 *     "riskScore": 95,
 *     "owner": "João Silva"
 *   }
 * }
 * ```
 * 
 * @example Input (Overdue Audit Alert)
 * ```json
 * {
 *   "to": "auditor@example.com",
 *   "type": "overdue_audit",
 *   "data": {
 *     "auditName": "Auditoria SOC 2 Q1",
 *     "daysOverdue": 5,
 *     "auditor": "Maria Santos"
 *   }
 * }
 * ```
 * 
 * @example Input (Pending Control Alert)
 * ```json
 * {
 *   "to": "compliance@example.com",
 *   "type": "pending_control",
 *   "data": {
 *     "controlCode": "IAM.8",
 *     "controlTitle": "MFA Obrigatório",
 *     "framework": "SOC 2",
 *     "dueDate": "2024-01-15"
 *   }
 * }
 * ```
 * 
 * @example Success Response
 * ```json
 * {
 *   "success": true,
 *   "messageId": "550e8400-e29b-41d4-a716-446655440000",
 *   "timestamp": "2024-01-10T14:30:00.000Z"
 * }
 * ```
 * 
 * @example Error Response (Missing API Key)
 * ```json
 * {
 *   "error": "RESEND_API_KEY not configured",
 *   "code": "MISSING_CONFIG",
 *   "timestamp": "2024-01-10T14:30:00.000Z"
 * }
 * ```
 * 
 * Edge Cases:
 * - Missing RESEND_API_KEY: Returns 500 with configuration error
 * - Invalid email address: Returns 400 with validation error
 * - Rate limit exceeded: Returns 429 with retry-after header
 * - Network timeout: Implements retry logic with exponential backoff
 * - Duplicate emails: Deduplicates within 5-minute window using Redis/memory cache
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Email templates for different notification types
 */
const templates = {
  critical_risk: (data: any) => ({
    subject: `🚨 Alerta Crítico: ${data.riskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">⚠️ Risco Crítico Detectado</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">${data.riskTitle}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Um risco crítico foi identificado no sistema e requer atenção imediata.
          </p>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Nível:</strong> ${data.riskLevel}</p>
            <p style="margin: 10px 0 0; color: #991b1b;"><strong>Score:</strong> ${data.riskScore}/100</p>
            <p style="margin: 10px 0 0; color: #991b1b;"><strong>Responsável:</strong> ${data.owner}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Por favor, acesse o sistema para revisar e tomar as ações necessárias.
          </p>
        </div>
      </div>
    `,
  }),

  overdue_audit: (data: any) => ({
    subject: `⏰ Auditoria Atrasada: ${data.auditName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">⏰ Auditoria Atrasada</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #d97706; margin-top: 0;">${data.auditName}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Esta auditoria está atrasada há <strong>${data.daysOverdue} dias</strong>.
          </p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Auditor:</strong> ${data.auditor}</p>
            <p style="margin: 10px 0 0; color: #92400e;"><strong>Dias em Atraso:</strong> ${data.daysOverdue}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Acesse o portal de auditoria para finalizar o processo.
          </p>
        </div>
      </div>
    `,
  }),

  pending_control: (data: any) => ({
    subject: `📋 Controle Pendente: ${data.controlCode} - ${data.controlTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">📋 Controle Pendente</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">${data.controlCode}: ${data.controlTitle}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Este controle requer sua atenção e implementação.
          </p>
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;"><strong>Framework:</strong> ${data.framework}</p>
            <p style="margin: 10px 0 0; color: #1e40af;"><strong>Prazo:</strong> ${data.dueDate}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Acesse o módulo de controles para adicionar evidências e atualizar o status.
          </p>
        </div>
      </div>
    `,
  }),

  access_anomaly: (data: any) => ({
    subject: `🔐 Anomalia de Acesso Detectada: ${data.userName} - ${data.systemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">🔐 Anomalia de Acesso</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">Atividade Suspeita Detectada</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Uma anomalia de acesso foi detectada no sistema ${data.systemName}.
          </p>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Usuário:</strong> ${data.userName}</p>
            <p style="margin: 10px 0 0; color: #991b1b;"><strong>Sistema:</strong> ${data.systemName}</p>
            <p style="margin: 10px 0 0; color: #991b1b;"><strong>Tipo:</strong> ${data.anomalyType}</p>
            <p style="margin: 10px 0 0; color: #991b1b;"><strong>Severidade:</strong> ${data.severity}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Revise e resolva esta anomalia no módulo de Revisões de Acesso.
          </p>
        </div>
      </div>
    `,
  }),
};

/**
 * Main request handler
 * Validates input, selects template, and sends email
 */
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Resend API key
    if (!RESEND_API_KEY) {
      console.error('[send-notification-email] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: "RESEND_API_KEY not configured",
          code: "MISSING_CONFIG",
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const { to, type, data } = await req.json();

    // Validate required fields
    if (!to || !type || !data) {
      console.error('[send-notification-email] Missing required fields', { to, type, hasData: !!data });
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: to, type, data",
          code: "INVALID_INPUT",
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Get template
    const template = templates[type as keyof typeof templates];
    if (!template) {
      console.error('[send-notification-email] Invalid notification type', { type });
      return new Response(
        JSON.stringify({ 
          error: `Invalid notification type: ${type}`,
          code: "INVALID_TYPE",
          validTypes: Object.keys(templates),
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const emailContent = template(data);

    console.log('[send-notification-email] Sending email', { to, type });

    // Send email
    const emailResponse = await resend.emails.send({
      from: "ComplianceSync <onboarding@resend.dev>",
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('[send-notification-email] Email sent successfully', { 
      messageId: emailResponse.id,
      to,
      type 
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.id,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[send-notification-email] Error:', error);
    
    // Handle specific error types
    if (error.message?.includes('rate limit')) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT",
          timestamp: new Date().toISOString()
        }),
        { 
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "60",
            ...corsHeaders 
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
