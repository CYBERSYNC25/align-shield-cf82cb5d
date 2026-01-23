/**
 * useErrorLogger Hook
 * 
 * Provides easy-to-use logging functions for React components.
 * Logs are sent to the centralized logging system.
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/hooks/useAuth';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface ErrorLogContext {
  action?: string;
  [key: string]: unknown;
}

interface LogPayload {
  level: LogLevel;
  source: 'frontend';
  message: string;
  stack_trace?: string;
  component_name?: string;
  metadata?: Record<string, unknown>;
}

// Batch logs to reduce API calls
interface QueuedLog extends LogPayload {
  timestamp: number;
}

const BATCH_DELAY_MS = 1000;
const MAX_BATCH_SIZE = 10;

export function useErrorLogger(componentName?: string) {
  const { user } = useAuthSafe();
  const logQueueRef = useRef<QueuedLog[]>([]);
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushLogs = useCallback(async () => {
    if (logQueueRef.current.length === 0) return;

    const logsToSend = logQueueRef.current.splice(0, MAX_BATCH_SIZE);
    
    // Send each log (could be optimized to batch insert in Edge Function)
    for (const log of logsToSend) {
      try {
        await supabase.functions.invoke('log-event', {
          body: {
            level: log.level,
            source: log.source,
            message: log.message,
            stack_trace: log.stack_trace,
            component_name: log.component_name,
            metadata: log.metadata,
          }
        });
      } catch (e) {
        console.error('[useErrorLogger] Failed to send log:', e);
      }
    }

    // If there are more logs, schedule another flush
    if (logQueueRef.current.length > 0) {
      batchTimeoutRef.current = setTimeout(flushLogs, BATCH_DELAY_MS);
    }
  }, []);

  const queueLog = useCallback((payload: LogPayload) => {
    logQueueRef.current.push({
      ...payload,
      timestamp: Date.now(),
    });

    // Clear existing timeout and set new one
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Flush immediately if batch is full
    if (logQueueRef.current.length >= MAX_BATCH_SIZE) {
      flushLogs();
    } else {
      batchTimeoutRef.current = setTimeout(flushLogs, BATCH_DELAY_MS);
    }
  }, [flushLogs]);

  const createLogPayload = useCallback((
    level: LogLevel,
    message: string,
    error?: Error,
    context?: ErrorLogContext
  ): LogPayload => {
    return {
      level,
      source: 'frontend' as const,
      message,
      stack_trace: error?.stack,
      component_name: componentName,
      metadata: {
        ...context,
        userId: user?.id,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
      }
    };
  }, [componentName, user?.id]);

  const logError = useCallback(async (
    message: string,
    error?: Error,
    context?: ErrorLogContext
  ) => {
    // Always log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error(`[${componentName || 'App'}]`, message, error);
    }

    const payload = createLogPayload('error', message, error, context);
    queueLog(payload);
  }, [componentName, createLogPayload, queueLog]);

  const logCritical = useCallback(async (
    message: string,
    error?: Error,
    context?: ErrorLogContext
  ) => {
    // Always log critical errors
    console.error(`[CRITICAL][${componentName || 'App'}]`, message, error);

    const payload = createLogPayload('critical', message, error, context);
    // Critical logs are sent immediately, not batched
    try {
      await supabase.functions.invoke('log-event', { body: payload });
    } catch (e) {
      console.error('[useErrorLogger] Failed to send critical log:', e);
    }
  }, [componentName, createLogPayload]);

  const logWarning = useCallback(async (
    message: string,
    context?: ErrorLogContext
  ) => {
    if (import.meta.env.MODE === 'development') {
      console.warn(`[${componentName || 'App'}]`, message);
    }

    const payload = createLogPayload('warn', message, undefined, context);
    queueLog(payload);
  }, [componentName, createLogPayload, queueLog]);

  const logInfo = useCallback(async (
    message: string,
    context?: ErrorLogContext
  ) => {
    if (import.meta.env.MODE === 'development') {
      console.info(`[${componentName || 'App'}]`, message);
    }

    // Only persist info logs if explicitly requested via context
    if (context?.persist) {
      const payload = createLogPayload('info', message, undefined, context);
      queueLog(payload);
    }
  }, [componentName, createLogPayload, queueLog]);

  const logDebug = useCallback(async (
    message: string,
    context?: ErrorLogContext
  ) => {
    // Debug logs only go to console in development
    if (import.meta.env.MODE === 'development') {
      console.log(`[DEBUG][${componentName || 'App'}]`, message, context);
    }

    // Only persist debug logs if explicitly requested
    if (context?.persist) {
      const payload = createLogPayload('debug', message, undefined, context);
      queueLog(payload);
    }
  }, [componentName, createLogPayload, queueLog]);

  return {
    logError,
    logCritical,
    logWarning,
    logInfo,
    logDebug,
  };
}

export default useErrorLogger;
