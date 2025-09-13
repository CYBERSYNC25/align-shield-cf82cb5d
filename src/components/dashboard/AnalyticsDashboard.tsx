import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Users,
  FileText,
  Target
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const complianceMetrics = [
    {
      title: 'Score Geral de Compliance',
      value: 87,
      change: +5,
      trend: 'up',
      description: 'Média ponderada de todos os frameworks',
      color: 'success'
    },
    {
      title: 'Controles Implementados',
      value: 156,
      total: 180,
      change: +12,
      trend: 'up',
      description: 'Controles ativos vs. totais necessários',
      color: 'info'
    },
    {
      title: 'Riscos Críticos',
      value: 3,
      change: -2,
      trend: 'down',
      description: 'Riscos com nível crítico identificados',
      color: 'danger'
    },
    {
      title: 'Evidências Coletadas',
      value: 324,
      change: +28,
      trend: 'up',
      description: 'Documentos e evidências no último mês',
      color: 'primary'
    }
  ];

  const frameworkProgress = [
    { name: 'SOC 2 Type II', progress: 89, status: 'good', controls: 57, total: 64 },
    { name: 'ISO 27001:2022', progress: 92, status: 'excellent', controls: 105, total: 114 },
    { name: 'LGPD', progress: 76, status: 'warning', controls: 32, total: 42 },
    { name: 'GDPR', progress: 83, status: 'good', controls: 31, total: 38 },
    { name: 'PCI DSS', progress: 94, status: 'excellent', controls: 47, total: 50 }
  ];

  const recentActivities = [
    {
      icon: CheckCircle,
      title: 'Auditoria SOC 2 concluída',
      description: '3 não-conformidades identificadas',
      time: '2h atrás',
      type: 'success'
    },
    {
      icon: AlertTriangle,
      title: 'Controle CC6.1 falhando',
      description: 'Acesso privilegiado sem MFA',
      time: '4h atrás',
      type: 'warning'
    },
    {
      icon: FileText,
      title: 'Nova política publicada',
      description: 'Política de Gestão de Acessos v2.1',
      time: '6h atrás',
      type: 'info'
    },
    {
      icon: Users,
      title: 'Revisão de acesso iniciada',
      description: '45 usuários para revisão',
      time: '8h atrás',
      type: 'info'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'danger': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytics & Insights</h2>
          <p className="text-lg text-muted-foreground">
            Visão detalhada da postura de compliance e métricas de segurança
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/reports'}>
            <BarChart3 className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button className="gap-2" onClick={() => window.location.href = '/analytics'}>
            <PieChart className="h-4 w-4" />
            Dashboard Executivo
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {complianceMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {metric.value}
                  </span>
                  {metric.total && (
                    <span className="text-sm text-muted-foreground">
                      / {metric.total}
                    </span>
                  )}
                </div>
                
                {metric.total && (
                  <Progress 
                    value={(metric.value / metric.total) * 100} 
                    className="h-2"
                  />
                )}
                
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress dos Frameworks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Progresso por Framework
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {frameworkProgress.map((framework, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      {framework.name}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(framework.status)}
                    >
                      {framework.progress}%
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {framework.controls}/{framework.total} controles
                  </span>
                </div>
                <Progress value={framework.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-lg bg-muted/50`}>
                    <activity.icon className={`h-4 w-4 ${getActivityIcon(activity.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Métricas Avançadas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas de Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">92%</div>
                  <div className="text-sm text-green-600">Meta Atingida</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">15</div>
                  <div className="text-sm text-blue-600">Dias para Auditoria</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">7</div>
                  <div className="text-sm text-orange-600">Ações Pendentes</div>
                </div>
              </div>
              
              {/* Gráfico de Metas de Compliance */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Progresso das Metas Mensais</h4>
                
                {/* Barra de Progresso Principal */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Meta Geral de Compliance</span>
                    <span className="text-sm font-bold text-primary">87% / 90%</span>
                  </div>
                  <Progress value={87} className="h-3" />
                  <p className="text-xs text-muted-foreground">Faltam 3% para atingir a meta mensal</p>
                </div>

                {/* Sub-metas por Framework */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-foreground">SOC 2</span>
                        <span className="text-xs text-success">89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-foreground">ISO 27001</span>
                        <span className="text-xs text-success">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-foreground">LGPD</span>
                        <span className="text-xs text-warning">76%</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-foreground">GDPR</span>
                        <span className="text-xs text-success">83%</span>
                      </div>
                      <Progress value={83} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Timeline Visual */}
                <div className="mt-6 p-4 bg-surface-elevated rounded-lg border border-card-border">
                  <h5 className="text-sm font-medium text-foreground mb-3">Cronograma de Auditoria</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-success"></div>
                      <span className="text-xs text-foreground">SOC 2 - Concluída (15/Jan)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                      <span className="text-xs text-foreground">ISO 27001 - Em Progresso (30/Jan)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-muted border-2 border-warning"></div>
                      <span className="text-xs text-foreground">LGPD - Agendada (15/Fev)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Pontos Fortes */}
              <div className="relative p-6 bg-gradient-to-br from-success/8 to-success/4 rounded-2xl border border-success/15 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute top-4 right-4">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-success/15 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <h4 className="text-base font-bold text-success">Pontos Fortes</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-success/95 leading-relaxed">
                      ISO 27001 com 92% de conformidade
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-success/95 leading-relaxed">
                      PCI DSS quase certificado (94%)
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-success/95 leading-relaxed">
                      Programa de treinamento ativo
                    </p>
                  </div>
                </div>
              </div>

              {/* Atenção Necessária */}
              <div className="relative p-6 bg-gradient-to-br from-warning/8 to-warning/4 rounded-2xl border border-warning/15 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute top-4 right-4">
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-warning/15 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                  <h4 className="text-base font-bold text-warning">Atenção Necessária</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-warning/95 leading-relaxed">
                      LGPD precisa de melhorias (76%)
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-warning/95 leading-relaxed">
                      3 controles críticos falhando
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-warning/95 leading-relaxed">
                      Revisão de acessos em atraso
                    </p>
                  </div>
                </div>
              </div>

              {/* Próximos Passos */}
              <div className="relative p-6 bg-gradient-to-br from-primary/8 to-primary/4 rounded-2xl border border-primary/15 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute top-4 right-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-base font-bold text-primary">Próximos Passos</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-primary/95 leading-relaxed">
                      Finalizar auditoria SOC 2 (15 dias)
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-primary/95 leading-relaxed">
                      Implementar MFA corporativo
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm font-medium text-primary/95 leading-relaxed">
                      Atualizar políticas LGPD
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;