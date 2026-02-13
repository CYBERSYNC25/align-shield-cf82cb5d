import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar,
  BarChart3,
  FileText,
  ClipboardList
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
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg">
            <div>
              <span className="text-xs text-muted-foreground">Tipo:</span>
              <div className="font-medium text-sm">{test.type}</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Status:</span>
              <div className="font-medium text-sm capitalize">{test.status}</div>
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

          <Separator />

          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              Detalhes do teste não disponíveis
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Execute um teste de continuidade para registrar participantes, objetivos, resultados e recomendações.
            </p>
          </div>

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
            <Button onClick={() => onOpenChange(false)} className="ml-auto">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestDetailsModal;
