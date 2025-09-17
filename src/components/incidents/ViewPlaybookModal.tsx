import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight 
} from 'lucide-react';

interface PlaybookStep {
  id: number;
  title: string;
  description: string;
  estimatedTime: string;
  responsible: string;
}

interface ViewPlaybookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook: {
    name: string;
    description: string;
    category: string;
    severity: string;
    estimatedTime: string;
    roles: string[];
    triggers: string[];
    steps: number;
  } | null;
}

const ViewPlaybookModal = ({ open, onOpenChange, playbook }: ViewPlaybookModalProps) => {
  if (!playbook) return null;

  // Mock steps for demonstration
  const playbookSteps: PlaybookStep[] = [
    {
      id: 1,
      title: "Identificação Inicial",
      description: "Verificar e confirmar a natureza do incidente através de logs e monitoramento.",
      estimatedTime: "5min",
      responsible: "Security Analyst"
    },
    {
      id: 2,
      title: "Contenção Imediata", 
      description: "Isolar sistemas afetados para prevenir propagação do incidente.",
      estimatedTime: "15min",
      responsible: "Security Admin"
    },
    {
      id: 3,
      title: "Análise e Investigação",
      description: "Realizar análise detalhada para determinar causa raiz e impacto.",
      estimatedTime: "30min",
      responsible: "Security Engineer"
    },
    {
      id: 4,
      title: "Comunicação",
      description: "Notificar stakeholders e atualizar status do incidente.",
      estimatedTime: "10min",
      responsible: "Incident Commander"
    },
    {
      id: 5,
      title: "Resolução",
      description: "Implementar correções necessárias e restaurar serviços.",
      estimatedTime: "45min",
      responsible: "DevOps Team"
    }
  ];

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
      high: { label: 'Alto', className: 'bg-warning text-warning-foreground' },
      medium: { label: 'Médio', className: 'bg-info text-info-foreground' },
      low: { label: 'Baixo', className: 'bg-success text-success-foreground' }
    };
    
    const conf = config[severity as keyof typeof config];
    return <Badge variant="secondary" className={conf.className}>{conf.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const config = {
      Security: { className: 'bg-destructive/10 text-destructive border-destructive/20' },
      Infrastructure: { className: 'bg-info/10 text-info border-info/20' },
      Performance: { className: 'bg-warning/10 text-warning border-warning/20' },
      'Data Protection': { className: 'bg-primary/10 text-primary border-primary/20' }
    };
    
    const conf = config[category as keyof typeof config] || { className: 'bg-muted/10 text-muted-foreground border-muted/20' };
    return <Badge variant="outline" className={conf.className}>{category}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 {playbook.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getCategoryBadge(playbook.category)}
              {getSeverityBadge(playbook.severity)}
            </div>
            <p className="text-sm text-muted-foreground">{playbook.description}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/10 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{playbookSteps.length}</div>
              <div className="text-xs text-muted-foreground">Passos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{playbook.estimatedTime}</div>
              <div className="text-xs text-muted-foreground">Tempo Est.</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{(playbook?.roles || []).length}</div>
              <div className="text-xs text-muted-foreground">Roles</div>
            </div>
          </div>

          <Separator />

          {/* Roles */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Roles Necessários</h4>
            <div className="flex flex-wrap gap-1">
              {(playbook.roles || []).map((role, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Triggers Comuns</h4>
            <div className="space-y-1">
              {(playbook.triggers || []).map((trigger, idx) => (
                <div key={idx} className="text-xs text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  {trigger}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Passos do Playbook</h4>
            <div className="space-y-3">
              {playbookSteps.map((step, idx) => (
                <div key={step.id} className="flex gap-3 p-3 bg-muted/10 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                      {step.id}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm">{step.title}</h5>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {step.estimatedTime}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium">{step.responsible}</span>
                    </div>
                  </div>
                  {idx < playbookSteps.length - 1 && (
                    <div className="flex-shrink-0 mt-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Executar Playbook
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPlaybookModal;