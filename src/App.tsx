import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
          <Route path="/" element={<Index />} />
          <Route path="/controls" element={<ControlsFrameworks />} />
          <Route path="/integrations" element={<IntegrationsHub />} />
          <Route path="/policies" element={<PoliciesTraining />} />
          <Route path="/access-reviews" element={<AccessReviews />} />
          <Route path="/risks" element={<RiskManagement />} />
          <Route path="/audit" element={<AuditPortal />} />
          <Route path="/incidents" element={<IncidentsManagement />} />
          <Route path="/reports" element={<ReportsExports />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
