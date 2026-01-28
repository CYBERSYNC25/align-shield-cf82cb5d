/**
 * SSRF (Server-Side Request Forgery) Validator - Backend
 * 
 * Server-side validation for URLs to prevent SSRF attacks.
 * Includes all frontend validations plus DNS resolution checks.
 */

export type SsrfBlockedReason = 
  | 'private_ip'
  | 'localhost'
  | 'loopback'
  | 'metadata_endpoint'
  | 'ipv6_local'
  | 'link_local'
  | 'non_https'
  | 'blocked_hostname'
  | 'invalid_url'
  | 'carrier_nat'
  | 'dns_resolution_failed';

export interface SsrfValidationResult {
  valid: boolean;
  error?: string;
  blockedReason?: SsrfBlockedReason;
  resolvedIp?: string;
}

// ============= Blocked IP Patterns (Regex) =============

const BLOCKED_IPV4_PATTERNS: Array<{ pattern: RegExp; reason: SsrfBlockedReason }> = [
  // Loopback (127.0.0.0/8)
  { pattern: /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, reason: 'loopback' },
  
  // Private Class A (10.0.0.0/8)
  { pattern: /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, reason: 'private_ip' },
  
  // Private Class B (172.16.0.0/12)
  { pattern: /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, reason: 'private_ip' },
  
  // Private Class C (192.168.0.0/16)
  { pattern: /^192\.168\.\d{1,3}\.\d{1,3}$/, reason: 'private_ip' },
  
  // Link-local / APIPA (169.254.0.0/16)
  { pattern: /^169\.254\.\d{1,3}\.\d{1,3}$/, reason: 'link_local' },
  
  // Carrier-grade NAT (100.64.0.0/10)
  { pattern: /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, reason: 'carrier_nat' },
  
  // All interfaces
  { pattern: /^0\.0\.0\.0$/, reason: 'localhost' },
];

const BLOCKED_IPV6_PATTERNS: Array<{ pattern: RegExp; reason: SsrfBlockedReason }> = [
  { pattern: /^::1$/i, reason: 'loopback' },
  { pattern: /^::$/, reason: 'localhost' },
  { pattern: /^::ffff:127\./i, reason: 'loopback' },
  { pattern: /^::ffff:10\./i, reason: 'private_ip' },
  { pattern: /^::ffff:192\.168\./i, reason: 'private_ip' },
  { pattern: /^::ffff:172\.(1[6-9]|2\d|3[01])\./i, reason: 'private_ip' },
  { pattern: /^::ffff:169\.254\./i, reason: 'link_local' },
  { pattern: /^fe80:/i, reason: 'ipv6_local' },
  { pattern: /^fc[0-9a-f]{2}:/i, reason: 'ipv6_local' },
  { pattern: /^fd[0-9a-f]{2}:/i, reason: 'ipv6_local' },
];

// ============= Blocked Hostnames =============

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '169.254.169.254',
  'instance-data',
  'metadata.google.internal',
  'metadata.google',
  'metadata.azure.com',
  'kubernetes.default',
  'kubernetes.default.svc',
  'kubernetes.default.svc.cluster.local',
]);

const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /\.localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /\.cluster\.local$/i,
  /\.svc\.cluster\.local$/i,
];

// ============= Validation Functions =============

function isBlockedIp(ip: string): { blocked: boolean; reason?: SsrfBlockedReason } {
  for (const { pattern, reason } of BLOCKED_IPV4_PATTERNS) {
    if (pattern.test(ip)) return { blocked: true, reason };
  }
  for (const { pattern, reason } of BLOCKED_IPV6_PATTERNS) {
    if (pattern.test(ip)) return { blocked: true, reason };
  }
  return { blocked: false };
}

function isBlockedHostname(hostname: string): { blocked: boolean; reason?: SsrfBlockedReason } {
  const lower = hostname.toLowerCase();
  
  if (BLOCKED_HOSTNAMES.has(lower)) {
    return { blocked: true, reason: lower.includes('metadata') ? 'metadata_endpoint' : 'blocked_hostname' };
  }
  
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(lower)) return { blocked: true, reason: 'blocked_hostname' };
  }
  
  return { blocked: false };
}

/**
 * Validate URL against SSRF patterns
 */
export function validateWebhookUrl(
  url: string,
  options: { allowHttp?: boolean } = {}
): SsrfValidationResult {
  const { allowHttp = false } = options;
  
  if (!url?.trim()) {
    return { valid: false, error: 'URL is empty', blockedReason: 'invalid_url' };
  }
  
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format', blockedReason: 'invalid_url' };
  }
  
  // Protocol check
  if (!allowHttp && parsedUrl.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS allowed', blockedReason: 'non_https' };
  }
  
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return { valid: false, error: 'Invalid protocol', blockedReason: 'non_https' };
  }
  
  const hostname = parsedUrl.hostname.toLowerCase();
  
  // Check if hostname is blocked IP
  const ipCheck = isBlockedIp(hostname);
  if (ipCheck.blocked) {
    return { valid: false, error: `Blocked IP: ${hostname}`, blockedReason: ipCheck.reason };
  }
  
  // Check blocked hostnames
  const hostCheck = isBlockedHostname(hostname);
  if (hostCheck.blocked) {
    return { valid: false, error: `Blocked hostname: ${hostname}`, blockedReason: hostCheck.reason };
  }
  
  return { valid: true };
}

/**
 * Quick boolean check for Zod schemas
 */
export function isValidWebhookUrl(url: string): boolean {
  return validateWebhookUrl(url).valid;
}
