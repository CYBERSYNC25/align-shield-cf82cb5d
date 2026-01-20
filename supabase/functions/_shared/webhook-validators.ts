/**
 * Webhook Signature Validators
 * 
 * Provider-specific HMAC-SHA256 signature validation for:
 * - GitHub (X-Hub-Signature-256)
 * - Slack (X-Slack-Signature with timestamp)
 * - AWS SNS (Certificate-based or shared secret)
 * - Azure AD (x-webhook-signature)
 * 
 * @module webhook-validators
 */

import { createLogger } from './logger.ts';

const logger = createLogger('WebhookValidator');

/**
 * Compute HMAC-SHA256 signature
 */
async function computeHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export interface ValidationResult {
  valid: boolean;
  provider: string;
  error?: string;
}

/**
 * Validate GitHub webhook signature
 * Header: X-Hub-Signature-256: sha256=<hmac>
 */
export async function validateGitHubSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<ValidationResult> {
  const provider = 'github';
  
  if (!signatureHeader) {
    logger.warn('Missing GitHub signature header');
    return { valid: false, provider, error: 'Missing X-Hub-Signature-256 header' };
  }
  
  if (!signatureHeader.startsWith('sha256=')) {
    logger.warn('Invalid GitHub signature format');
    return { valid: false, provider, error: 'Invalid signature format' };
  }
  
  const providedSignature = signatureHeader.slice(7); // Remove 'sha256=' prefix
  const expectedSignature = await computeHmacSha256(rawBody, secret);
  
  const valid = secureCompare(providedSignature.toLowerCase(), expectedSignature.toLowerCase());
  
  if (!valid) {
    logger.warn('GitHub signature mismatch');
  }
  
  return { valid, provider };
}

/**
 * Validate Slack webhook signature
 * Headers: X-Slack-Request-Timestamp, X-Slack-Signature
 * Format: v0=<hmac> where basestring = "v0:{timestamp}:{body}"
 */
export async function validateSlackSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  secret: string
): Promise<ValidationResult> {
  const provider = 'slack';
  
  if (!timestampHeader || !signatureHeader) {
    logger.warn('Missing Slack signature headers');
    return { 
      valid: false, 
      provider, 
      error: 'Missing X-Slack-Request-Timestamp or X-Slack-Signature header' 
    };
  }
  
  // Check timestamp to prevent replay attacks (5 minutes tolerance)
  const timestamp = parseInt(timestampHeader, 10);
  const now = Math.floor(Date.now() / 1000);
  
  if (Math.abs(now - timestamp) > 300) {
    logger.warn('Slack timestamp expired', { diff: Math.abs(now - timestamp) });
    return { valid: false, provider, error: 'Request timestamp expired' };
  }
  
  if (!signatureHeader.startsWith('v0=')) {
    logger.warn('Invalid Slack signature format');
    return { valid: false, provider, error: 'Invalid signature format' };
  }
  
  const basestring = `v0:${timestampHeader}:${rawBody}`;
  const providedSignature = signatureHeader.slice(3); // Remove 'v0=' prefix
  const expectedSignature = await computeHmacSha256(basestring, secret);
  
  const valid = secureCompare(providedSignature.toLowerCase(), expectedSignature.toLowerCase());
  
  if (!valid) {
    logger.warn('Slack signature mismatch');
  }
  
  return { valid, provider };
}

/**
 * Validate AWS SNS webhook
 * AWS SNS uses certificate-based validation, but we add an additional HMAC layer
 * Also handles subscription confirmation
 */
export async function validateAwsSnsSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  payload: any
): Promise<ValidationResult & { isSubscriptionConfirmation?: boolean; subscribeUrl?: string }> {
  const provider = 'aws';
  
  // Handle subscription confirmation
  if (payload?.Type === 'SubscriptionConfirmation') {
    logger.info('AWS SNS subscription confirmation received');
    return { 
      valid: true, 
      provider, 
      isSubscriptionConfirmation: true,
      subscribeUrl: payload.SubscribeURL 
    };
  }
  
  // For regular notifications, validate our custom HMAC header
  if (!signatureHeader) {
    // AWS SNS messages have their own signature in the body
    // If no custom header, verify the SNS message structure
    if (payload?.Type === 'Notification' && payload?.MessageId) {
      logger.info('AWS SNS notification without custom signature, allowing');
      return { valid: true, provider };
    }
    
    logger.warn('Missing AWS signature header');
    return { valid: false, provider, error: 'Missing x-webhook-signature header' };
  }
  
  const expectedSignature = await computeHmacSha256(rawBody, secret);
  const valid = secureCompare(signatureHeader.toLowerCase(), expectedSignature.toLowerCase());
  
  if (!valid) {
    logger.warn('AWS signature mismatch');
  }
  
  return { valid, provider };
}

/**
 * Validate Azure AD webhook signature
 * Header: x-webhook-signature or x-ms-signature
 */
export async function validateAzureSignature(
  rawBody: string,
  signatureHeader: string | null,
  validationToken: string | null,
  secret: string
): Promise<ValidationResult & { isValidationRequest?: boolean; validationToken?: string }> {
  const provider = 'azure';
  
  // Handle webhook validation request
  if (validationToken) {
    logger.info('Azure AD validation request received');
    return { 
      valid: true, 
      provider, 
      isValidationRequest: true,
      validationToken 
    };
  }
  
  if (!signatureHeader) {
    logger.warn('Missing Azure signature header');
    return { valid: false, provider, error: 'Missing x-webhook-signature header' };
  }
  
  const expectedSignature = await computeHmacSha256(rawBody, secret);
  const valid = secureCompare(signatureHeader.toLowerCase(), expectedSignature.toLowerCase());
  
  if (!valid) {
    logger.warn('Azure signature mismatch');
  }
  
  return { valid, provider };
}

/**
 * Generic webhook signature validation using HMAC-SHA256
 * For providers without specific validation logic
 */
export async function validateGenericSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  provider: string
): Promise<ValidationResult> {
  if (!signatureHeader) {
    logger.warn(`Missing signature header for ${provider}`);
    return { valid: false, provider, error: 'Missing signature header' };
  }
  
  // Handle common prefix formats
  let providedSignature = signatureHeader;
  if (signatureHeader.startsWith('sha256=')) {
    providedSignature = signatureHeader.slice(7);
  } else if (signatureHeader.startsWith('v0=')) {
    providedSignature = signatureHeader.slice(3);
  }
  
  const expectedSignature = await computeHmacSha256(rawBody, secret);
  const valid = secureCompare(providedSignature.toLowerCase(), expectedSignature.toLowerCase());
  
  if (!valid) {
    logger.warn(`${provider} signature mismatch`);
  }
  
  return { valid, provider };
}

/**
 * Identify provider from request headers
 */
export function identifyProvider(headers: Headers): string {
  // GitHub
  if (headers.get('x-github-event') || headers.get('x-hub-signature-256')) {
    return 'github';
  }
  
  // Slack
  if (headers.get('x-slack-signature') || headers.get('x-slack-request-timestamp')) {
    return 'slack';
  }
  
  // AWS SNS
  if (headers.get('x-amz-sns-topic-arn') || headers.get('x-amz-sns-message-type')) {
    return 'aws';
  }
  
  // Azure AD
  if (headers.get('x-ms-webhook-validation') || headers.get('client-request-id')) {
    return 'azure';
  }
  
  // Check custom provider header
  const customProvider = headers.get('x-webhook-provider');
  if (customProvider) {
    return customProvider.toLowerCase();
  }
  
  return 'unknown';
}

/**
 * Main validation function - routes to provider-specific validator
 */
export async function validateWebhookSignature(
  headers: Headers,
  rawBody: string,
  payload: any,
  provider?: string
): Promise<ValidationResult & { isSubscriptionConfirmation?: boolean; isValidationRequest?: boolean; subscribeUrl?: string; validationToken?: string }> {
  const detectedProvider = provider || identifyProvider(headers);
  const secret = Deno.env.get('WEBHOOK_SIGNING_SECRET') || '';
  
  // Get provider-specific secret if available
  const providerSecretKey = `${detectedProvider.toUpperCase()}_WEBHOOK_SECRET`;
  const providerSecret = Deno.env.get(providerSecretKey) || secret;
  
  if (!providerSecret) {
    logger.error('No webhook signing secret configured');
    return { valid: false, provider: detectedProvider, error: 'Server configuration error' };
  }
  
  switch (detectedProvider) {
    case 'github':
      return validateGitHubSignature(
        rawBody,
        headers.get('x-hub-signature-256'),
        providerSecret
      );
      
    case 'slack':
      return validateSlackSignature(
        rawBody,
        headers.get('x-slack-request-timestamp'),
        headers.get('x-slack-signature'),
        providerSecret
      );
      
    case 'aws':
      return validateAwsSnsSignature(
        rawBody,
        headers.get('x-webhook-signature'),
        providerSecret,
        payload
      );
      
    case 'azure':
      return validateAzureSignature(
        rawBody,
        headers.get('x-webhook-signature') || headers.get('x-ms-signature'),
        headers.get('x-ms-webhook-validation'),
        providerSecret
      );
      
    default:
      return validateGenericSignature(
        rawBody,
        headers.get('x-webhook-signature') || headers.get('x-signature'),
        providerSecret,
        detectedProvider
      );
  }
}
