import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { 
  FileText, 
  BarChart3, 
  Users,
  Calendar,
  Settings
} from 'lucide-react';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateReportModal = ({ isOpen, onClose }: CreateReportModalProps) => {
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [format, setFormat] = useState('');
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [recipients, setRecipients] = useState('');
  const { toast } = useToast();

  const reportTypes = [
    { value: 'dashboard', label: 'Dashboard', description: 'Visualizações e KPIs executivos' },
    { value: 'detailed', label: 'Detalhado', description: 'Análise técnica completa' },
    { value: 'executive', label: 'Executivo', description: 'Resumo para liderança' }
  ];

  const availableMetrics = [
    { id: 'compliance_score', name: 'Compliance Score', category: 'Compliance' },
    { id: 'incident_count', name: 'Incident Count', category: 'Security' },
    { id: 'mttr', name: 'MTTR Average', category: 'Operations' },
    { id: 'control_status', name: 'Control Status', category: 'Compliance' },
    { id: 'risk_score', name: 'Risk Score', category: 'Risk' },
    { id: 'vulnerability_count', name: 'Vulnerability Count', category: 'Security' },
    { id: 'training_completion', name: 'Training Completion', category: 'Training' },
    { id: 'policy_attestation', name: 'Policy Attestation', category: 'Governance' },
    { id: 'backup_success', name: 'Backup Success Rate', category: 'Operations' },
    { id: 'access_review', name: 'Access Review Status', category: 'Identity' }
  ];

  const availableFrameworks = ['SOC 2', 'ISO 27001', 'LGPD', 'GDPR', 'PCI DSS', 'NIST'];
  const availableFormats = ['PDF', 'Excel', 'PowerPoint', 'CSV'];

  const handleFrameworkChange = (framework: string, checked: boolean) => {
    if (checked) {
      setFrameworks([...frameworks, framework]);
    } else {
      setFrameworks(frameworks.filter(f => f !== framework));
    }
  };

  const handleMetricChange = (metricId: string, checked: boolean) => {
    if (checked) {
      setSelectedMetrics([...selectedMetrics, metricId]);
    } else {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metricId));
    }
  };

  const handleCreate = () => {
    if (!reportName || !type || !format || selectedMetrics.length === 0) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Relatório Criado",
      description: `"${reportName}" foi criado com sucesso!`,
    });
    onClose();
  };

  const getTypeIcon = (typeValue: string) => {
    switch (typeValue) {
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'detailed': return <FileText className="h-4 w-4" />;
      case 'executive': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Criar Novo Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Nome do Relatório *</Label>
              <Input
                id="reportName"
                placeholder="Ex: Weekly Security Report"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Relatório *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((reportType) => (
                    <SelectItem key={reportType.value} value={reportType.value}>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(reportType.value)}
                        <div>
                          <div>{reportType.label}</div>
                          <div className="text-xs text-muted-foreground">{reportType.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito e conteúdo do relatório..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Format and Framework */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formato de Saída *</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  {availableFormats.map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Destinatários (Emails)</Label>
              <Input
                id="recipients"
                placeholder="email1@company.com, email2@company.com"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
            </div>
          </div>

          {/* Frameworks */}
          <div className="space-y-3">
            <Label>Frameworks de Compliance</Label>
            <div className="grid grid-cols-3 gap-2">
              {availableFrameworks.map((framework) => (
                <div key={framework} className="flex items-center space-x-2">
                  <Checkbox
                    id={`framework-${framework}`}
                    checked={frameworks.includes(framework)}
                    onCheckedChange={(checked) => 
                      handleFrameworkChange(framework, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`framework-${framework}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {framework}
                  </Label>
                </div>
              ))}
            </div>
            {frameworks.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {frameworks.map((framework) => (
                  <Badge key={framework} variant="outline" className="text-xs">
                    {framework}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Metrics Selection */}
          <div className="space-y-3">
            <Label>Métricas Incluídas *</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border border-border rounded-lg p-3">
              {availableMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`metric-${metric.id}`}
                    checked={selectedMetrics.includes(metric.id)}
                    onCheckedChange={(checked) => 
                      handleMetricChange(metric.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`metric-${metric.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    <div>{metric.name}</div>
                    <div className="text-xs text-muted-foreground">{metric.category}</div>
                  </Label>
                </div>
              ))}
            </div>
            {selectedMetrics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedMetrics.map((metricId) => {
                  const metric = availableMetrics.find(m => m.id === metricId);
                  return (
                    <Badge key={metricId} variant="outline" className="text-xs gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {metric?.name}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {reportName && type && format && selectedMetrics.length > 0 && (
            <div className="p-4 bg-muted/10 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Resumo da Configuração
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span> {reportName}
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span> {reportTypes.find(t => t.value === type)?.label}
                </div>
                <div>
                  <span className="text-muted-foreground">Formato:</span> {format}
                </div>
                <div>
                  <span className="text-muted-foreground">Métricas:</span> {selectedMetrics.length} selecionadas
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Criar e Agendar
              </Button>
              <Button onClick={handleCreate}>
                <FileText className="h-4 w-4 mr-2" />
                Criar Relatório
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReportModal;