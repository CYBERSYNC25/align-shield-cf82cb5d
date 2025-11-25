import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ComplianceScoreCard from '@/components/dashboard/ComplianceScoreCard';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TasksPanel from '@/components/dashboard/TasksPanel';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import ComplianceChart from '@/components/dashboard/ComplianceChart';
import NetworkMonitoring from '@/components/dashboard/NetworkMonitoring';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import DashboardOnboarding from '@/components/dashboard/DashboardOnboarding';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Index = () => {
  const handleExportReport = () => {
    window.print();
  };

  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Print Header - Only visible when printing */}
      <div className="print-header hidden print:block">
        <h1>Relatório de Status APOC</h1>
        <p>{currentDate}</p>
      </div>

      <DashboardOnboarding />
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Grid Layout Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            
            {/* Hero Section - Full Width */}
            <div className="col-span-full">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                    APOC Dashboard
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Visão geral da postura de segurança e conformidade da organização
                  </p>
                </div>
                <div className="flex items-center space-x-3 print-hide">
                  <CreateTaskModal />
                  <Button 
                    variant="outline" 
                    onClick={handleExportReport}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Exportar Relatório
                  </Button>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Postura Melhorada
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Atualizado 2 min atrás
                  </Badge>
                </div>
              </div>
            </div>

            {/* Metrics Grid - Full Width */}
            <div className="col-span-full">
              <MetricsGrid />
            </div>

            {/* Compliance Score Card - 8 columns on large screens */}
            <div className="col-span-full lg:col-span-8">
              <ComplianceScoreCard />
            </div>

            {/* Connection Status - 4 columns on large screens */}
            <div className="col-span-full lg:col-span-4">
              <ConnectionStatus />
            </div>

            {/* Network Monitoring - Full Width */}
            <div className="col-span-full">
              <NetworkMonitoring />
            </div>

            {/* Compliance Chart - Full Width */}
            <div className="col-span-full">
              <ComplianceChart />
            </div>

            {/* Tasks Panel - 6 columns on large screens */}
            <div className="col-span-full lg:col-span-6">
              <TasksPanel />
            </div>

            {/* Analytics Dashboard - 6 columns on large screens */}
            <div className="col-span-full lg:col-span-6">
              <AnalyticsDashboard />
            </div>

          </div>
        </main>
      </div>

      <Footer />

      {/* Print Footer - Only visible when printing */}
      <div className="print-footer hidden print:block">
        <p>Gerado automaticamente pela plataforma APOC Compliance</p>
      </div>
    </div>
  );
};

export default Index;
