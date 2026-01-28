import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useOnboardingWizard } from '@/hooks/useOnboardingWizard';
import { useMFA } from '@/hooks/useMFA';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { MFARequiredBanner } from '@/components/auth/MFARequiredBanner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isViewer, loading: rolesLoading, roles, isAdmin, isMasterAdmin } = useUserRoles();
  const { state: onboardingState } = useOnboardingWizard();
  const { mfaStatus, isLoading: mfaLoading } = useMFA();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

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
    </>
  );
};

export default ProtectedRoute;