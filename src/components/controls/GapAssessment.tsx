import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Clock, Users, FileText, Download } from 'lucide-react';

const gapData = [
  {
    id: 'gap-1',
    control: 'CC6.1',
    title: 'Controle de Acesso Lógico',
    frameworks: ['SOC 2', 'ISO 27001'],
    severity: 'high',
    description: 'Implementação de controles de acesso baseado em funções (RBAC)',
    currentStatus: 'partial',
    requiredActions: [
      'Configurar RBAC no sistema de IAM',
      'Definir matriz de autorização por função',
      'Implementar revisões periódicas de acesso'
    ],
    assignedTo: 'DevOps Team',
    dueDate: '2024-01-15',
    effort: 'medium'
  },
  {
    id: 'gap-2',
    control: 'A.5.8',
    title: 'Classificação da Informação',
    frameworks: ['ISO 27001', 'LGPD'],
    severity: 'medium',
    description: 'Estabelecer esquema de classificação de dados pessoais e sensíveis',
    currentStatus: 'missing',
    requiredActions: [
      'Desenvolver política de classificação de dados',
      'Implementar tags de classificação automática',
      'Treinar equipe sobre categorização'
    ],
    assignedTo: 'Security Team',
    dueDate: '2024-01-30',
    effort: 'high'
  },
  {
    id: 'gap-3',
    control: 'LGPD.Art.46',
    title: 'Relatório de Impacto à Proteção de Dados',
    frameworks: ['LGPD', 'GDPR'],
    severity: 'high',
    description: 'Elaboração de RIPD para tratamentos de alto risco',
    currentStatus: 'missing',
    requiredActions: [
      'Identificar tratamentos de alto risco',
      'Desenvolver template de RIPD',
      'Conduzir avaliações de impacto'
    ],
    assignedTo: 'Legal Team',
    dueDate: '2024-02-15',
    effort: 'high'
  }
];

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
    case 'missing':
      return 'text-danger bg-danger/10';
    case 'partial':
      return 'text-warning bg-warning/10';
    case 'implemented':
      return 'text-success bg-success/10';
    default:
      return 'text-muted-foreground bg-muted/10';
  }
};

const getEffortIcon = (effort: string) => {
  switch (effort) {
    case 'high':
      return <TrendingUp className="w-4 h-4 text-danger" />;
    case 'medium':
      return <Clock className="w-4 h-4 text-warning" />;
    case 'low':
      return <Clock className="w-4 h-4 text-success" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const GapAssessment = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Análise de Gaps Críticos
        </h2>
        <Button variant="outline" size="sm" className="gap-2">
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
                      {gap.severity === 'high' ? 'Alto' : gap.severity === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {gap.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {gap.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`text-xs ${getStatusColor(gap.currentStatus)}`}>
                    {gap.currentStatus === 'missing' ? 'Não Implementado' : 
                     gap.currentStatus === 'partial' ? 'Parcial' : 'Implementado'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getEffortIcon(gap.effort)}
                    <span>{gap.effort === 'high' ? 'Alto Esforço' : 
                           gap.effort === 'medium' ? 'Médio Esforço' : 'Baixo Esforço'}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Frameworks */}
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

              {/* Required Actions */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Ações Necessárias:</span>
                <ul className="space-y-1 ml-4">
                  {gap.requiredActions.map((action, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Assignment and Timeline */}
              <div className="flex items-center justify-between pt-2 border-t border-card-border">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{gap.assignedTo}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Prazo: {new Date(gap.dueDate).toLocaleDateString('pt-BR')}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">2</div>
              <div className="text-sm text-muted-foreground">Gaps Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">1</div>
              <div className="text-sm text-muted-foreground">Gaps Médios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">45</div>
              <div className="text-sm text-muted-foreground">Dias Médios p/ Resolução</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground">Equipes Envolvidas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GapAssessment;