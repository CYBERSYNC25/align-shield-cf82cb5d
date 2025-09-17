import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  Calendar, 
  Database,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudits } from '@/hooks/useAudits';

const AuditReportModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedAudit, setSelectedAudit] = useState('all');
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeChecklists, setIncludeChecklists] = useState(true);
  const [includeFindings, setIncludeFindings] = useState(true);
  
  const { toast } = useToast();
  const { audits, evidence, stats } = useAudits();

  const reportTypes = [
    { 
      value: 'compliance', 
      label: 'Relatório de Conformidade', 
      description: 'Relatório completo de conformidade com evidências e controles',
      icon: Shield
    },
    { 
      value: 'evidence', 
      label: 'Inventário de Evidências', 
      description: 'Lista detalhada de todas as evidências coletadas',
      icon: Database
    },
    { 
      value: 'audit-summary', 
      label: 'Resumo de Auditoria', 
      description: 'Sumário executivo do status das auditorias',
      icon: BarChart3
    },
    { 
      value: 'gap-analysis', 
      label: 'Análise de Gaps', 
      description: 'Identificação de lacunas na conformidade',
      icon: AlertTriangle
    }
  ];

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de relatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const reportTypeName = reportTypes.find(t => t.value === reportType)?.label || 'Relatório';
      const auditFilter = selectedAudit === 'all' ? 'todas as auditorias' : audits.find(a => a.id === selectedAudit)?.name || 'auditoria selecionada';
      const frameworkFilter = selectedFramework === 'all' ? 'todos os frameworks' : selectedFramework.toUpperCase();
      
      toast({
        title: "Relatório Gerado",
        description: `${reportTypeName} para ${auditFilter} (${frameworkFilter}) foi gerado com sucesso e está sendo baixado.`,
      });

      // Simulate file download
      const filename = `${reportTypeName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      const blob = new Blob(['Relatório de auditoria gerado...'], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportPreview = () => {
    const selectedType = reportTypes.find(t => t.value === reportType);
    if (!selectedType) return null;

    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <selectedType.icon className="h-4 w-4" />
            Prévia do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold text-foreground">{stats.totalEvidence}</div>
              <div className="text-xs text-muted-foreground">Evidências</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold text-foreground">{stats.activeAudits}</div>
              <div className="text-xs text-muted-foreground">Auditorias</div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Conteúdo incluído:</p>
            <div className="space-y-1">
              {includeStats && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span className="text-xs">Estatísticas e métricas</span>
                </div>
              )}
              {includeEvidence && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span className="text-xs">Inventário de evidências</span>
                </div>
              )}
              {includeChecklists && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span className="text-xs">Checklists de frameworks</span>
                </div>
              )}
              {includeFindings && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span className="text-xs">Achados e recomendações</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-muted/20">
            <p className="text-xs text-muted-foreground">
              O relatório será gerado em formato PDF com gráficos, tabelas e análises detalhadas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório de Auditoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Relatório *</Label>
            <div className="grid grid-cols-1 gap-3">
              {reportTypes.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer transition-all border-2 ${
                    reportType === type.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-card-border hover:border-primary/50'
                  }`}
                  onClick={() => setReportType(type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        reportType === type.value ? 'bg-primary/10' : 'bg-muted/20'
                      }`}>
                        <type.icon className={`h-4 w-4 ${
                          reportType === type.value ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">
                          {type.label}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                      {reportType === type.value && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audit">Auditoria Específica</Label>
              <Select value={selectedAudit} onValueChange={setSelectedAudit}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as auditorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as auditorias</SelectItem>
                  {audits.map(audit => (
                    <SelectItem key={audit.id} value={audit.id}>
                      {audit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os frameworks</SelectItem>
                  <SelectItem value="iso27001">ISO 27001</SelectItem>
                  <SelectItem value="sox">SOX</SelectItem>
                  <SelectItem value="lgpd">LGPD</SelectItem>
                  <SelectItem value="pci">PCI DSS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Options */}
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <CardTitle className="text-base">Conteúdo do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stats" 
                    checked={includeStats}
                    onCheckedChange={(checked) => setIncludeStats(checked === true)}
                  />
                  <Label htmlFor="stats" className="text-sm">
                    Incluir estatísticas e métricas
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="evidence" 
                    checked={includeEvidence}
                    onCheckedChange={(checked) => setIncludeEvidence(checked === true)}
                  />
                  <Label htmlFor="evidence" className="text-sm">
                    Incluir inventário de evidências
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="checklists" 
                    checked={includeChecklists}
                    onCheckedChange={(checked) => setIncludeChecklists(checked === true)}
                  />
                  <Label htmlFor="checklists" className="text-sm">
                    Incluir checklists de frameworks
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="findings" 
                    checked={includeFindings}
                    onCheckedChange={(checked) => setIncludeFindings(checked === true)}
                  />
                  <Label htmlFor="findings" className="text-sm">
                    Incluir achados e recomendações
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {reportType && getReportPreview()}

          {/* Progress Indicator */}
          {loading && (
            <Card className="bg-info/5 border-info/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-info animate-spin" />
                    <span className="text-sm font-medium text-info">
                      Gerando relatório...
                    </span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Coletando dados e compilando evidências...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              disabled={loading || !reportType}
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditReportModal;