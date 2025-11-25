import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import ReportsStats from '@/components/reports/ReportsStats';
import ReadyReports from '@/components/reports/ReadyReports';
import CustomReports from '@/components/reports/CustomReports';
import ScheduledReports from '@/components/reports/ScheduledReports';

const ReportsExports = () => {
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
                  Relatórios & Exportações
                </h1>
                <p className="text-muted-foreground">
                  Relatórios executivos, compliance scorecards e exportações seguras para auditores
                </p>
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
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ReportsExports;