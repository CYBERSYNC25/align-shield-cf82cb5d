import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSecureForm } from '@/hooks/useSecureForm';
import { useIncidents } from '@/hooks/useIncidents';
import { reportIncidentSchema, ReportIncidentFormData } from '@/lib/validation';

interface ReportIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportIncidentModal = ({ open, onOpenChange }: ReportIncidentModalProps) => {
  const { toast } = useToast();
  const { reportIncident } = useIncidents();

  const {
    register,
    handleSecureSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useSecureForm<ReportIncidentFormData>({
    schema: reportIncidentSchema,
    defaultValues: {
      title: '',
      description: '',
      severity: 'medium',
      impactLevel: 'medium',
      affectedSystems: '',
      assignedTo: '',
    },
    onSubmit: async (data) => {
      const result = await reportIncident({
        title: data.title,
        description: data.description,
        severity: data.severity,
        impactLevel: data.impactLevel,
        affectedSystems: data.affectedSystems ?? '',
        assignedTo: data.assignedTo,
      });
      if (result.success) {
        toast({
          title: "Incidente Reportado",
          description: `Incidente "${data.title}" foi registrado com sucesso.`,
        });
        reset();
        onOpenChange(false);
      }
    },
  });

  const severity = watch('severity');
  const impactLevel = watch('impactLevel');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar Novo Incidente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSecureSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título do Incidente</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Descreva o incidente brevemente..."
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva os detalhes do incidente..."
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Severidade</Label>
              <Select 
                value={severity} 
                onValueChange={(value) => setValue('severity', value as ReportIncidentFormData['severity'], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
              {errors.severity && (
                <p className="text-sm text-destructive mt-1">{errors.severity.message}</p>
              )}
            </div>

            <div>
              <Label>Impacto</Label>
              <Select 
                value={impactLevel} 
                onValueChange={(value) => setValue('impactLevel', value as ReportIncidentFormData['impactLevel'], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo Impacto</SelectItem>
                  <SelectItem value="medium">Médio Impacto</SelectItem>
                  <SelectItem value="high">Alto Impacto</SelectItem>
                </SelectContent>
              </Select>
              {errors.impactLevel && (
                <p className="text-sm text-destructive mt-1">{errors.impactLevel.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="affectedSystems">Sistemas Afetados</Label>
            <Input
              id="affectedSystems"
              {...register('affectedSystems')}
              placeholder="Ex: API, Database, Frontend..."
            />
            {errors.affectedSystems && (
              <p className="text-sm text-destructive mt-1">{errors.affectedSystems.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="assignedTo">Responsável</Label>
            <Input
              id="assignedTo"
              {...register('assignedTo')}
              placeholder="Nome do responsável..."
            />
            {errors.assignedTo && (
              <p className="text-sm text-destructive mt-1">{errors.assignedTo.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Reportando...' : 'Reportar Incidente'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIncidentModal;
