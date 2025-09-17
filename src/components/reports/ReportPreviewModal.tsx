import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Share2, 
  Calendar,
  BarChart3,
  Users,
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    name: string;
    description: string;
    framework: string;
    pages: number;
    size: string;
    sections: string[];
    audience: string;
    readiness: number;
  } | null;
}

const ReportPreviewModal = ({ isOpen, onClose, report }: ReportPreviewModalProps) => {
  if (!report) return null;

  const previewSections = [
    {
      title: "Executive Summary",
      content: "Resumo executivo da situação atual de compliance e principais achados da auditoria. Este relatório apresenta o status geral de conformidade do framework selecionado.",
      status: "complete"
    },
    {
      title: "Compliance Scorecard",
      content: "Scorecard detalhado com métricas de compliance, indicadores de performance e comparação com benchmarks da indústria.",
      status: "complete"
    },
    {
      title: "Control Assessment",
      content: "Avaliação detalhada dos controles implementados, evidências coletadas e gaps identificados com recomendações de remediação.",
      status: "review"
    },
    {
      title: "Risk Analysis",
      content: "Análise de riscos associados aos gaps identificados, matriz de criticidade e planos de mitigação sugeridos.",
      status: "pending"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'review':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Prévia: {report.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Report Overview */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Framework:</span>
                <div className="font-medium">{report.framework}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Audiência:</span>
                <div className="font-medium">{report.audience}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Páginas:</span>
                <div className="font-medium">{report.pages} páginas</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tamanho:</span>
                <div className="font-medium">{report.size}</div>
              </div>
            </div>

            {/* Readiness Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Status de Readiness</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${report.readiness}%` }}
                  ></div>
                </div>
                <span className="font-medium text-sm">{report.readiness}%</span>
              </div>
            </div>

            {/* Preview Sections */}
            <div className="space-y-4">
              <h4 className="font-medium">Seções do Relatório</h4>
              {previewSections.map((section, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium flex items-center gap-2">
                      {getStatusIcon(section.status)}
                      {section.title}
                    </h5>
                    <Badge 
                      variant="outline" 
                      className={
                        section.status === 'complete' ? 'bg-success/10 text-success border-success/20' :
                        section.status === 'review' ? 'bg-warning/10 text-warning border-warning/20' :
                        'bg-muted/10 text-muted-foreground'
                      }
                    >
                      {section.status === 'complete' ? 'Completo' :
                       section.status === 'review' ? 'Em Revisão' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{section.content}</p>
                </div>
              ))}
            </div>

            {/* Sample Charts/Graphics */}
            <div className="space-y-4">
              <h4 className="font-medium">Gráficos e Visualizações</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4 h-32 flex items-center justify-center bg-muted/5">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Compliance Score</p>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4 h-32 flex items-center justify-center bg-muted/5">
                  <div className="text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p className="text-sm text-muted-foreground">Risk Matrix</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreviewModal;