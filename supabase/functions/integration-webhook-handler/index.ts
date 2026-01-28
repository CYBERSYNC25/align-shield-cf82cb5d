/**
 * Integration Webhook Handler - Enhanced
 * 
 * Processa webhooks em tempo real de:
 * - GitHub (repository, push, member events)
 * - Slack (user, channel, app events)
 * - AWS CloudTrail (S3, IAM, EC2 events)
 * - Azure AD (user, group, policy events)
 * 
 * Features:
 * - Provider-specific HMAC-SHA256 signature validation
 * - Automatic event-to-compliance-rule mapping
 * - Targeted compliance checks (only affected resources)
 * - Real-time updates via Supabase Realtime
 * - Rate limiting per provider (Upstash Redis)
 * - Structured logging (production JSON, dev readable)
 * 
 * @endpoint POST /integration-webhook-handler
 * @auth Public (validates webhook signatures)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { 
  checkRateLimit, 
  rateLimitHeaders, 
  rateLimitExceededResponse 
} from '../_shared/rate-limiter.ts';
import { 
  validateWebhookSignature, 
  identifyProvider 
} from '../_shared/webhook-validators.ts';
import { 
  extractEventType, 
  mapEventToCompliance, 
  getHighestSeverity 
} from '../_shared/event-mapper.ts';
import { 
  runComplianceChecks, 
  calculateSlaDeadline 
} from '../_shared/compliance-rules.ts';
import { validateWebhookUrl } from '../_shared/ssrf-validator.ts';
import { secureGet } from '../_shared/secure-fetch.ts';

const logger = createLogger('WebhookHandler');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256, x-github-event, x-slack-signature, x-slack-request-timestamp, x-webhook-signature, x-webhook-provider, x-amz-sns-topic-arn, x-amz-sns-message-type, x-ms-webhook-validation',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limits per provider (requests per minute)
const PROVIDER_RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  github: { maxRequests: 100, windowSeconds: 60 },
  slack: { maxRequests: 50, windowSeconds: 60 },
  aws: { maxRequests: 200, windowSeconds: 60 },
  azure: { maxRequests: 50, windowSeconds: 60 },
  default: { maxRequests: 30, windowSeconds: 60 },
};

interface ProcessingResult {
  resourceUpdated: boolean;
  complianceRulesChecked: number;
  alertsCreated: number;
  realtimePublished: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const startTime = Date.now();
  let webhookId: string | null = null;
  
  try {
    // Read raw body for signature validation
    const rawBody = await req.text();
    let payload: any;
    
    try {
      payload = JSON.parse(rawBody);
    } catch {
      logger.error('Invalid JSON payload');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Identify provider from headers
    const provider = identifyProvider(req.headers);
    logger.info('Webhook received', { provider, contentLength: rawBody.length });
    
    // Rate limiting per provider
    const rateLimitConfig = PROVIDER_RATE_LIMITS[provider] || PROVIDER_RATE_LIMITS.default;
    const rateLimitResult = await checkRateLimit(
      provider, // Use provider as the identifier
      'integration-webhook-handler',
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowSeconds
    );
    
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { provider, remaining: rateLimitResult.remaining });
      return rateLimitExceededResponse(rateLimitResult, corsHeaders);
    }
    
    // Validate webhook signature
    const validationResult = await validateWebhookSignature(req.headers, rawBody, payload, provider);
    
    if (!validationResult.valid) {
      logger.warn('Signature validation failed', { 
        provider, 
        error: validationResult.error 
      });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid webhook signature',
          code: 'INVALID_SIGNATURE',
          provider,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle subscription confirmation (AWS SNS) with SSRF protection
    if (validationResult.isSubscriptionConfirmation && validationResult.subscribeUrl) {
      // Validate the subscription URL before fetching
      const ssrfCheck = validateWebhookUrl(validationResult.subscribeUrl, { allowHttp: true });
      if (!ssrfCheck.valid) {
        logger.error('SNS subscribe URL blocked by SSRF protection', { 
          url: validationResult.subscribeUrl,
          reason: ssrfCheck.blockedReason 
        });
        return new Response(
          JSON.stringify({ error: 'Invalid subscription URL', reason: ssrfCheck.blockedReason }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      logger.info('Confirming AWS SNS subscription');
      const result = await secureGet(validationResult.subscribeUrl, undefined, {
        timeoutMs: 10000,
        followRedirects: false,
        logAttempt: true,
        functionName: 'integration-webhook-handler',
      });
      
      if (!result.success) {
        logger.error('Failed to confirm SNS subscription', { error: result.error });
        return new Response(
          JSON.stringify({ error: 'Failed to confirm subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription confirmed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle validation request (Azure AD)
    if (validationResult.isValidationRequest && validationResult.validationToken) {
      logger.info('Responding to Azure AD validation');
      return new Response(validationResult.validationToken, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    
    logger.info('Signature validated', { provider });
    
    // Extract event type
    const eventType = extractEventType(provider, payload, req.headers);
    logger.info('Event extracted', { provider, eventType });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Map event to compliance rules and resource data
    const mappedEvent = mapEventToCompliance(provider, eventType, payload);
    
    let processingResult: ProcessingResult = {
      resourceUpdated: false,
      complianceRulesChecked: 0,
      alertsCreated: 0,
      realtimePublished: false,
    };
    
    if (mappedEvent) {
      logger.info('Event mapped', { 
        provider, 
        eventType, 
        resourceType: mappedEvent.resourceType,
        resourceId: mappedEvent.resourceId,
        complianceRules: mappedEvent.complianceRules,
      });
      
      // Get user ID from integration or use system user
      // In production, you'd look up the user based on the integration/org
      const { data: integration } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('provider', provider)
        .eq('status', 'connected')
        .limit(1)
        .single();
      
      const userId = integration?.user_id;
      
      if (userId) {
        // Update integration_collected_data
        const { error: upsertError } = await supabase
          .from('integration_collected_data')
          .upsert({
            user_id: userId,
            integration_name: provider,
            resource_type: mappedEvent.resourceType,
            resource_id: mappedEvent.resourceId,
            resource_data: mappedEvent.resourceData,
            collected_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,integration_name,resource_type,resource_id',
          });
        
        if (upsertError) {
          logger.error('Error upserting collected data', upsertError);
        } else {
          processingResult.resourceUpdated = true;
          logger.info('Resource updated', { 
            resourceType: mappedEvent.resourceType, 
            resourceId: mappedEvent.resourceId 
          });
        }
        
        // Run targeted compliance checks
        if (mappedEvent.complianceRules.length > 0) {
          const checkResults = runComplianceChecks(
            mappedEvent.complianceRules,
            mappedEvent.resourceId,
            mappedEvent.resourceData
          );
          
          processingResult.complianceRulesChecked = checkResults.length;
          
          // Create alerts for failed checks
          for (const result of checkResults) {
            if (!result.passed) {
              const slaDeadline = calculateSlaDeadline(result.severity);
              
              const { error: alertError } = await supabase
                .from('compliance_alerts')
                .insert({
                  user_id: userId,
                  integration_name: provider,
                  rule_id: result.ruleId,
                  rule_title: result.ruleName,
                  severity: result.severity,
                  previous_status: 'pass',
                  new_status: 'fail',
                  affected_resources: 1,
                  affected_items: [{ 
                    id: result.resourceId, 
                    type: mappedEvent.resourceType,
                    details: mappedEvent.resourceData 
                  }],
                  triggered_at: new Date().toISOString(),
                  remediation_deadline: slaDeadline.toISOString(),
                  sla_hours: result.slaHours,
                });
              
              if (alertError) {
                logger.error('Error creating alert', alertError);
              } else {
                processingResult.alertsCreated++;
                logger.warn('Drift detected', { 
                  ruleId: result.ruleId, 
                  severity: result.severity,
                  resourceId: result.resourceId,
                });
              }
            }
          }
        }
        
        // Create notification for critical/high severity events
        if (processingResult.alertsCreated > 0 && 
            ['critical', 'high'].includes(mappedEvent.severity)) {
          await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_title: `Alerta de Compliance: ${provider}`,
            p_message: mappedEvent.description,
            p_type: 'compliance_drift',
            p_priority: mappedEvent.severity,
            p_related_table: 'compliance_alerts',
            p_action_url: '/dashboard',
          });
        }
      }
    }
    
    // Log webhook to integration_webhooks table
    const { data: webhookRecord, error: webhookError } = await supabase
      .from('integration_webhooks')
      .insert({
        integration_name: provider,
        event_type: eventType,
        payload,
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (webhookError) {
      logger.error('Error logging webhook', webhookError);
    } else {
      webhookId = webhookRecord?.id;
      processingResult.realtimePublished = true; // INSERT triggers Realtime
    }
    
    // Update integration status
    await supabase
      .from('integration_status')
      .upsert({
        integration_name: provider,
        status: 'healthy',
        last_webhook_at: new Date().toISOString(),
        total_webhooks: 1, // Will be incremented via trigger/function
        health_score: 100,
      }, {
        onConflict: 'integration_name',
      });
    
    const processingTime = Date.now() - startTime;
    
    logger.info('Webhook processed successfully', {
      provider,
      eventType,
      webhookId,
      processingTimeMs: processingTime,
      ...processingResult,
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        webhook_id: webhookId,
        provider,
        event_type: eventType,
        processing: {
          resource_updated: processingResult.resourceUpdated,
          compliance_rules_checked: processingResult.complianceRulesChecked,
          alerts_created: processingResult.alertsCreated,
          realtime_published: processingResult.realtimePublished,
          processing_time_ms: processingTime,
        },
        rate_limit: {
          remaining: rateLimitResult.remaining,
          reset_at: rateLimitResult.resetAt,
        },
      }),
      { 
        headers: { 
          ...corsHeaders, 
          ...rateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    logger.error('Webhook processing error', error);
    
    // Try to log failed webhook
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase
        .from('integration_webhooks')
        .insert({
          integration_name: identifyProvider(req.headers),
          event_type: 'unknown',
          payload: {},
          status: 'failed',
          error_message: error.message || 'Unknown error',
          retry_count: 0,
        });
    } catch {
      // Ignore logging errors
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: 'Failed to process webhook',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
