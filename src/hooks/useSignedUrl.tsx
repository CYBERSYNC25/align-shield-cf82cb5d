/**
 * Hook para obter URLs assinadas com cache e refresh automático
 * 
 * URLs assinadas expiram em 1 hora por segurança.
 * Este hook gerencia o refresh automático 5 minutos antes da expiração.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSignedUrlOptions {
  /** Time to live in seconds (default: 3600 = 1 hour) */
  ttl?: number;
  /** Auto-refresh before expiry (default: true) */
  autoRefresh?: boolean;
  /** Minutes before expiry to refresh (default: 5) */
  refreshBeforeMinutes?: number;
}

interface UseSignedUrlReturn {
  /** The signed URL (null if not yet fetched or error) */
  signedUrl: string | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** When the URL expires */
  expiresAt: Date | null;
  /** Manually refresh the URL */
  refreshUrl: () => Promise<void>;
  /** Time remaining in seconds */
  timeRemaining: number | null;
}

export function useSignedUrl(
  bucket: string,
  path: string | null,
  options: UseSignedUrlOptions = {}
): UseSignedUrlReturn {
  const { 
    ttl = 3600, 
    autoRefresh = true, 
    refreshBeforeMinutes = 5 
  } = options;

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const refreshUrl = useCallback(async () => {
    if (!path) {
      setSignedUrl(null);
      setExpiresAt(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: urlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, ttl);

      if (urlError) {
        throw urlError;
      }

      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
        setExpiresAt(new Date(Date.now() + ttl * 1000));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get signed URL';
      setError(message);
      setSignedUrl(null);
      setExpiresAt(null);
    } finally {
      setLoading(false);
    }
  }, [bucket, path, ttl]);

  // Initial fetch
  useEffect(() => {
    if (path) {
      refreshUrl();
    }
  }, [path, refreshUrl]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh || !expiresAt) return;

    const msUntilRefresh = expiresAt.getTime() - Date.now() - (refreshBeforeMinutes * 60 * 1000);
    
    if (msUntilRefresh <= 0) {
      // Already past refresh time, refresh now
      refreshUrl();
      return;
    }

    const timer = setTimeout(refreshUrl, msUntilRefresh);
    return () => clearTimeout(timer);
  }, [expiresAt, autoRefresh, refreshBeforeMinutes, refreshUrl]);

  // Time remaining countdown
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return {
    signedUrl,
    loading,
    error,
    expiresAt,
    refreshUrl,
    timeRemaining
  };
}

/**
 * Helper to format time remaining
 */
export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null) return '';
  if (seconds <= 0) return 'Expirado';
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export default useSignedUrl;
