import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Shield,
  FileCheck,
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
} from 'lucide-react';
import { useComplianceReadiness } from '@/hooks/useComplianceReadiness';
import { LoadingSpinner } from '@/components/common';

const ComplianceReadiness = () => {
  const { metrics, loading, refresh } = useComplianceReadiness();

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
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

  const readinessStatus = getReadinessLabel(metrics.readinessLevel);

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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    Prontidão para Certificação
                  </h1>
                  <p className="text-muted-foreground">
                    Monitore seu progresso e prepare-se para auditoria de compliance
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Relatório Completo
                  </Button>
                </div>
              </div>
            </div>

            {/* Overall Readiness Score - Full Width */}
            <div className="col-span-full">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">
                            Pontuação Geral de Conformidade
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Baseado em controles, evidências, políticas e integrações
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className={`text-6xl font-bold ${getReadinessColor(metrics.overallScore)}`}>
                        {metrics.overallScore}%
                      </div>
                      <Badge variant="secondary" className={readinessStatus.color}>
                        {readinessStatus.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <Progress value={metrics.overallScore} className="h-4" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {metrics.frameworks.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Frameworks</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {metrics.integrations.active}
                        </div>
                        <div className="text-xs text-muted-foreground">Integrações Ativas</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {metrics.policies.approved}
                        </div>
                        <div className="text-xs text-muted-foreground">Políticas Aprovadas</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-foreground">
                          <Calendar className="h-5 w-5" />
                          {metrics.estimatedDaysToReady}
                        </div>
                        <div className="text-xs text-muted-foreground">Dias até Pronto</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Framework Breakdown Section - Full Width */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Prontidão por Framework
              </h2>
            </div>
            
            {/* Framework Cards - 2 columns on lg */}
            {metrics.frameworks.map((framework, index) => (
              <div key={index} className="col-span-full lg:col-span-6">
                <Card className="bg-surface-elevated border-card-border h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                        <FileCheck className="h-4 w-4" />
                        {framework.framework}
                      </CardTitle>
                      {framework.certificationReady ? (
                        <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3" />
                          Pronto
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {framework.score}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <Progress value={framework.score} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-success/10 rounded">
                        <div className="font-bold text-success">{framework.implementedControls}</div>
                        <div className="text-xs text-muted-foreground">Implementado</div>
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

                    {framework.gaps.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Gaps Identificados:</div>
                        {framework.gaps.map((gap, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <AlertCircle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{gap}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {framework.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Recomendações:</div>
                        {framework.recommendations.slice(0, 2).map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <Target className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Key Metrics - 3 columns on md */}
            <div className="col-span-full md:col-span-4">
              <Card className="bg-surface-elevated border-card-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Integrações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">{metrics.integrations.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ativas</span>
                    <span className="font-semibold text-success">{metrics.integrations.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Coletando Evidências</span>
                    <span className="font-semibold text-primary">{metrics.integrations.collectingEvidence}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-full md:col-span-4">
              <Card className="bg-surface-elevated border-card-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <FileCheck className="h-4 w-4 text-primary" />
                    Políticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">{metrics.policies.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Aprovadas</span>
                    <span className="font-semibold text-success">{metrics.policies.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pendentes</span>
                    <span className="font-semibold text-warning">{metrics.policies.pending}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-full md:col-span-4">
              <Card className="bg-surface-elevated border-card-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    Riscos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">{metrics.risks.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alto/Crítico</span>
                    <span className="font-semibold text-destructive">{metrics.risks.high}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mitigados</span>
                    <span className="font-semibold text-success">{metrics.risks.mitigated}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ComplianceReadiness;