import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReports } from '@/hooks/useReports';
import { toast } from '@/hooks/use-toast';
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
  const { reports, loading, generateReport } = useReports();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="bg-surface-elevated border-card-border animate-pulse">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-2 bg-muted rounded w-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getIconComponent = (framework: string) => {
    const iconMap: Record<string, any> = {
      'SOC 2': Shield,
      'ISO 27001': Building,
      'LGPD': Users,
      'Multi-Framework': FileText,
      'GRC': Building,
      'Security': AlertTriangle
    };
    return iconMap[framework] || FileText;
  };

  const getIconColor = (framework: string) => {
    const colorMap: Record<string, string> = {
      'SOC 2': 'text-primary',
      'ISO 27001': 'text-info',
      'LGPD': 'text-success',
      'Multi-Framework': 'text-accent',
      'GRC': 'text-warning',
      'Security': 'text-destructive'
    };
    return colorMap[framework] || 'text-primary';
  };

  const handleGenerateReport = async (reportId: string, reportName: string) => {
    await generateReport(reportId);
  };

  const handlePreview = (reportName: string) => {
    toast({
      title: "Prévia do Relatório",
      description: `Abrindo prévia de "${reportName}"...`,
    });
  };

  const handleShare = (reportName: string) => {
    toast({
      title: "Link Compartilhado",
      description: `Link seguro gerado para "${reportName}".`,
    });
  };

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
          {reports.length} templates
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((report, index) => {
          const IconComponent = getIconComponent(report.framework);
          const iconColor = getIconColor(report.framework);
          
          return (
            <Card key={index} className="bg-surface-elevated border-card-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-muted/20`}>
                      <IconComponent className={`h-4 w-4 ${iconColor}`} />
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
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => handleGenerateReport(report.id, report.name)}
                    disabled={report.status === 'generating'}
                  >
                    <Download className="h-4 w-4" />
                    {report.status === 'generating' ? 'Gerando...' : 'Gerar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handlePreview(report.name)}
                  >
                    <Eye className="h-4 w-4" />
                    Prévia
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleShare(report.name)}
                  >
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