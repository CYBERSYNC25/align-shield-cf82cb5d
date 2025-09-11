import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import ReportsExports from "./pages/ReportsExports";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
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
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
