import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import AccessReviewsStats from '@/components/access/AccessReviewsStats';
import ActiveCampaigns from '@/components/access/ActiveCampaigns';
import SystemsInventory from '@/components/access/SystemsInventory';
import AnomaliesDetection from '@/components/access/AnomaliesDetection';
import { useAccess } from '@/hooks/useAccess';
import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle } from 'lucide-react';

const AccessReviews = () => {
  const { hasRealData } = useAccess();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Page Header - Full Width */}
              <div className="col-span-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground truncate">
                      Revisões de Acesso
                    </h1>
                    {hasRealData ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                        <Database className="h-3 w-3" />
                        Dados Reais
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Dados de Demonstração
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2">
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
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AccessReviews;
