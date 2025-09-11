import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Eye, 
  Share2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Building,
  Users
} from 'lucide-react';

const ReadyReports = () => {
  const reportTemplates = [
    {
      name: 'SOC 2 Readiness Report',
      description: 'Avaliação completa de conformidade SOC 2 Type II com gaps e recomendações',
      framework: 'SOC 2',
      readiness: 89,
      status: 'ready',
      lastGenerated: '2 horas atrás',
      size: '4.2 MB',
      pages: 47,
      sections: ['Trust Services Criteria', 'Control Assessment', 'Evidence Summary', 'Gap Analysis'],
      audience: 'Auditores Externos',
      icon: Shield,
      color: 'text-primary'
    },
    {
      name: 'ISO 27001 Compliance Scorecard',
      description: 'Scorecard executivo de conformidade ISO 27001:2022 com métricas de maturidade',
      framework: 'ISO 27001',
      readiness: 92,
      status: 'ready',
      lastGenerated: '1 dia atrás',
      size: '2.8 MB',
      pages: 32,
      sections: ['ISMS Overview', 'Annex A Controls', 'Risk Assessment', 'Management Review'],
      audience: 'C-Level',
      icon: Building,
      color: 'text-info'
    },
    {
      name: 'LGPD Maturity Assessment',
      description: 'Avaliação de maturidade LGPD com registro de atividades de tratamento',
      framework: 'LGPD',
      readiness: 76,
      status: 'updating',
      lastGenerated: '3 dias atrás',
      size: '1.9 MB',
      pages: 28,
      sections: ['Princípios LGPD', 'Base Legal', 'DPO Report', 'Incident Response'],
      audience: 'Jurídico & DPO',
      icon: Users,
      color: 'text-success'
    },
    {
      name: 'Executive Security Dashboard',
      description: 'Dashboard executivo com KPIs de segurança e resumo de postura de risco',
      framework: 'Multi-Framework',
      readiness: 94,
      status: 'ready',
      lastGenerated: '6 horas atrás',
      size: '1.1 MB',
      pages: 12,
      sections: ['Security Metrics', 'Risk Overview', 'Compliance Status', 'Recommendations'],
      audience: 'Board & Executives',
      icon: FileText,
      color: 'text-accent'
    },
    {
      name: 'Third-Party Risk Report',
      description: 'Relatório detalhado de riscos de terceiros com avaliações e mitigações',
      framework: 'GRC',
      readiness: 87,
      status: 'ready',
      lastGenerated: '12 horas atrás',
      size: '3.4 MB',
      pages: 41,
      sections: ['Vendor Assessment', 'Risk Matrix', 'Due Diligence', 'Action Plans'],
      audience: 'Procurement & Risk',
      icon: Building,
      color: 'text-warning'
    },
    {
      name: 'Incident Response Summary',
      description: 'Resumo de incidentes de segurança com métricas de resposta e lições aprendidas',
      framework: 'Security',
      readiness: 83,
      status: 'ready',
      lastGenerated: '18 horas atrás',
      size: '2.1 MB',
      pages: 24,
      sections: ['Incident Timeline', 'Response Metrics', 'Root Cause Analysis', 'Improvements'],
      audience: 'Security Team',
      icon: AlertTriangle,
      color: 'text-destructive'
    }
  ];

  const getStatusBadge = (status: string, readiness: number) => {
    if (status === 'updating') {
      return <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3" />Atualizando</Badge>;
    }
    if (readiness >= 90) {
      return <Badge variant="secondary" className="bg-success/10 text-success border-success/20 gap-1"><CheckCircle className="h-3 w-3" />Pronto</Badge>;
    }
    if (readiness >= 80) {
      return <Badge variant="outline" className="gap-1 bg-info/10 text-info border-info/20"><Shield className="h-3 w-3" />Disponível</Badge>;
    }
    return <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20"><AlertTriangle className="h-3 w-3" />Em Progresso</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Relatórios Prontos
        </h2>
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          {reportTemplates.length} templates
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reportTemplates.map((report, index) => {
          const IconComponent = report.icon;
          
          return (
            <Card key={index} className="bg-surface-elevated border-card-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-muted/20`}>
                      <IconComponent className={`h-4 w-4 ${report.color}`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.framework}
                    </Badge>
                  </div>
                  {getStatusBadge(report.status, report.readiness)}
                </div>
                
                <CardTitle className="text-base font-semibold mb-2">
                  {report.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Readiness Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Readiness:</span>
                    <span className="font-medium">{report.readiness}%</span>
                  </div>
                  <Progress value={report.readiness} className="h-2" />
                </div>

                {/* Report Details */}
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">{report.pages}</span> páginas
                  </div>
                  <div>
                    <span className="font-medium">{report.size}</span>
                  </div>
                  <div>
                    <span className="font-medium">{report.sections.length}</span> seções
                  </div>
                </div>

                {/* Audience */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">AUDIÊNCIA</p>
                  <Badge variant="outline" className="text-xs">
                    {report.audience}
                  </Badge>
                </div>

                {/* Sections Preview */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">SEÇÕES PRINCIPAIS</p>
                  <div className="space-y-1">
                    {report.sections.slice(0, 3).map((section, idx) => (
                      <div key={idx} className="text-xs text-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {section}
                      </div>
                    ))}
                    {report.sections.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{report.sections.length - 3} seções adicionais
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 gap-1">
                    <Download className="h-4 w-4" />
                    Gerar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-4 w-4" />
                    Prévia
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>

                {/* Last Generated */}
                <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  Gerado {report.lastGenerated}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ReadyReports;