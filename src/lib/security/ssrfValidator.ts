/**
 * SSRF (Server-Side Request Forgery) Validator
 * 
 * Validates URLs to prevent SSRF attacks by blocking:
 * - Private IP ranges (RFC 1918)
 * - Localhost and loopback addresses
 * - IPv6 local/link-local addresses
 * - Cloud metadata endpoints (AWS, GCP, Azure)
 * - Kubernetes internal DNS
 * - Non-HTTPS protocols
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
  | 'carrier_nat';

export interface SsrfValidationResult {
  valid: boolean;
  error?: string;
  blockedReason?: SsrfBlockedReason;
}

// ============= Blocked IP Patterns (Regex) =============

const BLOCKED_IPV4_PATTERNS: Array<{ pattern: RegExp; reason: SsrfBlockedReason; description: string }> = [
  // Loopback (127.0.0.0/8)
  { pattern: /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, reason: 'loopback', description: 'IPv4 loopback range' },
  
  // Private Class A (10.0.0.0/8)
  { pattern: /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, reason: 'private_ip', description: 'Private Class A' },
  
  // Private Class B (172.16.0.0/12)
  { pattern: /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, reason: 'private_ip', description: 'Private Class B' },
  
  // Private Class C (192.168.0.0/16)
  { pattern: /^192\.168\.\d{1,3}\.\d{1,3}$/, reason: 'private_ip', description: 'Private Class C' },
  
  // Link-local / APIPA (169.254.0.0/16) - includes AWS/Azure metadata
  { pattern: /^169\.254\.\d{1,3}\.\d{1,3}$/, reason: 'link_local', description: 'Link-local / Cloud metadata' },
  
  // Carrier-grade NAT (100.64.0.0/10)
  { pattern: /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, reason: 'carrier_nat', description: 'Carrier-grade NAT' },
  
  // All interfaces
  { pattern: /^0\.0\.0\.0$/, reason: 'localhost', description: 'All interfaces' },
];

const BLOCKED_IPV6_PATTERNS: Array<{ pattern: RegExp; reason: SsrfBlockedReason; description: string }> = [
  // Loopback (::1)
  { pattern: /^::1$/i, reason: 'loopback', description: 'IPv6 loopback' },
  
  // Unspecified (::)
  { pattern: /^::$/, reason: 'localhost', description: 'IPv6 unspecified' },
  
  // IPv4-mapped loopback (::ffff:127.x.x.x)
  { pattern: /^::ffff:127\./i, reason: 'loopback', description: 'IPv4-mapped loopback' },
  
  // IPv4-mapped private Class A (::ffff:10.x.x.x)
  { pattern: /^::ffff:10\./i, reason: 'private_ip', description: 'IPv4-mapped Class A' },
  
  // IPv4-mapped private Class C (::ffff:192.168.x.x)
  { pattern: /^::ffff:192\.168\./i, reason: 'private_ip', description: 'IPv4-mapped Class C' },
  
  // IPv4-mapped private Class B (::ffff:172.16-31.x.x)
  { pattern: /^::ffff:172\.(1[6-9]|2\d|3[01])\./i, reason: 'private_ip', description: 'IPv4-mapped Class B' },
  
  // IPv4-mapped link-local (::ffff:169.254.x.x)
  { pattern: /^::ffff:169\.254\./i, reason: 'link_local', description: 'IPv4-mapped link-local' },
  
  // Link-local (fe80::/10)
  { pattern: /^fe80:/i, reason: 'ipv6_local', description: 'IPv6 link-local' },
  
  // Unique local - fc00::/7 (fc00:: and fd00::)
  { pattern: /^fc[0-9a-f]{2}:/i, reason: 'ipv6_local', description: 'IPv6 unique local (fc)' },
  { pattern: /^fd[0-9a-f]{2}:/i, reason: 'ipv6_local', description: 'IPv6 unique local (fd)' },
];

// ============= Blocked Hostnames =============

const BLOCKED_HOSTNAMES: Array<{ hostname: string; reason: SsrfBlockedReason; description: string }> = [
  // Localhost variants
  { hostname: 'localhost', reason: 'localhost', description: 'Localhost' },
  
  // AWS metadata endpoints
  { hostname: '169.254.169.254', reason: 'metadata_endpoint', description: 'AWS/Azure metadata IP' },
  { hostname: 'instance-data', reason: 'metadata_endpoint', description: 'AWS metadata alias' },
  
  // GCP metadata endpoints
  { hostname: 'metadata.google.internal', reason: 'metadata_endpoint', description: 'GCP metadata' },
  { hostname: 'metadata.google', reason: 'metadata_endpoint', description: 'GCP metadata alias' },
  
  // Azure metadata endpoints
  { hostname: 'metadata.azure.com', reason: 'metadata_endpoint', description: 'Azure metadata' },
  
  // Kubernetes internal DNS
  { hostname: 'kubernetes.default', reason: 'blocked_hostname', description: 'Kubernetes default' },
  { hostname: 'kubernetes.default.svc', reason: 'blocked_hostname', description: 'Kubernetes default SVC' },
  { hostname: 'kubernetes.default.svc.cluster.local', reason: 'blocked_hostname', description: 'Kubernetes cluster local' },
];

// Patterns for wildcard hostname matching
const BLOCKED_HOSTNAME_PATTERNS: Array<{ pattern: RegExp; reason: SsrfBlockedReason; description: string }> = [
  // *.localhost
  { pattern: /\.localhost$/i, reason: 'localhost', description: 'Localhost subdomain' },
  
  // *.local (mDNS)
  { pattern: /\.local$/i, reason: 'blocked_hostname', description: 'mDNS local domain' },
  
  // *.internal (internal networks)
  { pattern: /\.internal$/i, reason: 'blocked_hostname', description: 'Internal domain' },
  
  // *.cluster.local (Kubernetes)
  { pattern: /\.cluster\.local$/i, reason: 'blocked_hostname', description: 'Kubernetes cluster' },
  
  // *.svc.cluster.local (Kubernetes services)
  { pattern: /\.svc\.cluster\.local$/i, reason: 'blocked_hostname', description: 'Kubernetes services' },
];

// ============= Validation Functions =============

/**
 * Check if hostname matches blocked IP patterns
 */
function isBlockedIp(hostname: string): { blocked: boolean; reason?: SsrfBlockedReason; description?: string } {
  // Check IPv4 patterns
  for (const { pattern, reason, description } of BLOCKED_IPV4_PATTERNS) {
    if (pattern.test(hostname)) {
      return { blocked: true, reason, description };
    }
  }
  
  // Check IPv6 patterns
  for (const { pattern, reason, description } of BLOCKED_IPV6_PATTERNS) {
    if (pattern.test(hostname)) {
      return { blocked: true, reason, description };
    }
  }
  
  return { blocked: false };
}

/**
 * Check if hostname is in blocked list
 */
function isBlockedHostname(hostname: string): { blocked: boolean; reason?: SsrfBlockedReason; description?: string } {
  const lowerHostname = hostname.toLowerCase();
  
  // Check exact matches
  for (const { hostname: blocked, reason, description } of BLOCKED_HOSTNAMES) {
    if (lowerHostname === blocked.toLowerCase()) {
      return { blocked: true, reason, description };
    }
  }
  
  // Check wildcard patterns
  for (const { pattern, reason, description } of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(lowerHostname)) {
      return { blocked: true, reason, description };
    }
  }
  
  return { blocked: false };
}

/**
 * Validate a URL against SSRF attack patterns
 * 
 * @param url - The URL to validate
 * @param options - Validation options
 * @returns Validation result with success/failure and reason
 */
export function validateWebhookUrl(
  url: string,
  options: { allowHttp?: boolean } = {}
): SsrfValidationResult {
  const { allowHttp = false } = options;
  
  // Trim and validate basic format
  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return {
      valid: false,
      error: 'URL is empty',
      blockedReason: 'invalid_url',
    };
  }
  
  // Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
      blockedReason: 'invalid_url',
    };
  }
  
  // Protocol validation - only HTTPS allowed (unless explicitly allowed)
  if (!allowHttp && parsedUrl.protocol !== 'https:') {
    return {
      valid: false,
      error: 'Only HTTPS URLs are allowed',
      blockedReason: 'non_https',
    };
  }
  
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return {
      valid: false,
      error: 'Invalid protocol - only HTTP/HTTPS allowed',
      blockedReason: 'non_https',
    };
  }
  
  const hostname = parsedUrl.hostname.toLowerCase();
  
  // Check if hostname is a blocked IP
  const ipCheck = isBlockedIp(hostname);
  if (ipCheck.blocked) {
    return {
      valid: false,
      error: `Blocked IP: ${ipCheck.description}`,
      blockedReason: ipCheck.reason,
    };
  }
  
  // Check if hostname is in blocked list
  const hostnameCheck = isBlockedHostname(hostname);
  if (hostnameCheck.blocked) {
    return {
      valid: false,
      error: `Blocked hostname: ${hostnameCheck.description}`,
      blockedReason: hostnameCheck.reason,
    };
  }
  
  // All checks passed
  return { valid: true };
}

/**
 * Quick validation function for use in Zod schemas
 */
export function isValidWebhookUrl(url: string): boolean {
  return validateWebhookUrl(url).valid;
}

/**
 * Get human-readable error message for SSRF validation failure
 */
export function getSsrfErrorMessage(result: SsrfValidationResult): string {
  if (result.valid) return '';
  
  const reasonMessages: Record<SsrfBlockedReason, string> = {
    private_ip: 'URL aponta para um IP privado (rede interna)',
    localhost: 'URL aponta para localhost',
    loopback: 'URL aponta para endereço de loopback',
    metadata_endpoint: 'URL aponta para endpoint de metadados de cloud (AWS/GCP/Azure)',
    ipv6_local: 'URL aponta para endereço IPv6 local',
    link_local: 'URL aponta para endereço link-local',
    non_https: 'Apenas URLs HTTPS são permitidas',
    blocked_hostname: 'Hostname bloqueado por política de segurança',
    invalid_url: 'URL inválida',
    carrier_nat: 'URL aponta para IP de Carrier-grade NAT',
  };
  
  return result.blockedReason 
    ? reasonMessages[result.blockedReason] 
    : result.error || 'URL bloqueada por política de segurança';
}
