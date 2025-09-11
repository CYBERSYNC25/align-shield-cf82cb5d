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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  CalendarDays,
  Building,
  Mail,
  FileText,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewAssessmentModal = ({ isOpen, onClose }: NewAssessmentModalProps) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [formData, setFormData] = useState({
    vendorName: '',
    contactName: '',
    contactEmail: '',
    category: '',
    description: ''
  });

  const assessmentTemplates = [
    {
      id: 'soc2',
      name: 'SOC 2 Vendor Assessment',
      category: 'Security',
      questions: 45,
      frameworks: ['SOC 2', 'ISO 27001'],
      avgTime: '35 min'
    },
    {
      id: 'lgpd',
      name: 'LGPD Data Processing',
      category: 'Privacy',
      questions: 32,
      frameworks: ['LGPD', 'GDPR'],
      avgTime: '25 min'
    },
    {
      id: 'financial',
      name: 'Financial Services Risk',
      category: 'Compliance',
      questions: 28,
      frameworks: ['PCI DSS', 'SOX'],
      avgTime: '20 min'
    },
    {
      id: 'general',
      name: 'General Vendor Onboarding',
      category: 'General',
      questions: 18,
      frameworks: ['ISO 9001'],
      avgTime: '15 min'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendorName || !formData.contactEmail || !selectedTemplate || !dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending assessment
    toast({
      title: "Avaliação Criada",
      description: `Avaliação enviada para ${formData.vendorName} com sucesso!`,
    });
    
    onClose();
    
    // Reset form
    setFormData({
      vendorName: '',
      contactName: '',
      contactEmail: '',
      category: '',
      description: ''
    });
    setSelectedTemplate('');
    setDueDate(undefined);
  };

  const selectedTemplateData = assessmentTemplates.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Avaliação de Risco
          </DialogTitle>
          <DialogDescription>
            Configure e envie uma nova avaliação de risco para um fornecedor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações do Fornecedor
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Nome do Fornecedor *</Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                  placeholder="Ex: CloudSecure Inc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud">Cloud Provider</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="consulting">Consultoria</SelectItem>
                    <SelectItem value="financial">Serviços Financeiros</SelectItem>
                    <SelectItem value="support">Suporte Técnico</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição dos Serviços</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva os serviços prestados pelo fornecedor..."
                rows={3}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contato Responsável
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome do Contato</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Ex: James Wilson"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email do Contato *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contato@fornecedor.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Assessment Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configuração da Avaliação
            </h3>
            
            <div className="space-y-2">
              <Label>Template de Avaliação *</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.questions} questões • {template.avgTime}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplateData && (
              <div className="p-4 bg-muted/10 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{selectedTemplateData.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplateData.questions} questões • Tempo estimado: {selectedTemplateData.avgTime}
                    </p>
                  </div>
                  <Badge variant="outline">{selectedTemplateData.category}</Badge>
                </div>
                <div className="flex gap-1 mt-2">
                  {selectedTemplateData.frameworks.map((framework) => (
                    <Badge key={framework} variant="secondary" className="text-xs">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Prazo para Resposta *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Avaliação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAssessmentModal;