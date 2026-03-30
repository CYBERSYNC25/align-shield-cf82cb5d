/**
 * Sistema de Logging Estruturado - Frontend
 * 
 * Funcionalidades:
 * - Logs apenas em development mode (exceto errors)
 * - Formatação com timestamp e contexto
 * - Preparado para integração Sentry (produção)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDev = import.meta.env.MODE === 'development';
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.isDev) {
      if (data !== undefined) {
        console.log(this.formatMessage('debug', message), data);
      } else {
        console.log(this.formatMessage('debug', message));
      }
    }
  }

  info(message: string, data?: unknown): void {
    if (this.isDev) {
      if (data !== undefined) {
        console.info(this.formatMessage('info', message), data);
      } else {
        console.info(this.formatMessage('info', message));
      }
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.isDev) {
      if (data !== undefined) {
        console.warn(this.formatMessage('warn', message), data);
      } else {
        console.warn(this.formatMessage('warn', message));
      }
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    // Errors sempre logados (dev e prod)
    if (error !== undefined) {
      console.error(this.formatMessage('error', message), error);
    } else {
      console.error(this.formatMessage('error', message));
    }
    
    // TODO: Enviar para Sentry em produção
    // if (!this.isDev && typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error, { extra: { ...context, module: this.context } });
    // }
  }

  // Factory para criar logger com contexto específico
  static create(context: string): Logger {
    return new Logger(context);
  }
}

// Instância padrão
export const logger = new Logger('Compliance Sync');

// Factory para módulos específicos
export const createLogger = (context: string) => new Logger(context);

export default Logger;
