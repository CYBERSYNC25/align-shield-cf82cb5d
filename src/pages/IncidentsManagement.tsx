import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import IncidentStats from '@/components/incidents/IncidentStats';
import ActiveIncidents from '@/components/incidents/ActiveIncidents';
import BusinessContinuity from '@/components/incidents/BusinessContinuity';
import IncidentPlaybooks from '@/components/incidents/IncidentPlaybooks';

const IncidentsManagement = () => {
  console.log('IncidentsManagement component rendered');
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Incidentes & Continuidade
            </h1>
            <p className="text-muted-foreground">
              Gestão de incidentes de segurança, playbooks de resposta e planos de continuidade de negócios
            </p>
          </div>

          {/* Stats Overview */}
          <IncidentStats />

          {/* Active Incidents */}
          <ActiveIncidents />

          {/* Business Continuity & Playbooks */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BusinessContinuity />
            <IncidentPlaybooks />
          </div>
        </main>
      </div>
    </div>
  );
};

export default IncidentsManagement;