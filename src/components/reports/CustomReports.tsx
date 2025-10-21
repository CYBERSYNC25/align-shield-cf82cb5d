import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import CreateReportModal from './CreateReportModal';
import ReportPreviewModal from './ReportPreviewModal';
import ConfigureReportModal from './ConfigureReportModal';
import { 
  Plus, 
  Settings, 
  BarChart3, 
  FileText,
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

const CustomReports = () => {
  const { toast } = useToast();
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const customReports = [
    {
      name: 'Weekly Security Metrics',
      description: 'Métricas semanais personalizadas para o board de segurança',
      type: 'dashboard',
      format: 'PDF',
      frequency: 'Semanal',
      lastGenerated: '2 dias atrás',
      metrics: ['Incident Count', 'MTTR', 'Vulnerability Score', 'Compliance %'],
      filters: {
        dateRange: 'Last 30 days',
        frameworks: ['SOC 2', 'ISO 27001'],
        severity: 'High & Critical'
      },
      recipients: ['CISO', 'CTO', 'Board Members']
    },
    {
      name: 'Compliance Gap Analysis',
      description: 'Análise detalhada de gaps por framework com planos de ação',
      type: 'detailed',
      format: 'Excel',
      frequency: 'Mensal',
      lastGenerated: '1 semana atrás',
      metrics: ['Control Status', 'Evidence Quality', 'Risk Level', 'Remediation Timeline'],
      filters: {
        dateRange: 'Current Quarter',
        frameworks: ['All Active'],
        status: 'Failed & Pending'
      },
      recipients: ['Compliance Team', 'Risk Manager']
    },
    {
      name: 'Vendor Risk Dashboard',
      description: 'Dashboard executivo de riscos de terceiros e fornecedores críticos',
      type: 'executive',
      format: 'PDF',
      frequency: 'Quinzenal',
      lastGenerated: '5 dias atrás',
      metrics: ['Vendor Count', 'Risk Score', 'Assessment Status', 'SLA Compliance'],
      filters: {
        dateRange: 'Last 90 days',
        criticality: 'Critical & High',
        status: 'All'
      },
      recipients: ['Procurement', 'Risk Team', 'Legal']
    }
  ];

  const reportBuilder = {
    availableMetrics: [
      { name: 'Compliance Score', category: 'Compliance', icon: '📊' },
      { name: 'Incident Count', category: 'Security', icon: '🚨' },
      { name: 'MTTR Average', category: 'Operations', icon: '⏱️' },
      { name: 'Control Status', category: 'Compliance', icon: '✅' },
      { name: 'Risk Score', category: 'Risk', icon: '⚠️' },
      { name: 'Vulnerability Count', category: 'Security', icon: '🔍' },
      { name: 'Training Completion', category: 'Training', icon: '🎓' },
      { name: 'Policy Attestation', category: 'Governance', icon: '📋' },
      { name: 'Backup Success Rate', category: 'Operations', icon: '💾' },
      { name: 'Access Review Status', category: 'Identity', icon: '👥' }
    ],
    frameworks: ['SOC 2', 'ISO 27001', 'LGPD', 'GDPR', 'PCI DSS'],
    formats: ['PDF', 'Excel', 'PowerPoint', 'CSV'],
    frequencies: ['Uma vez', 'Diário', 'Semanal', 'Quinzenal', 'Mensal', 'Trimestral']
  };

  const getTypeBadge = (type: string) => {
    const config = {
      dashboard: { label: 'Dashboard', className: 'bg-info/10 text-info border-info/20' },
      detailed: { label: 'Detalhado', className: 'bg-primary/10 text-primary border-primary/20' },
      executive: { label: 'Executivo', className: 'bg-success/10 text-success border-success/20' }
    };
    
    const conf = config[type as keyof typeof config];
    return <Badge variant="outline" className={conf.className}>{conf.label}</Badge>;
  };

  const handleViewReport = (report: any) => {
    const mockReport = {
      name: report.name,
      description: report.description,
      framework: 'Multi-Framework',
      pages: 24,
      size: '3.2 MB',
      sections: ['Executive Summary', 'Metrics Overview', 'Detailed Analysis', 'Recommendations'],
      audience: 'Executive Team',
      readiness: 95
    };
    setSelectedReport(mockReport);
    setPreviewOpen(true);
  };

  const handleEditReport = (reportName: string) => {
    toast({
      title: "Editar Relatório",
      description: `Abrindo editor para "${reportName}"...`,
    });
  };

  const handleDeleteReport = (reportName: string) => {
    toast({
      title: "Relatório Removido",
      description: `"${reportName}" foi removido da lista.`,
    });
  };

  const handleConfigureReport = (report: any) => {
    setSelectedReport(report);
    setConfigureOpen(true);
  };

  const handleGenerateNow = (reportName: string) => {
    toast({
      title: "Gerando Relatório",
      description: `"${reportName}" está sendo gerado...`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Relatórios Personalizados
        </h2>
        <Button className="gap-2" onClick={() => setCreateReportOpen(true)}>
          <Plus className="h-4 w-4" />
          Criar Relatório
        </Button>
      </div>

      <Tabs defaultValue="my-reports" className="w-full">
        <TabsList>
          <TabsTrigger value="my-reports">
            Meus Relatórios ({customReports.length})
          </TabsTrigger>
          <TabsTrigger value="builder">
            Report Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports" className="mt-6">
          <div className="space-y-4">
            {customReports.map((report, index) => (
              <Card key={index} className="bg-surface-elevated border-card-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeBadge(report.type)}
                        <Badge variant="outline" className="text-xs">
                          {report.format}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {report.frequency}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-semibold mb-1">
                        {report.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditReport(report.name)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteReport(report.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">MÉTRICAS INCLUÍDAS</p>
                    <div className="flex flex-wrap gap-1">
                      {report.metrics.map((metric, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/10 rounded-lg">
                    <div>
                      <span className="text-xs text-muted-foreground">Período:</span>
                      <div className="font-medium text-sm">{report.filters.dateRange}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Frameworks:</span>
                      <div className="font-medium text-sm">{report.filters.frameworks?.join(', ') || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">DESTINATÁRIOS</p>
                    <div className="flex flex-wrap gap-1">
                      {report.recipients.map((recipient, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {recipient}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Gerado {report.lastGenerated}
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigureReport(report)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleGenerateNow(report.name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Agora
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Report Builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Crie relatórios personalizados selecionando métricas, filtros e formato de saída
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Métricas Disponíveis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {reportBuilder.availableMetrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center p-2 bg-muted/10 rounded border-2 border-transparent hover:border-primary/20 cursor-pointer transition-colors">
                      <span className="text-sm mr-2">{metric.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{metric.name}</p>
                        <p className="text-xs text-muted-foreground">{metric.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Options */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Frameworks</h4>
                  <div className="space-y-1">
                    {reportBuilder.frameworks.map((framework, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">Formatos</h4>
                  <div className="space-y-1">
                    {reportBuilder.formats.map((format, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                        <FileText className="h-3 w-3 mr-1" />
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">Frequência</h4>
                  <div className="space-y-1">
                    {reportBuilder.frequencies.map((freq, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                        {freq}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="gap-2" onClick={() => setCreateReportOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Criar Relatório
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Prévia
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateReportModal
        isOpen={createReportOpen}
        onClose={() => setCreateReportOpen(false)}
      />
      
      <ReportPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        report={selectedReport}
      />
      
      <ConfigureReportModal
        isOpen={configureOpen}
        onClose={() => setConfigureOpen(false)}
        report={selectedReport}
      />
    </div>
  );
};

export default CustomReports;