/**
 * Global Error Handlers
 * 
 * Captures unhandled JS errors and Promise rejections,
 * sending them to the centralized logging system.
 * 
 * IMPORTANT: All data is sanitized for PII before logging (LGPD/GDPR compliant)
 */

import { supabase } from '@/integrations/supabase/client';
import { sanitizeForLogs, sanitizeStackTrace, maskPiiValue } from '@/lib/security/piiSanitizer';

// Debounce to avoid flooding the backend with duplicate errors
let lastErrorKey = '';
let lastErrorTime = 0;
const ERROR_DEBOUNCE_MS = 5000;

function shouldLogError(errorKey: string): boolean {
  const now = Date.now();
  if (errorKey === lastErrorKey && now - lastErrorTime < ERROR_DEBOUNCE_MS) {
    return false;
  }
  lastErrorKey = errorKey;
  lastErrorTime = now;
  return true;
}

async function sendLogToBackend(payload: {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  source: 'frontend';
  message: string;
  stack_trace?: string;
  component_name?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    // Sanitize all data before sending - LGPD/GDPR compliance
    const sanitizedPayload = {
      level: payload.level,
      source: payload.source,
      message: maskPiiValue(payload.message),
      stack_trace: sanitizeStackTrace(payload.stack_trace),
      component_name: payload.component_name,
      metadata: payload.metadata ? sanitizeForLogs(payload.metadata) as Record<string, unknown> : undefined
    };

    await supabase.functions.invoke('log-event', {
      body: sanitizedPayload
    });
  } catch (e) {
    // Silently fail - we don't want error logging to cause more errors
    console.error('[GlobalErrorHandler] Failed to send log:', e);
  }
}

export function setupGlobalErrorHandlers(): void {
  // Only setup in browser environment
  if (typeof window === 'undefined') return;

  // Capture unhandled JS errors
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) => {
    const errorMessage = typeof message === 'string' ? message : 'Unknown error';
    const errorKey = `${errorMessage}-${source}-${lineno}`;
    
    if (!shouldLogError(errorKey)) return;

    sendLogToBackend({
      level: 'error',
      source: 'frontend',
      message: `Uncaught Error: ${errorMessage}`,
      stack_trace: error?.stack,
      component_name: 'GlobalErrorHandler',
      metadata: {
        errorType: 'window.onerror',
        file: source,
        line: lineno,
        column: colno,
        url: window.location.href,
        // Note: userAgent is sanitized by the sanitizeForLogs function
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
    });
  };

  // Capture unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason?.message || String(reason) || 'Unknown Promise rejection';
    const errorKey = `unhandledrejection-${message}`;
    
    if (!shouldLogError(errorKey)) return;

    sendLogToBackend({
      level: 'error',
      source: 'frontend',
      message: `Unhandled Promise Rejection: ${message}`,
      stack_trace: reason?.stack,
      component_name: 'GlobalErrorHandler',
      metadata: {
        errorType: 'unhandledrejection',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
    });
  });

  // Log successful initialization in development
  if (import.meta.env.MODE === 'development') {
    console.log('[GlobalErrorHandler] Initialized with PII sanitization');
  }
}

// Helper to manually log errors from anywhere
export async function logGlobalError(
  message: string,
  error?: Error,
  metadata?: Record<string, unknown>
): Promise<void> {
  await sendLogToBackend({
    level: 'error',
    source: 'frontend',
    message,
    stack_trace: error?.stack,
    metadata: {
      ...metadata,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
    }
  });
}
