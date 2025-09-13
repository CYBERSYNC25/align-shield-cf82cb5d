import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ComplianceScoreCard from '@/components/dashboard/ComplianceScoreCard';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TasksPanel from '@/components/dashboard/TasksPanel';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import ComplianceChart from '@/components/dashboard/ComplianceChart';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import EvidenceUploadModal from '@/components/audit/EvidenceUploadModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileCheck, 
  Users, 
  Settings, 
  Activity, 
  Shield,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

const Index = () => {
  const complianceData = [
    {
      framework: 'SOC 2 Type II',
      score: 89,
      trend: 'up' as const,
      trendValue: 5,
      status: 'good' as const,
      totalControls: 64,
      passedControls: 57
    },
    {
      framework: 'ISO 27001:2022',
      score: 92,
      trend: 'up' as const,
      trendValue: 3,
      status: 'excellent' as const,
      totalControls: 114,
      passedControls: 105
    },
    {
      framework: 'LGPD',
      score: 76,
      trend: 'down' as const,
      trendValue: -2,
      status: 'fair' as const,
      totalControls: 42,
      passedControls: 32
    },
    {
      framework: 'GDPR',
      score: 83,
      trend: 'up' as const,
      trendValue: 7,
      status: 'good' as const,
      totalControls: 38,
      passedControls: 31
    }
  ];

  const quickActions = [
    { icon: BarChart3, label: 'Executar coleta de evidências', color: 'primary' },
    { icon: FileCheck, label: 'Gerar relatório SOC 2', color: 'success' },
    { icon: Users, label: 'Iniciar revisão de acessos', color: 'info' },
    { icon: Settings, label: 'Configurar nova integração', color: 'warning' }
  ];

  const recentActivities = [
    { 
      icon: Shield, 
      title: 'AWS IAM coleta concluída',
      time: '5 min atrás',
      status: 'success'
    },
    { 
      icon: FileCheck, 
      title: 'Nova política publicada',
      time: '2h atrás',
      status: 'warning'
    },
    { 
      icon: Users, 
      title: 'Revisão de acesso iniciada',
      time: '4h atrás',
      status: 'info'
    },
    { 
      icon: AlertCircle, 
      title: 'Controle SOC 2 falhando',
      time: '6h atrás',
      status: 'danger'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">
                  Dashboard de Conformidade
                </h1>
                <p className="text-lg text-muted-foreground">
                  Visão geral da postura de segurança e conformidade da organização
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <CreateTaskModal />
                <Badge variant="outline" className="status-success">
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

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Metrics Overview */}
        <MetricsGrid />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Compliance Score (spans 2 columns) */}
          <div className="xl:col-span-2">
            <ComplianceScoreCard />
          </div>

          {/* Connection Status */}
          <ConnectionStatus />
        </div>

        {/* Charts Section */}
        <ComplianceChart />

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksPanel />
          <AnalyticsDashboard />
        </div>
      </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
