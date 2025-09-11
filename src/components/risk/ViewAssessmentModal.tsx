import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users,
  FileText,
  Download,
  Send
} from 'lucide-react';

interface ViewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
}

const ViewAssessmentModal = ({ isOpen, onClose, vendorName }: ViewAssessmentModalProps) => {
  // Mock data for the assessment
  const assessment = {
    vendor: vendorName,
    template: 'SOC 2 Vendor Assessment',
    status: 'in_progress',
    progress: 65,
    completedQuestions: 29,
    totalQuestions: 45,
    riskFlags: 2,
    contactPerson: 'James Wilson',
    contactEmail: 'james@example.com',
    sentDate: '15/11/2024',
    dueDate: '25/11/2024',
    questions: [
      {
        id: 1,
        question: 'Possui certificação ISO 27001?',
        answer: 'Sim, certificação válida até 2025',
        status: 'completed',
        riskLevel: 'low'
      },
      {
        id: 2,
        question: 'Como são realizados os backups de dados?',
        answer: 'Backups diários com replicação em 3 regiões',
        status: 'completed',
        riskLevel: 'low'
      },
      {
        id: 3,
        question: 'Qual a política de retenção de logs?',
        answer: 'Logs retidos por 2 anos conforme regulamentação',
        status: 'completed',
        riskLevel: 'medium'
      },
      {
        id: 4,
        question: 'Como é feito o controle de acesso privilegiado?',
        answer: '',
        status: 'pending',
        riskLevel: 'high'
      },
      {
        id: 5,
        question: 'Existe programa de conscientização em segurança?',
        answer: '',
        status: 'pending',
        riskLevel: 'medium'
      }
    ]
  };

  const getRiskBadge = (level: string) => {
    const config = {
      low: { label: 'Baixo', className: 'bg-success/10 text-success border-success/20' },
      medium: { label: 'Médio', className: 'bg-warning/10 text-warning border-warning/20' },
      high: { label: 'Alto', className: 'bg-destructive/10 text-destructive border-destructive/20' }
    };
    
    const conf = config[level as keyof typeof config] || config.medium;
    
    return (
      <Badge variant="outline" className={conf.className}>
        {conf.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === 'pending') return <Clock className="h-4 w-4 text-warning" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Avaliação de Risco - {vendorName}
          </DialogTitle>
          <DialogDescription>
            Visualize o progresso e respostas da avaliação de risco do fornecedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assessment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg">
            <div>
              <p className="text-sm font-medium">Template</p>
              <p className="text-sm text-muted-foreground">{assessment.template}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Contato</p>
              <p className="text-sm text-muted-foreground">{assessment.contactPerson}</p>
              <p className="text-xs text-muted-foreground">{assessment.contactEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Enviado em</p>
              <p className="text-sm text-muted-foreground">{assessment.sentDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Prazo</p>
              <p className="text-sm text-muted-foreground">{assessment.dueDate}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Progresso da Avaliação</h3>
              <Badge variant="outline">
                {assessment.completedQuestions}/{assessment.totalQuestions} questões
              </Badge>
            </div>
            <Progress value={assessment.progress} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">
              {assessment.progress}% concluído
            </p>
          </div>

          <Separator />

          {/* Questions and Answers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Questões e Respostas</h3>
            
            <div className="space-y-4">
              {assessment.questions.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium">Questão {item.id}</span>
                    </div>
                    {getRiskBadge(item.riskLevel)}
                  </div>
                  
                  <p className="text-sm mb-3">{item.question}</p>
                  
                  {item.answer ? (
                    <div className="p-3 bg-muted/20 rounded">
                      <p className="text-sm">{item.answer}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-warning/10 rounded border border-warning/20">
                      <p className="text-sm text-muted-foreground italic">
                        Aguardando resposta...
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Flags */}
          {assessment.riskFlags > 0 && (
            <>
              <Separator />
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">
                    Flags de Risco Identificados ({assessment.riskFlags})
                  </h3>
                </div>
                <ul className="space-y-1 text-sm">
                  <li>• Controle de acesso privilegiado não respondido</li>
                  <li>• Política de backup incompleta</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" className="gap-2">
            <Send className="h-4 w-4" />
            Enviar Lembrete
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={onClose} className="ml-auto">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAssessmentModal;