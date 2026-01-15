/**
 * Sistema de Logging Estruturado - Edge Functions (Deno)
 * 
 * Funcionalidades:
 * - Logs estruturados em JSON para produção
 * - Formatação legível em desenvolvimento
 * - Contexto automático (function name, timestamp)
 * - warn e error sempre logados (ambos os ambientes)
 */

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
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(data !== undefined && { data }),
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
    // Errors sempre logados
    const errorData = error !== undefined || data !== undefined 
      ? { error, ...(typeof data === 'object' && data !== null ? data : { data }) }
      : undefined;
    this.output(this.formatLog('error', message, errorData));
  }

  // Factory
  static create(context: string): EdgeLogger {
    return new EdgeLogger(context);
  }
}

export const createLogger = (context: string) => new EdgeLogger(context);
export default EdgeLogger;
