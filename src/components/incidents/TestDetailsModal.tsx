import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Calendar,
  Target,
  BarChart3,
  FileText
} from 'lucide-react';

interface TestDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: {
    plan: string;
    type: string;
    status: string;
    lastTested: string;
    nextTest: string;
    rto: string;
    rpo: string;
  } | null;
}

const TestDetailsModal = ({ open, onOpenChange, test }: TestDetailsModalProps) => {
  if (!test) return null;

  // Mock detailed test data
  const testDetails = {
    id: "BCP-TEST-2025-001",
    duration: "2h 15min",
    participants: ["John Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa"],
    objectives: [
      "Validar procedimentos de backup",
      "Testar comunicação de emergência", 
      "Verificar tempo de recuperação",
      "Avaliar coordenação da equipe"
    ],
    results: [
      { item: "Backup e Restore", status: "success", time: "45min", target: "60min" },
      { item: "Comunicações", status: "success", time: "5min", target: "10min" },
      { item: "Ativação da Equipe", status: "warning", time: "25min", target: "20min" },
      { item: "Recuperação Completa", status: "success", time: "1h 30min", target: "2h" }
    ],
    recommendations: [
      "Melhorar processo de notificação da equipe",
      "Automatizar mais etapas do processo de restore",
      "Realizar treinamentos adicionais mensais"
    ]
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: { 
        label: 'Sucesso', 
        className: 'bg-success/10 text-success border-success/20',
        icon: CheckCircle 
      },
      warning: { 
        label: 'Atenção', 
        className: 'bg-warning/10 text-warning border-warning/20',
        icon: AlertTriangle 
      },
      error: { 
        label: 'Falha', 
        className: 'bg-destructive/10 text-destructive border-destructive/20',
        icon: AlertTriangle 
      }
    };
    
    const conf = config[status as keyof typeof config] || config.success;
    const Icon = conf.icon;
    
    return (
      <Badge variant="outline" className={`gap-1 ${conf.className}`}>
        <Icon className="h-3 w-3" />
        {conf.label}
      </Badge>
    );
  };

  const getOverallProgress = () => {
    const successCount = testDetails.results.filter(r => r.status === 'success').length;
    return (successCount / testDetails.results.length) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detalhes do Teste - {test.plan}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg">
            <div>
              <span className="text-xs text-muted-foreground">ID do Teste:</span>
              <div className="font-mono text-sm">{testDetails.id}</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Duração:</span>
              <div className="font-medium text-sm">{testDetails.duration}</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">RTO Alvo:</span>
              <div className="font-medium text-sm">{test.rto}</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">RPO Alvo:</span>
              <div className="font-medium text-sm">{test.rpo}</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Progresso Geral</h4>
              <span className="text-sm text-muted-foreground">{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes ({testDetails.participants.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {testDetails.participants.map((participant, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {participant}
                </Badge>
              ))}
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objetivos do Teste
            </h4>
            <div className="space-y-2">
              {testDetails.objectives.map((objective, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  {objective}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Test Results */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Resultados dos Testes</h4>
            <div className="space-y-3">
              {testDetails.results.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(result.status)}
                    <span className="font-medium text-sm">{result.item}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Realizado</div>
                      <div className="font-medium">{result.time}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Alvo</div>
                      <div className="font-medium">{result.target}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recomendações
            </h4>
            <div className="space-y-2">
              {testDetails.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-info/10 border border-info/20 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-foreground">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Último teste: {test.lastTested}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Próximo teste: {test.nextTest}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1">
              Exportar Relatório
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestDetailsModal;