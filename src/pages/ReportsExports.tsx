import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ReportsStats from '@/components/reports/ReportsStats';
import ReadyReports from '@/components/reports/ReadyReports';
import CustomReports from '@/components/reports/CustomReports';
import ScheduledReports from '@/components/reports/ScheduledReports';

const ReportsExports = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Relatórios & Exportações
            </h1>
            <p className="text-muted-foreground">
              Relatórios executivos, compliance scorecards e exportações seguras para auditores
            </p>
          </div>

          {/* Stats Overview */}
          <ReportsStats />

          {/* Ready Reports */}
          <ReadyReports />

          {/* Custom Reports & Scheduled Reports */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CustomReports />
            <ScheduledReports />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsExports;