import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import AccessReviewsStats from '@/components/access/AccessReviewsStats';
import ActiveCampaigns from '@/components/access/ActiveCampaigns';
import SystemsInventory from '@/components/access/SystemsInventory';
import AnomaliesDetection from '@/components/access/AnomaliesDetection';

const AccessReviews = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Revisões de Acesso
            </h1>
            <p className="text-muted-foreground">
              Certificação periódica de acessos, detecção de anomalias e gestão de privilégios
            </p>
          </div>

          {/* Stats Overview */}
          <AccessReviewsStats />

          {/* Active Campaigns */}
          <ActiveCampaigns />

          {/* Systems Inventory & Anomalies */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SystemsInventory />
            <AnomaliesDetection />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccessReviews;