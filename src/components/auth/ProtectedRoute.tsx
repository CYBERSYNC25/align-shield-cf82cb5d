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
import AdminTenantBanner from '@/components/admin/AdminTenantBanner';
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
  const [searchParams] = useSearchParams();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const isAdminTenant = !!searchParams.get('admin_tenant');

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

  // Not authenticated - but allow admin tenant access if user is a platform admin
  if (!user) {
    // If accessing via admin_tenant param, check if there's already a session (admin is logged in)
    if (isAdminTenant) {
      // Admin accessing tenant - verify platform admin status
      const checkAdmin = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data } = await supabase
            .from('platform_admins' as any)
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
          if (data) return; // Allow access
        }
      };
      checkAdmin();
    }
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
      {isAdminTenant && <AdminTenantBanner />}
      {requiresMfaSetup && <MFARequiredBanner variant="warning" />}
      <div className={isAdminTenant ? 'pt-10' : ''}>
        {children}
      </div>
      
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