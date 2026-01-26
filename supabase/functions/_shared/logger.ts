/**
 * Sistema de Logging Estruturado - Edge Functions (Deno)
 * 
 * Funcionalidades:
 * - Logs estruturados em JSON para produção
 * - Formatação legível em desenvolvimento
 * - Contexto automático (function name, timestamp)
 * - warn e error sempre logados (ambos os ambientes)
 * - Sanitização automática de PII (LGPD/GDPR)
 */

import { sanitizeForLogs, sanitizeError as sanitizePiiError } from './pii-sanitizer.ts';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

class EdgeLogger {
  private context: string;
  private isProd: boolean;

  constructor(context: string = 'EdgeFunction') {
    this.context = context;
    this.isProd = Deno.env.get('ENVIRONMENT') === 'production';
  }

  private formatLog(level: LogLevel, message: string, data?: unknown): LogEntry {
    // Always sanitize data before logging
    const sanitizedData = data !== undefined ? sanitizeForLogs(data) : undefined;
    
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message: sanitizeForLogs(message) as string,
      ...(sanitizedData !== undefined && { data: sanitizedData }),
    };
  }

  private output(entry: LogEntry): void {
    if (this.isProd) {
      // Em produção: JSON estruturado (melhor para agregadores)
      console.log(JSON.stringify(entry));
    } else {
      // Em desenvolvimento: formato legível
      const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
      if (entry.data !== undefined) {
        console.log(prefix, entry.message, entry.data);
      } else {
        console.log(prefix, entry.message);
      }
    }
  }

  debug(message: string, data?: unknown): void {
    if (!this.isProd) {
      this.output(this.formatLog('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (!this.isProd) {
      this.output(this.formatLog('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    // Warnings também em produção (podem indicar problemas)
    this.output(this.formatLog('warn', message, data));
  }

  error(message: string, error?: unknown, data?: unknown): void {
    // Errors sempre logados - com sanitização de PII
    const sanitizedError = error !== undefined ? sanitizePiiError(error) : undefined;
    const sanitizedData = data !== undefined ? sanitizeForLogs(data) : undefined;
    
    const errorData = sanitizedError !== undefined || sanitizedData !== undefined 
      ? { 
          error: sanitizedError, 
          ...(typeof sanitizedData === 'object' && sanitizedData !== null ? sanitizedData : { data: sanitizedData }) 
        }
      : undefined;
    
    this.output(this.formatLog('error', message, errorData));
  }

  /**
   * Log PII access for LGPD/GDPR audit trail
   * This should be called whenever confidential or restricted data is accessed
   */
  async logPiiAccess(
    supabase: { from: (table: string) => { insert: (data: unknown) => Promise<unknown> } },
    userId: string,
    orgId: string | undefined,
    action: string,
    resourceType: string,
    resourceId: string | undefined,
    piiFields: string[],
    reason?: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('pii_access_audit').insert({
        user_id: userId,
        org_id: orgId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        pii_fields: piiFields,
        access_reason: reason,
        access_context: context || {}
      });
    } catch (err) {
      // Log the failure but don't throw - we don't want audit logging to break functionality
      console.error('[Logger] Failed to log PII access:', sanitizePiiError(err));
    }
  }

  // Factory
  static create(context: string): EdgeLogger {
    return new EdgeLogger(context);
  }
}

export const createLogger = (context: string) => new EdgeLogger(context);
export default EdgeLogger;
