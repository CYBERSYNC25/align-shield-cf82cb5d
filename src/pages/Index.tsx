import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import ActionCenter from '@/components/dashboard/ActionCenter';
import PassingTestsSummary from '@/components/dashboard/PassingTestsSummary';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TasksPanel from '@/components/dashboard/TasksPanel';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import ComplianceHub from '@/components/dashboard/ComplianceHub';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

const Index = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExportReport = () => {
    window.print();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 500);
  };

  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Print Header - Only visible when printing */}
      <div className="print-header hidden print:block">
        <h1>Relatório de Status APOC</h1>
        <p>{currentDate}</p>
      </div>

      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-foreground tracking-tight truncate">
                  Dashboard
                </h1>
                <p className="text-muted-foreground line-clamp-2">
                  Centro de ação para conformidade e segurança
                </p>
              </div>
              <div className="flex items-center gap-2 print-hide flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <CreateTaskModal />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportReport}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Exportar
                </Button>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hidden md:flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Atualizado 2 min atrás
                </Badge>
              </div>
            </div>

            {/* Action Center - Main Focus */}
            <ActionCenter />

            {/* Passing Tests + Connection Status Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <PassingTestsSummary />
              </div>
              <div className="lg:col-span-4">
                <ConnectionStatus />
              </div>
            </div>

            {/* Metrics Grid */}
            <MetricsGrid />

            {/* Compliance Hub - Detailed Controls */}
            <ComplianceHub />

            {/* Tasks Panel */}
            <TasksPanel />
          </PageContainer>
          
          <Footer />
        </main>
      </div>

      {/* Print Footer - Only visible when printing */}
      <div className="print-footer hidden print:block">
        <p>Gerado automaticamente pela plataforma APOC Compliance</p>
      </div>
    </div>
  );
};

export default Index;