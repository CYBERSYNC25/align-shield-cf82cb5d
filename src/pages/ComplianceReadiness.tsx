import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertTriangle,
  Target,
  Shield,
  FileCheck,
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
  ArrowRight,
  Clock,
  User,
  ExternalLink,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { useComplianceReadiness, CriticalControl } from '@/hooks/useComplianceReadiness';
import { LoadingSpinner } from '@/components/common';

const ComplianceReadiness = () => {
  const { metrics, loading, refresh } = useComplianceReadiness();
  const navigate = useNavigate();

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex flex-1 pt-16">
          <Sidebar />
          <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <LoadingSpinner />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const getReadinessColor = (score: number) => {
    if (score >= 95) return 'text-success';
    if (score >= 80) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getReadinessLabel = (level: string) => {
    switch (level) {
      case 'ready': return { label: 'Pronto para Certificação', color: 'bg-success/10 text-success border-success/20' };
      case 'almost-ready': return { label: 'Quase Pronto', color: 'bg-primary/10 text-primary border-primary/20' };
      case 'in-progress': return { label: 'Em Progresso', color: 'bg-warning/10 text-warning border-warning/20' };
      case 'getting-started': return { label: 'Começando', color: 'bg-info/10 text-info border-info/20' };
      default: return { label: 'Não Pronto', color: 'bg-destructive/10 text-destructive border-destructive/20' };
    }
  };

  const getPriorityBadge = (priority: CriticalControl['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Alto</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Médio</Badge>;
    }
  };

  const handleGoToControl = (control: CriticalControl) => {
    navigate(`/controls?framework=${control.frameworkId}&control=${control.id}`);
  };

  const readinessStatus = getReadinessLabel(metrics.readinessLevel);
  const top3CriticalControls = metrics.criticalControls.slice(0, 3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-foreground tracking-tight truncate">
                  Prontidão para Certificação
                </h1>
                <p className="text-muted-foreground line-clamp-2">
                  O que você precisa fazer HOJE para aumentar sua conformidade
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
                <Button size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Relatório
                </Button>
              </div>
            </div>

            {/* Main Score + Critical Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Overall Score Card */}
              <div className="lg:col-span-4">
                <Card className="h-full bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="pt-6 flex flex-col items-center justify-center h-full min-h-[280px]">
                    <div className="text-center space-y-4">
                      <div className="p-4 rounded-full bg-primary/10 inline-block">
                        <Shield className="h-10 w-10 text-primary" />
                      </div>
                      <div className={`text-6xl font-bold ${getReadinessColor(metrics.overallScore)}`}>
                        {metrics.overallScore}%
                      </div>
                      <Badge variant="secondary" className={readinessStatus.color}>
                        {readinessStatus.label}
                      </Badge>
                      <Progress value={metrics.overallScore} className="h-3 w-full max-w-[200px] mx-auto" />
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>~{metrics.estimatedDaysToReady} dias para 100%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Critical Actions */}
              <div className="lg:col-span-8">
                <Card className="h-full bg-destructive/5 border-destructive/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Ações Prioritárias para Hoje
                      {top3CriticalControls.length > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {metrics.criticalControls.length} pendentes
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {top3CriticalControls.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                        <p className="font-medium text-foreground">Todos os controles estão em dia!</p>
                        <p className="text-sm">Continue monitorando para manter a conformidade.</p>
                      </div>
                    ) : (
                      top3CriticalControls.map((control) => (
                        <div 
                          key={control.id}
                          className="bg-background/80 rounded-lg p-4 border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                  {control.code}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {control.framework}
                                </Badge>
                                {getPriorityBadge(control.priority)}
                              </div>
                              <h4 className="font-semibold text-foreground truncate">{control.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {control.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {control.owner}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Prazo: {control.nextReview}
                                </span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleGoToControl(control)}
                              className="flex-shrink-0 gap-1"
                            >
                              Resolver
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    {metrics.criticalControls.length > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground gap-2"
                        onClick={() => navigate('/controls')}
                      >
                        Ver todos os {metrics.criticalControls.length} controles pendentes
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-surface-elevated border-card-border">
                <CardContent className="pt-4 pb-4 flex flex-col items-center justify-center text-center">
                  <FileCheck className="h-5 w-5 text-primary mb-2" />
                  <div className="text-2xl font-bold text-foreground">{metrics.frameworks.length}</div>
                  <div className="text-xs text-muted-foreground">Frameworks</div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated border-card-border">
                <CardContent className="pt-4 pb-4 flex flex-col items-center justify-center text-center">
                  <Zap className="h-5 w-5 text-success mb-2" />
                  <div className="text-2xl font-bold text-success">{metrics.integrations.active}</div>
                  <div className="text-xs text-muted-foreground">Integrações Ativas</div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated border-card-border">
                <CardContent className="pt-4 pb-4 flex flex-col items-center justify-center text-center">
                  <Activity className="h-5 w-5 text-primary mb-2" />
                  <div className="text-2xl font-bold text-primary">{metrics.policies.approved}</div>
                  <div className="text-xs text-muted-foreground">Políticas Aprovadas</div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated border-card-border">
                <CardContent className="pt-4 pb-4 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
                  <div className="text-2xl font-bold text-destructive">{metrics.risks.high}</div>
                  <div className="text-xs text-muted-foreground">Riscos Alto/Crítico</div>
                </CardContent>
              </Card>
            </div>

            {/* Framework Cards Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Status por Framework
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {metrics.frameworks.map((framework) => (
                  <Card 
                    key={framework.frameworkId} 
                    className="h-full bg-surface-elevated border-card-border hover:border-primary/30 transition-colors flex flex-col"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-foreground truncate">
                          {framework.framework}
                        </CardTitle>
                        {framework.certificationReady ? (
                          <Badge className="gap-1 bg-success/10 text-success border-success/20 flex items-center">
                            <CheckCircle className="h-3 w-3" />
                            Pronto
                          </Badge>
                        ) : (
                          <span className={`text-2xl font-bold ${getReadinessColor(framework.score)}`}>
                            {framework.score}%
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <Progress value={framework.score} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-success/10 rounded">
                          <div className="font-bold text-success">{framework.implementedControls}</div>
                          <div className="text-xs text-muted-foreground">OK</div>
                        </div>
                        <div className="text-center p-2 bg-warning/10 rounded">
                          <div className="font-bold text-warning">{framework.partialControls}</div>
                          <div className="text-xs text-muted-foreground">Parcial</div>
                        </div>
                        <div className="text-center p-2 bg-destructive/10 rounded">
                          <div className="font-bold text-destructive">{framework.pendingControls}</div>
                          <div className="text-xs text-muted-foreground">Pendente</div>
                        </div>
                      </div>

                      {/* Quick Actions for this framework */}
                      {framework.criticalControls.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border mt-auto">
                          <div className="text-xs font-medium text-muted-foreground">
                            Próxima ação:
                          </div>
                          <div 
                            className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors gap-2"
                            onClick={() => handleGoToControl(framework.criticalControls[0])}
                          >
                            <div className="flex items-center gap-2 text-sm min-w-0">
                              <Target className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="font-mono text-xs flex-shrink-0">{framework.criticalControls[0].code}</span>
                              <span className="text-foreground truncate">
                                {framework.criticalControls[0].title}
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default ComplianceReadiness;