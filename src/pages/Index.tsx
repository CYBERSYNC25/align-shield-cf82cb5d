import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ComplianceScoreCard from '@/components/dashboard/ComplianceScoreCard';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TasksPanel from '@/components/dashboard/TasksPanel';

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard de Conformidade
            </h1>
            <p className="text-muted-foreground">
              Visão geral da postura de segurança e conformidade da organização
            </p>
          </div>

          {/* Metrics Overview */}
          <MetricsGrid />

          {/* Compliance Framework Scores */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Score por Framework
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {complianceData.map((data, index) => (
                <ComplianceScoreCard
                  key={index}
                  {...data}
                />
              ))}
            </div>
          </div>

          {/* Tasks and Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TasksPanel />
            </div>
            
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-surface-elevated rounded-lg border border-card-border p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Ações Rápidas</h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
                    📊 Executar coleta de evidências
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
                    📋 Gerar relatório SOC 2
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
                    👥 Iniciar revisão de acessos
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
                    🔒 Configurar nova integração
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-surface-elevated rounded-lg border border-card-border p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Atividades Recentes</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-foreground">AWS IAM coleta concluída</p>
                      <p className="text-muted-foreground">5 min atrás</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-foreground">Nova política publicada</p>
                      <p className="text-muted-foreground">2h atrás</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-info rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-foreground">Revisão de acesso iniciada</p>
                      <p className="text-muted-foreground">4h atrás</p>
                    </div>
                  </div>
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
