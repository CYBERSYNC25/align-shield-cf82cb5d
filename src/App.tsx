import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import ControlsFrameworks from "./pages/ControlsFrameworks";
import IntegrationsHub from "./pages/IntegrationsHub";
import PoliciesTraining from "./pages/PoliciesTraining";
import AccessReviews from "./pages/AccessReviews";
import RiskManagement from "./pages/RiskManagement";
import AuditPortal from "./pages/AuditPortal";
import IncidentsManagement from "./pages/IncidentsManagement";
import IncidentsTest from "./pages/IncidentsTest";
import ReportsExports from "./pages/ReportsExports";
import Analytics from "./pages/Analytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import FileManagement from "./pages/FileManagement";
import Notifications from "./pages/Notifications";
import Tasks from "./pages/Tasks";
import ComplianceReadiness from "./pages/ComplianceReadiness";
import PolicyDocuments from "./pages/PolicyDocuments";
import Welcome from "./pages/Welcome";
import Inventory from "./pages/Inventory";
import AuditorPortalPage from "./pages/AuditorPortalPage";
import TrustCenter from "./pages/TrustCenter";
import Questionnaires from "./pages/Questionnaires";
import Developers from "./pages/Developers";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import DPA from "./pages/legal/DPA";
import Jobs from "./pages/Jobs";

// Admin Multi-Tenant Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminPermissions from "./pages/admin/AdminPermissions";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/controls" element={
            <ProtectedRoute>
              <ControlsFrameworks />
            </ProtectedRoute>
          } />
          <Route path="/integrations" element={
            <ProtectedRoute>
              <IntegrationsHub />
            </ProtectedRoute>
          } />
          <Route path="/policies" element={
            <ProtectedRoute>
              <PoliciesTraining />
            </ProtectedRoute>
          } />
          <Route path="/access-reviews" element={
            <ProtectedRoute>
              <AccessReviews />
            </ProtectedRoute>
          } />
          <Route path="/risks" element={
            <ProtectedRoute>
              <RiskManagement />
            </ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute>
              <AuditPortal />
            </ProtectedRoute>
          } />
          <Route path="/incidents" element={
            <ProtectedRoute>
              <IncidentsManagement />
            </ProtectedRoute>
          } />
          <Route path="/incidents-test" element={
            <ProtectedRoute>
              <IncidentsTest />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsExports />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/advanced-analytics" element={
            <ProtectedRoute>
              <AdvancedAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/files" element={
            <ProtectedRoute>
              <FileManagement />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } />
          <Route path="/readiness" element={
            <ProtectedRoute>
              <ComplianceReadiness />
            </ProtectedRoute>
          } />
          <Route path="/policy-documents" element={
            <ProtectedRoute>
              <PolicyDocuments />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/questionnaires" element={
            <ProtectedRoute>
              <Questionnaires />
            </ProtectedRoute>
          } />
          {/* Developer Documentation */}
          <Route path="/developers" element={
            <ProtectedRoute>
              <Developers />
            </ProtectedRoute>
          } />
          {/* Jobs Queue Management - Admin only */}
          <Route path="/jobs" element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          } />
          {/* Auditor Portal - Public Route (no auth required) */}
          <Route path="/auditor-portal" element={<AuditorPortalPage />} />
          <Route path="/auditor-portal/:auditId" element={<AuditorPortalPage />} />
          {/* Trust Center - Public Route (no auth required) */}
          <Route path="/trust/:slug" element={<TrustCenter />} />
          {/* Legal Pages - Public Routes */}
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/dpa" element={<DPA />} />
          {/* Redirect para manter compatibilidade com URLs antigas */}
          <Route path="/compliance-readiness" element={<Navigate to="/readiness" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
