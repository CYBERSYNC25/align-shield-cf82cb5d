import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import AccessReviewsStats from '@/components/access/AccessReviewsStats';
import ActiveCampaigns from '@/components/access/ActiveCampaigns';
import SystemsInventory from '@/components/access/SystemsInventory';
import AnomaliesDetection from '@/components/access/AnomaliesDetection';

const AccessReviews = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Grid Layout Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Page Header - Full Width */}
            <div className="col-span-full">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Revisões de Acesso
                </h1>
                <p className="text-muted-foreground">
                  Certificação periódica de acessos, detecção de anomalias e gestão de privilégios
                </p>
              </div>
            </div>

            {/* Stats Overview - Full Width */}
            <div className="col-span-full">
              <AccessReviewsStats />
            </div>

            {/* Active Campaigns - Full Width */}
            <div className="col-span-full">
              <ActiveCampaigns />
            </div>

            {/* Systems Inventory & Anomalies - 2 columns on xl */}
            <div className="col-span-full xl:col-span-6">
              <SystemsInventory />
            </div>
            <div className="col-span-full xl:col-span-6">
              <AnomaliesDetection />
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AccessReviews;