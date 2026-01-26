/**
 * Hook for Login Rate Limiting and Account Lockout
 * 
 * Security features:
 * - 5 attempts per 15 minutes
 * - Account lockout after exceeding limit
 * - Tracks failed/successful attempts
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitStatus {
  allowed: boolean;
  attemptsRemaining: number;
  lockedUntil: Date | null;
}

interface UseLoginRateLimiterReturn {
  status: RateLimitStatus;
  checkCanAttempt: (email: string) => Promise<boolean>;
  recordAttempt: (email: string, success: boolean, failureReason?: string) => Promise<void>;
  getTimeRemaining: () => string;
}

export function useLoginRateLimiter(): UseLoginRateLimiterReturn {
  const [status, setStatus] = useState<RateLimitStatus>({
    allowed: true,
    attemptsRemaining: 5,
    lockedUntil: null
  });

  /**
   * Check if login attempt is allowed for the given email
   */
  const checkCanAttempt = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('can_attempt_login', { p_email: email });
      
      if (error) {
        console.error('[RateLimiter] Error checking attempt:', error);
        // Fail open - allow attempt if we can't check
        return true;
      }
      
      if (!data || data.length === 0) {
        // No data returned - allow attempt
        return true;
      }

      const result = data[0];
      setStatus({
        allowed: result.allowed,
        attemptsRemaining: result.attempts_remaining,
        lockedUntil: result.locked_until ? new Date(result.locked_until) : null
      });
      
      return result.allowed;
    } catch (err) {
      console.error('[RateLimiter] Exception checking attempt:', err);
      // Fail open
      return true;
    }
  }, []);

  /**
   * Record a login attempt (success or failure)
   */
  const recordAttempt = useCallback(async (
    email: string, 
    success: boolean, 
    failureReason?: string
  ): Promise<void> => {
    try {
      const { error } = await supabase.rpc('record_login_attempt', {
        p_email: email,
        p_success: success,
        p_ip_address: null, // Could be obtained via Edge Function if needed
        p_user_agent: navigator.userAgent,
        p_failure_reason: failureReason || null
      });

      if (error) {
        console.error('[RateLimiter] Error recording attempt:', error);
      }

      // Refresh status after recording
      if (!success) {
        await checkCanAttempt(email);
      }
    } catch (err) {
      console.error('[RateLimiter] Exception recording attempt:', err);
    }
  }, [checkCanAttempt]);

  /**
   * Get human-readable time remaining until lockout expires
   */
  const getTimeRemaining = useCallback((): string => {
    if (!status.lockedUntil) return '';
    
    const now = new Date();
    const diff = status.lockedUntil.getTime() - now.getTime();
    
    if (diff <= 0) return '';
    
    const minutes = Math.ceil(diff / 60000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
    
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }, [status.lockedUntil]);

  return {
    status,
    checkCanAttempt,
    recordAttempt,
    getTimeRemaining
  };
}
