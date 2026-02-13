import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Clock, Users, Download, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useMemo } from 'react';

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'text-danger bg-danger/10 border-danger/20';
    case 'medium':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'low':
      return 'text-info bg-info/10 border-info/20';
    default:
      return 'text-muted-foreground bg-muted/10 border-muted/20';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'failed':
      return 'text-danger bg-danger/10';
    case 'pending':
      return 'text-warning bg-warning/10';
    default:
      return 'text-muted-foreground bg-muted/10';
  }
};

const GapAssessment = () => {
  const { toast } = useToast();
  const { controls, frameworks, loading } = useFrameworks();

  const gapData = useMemo(() => {
    const gaps = controls.filter(c => c.status === 'failed' || c.status === 'pending');
    return gaps.map(c => {
      const framework = frameworks.find(f => f.id === c.framework_id);
      const severity = c.status === 'failed' ? 'high' : 'medium';
      return {
        id: c.id,
        control: c.code,
        title: c.title,
        frameworks: framework ? [framework.name] : [],
        severity,
        description: c.description || 'Sem descrição',
        currentStatus: c.status,
        owner: c.owner || 'Não atribuído',
        category: c.category,
      };
    });
  }, [controls, frameworks]);

  const summary = useMemo(() => {
    const critical = gapData.filter(g => g.severity === 'high').length;
    const medium = gapData.filter(g => g.severity === 'medium').length;
    const owners = new Set(gapData.map(g => g.owner).filter(o => o !== 'Não atribuído'));
    return { critical, medium, total: gapData.length, teams: owners.size };
  }, [gapData]);

  const handleExportReport = () => {
    if (gapData.length === 0) return;
    toast({ title: "Gerando Relatório", description: "Preparando relatório de análise de gaps..." });

    setTimeout(() => {
      const reportContent = `RELATÓRIO DE ANÁLISE DE GAPS
========================================
Data: ${new Date().toLocaleDateString('pt-BR')}

RESUMO
------
Total de Gaps: ${summary.total}
Gaps Críticos (failed): ${summary.critical}
Gaps Médios (pending): ${summary.medium}
Equipes Envolvidas: ${summary.teams}

DETALHAMENTO
------------
${gapData.map((gap, i) => `
${i + 1}. ${gap.title} (${gap.control})
   Severidade: ${gap.severity === 'high' ? 'Alta' : 'Média'}
   Status: ${gap.currentStatus === 'failed' ? 'Falhou' : 'Pendente'}
   Frameworks: ${gap.frameworks.join(', ') || 'N/A'}
   Responsável: ${gap.owner}
`).join('\n')}

Gerado em: ${new Date().toLocaleString('pt-BR')}
`;
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analise-gaps-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Relatório Exportado", description: "O relatório foi baixado com sucesso." });
    }, 500);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Análise de Gaps Críticos</h2>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (gapData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Análise de Gaps Críticos</h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mb-4 text-success opacity-70" />
            <p className="font-medium text-foreground">Nenhum gap identificado</p>
            <p className="text-sm mt-1">Todos os controles estão em conformidade ou ainda não foram cadastrados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Análise de Gaps Críticos
        </h2>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportReport}>
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      <div className="grid gap-4">
        {gapData.map((gap) => (
          <Card key={gap.id} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {gap.control}
                    </Badge>
                    <Badge className={`text-xs ${getSeverityColor(gap.severity)}`}>
                      {gap.severity === 'high' ? 'Alto' : 'Médio'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {gap.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {gap.description}
                  </p>
                </div>
                <Badge className={`text-xs ${getStatusColor(gap.currentStatus)}`}>
                  {gap.currentStatus === 'failed' ? 'Falhou' : 'Pendente'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                {gap.frameworks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Frameworks:</span>
                    <div className="flex gap-1">
                      {gap.frameworks.map((framework) => (
                        <Badge key={framework} variant="secondary" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Categoria:</span>
                  <Badge variant="outline" className="text-xs">{gap.category}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-card-border">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{gap.owner}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Resumo de Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">{summary.critical}</div>
              <div className="text-sm text-muted-foreground">Gaps Críticos (failed)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{summary.medium}</div>
              <div className="text-sm text-muted-foreground">Gaps Médios (pending)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.teams}</div>
              <div className="text-sm text-muted-foreground">Equipes Envolvidas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GapAssessment;
