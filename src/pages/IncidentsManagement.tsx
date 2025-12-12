import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import IncidentStats from '@/components/incidents/IncidentStats';
import ActiveIncidents from '@/components/incidents/ActiveIncidents';
import BusinessContinuity from '@/components/incidents/BusinessContinuity';
import IncidentPlaybooks from '@/components/incidents/IncidentPlaybooks';

const IncidentsManagement = () => {
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
                    Incidentes & Continuidade
                  </h1>
                  <p className="text-muted-foreground line-clamp-2">
                    Gestão de incidentes de segurança, playbooks de resposta e planos de continuidade de negócios
                  </p>
                </div>
              </div>

              {/* Stats Overview - Full Width */}
              <div className="col-span-full">
                <IncidentStats />
              </div>

              {/* Active Incidents - Full Width */}
              <div className="col-span-full">
                <ActiveIncidents />
              </div>

              {/* Business Continuity & Playbooks - 2 columns on xl */}
              <div className="col-span-full xl:col-span-6">
                <BusinessContinuity />
              </div>
              <div className="col-span-full xl:col-span-6">
                <IncidentPlaybooks />
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default IncidentsManagement;
