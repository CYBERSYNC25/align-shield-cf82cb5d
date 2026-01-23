import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useOnboardingWizard } from '@/hooks/useOnboardingWizard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isViewer, loading: rolesLoading, roles } = useUserRoles();
  const { state: onboardingState } = useOnboardingWizard();
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
  if (authLoading || (user && rolesLoading) || (user && onboardingState.isLoading)) {
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

  return <>{children}</>;
};

export default ProtectedRoute;