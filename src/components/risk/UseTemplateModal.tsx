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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Users,
  Clock,
  CheckCircle,
  Send,
  Eye,
  Edit
} from 'lucide-react';

interface UseTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
}

const UseTemplateModal = ({ isOpen, onClose, templateName }: UseTemplateModalProps) => {
  const { toast } = useToast();
  const [vendorEmail, setVendorEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Mock template data
  const templateData = {
    'SOC 2 Vendor Assessment': {
      category: 'Security',
      questions: 45,
      avgTime: '35 min',
      frameworks: ['SOC 2', 'ISO 27001'],
      description: 'Avaliação completa de controles de segurança para fornecedores críticos',
      sections: [
        { name: 'Controles de Acesso', questions: 12 },
        { name: 'Criptografia e Proteção de Dados', questions: 8 },
        { name: 'Monitoramento e Logging', questions: 7 },
        { name: 'Gestão de Vulnerabilidades', questions: 6 },
        { name: 'Backup e Recuperação', questions: 5 },
        { name: 'Compliance e Certificações', questions: 7 }
      ],
      sampleQuestions: [
        'Sua organização possui certificação ISO 27001 válida?',
        'Como são implementados os controles de acesso privilegiado?',
        'Qual é a política de criptografia para dados em trânsito e em repouso?',
        'Como são realizados os testes de penetração e avaliações de vulnerabilidades?',
        'Existe um programa formal de conscientização em segurança da informação?'
      ]
    },
    'LGPD Data Processing': {
      category: 'Privacy',
      questions: 32,
      avgTime: '25 min',
      frameworks: ['LGPD', 'GDPR'],
      description: 'Questionário específico para processamento de dados pessoais',
      sections: [
        { name: 'Base Legal para Processamento', questions: 8 },
        { name: 'Direitos dos Titulares', questions: 6 },
        { name: 'Segurança de Dados Pessoais', questions: 7 },
        { name: 'Transferência Internacional', questions: 4 },
        { name: 'Gestão de Incidentes', questions: 4 },
        { name: 'DPO e Governança', questions: 3 }
      ],
      sampleQuestions: [
        'Qual a base legal utilizada para o processamento de dados pessoais?',
        'Como são atendidas as solicitações de direitos dos titulares?',
        'Existe processo formal para notificação de incidentes com dados pessoais?',
        'Como é realizada a avaliação de impacto à proteção de dados (AIPD)?',
        'A organização possui um Encarregado de Proteção de Dados (DPO)?'
      ]
    },
    'Financial Services Risk': {
      category: 'Compliance',
      questions: 28,
      avgTime: '20 min',
      frameworks: ['PCI DSS', 'SOX'],
      description: 'Avaliação para fornecedores de serviços financeiros',
      sections: [
        { name: 'Controles Financeiros', questions: 8 },
        { name: 'Segurança de Transações', questions: 6 },
        { name: 'Compliance Regulatório', questions: 5 },
        { name: 'Auditoria e Monitoramento', questions: 4 },
        { name: 'Gestão de Fraudes', questions: 3 },
        { name: 'Relatórios e Documentação', questions: 2 }
      ],
      sampleQuestions: [
        'A empresa possui certificação PCI DSS válida?',
        'Como são protegidas as transações financeiras?',
        'Existe conformidade com regulamentações financeiras locais?',
        'Como são realizadas auditorias internas de controles financeiros?',
        'Qual é o processo de detecção e prevenção de fraudes?'
      ]
    },
    'General Vendor Onboarding': {
      category: 'General',
      questions: 18,
      avgTime: '15 min',
      frameworks: ['ISO 9001'],
      description: 'Questionário padrão para onboarding de novos fornecedores',
      sections: [
        { name: 'Informações Corporativas', questions: 5 },
        { name: 'Capacidade Operacional', questions: 4 },
        { name: 'Qualidade e Processos', questions: 3 },
        { name: 'Sustentabilidade', questions: 3 },
        { name: 'Referências e Certificações', questions: 3 }
      ],
      sampleQuestions: [
        'Há quanto tempo a empresa está estabelecida no mercado?',
        'Qual a capacidade de produção/prestação de serviços?',
        'A empresa possui certificação ISO 9001 ou similar?',
        'Como são implementadas práticas de sustentabilidade?',
        'Pode fornecer referências de clientes atuais?'
      ]
    }
  };

  const currentTemplate = templateData[templateName as keyof typeof templateData];

  const handleSendAssessment = () => {
    if (!vendorEmail) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email do fornecedor.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Avaliação Enviada",
      description: `Template "${templateName}" enviado para ${vendorEmail}`,
    });
    
    onClose();
    setVendorEmail('');
    setCustomMessage('');
  };

  const handlePreviewTemplate = () => {
    toast({
      title: "Prévia do Template",
      description: "Abrindo visualização completa do questionário...",
    });
  };

  const handleCustomizeTemplate = () => {
    toast({
      title: "Editor de Template",
      description: "Abrindo editor para personalizar o questionário...",
    });
  };

  if (!currentTemplate) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Usar Template: {templateName}
          </DialogTitle>
          <DialogDescription>
            Configure e envie este template de avaliação para um fornecedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Overview */}
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{templateName}</h3>
                <p className="text-sm text-muted-foreground">{currentTemplate.description}</p>
              </div>
              <Badge variant="outline">{currentTemplate.category}</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium">{currentTemplate.questions}</span> questões
              </div>
              <div>
                <span className="font-medium">{currentTemplate.avgTime}</span> tempo médio
              </div>
              <div>
                <span className="font-medium">{currentTemplate.sections.length}</span> seções
              </div>
            </div>
            
            <div className="flex gap-1">
              {currentTemplate.frameworks.map((framework) => (
                <Badge key={framework} variant="secondary" className="text-xs">
                  {framework}
                </Badge>
              ))}
            </div>
          </div>

          {/* Template Sections */}
          <div className="space-y-3">
            <h3 className="font-semibold">Seções do Template</h3>
            <div className="grid gap-2">
              {currentTemplate.sections.map((section, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/10 rounded">
                  <span className="text-sm font-medium">{section.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {section.questions} questões
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Questions */}
          <div className="space-y-3">
            <h3 className="font-semibold">Exemplos de Questões</h3>
            <ScrollArea className="h-32 border rounded p-3">
              <div className="space-y-2">
                {currentTemplate.sampleQuestions.map((question, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-muted-foreground">{index + 1}.</span> {question}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Send Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Configuração de Envio
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="vendorEmail">Email do Fornecedor *</Label>
                <Input
                  id="vendorEmail"
                  type="email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="contato@fornecedor.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customMessage">Mensagem Personalizada (Opcional)</Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Adicione uma mensagem personalizada para o fornecedor..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Template Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handlePreviewTemplate} className="gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Template Completo
            </Button>
            <Button variant="outline" onClick={handleCustomizeTemplate} className="gap-2">
              <Edit className="h-4 w-4" />
              Personalizar Template
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSendAssessment} className="gap-2">
            <Send className="h-4 w-4" />
            Enviar Avaliação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UseTemplateModal;