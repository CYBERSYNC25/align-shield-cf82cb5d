/**
 * PII Sanitizer - Frontend Version
 * 
 * CRITICAL: Use this function for ALL logging operations.
 * Never log raw PII, tokens, credentials, or sensitive data.
 * 
 * LGPD/GDPR Compliant Masking:
 * - Email: jo***@example.com
 * - CPF: ***.456.789-**
 * - Phone: ***-**67
 * - IP: 192.168.***.***
 * - Token: sk_live_abc1****z789
 */

// Classification levels
export type ClassificationLevel = 'public' | 'internal' | 'confidential' | 'restricted';

// PII type identifiers
export type PiiType = 'email' | 'cpf' | 'cnpj' | 'phone' | 'ip' | 'ipv6' | 'token' | 'creditCard' | 'ssn' | 'name';

interface PiiPattern {
  regex: RegExp;
  mask: (value: string) => string;
}

// PII patterns with masking functions
const PII_PATTERNS: Record<string, PiiPattern> = {
  // Email: jo***@example.com
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    mask: (email: string): string => {
      const parts = email.split('@');
      if (parts.length !== 2 || !parts[0] || !parts[1]) return '[REDACTED_EMAIL]';
      const [local, domain] = parts;
      const masked = local.length > 2 ? local.substring(0, 2) + '***' : '***';
      return `${masked}@${domain}`;
    }
  },
  
  // CPF brasileiro: ***.456.789-**
  cpf: {
    regex: /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}\b/g,
    mask: (cpf: string): string => {
      const digits = cpf.replace(/\D/g, '');
      if (digits.length !== 11) return '[REDACTED_CPF]';
      return `***.${digits.substring(3, 6)}.${digits.substring(6, 9)}-**`;
    }
  },
  
  // CNPJ brasileiro: **.456.789/0001-**
  cnpj: {
    regex: /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[\/.\s]?\d{4}[-.\s]?\d{2}\b/g,
    mask: (cnpj: string): string => {
      const digits = cnpj.replace(/\D/g, '');
      if (digits.length !== 14) return '[REDACTED_CNPJ]';
      return `**.${digits.substring(2, 5)}.${digits.substring(5, 8)}/${digits.substring(8, 12)}-**`;
    }
  },
  
  // Phone: ***-**67
  phone: {
    regex: /\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}\b/g,
    mask: (phone: string): string => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 8) return '[REDACTED_PHONE]';
      return `***-**${digits.slice(-2)}`;
    }
  },
  
  // IPv4: 192.168.***.***
  ip: {
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    mask: (ip: string): string => {
      const parts = ip.split('.');
      if (parts.length !== 4) return '[REDACTED_IP]';
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  },
  
  // IPv6 (simplified - full redaction)
  ipv6: {
    regex: /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/g,
    mask: (): string => '[REDACTED_IPV6]'
  },
  
  // Tokens: sk_live_abc1****z789
  token: {
    regex: /\b(?:sk_live_|pk_live_|sk_test_|pk_test_|xox[baprs]-|ghp_|gho_|github_pat_)?[A-Za-z0-9_-]{20,}\b/gi,
    mask: (token: string): string => {
      if (token.length < 12) return '[REDACTED_TOKEN]';
      const prefixMatch = token.match(/^(sk_live_|pk_live_|sk_test_|pk_test_|xox[baprs]-|ghp_|gho_|github_pat_)/i);
      const prefix = prefixMatch ? prefixMatch[0] : '';
      const rest = token.substring(prefix.length);
      if (rest.length < 8) return `${prefix}[REDACTED]`;
      return `${prefix}${rest.substring(0, 4)}****${rest.slice(-4)}`;
    }
  },
  
  // Credit Card: ****-****-****-1234
  creditCard: {
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    mask: (cc: string): string => {
      const digits = cc.replace(/\D/g, '');
      if (digits.length < 15) return '[REDACTED_CARD]';
      return `****-****-****-${digits.slice(-4)}`;
    }
  },
  
  // SSN (US): ***-**-1234
  ssn: {
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    mask: (ssn: string): string => {
      const digits = ssn.replace(/\D/g, '');
      if (digits.length !== 9) return '[REDACTED_SSN]';
      return `***-**-${digits.slice(-4)}`;
    }
  }
};

// Fields that should NEVER be logged (restricted level)
const RESTRICTED_FIELDS = new Set([
  'password', 'senha', 'secret', 'token', 'key', 'credential', 'private_key',
  'access_token', 'refresh_token', 'api_key', 'apikey', 'authorization',
  'bearer', 'session_token', 'jwt', 'client_secret', 'webhook_secret',
  'encryption_key', 'signing_key', 'master_key', 'private', 'credentials',
  'configuration', 'key_hash', 'token_hash'
]);

// Fields with PII that need masking (confidential level)
const CONFIDENTIAL_FIELDS = new Set([
  'email', 'e-mail', 'mail', 'phone', 'telefone', 'mobile', 'celular',
  'cpf', 'cnpj', 'ssn', 'tax_id', 'rg', 'documento',
  'ip_address', 'ip', 'ip_addr', 'client_ip', 'remote_ip',
  'credit_card', 'card_number', 'numero_cartao', 'cvv', 'cvc',
  'bank_account', 'conta_bancaria', 'iban', 'swift',
  'passport', 'passaporte', 'national_id', 'identidade',
  'address', 'endereco', 'street', 'rua', 'cep', 'zip', 'postal',
  'birth_date', 'date_of_birth', 'dob', 'data_nascimento', 'nascimento',
  'user_agent'
]);

/**
 * Masks a single string value by detecting and redacting PII patterns
 */
export function maskPiiValue(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  let masked = value;
  
  for (const config of Object.values(PII_PATTERNS)) {
    masked = masked.replace(config.regex, (match) => config.mask(match));
  }
  
  return masked;
}

/**
 * Masks a specific type of PII value
 */
export function maskByType(value: string, piiType: PiiType): string {
  if (!value || typeof value !== 'string') return value;
  
  const pattern = PII_PATTERNS[piiType];
  if (!pattern) return maskPiiValue(value);
  
  return pattern.mask(value);
}

/**
 * Sanitizes an object for safe logging
 */
export function sanitizeForLogs(data: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    return maskPiiValue(data);
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (typeof data !== 'object') return String(data);
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogs(item, depth + 1));
  }
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');
    
    const isRestricted = RESTRICTED_FIELDS.has(lowerKey) || 
      Array.from(RESTRICTED_FIELDS).some(f => lowerKey.includes(f.replace(/[-_]/g, '')));
    
    if (isRestricted) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    const isConfidential = CONFIDENTIAL_FIELDS.has(lowerKey) ||
      Array.from(CONFIDENTIAL_FIELDS).some(f => lowerKey.includes(f.replace(/[-_]/g, '')));
    
    if (isConfidential) {
      if (typeof value === 'string') {
        sanitized[key] = maskPiiValue(value);
      } else if (value === null || value === undefined) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[REDACTED_PII]';
      }
      continue;
    }
    
    sanitized[key] = sanitizeForLogs(value, depth + 1);
  }
  
  return sanitized;
}

/**
 * Sanitizes a stack trace
 */
export function sanitizeStackTrace(stackTrace: string | undefined): string | undefined {
  if (!stackTrace) return stackTrace;
  return maskPiiValue(stackTrace);
}

/**
 * Creates a sanitized error object for logging
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: maskPiiValue(error.message),
      stack: sanitizeStackTrace(error.stack)
    };
  }
  
  if (typeof error === 'string') {
    return { message: maskPiiValue(error) };
  }
  
  if (typeof error === 'object' && error !== null) {
    return sanitizeForLogs(error) as Record<string, unknown>;
  }
  
  return { message: String(error) };
}

/**
 * Creates a safe log context
 */
export function createSafeLogContext(context: Record<string, unknown>): Record<string, unknown> {
  return sanitizeForLogs(context) as Record<string, unknown>;
}
