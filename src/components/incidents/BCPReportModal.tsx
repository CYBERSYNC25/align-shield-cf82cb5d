import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface BCPReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BCPReportModal = ({ open, onOpenChange }: BCPReportModalProps) => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('');
  const [period, setPeriod] = useState('');

  const handleGenerateReport = () => {
    if (!reportType || !period) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, selecione o tipo de relatório e período.",
        variant: "destructive"
      });
      return;
    }

    // Simulate report generation
    toast({
      title: "Relatório Gerado",
      description: `Gerando relatório de ${reportType} para ${period}...`,
    });

    // Simulate download after a delay
    setTimeout(() => {
      toast({
        title: "Download Iniciado",
        description: "O relatório está sendo baixado.",
      });
      onOpenChange(false);
    }, 2000);
  };

  const reportTypes = [
    { value: 'testes-bcp', label: 'Relatório de Testes BCP', description: 'Resumo de todos os testes de continuidade realizados' },
    { value: 'planos-status', label: 'Status dos Planos', description: 'Estado atual de todos os planos de continuidade' },
    { value: 'conformidade', label: 'Conformidade BCP', description: 'Análise de conformidade com regulamentações' },
    { value: 'metricas', label: 'Métricas de Recuperação', description: 'RTO e RPO de todos os sistemas críticos' },
    { value: 'incidentes', label: 'Histórico de Incidentes', description: 'Relatório de incidentes e ativações do BCP' }
  ];

  const periods = [
    { value: 'last-30', label: 'Últimos 30 dias' },
    { value: 'last-90', label: 'Últimos 90 dias' },
    { value: 'last-6months', label: 'Últimos 6 meses' },
    { value: 'last-year', label: 'Último ano' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  // Mock statistics for preview
  const stats = {
    totalPlans: 12,
    activePlans: 8,
    testsThisMonth: 15,
    conformityRate: 94
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório BCP
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalPlans}</div>
              <div className="text-xs text-muted-foreground">Planos BCP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.activePlans}</div>
              <div className="text-xs text-muted-foreground">Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{stats.testsThisMonth}</div>
              <div className="text-xs text-muted-foreground">Testes/Mês</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.conformityRate}%</div>
              <div className="text-xs text-muted-foreground">Conformidade</div>
            </div>
          </div>

          <Separator />

          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de relatório..." />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Selection */}
          <div className="space-y-3">
            <Label>Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período..." />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Info */}
          {reportType && period && (
            <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-info mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-info">
                    Prévia do Relatório
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Será gerado um relatório detalhado em PDF contendo análises, gráficos e recomendações baseados nos dados selecionados.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {periods.find(p => p.value === period)?.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleGenerateReport} 
              className="flex-1 gap-2"
              disabled={!reportType || !period}
            >
              <Download className="h-4 w-4" />
              Gerar Relatório
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BCPReportModal;