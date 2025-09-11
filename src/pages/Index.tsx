import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ComplianceScoreCard from '@/components/dashboard/ComplianceScoreCard';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TasksPanel from '@/components/dashboard/TasksPanel';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
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
              <div className="flex items-center space-x-2">
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

          {/* Metrics Overview */}
          <div className="animate-fade-in">
            <MetricsGrid />
          </div>

          {/* Compliance Framework Scores */}
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Score por Framework
              </h2>
              <Button variant="outline" className="hover-scale">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {complianceData.map((data, index) => (
                <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ComplianceScoreCard {...data} />
                </div>
              ))}
            </div>
          </div>

          {/* Tasks and Widgets */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 animate-fade-in">
              <TasksPanel />
            </div>
            
            <div className="space-y-6">
              {/* Connection Status */}
              <ConnectionStatus />
              
              {/* Quick Actions */}
              <div className="bg-surface-elevated/80 backdrop-blur-sm rounded-xl border border-card-border/60 p-6 space-y-4 shadow-card hover-lift">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Ações Rápidas</h3>
                </div>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto text-left hover:bg-muted/80 hover-scale rounded-lg"
                    >
                      <action.icon className={`h-4 w-4 mr-3 text-${action.color}`} />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-surface-elevated/80 backdrop-blur-sm rounded-xl border border-card-border/60 p-6 space-y-4 shadow-card hover-lift">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Clock className="h-5 w-5 text-info" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Atividades Recentes</h3>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg bg-${activity.status}/10`}>
                        <activity.icon className={`h-4 w-4 text-${activity.status}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
