import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import RiskStats from '@/components/risk/RiskStats';
import RiskRegistry from '@/components/risk/RiskRegistry';
import VendorManagement from '@/components/risk/VendorManagement';
import RiskAssessments from '@/components/risk/RiskAssessments';

const RiskManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Riscos & Fornecedores
            </h1>
            <p className="text-muted-foreground">
              Gestão de riscos organizacionais, avaliação de terceiros e controles mitigadores
            </p>
          </div>

          {/* Stats Overview */}
          <RiskStats />

          {/* Risk Registry & Vendor Management */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RiskRegistry />
            <VendorManagement />
          </div>

          {/* Risk Assessments */}
          <RiskAssessments />
        </main>
      </div>
    </div>
  );
};

export default RiskManagement;