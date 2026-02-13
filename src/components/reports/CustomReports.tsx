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

  // Empty - user creates their own reports
  const customReports: any[] = [];

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

  const handleViewReport = (report: any) => {
    setSelectedReport({
      name: report.name,
      description: report.description,
      framework: report.filters?.frameworks?.join(', ') || 'N/A',
      pages: 'N/A',
      size: 'N/A',
      sections: report.metrics || [],
      audience: report.recipients?.join(', ') || 'N/A',
      readiness: 0
    });
    setPreviewOpen(true);
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
          {customReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Nenhum relatório personalizado
              </h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                Crie relatórios personalizados selecionando métricas, filtros e formato de saída para acompanhar sua compliance.
              </p>
              <Button onClick={() => setCreateReportOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {customReports.map((report, index) => (
                <Card key={index} className="bg-surface-elevated border-card-border">
                  <CardContent className="p-4">
                    <p>{report.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Frameworks</h4>
                  <div className="space-y-1">
                    {reportBuilder.frameworks.map((framework, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">{framework}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Formatos</h4>
                  <div className="space-y-1">
                    {reportBuilder.formats.map((format, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                        <FileText className="h-3 w-3 mr-1" />{format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Frequência</h4>
                  <div className="space-y-1">
                    {reportBuilder.frequencies.map((freq, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">{freq}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="gap-2" onClick={() => setCreateReportOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Criar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateReportModal isOpen={createReportOpen} onClose={() => setCreateReportOpen(false)} />
      <ReportPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} report={selectedReport} />
      <ConfigureReportModal isOpen={configureOpen} onClose={() => setConfigureOpen(false)} report={selectedReport} />
    </div>
  );
};

export default CustomReports;
