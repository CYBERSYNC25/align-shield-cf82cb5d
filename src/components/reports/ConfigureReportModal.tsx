import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Save } from 'lucide-react';

interface ConfigureReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

const ConfigureReportModal = ({ isOpen, onClose, report }: ConfigureReportModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(report?.name || '');
  const [description, setDescription] = useState(report?.description || '');
  const [format, setFormat] = useState(report?.format || 'PDF');
  const [frequency, setFrequency] = useState(report?.frequency || 'Semanal');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(report?.metrics || []);
  const [dateRange, setDateRange] = useState(report?.filters?.dateRange || 'Last 30 days');
  const [frameworks, setFrameworks] = useState<string[]>(report?.filters?.frameworks || []);
  const [recipients, setRecipients] = useState<string[]>(report?.recipients || []);
  const [newRecipient, setNewRecipient] = useState('');

  const availableMetrics = [
    'Compliance Score', 'Incident Count', 'MTTR', 'Vulnerability Score',
    'Control Status', 'Evidence Quality', 'Risk Level', 'Risk Score',
    'Vendor Count', 'Assessment Status', 'SLA Compliance', 'Training Completion',
    'Policy Attestation', 'Backup Success Rate', 'Access Review Status'
  ];

  const availableFrameworks = ['SOC 2', 'ISO 27001', 'LGPD', 'GDPR', 'PCI DSS', 'All Active'];
  const dateRangeOptions = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Current Quarter', 'Current Year'];

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleFramework = (framework: string) => {
    setFrameworks(prev =>
      prev.includes(framework)
        ? prev.filter(f => f !== framework)
        : [...prev, framework]
    );
  };

  const addRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (recipient: string) => {
    setRecipients(recipients.filter(r => r !== recipient));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do relatório é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (selectedMetrics.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma métrica",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Configurações Salvas",
      description: `Relatório "${name}" foi atualizado com sucesso.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Relatório</DialogTitle>
          <DialogDescription>
            Personalize as configurações, métricas e destinatários do relatório
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="metrics">Métricas & Filtros</TabsTrigger>
            <TabsTrigger value="recipients">Destinatários</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Relatório</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Weekly Security Metrics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo e conteúdo do relatório..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                    <SelectItem value="PowerPoint">PowerPoint</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uma vez">Uma vez</SelectItem>
                    <SelectItem value="Diário">Diário</SelectItem>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Metrics & Filters Tab */}
          <TabsContent value="metrics" className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label>Métricas Selecionadas ({selectedMetrics.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/10 rounded-lg min-h-[60px]">
                {selectedMetrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma métrica selecionada</p>
                ) : (
                  selectedMetrics.map((metric) => (
                    <Badge key={metric} variant="outline" className="gap-1">
                      {metric}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleMetric(metric)}
                      />
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Métricas Disponíveis</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableMetrics.map((metric) => (
                  <button
                    key={metric}
                    onClick={() => toggleMetric(metric)}
                    className={`p-2 text-left rounded-lg border-2 transition-all ${
                      selectedMetrics.includes(metric)
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted/10 hover:border-primary/20'
                    }`}
                  >
                    <p className="text-sm font-medium">{metric}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Período de Dados</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="dateRange">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Frameworks</Label>
              <div className="flex flex-wrap gap-2">
                {availableFrameworks.map((framework) => (
                  <Badge
                    key={framework}
                    variant={frameworks.includes(framework) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFramework(framework)}
                  >
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Recipients Tab */}
          <TabsContent value="recipients" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newRecipient">Adicionar Destinatário</Label>
              <div className="flex gap-2">
                <Input
                  id="newRecipient"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Nome, cargo ou equipe"
                  onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                />
                <Button onClick={addRecipient} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Destinatários Atuais ({recipients.length})</Label>
              {recipients.length === 0 ? (
                <div className="p-4 bg-muted/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Nenhum destinatário configurado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient}
                      className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-card-border"
                    >
                      <span className="text-sm font-medium">{recipient}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipient(recipient)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureReportModal;
