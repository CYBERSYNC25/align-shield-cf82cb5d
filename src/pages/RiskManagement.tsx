import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import RiskStats from '@/components/risk/RiskStats';
import RiskRegistry from '@/components/risk/RiskRegistry';
import VendorManagement from '@/components/risk/VendorManagement';
import RiskAssessments from '@/components/risk/RiskAssessments';
import RiskMatrix from '@/components/risk/RiskMatrix';

const RiskManagement = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-64 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Page Header - Full Width */}
              <div className="col-span-full">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground truncate">
                    Riscos & Fornecedores
                  </h1>
                  <p className="text-muted-foreground line-clamp-2">
                    Gestão de riscos organizacionais, avaliação de terceiros e controles mitigadores
                  </p>
                </div>
              </div>

              {/* Stats Overview - Full Width */}
              <div className="col-span-full">
                <RiskStats />
              </div>

              {/* Risk Matrix - Full Width */}
              <div className="col-span-full">
                <RiskMatrix />
              </div>

              {/* Risk Registry & Vendor Management - 2 columns on xl */}
              <div className="col-span-full xl:col-span-6">
                <RiskRegistry />
              </div>
              <div className="col-span-full xl:col-span-6">
                <VendorManagement />
              </div>

              {/* Risk Assessments - Full Width */}
              <div className="col-span-full">
                <RiskAssessments />
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default RiskManagement;
