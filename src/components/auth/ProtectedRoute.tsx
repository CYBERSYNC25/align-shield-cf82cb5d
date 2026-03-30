import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useOnboardingWizard } from '@/hooks/useOnboardingWizard';
import { useMFA } from '@/hooks/useMFA';
import { useSessionActivity } from '@/hooks/useSessionActivity';
import { useCreateSession } from '@/hooks/useUserSessions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { MFARequiredBanner } from '@/components/auth/MFARequiredBanner';
import { SessionTimeoutModal } from '@/components/auth/SessionTimeoutModal';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isViewer, loading: rolesLoading, roles, isAdmin, isMasterAdmin } = useUserRoles();
  const { state: onboardingState } = useOnboardingWizard();
  const { mfaStatus, isLoading: mfaLoading } = useMFA();
  const { showWarningModal, timeRemaining, continueSession, logout } = useSessionActivity();
  const createSession = useCreateSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  
  // Use ref to prevent multiple session creation attempts
  const sessionCreateAttempted = useRef(false);

  // Create session on login - only try once per mount
  useEffect(() => {
    const existingSessionId = localStorage.getItem('current_session_id');
    
    // Only attempt if: user exists, not already attempted, and no existing session
    if (user && !sessionCreateAttempted.current && !existingSessionId) {
      sessionCreateAttempted.current = true;
      
      createSession.mutate(undefined, {
        onSuccess: () => {
          setSessionCreated(true);
        },
        onError: (error) => {
          // Log but don't block - session tracking is optional
          console.warn('Session creation failed (non-blocking):', error.message);
          // Mark as "created" to prevent UI blocking
          setSessionCreated(true);
        },
      });
    } else if (existingSessionId) {
      // Already have a session
      setSessionCreated(true);
    }
  }, [user]); // Only depend on user, not createSession

  // Redirect based on role after authentication
  useEffect(() => {
    if (user && !rolesLoading && roles.length > 0 && !hasRedirected) {
      // Only redirect if user is on root path (just logged in)
      if (location.pathname === '/') {
        if (isViewer()) {
          navigate('/compliance-readiness', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        setHasRedirected(true);
      }
    }
  }, [user, rolesLoading, roles, isViewer, location.pathname, navigate, hasRedirected]);

  // Loading state
  if (authLoading || (user && rolesLoading) || (user && onboardingState.isLoading) || (user && mfaLoading)) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show onboarding wizard for new users
  if (onboardingState.isActive && !onboardingState.hasCompleted && !onboardingState.wasSkipped) {
    return <OnboardingWizard />;
  }

  // Show MFA required banner for admins without MFA
  const requiresMfaSetup = (isAdmin() || isMasterAdmin()) && mfaStatus && !mfaStatus.enabled;

  return (
    <>
      {requiresMfaSetup && <MFARequiredBanner variant="warning" />}
      {children}
      
      {/* Session timeout warning modal */}
      <SessionTimeoutModal
        open={showWarningModal}
        timeRemaining={timeRemaining}
        onContinue={continueSession}
        onLogout={logout}
      />
    </>
  );
};

export default ProtectedRoute;