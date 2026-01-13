import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRiskAcceptances, AcceptanceDuration, CreateAcceptanceInput } from '@/hooks/useRiskAcceptances';
import { ComplianceTest } from '@/hooks/useComplianceStatus';

interface AcceptRiskModalProps {
  test: ComplianceTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DURATION_OPTIONS: { value: AcceptanceDuration; label: string; description: string }[] = [
  { value: '3_months', label: '3 meses', description: 'Revisão trimestral' },
  { value: '6_months', label: '6 meses', description: 'Revisão semestral' },
  { value: '1_year', label: '1 ano', description: 'Revisão anual' },
  { value: 'permanent', label: 'Permanente', description: 'Sem expiração automática' },
];

export function AcceptRiskModal({ test, open, onOpenChange, onSuccess }: AcceptRiskModalProps) {
  const [justification, setJustification] = useState('');
  const [duration, setDuration] = useState<AcceptanceDuration | ''>('');
  const { createAcceptanceAsync, isCreating } = useRiskAcceptances();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!test || !justification.trim() || !duration) return;

    const input: CreateAcceptanceInput = {
      ruleId: test.ruleId,
      integrationName: test.integrationId,
      resourceType: test.resourceType,
      resourceId: test.affectedItems?.[0] || undefined,
      justification: justification.trim(),
      duration: duration,
    };

    try {
      await createAcceptanceAsync(input);
      setJustification('');
      setDuration('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setJustification('');
    setDuration('');
    onOpenChange(false);
  };

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>Aceitar Risco</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Você está aceitando o risco para:
            <span className="block mt-1 font-medium text-foreground">
              "{test.title}"
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="justification">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Descreva o motivo pelo qual este risco está sendo aceito e quais controles compensatórios estão em vigor..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Esta justificativa será registrada no log de auditoria.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">
              Duração da Exceção <span className="text-destructive">*</span>
            </Label>
            <Select value={duration} onValueChange={(v) => setDuration(v as AcceptanceDuration)}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Esta ação será registrada no log de auditoria. O item será removido da 
              contagem de erros críticos, mas permanecerá visível para auditores.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !justification.trim() || !duration}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isCreating ? 'Salvando...' : 'Confirmar Aceitação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
