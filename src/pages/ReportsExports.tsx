import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import ReportsStats from '@/components/reports/ReportsStats';
import ReadyReports from '@/components/reports/ReadyReports';
import CustomReports from '@/components/reports/CustomReports';
import ScheduledReports from '@/components/reports/ScheduledReports';
import ExportPDFButton from '@/components/reports/ExportPDFButton';

const ReportsExports = () => {
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground truncate">
                      Relatórios & Exportações
                    </h1>
                    <p className="text-muted-foreground line-clamp-2">
                      Relatórios executivos, compliance scorecards e exportações seguras para auditores
                    </p>
                  </div>
                  <ExportPDFButton />
                </div>
              </div>

              {/* Stats Overview - Full Width */}
              <div className="col-span-full">
                <ReportsStats />
              </div>

              {/* Ready Reports - Full Width */}
              <div className="col-span-full">
                <ReadyReports />
              </div>

              {/* Custom Reports & Scheduled Reports - 2 columns on xl */}
              <div className="col-span-full xl:col-span-6">
                <CustomReports />
              </div>
              <div className="col-span-full xl:col-span-6">
                <ScheduledReports />
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default ReportsExports;
