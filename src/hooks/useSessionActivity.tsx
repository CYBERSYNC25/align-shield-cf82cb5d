/**
 * Session Activity Hook
 * 
 * Monitors user activity and manages session timeout.
 * - Updates last_active_at every 60 seconds
 * - Shows warning modal at 25 minutes of inactivity
 * - Auto-logout at 30 minutes of inactivity
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateSessionActivity, useCurrentSessionId } from '@/hooks/useUserSessions';

// Constants
const UPDATE_INTERVAL = 60 * 1000; // 60 seconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes before timeout
const WARNING_TIME = INACTIVITY_TIMEOUT - WARNING_BEFORE; // 25 minutes

interface UseSessionActivityReturn {
  lastActivity: Date;
  showWarningModal: boolean;
  timeRemaining: number; // in seconds
  continueSession: () => void;
  logout: () => void;
}

export function useSessionActivity(): UseSessionActivityReturn {
  const { user, signOut } = useAuth();
  const updateActivity = useUpdateSessionActivity();
  const sessionId = useCurrentSessionId();
  
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(WARNING_BEFORE / 1000);
  
  const lastUpdateRef = useRef<Date>(new Date());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Reset activity timers
  const resetTimers = useCallback(() => {
    const now = new Date();
    setLastActivity(now);
    setShowWarningModal(false);
    setTimeRemaining(WARNING_BEFORE / 1000);

    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Set warning timer (25 minutes)
    warningTimerRef.current = setTimeout(() => {
      setShowWarningModal(true);
      startCountdown();
    }, WARNING_TIME);

    // Set logout timer (30 minutes)
    logoutTimerRef.current = setTimeout(() => {
      handleAutoLogout();
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Start countdown for warning modal
  const startCountdown = useCallback(() => {
    let remaining = WARNING_BEFORE / 1000;
    setTimeRemaining(remaining);

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);
  }, []);

  // Handle auto-logout
  const handleAutoLogout = useCallback(async () => {
    // Cleanup timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Clear session ID
    localStorage.removeItem('current_session_id');

    // Sign out
    await signOut();
  }, [signOut]);

  // Continue session (user clicked "Continue")
  const continueSession = useCallback(() => {
    resetTimers();
    
    // Update activity in database
    if (sessionId) {
      updateActivity.mutate(sessionId);
    }
  }, [sessionId, updateActivity, resetTimers]);

  // Manual logout
  const logout = useCallback(async () => {
    // Cleanup timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    localStorage.removeItem('current_session_id');
    await signOut();
  }, [signOut]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    const now = new Date();
    setLastActivity(now);

    // Only update database every 60 seconds
    if (now.getTime() - lastUpdateRef.current.getTime() >= UPDATE_INTERVAL) {
      lastUpdateRef.current = now;
      
      if (sessionId) {
        updateActivity.mutate(sessionId);
      }
    }

    // Reset timers only if warning modal is not showing
    if (!showWarningModal) {
      resetTimers();
    }
  }, [sessionId, updateActivity, showWarningModal, resetTimers]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle activity detection
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleActivity();
          throttleTimeout = null;
        }, 1000); // Throttle to 1 second
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    // Initialize timers
    resetTimers();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledHandler);
      });
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, handleActivity, resetTimers]);

  // Handle visibility change (tab focus/blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, handleActivity]);

  return {
    lastActivity,
    showWarningModal,
    timeRemaining,
    continueSession,
    logout,
  };
}
