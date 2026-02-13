import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  CheckCircle,
  ClipboardList
} from 'lucide-react';

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

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
      high: { label: 'Alto', className: 'bg-warning text-warning-foreground' },
      medium: { label: 'Médio', className: 'bg-info text-info-foreground' },
      low: { label: 'Baixo', className: 'bg-success text-success-foreground' }
    };
    const conf = config[severity as keyof typeof config];
    return <Badge variant="secondary" className={conf?.className}>{conf?.label || severity}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, { className: string }> = {
      Security: { className: 'bg-destructive/10 text-destructive border-destructive/20' },
      Infrastructure: { className: 'bg-info/10 text-info border-info/20' },
      Performance: { className: 'bg-warning/10 text-warning border-warning/20' },
      'Data Protection': { className: 'bg-primary/10 text-primary border-primary/20' }
    };
    const conf = config[category] || { className: 'bg-muted/10 text-muted-foreground border-muted/20' };
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getCategoryBadge(playbook.category)}
              {getSeverityBadge(playbook.severity)}
            </div>
            <p className="text-sm text-muted-foreground">{playbook.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/10 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{playbook.steps}</div>
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

          {(playbook.roles || []).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Roles Necessários</h4>
              <div className="flex flex-wrap gap-1">
                {playbook.roles.map((role, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(playbook.triggers || []).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Triggers Comuns</h4>
              <div className="space-y-1">
                {playbook.triggers.map((trigger, idx) => (
                  <div key={idx} className="text-xs text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    {trigger}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Passos do Playbook</h4>
            {playbook.steps === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Este playbook ainda não possui passos definidos. Edite o playbook para adicionar os passos de resposta.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este playbook possui {playbook.steps} passo(s) configurado(s).
              </p>
            )}
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
