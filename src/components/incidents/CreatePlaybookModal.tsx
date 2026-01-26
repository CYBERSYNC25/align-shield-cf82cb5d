import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSecureForm } from '@/hooks/useSecureForm';
import { createPlaybookSchema, CreatePlaybookFormData } from '@/lib/validation';

interface CreatePlaybookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePlaybookModal = ({ open, onOpenChange }: CreatePlaybookModalProps) => {
  const { toast } = useToast();

  const {
    register,
    handleSecureSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useSecureForm<CreatePlaybookFormData>({
    schema: createPlaybookSchema,
    defaultValues: {
      name: '',
      description: '',
      category: 'Security',
      severity: 'medium',
      estimatedTime: '',
      roles: '',
      triggers: '',
    },
    onSubmit: async (data) => {
      toast({
        title: "Playbook Criado",
        description: `Playbook "${data.name}" foi criado com sucesso.`,
      });
      
      reset();
      onOpenChange(false);
    },
  });

  const category = watch('category');
  const severity = watch('severity');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Playbook</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSecureSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Playbook</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Resposta a Violação de Segurança..."
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o propósito do playbook..."
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setValue('category', value as CreatePlaybookFormData['category'], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Performance">Performance</SelectItem>
                  <SelectItem value="Data Protection">Data Protection</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label>Severidade</Label>
              <Select 
                value={severity} 
                onValueChange={(value) => setValue('severity', value as CreatePlaybookFormData['severity'], { shouldValidate: true })}
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
          </div>

          <div>
            <Label htmlFor="estimatedTime">Tempo Estimado</Label>
            <Input
              id="estimatedTime"
              {...register('estimatedTime')}
              placeholder="Ex: 30min, 2h, 1 dia..."
            />
            {errors.estimatedTime && (
              <p className="text-sm text-destructive mt-1">{errors.estimatedTime.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="roles">Roles Necessários</Label>
            <Input
              id="roles"
              {...register('roles')}
              placeholder="Ex: Security Admin, DevOps Engineer..."
            />
            {errors.roles && (
              <p className="text-sm text-destructive mt-1">{errors.roles.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="triggers">Triggers Comuns</Label>
            <Textarea
              id="triggers"
              {...register('triggers')}
              placeholder="Descreva os eventos que acionam este playbook..."
            />
            {errors.triggers && (
              <p className="text-sm text-destructive mt-1">{errors.triggers.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Playbook'}
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

export default CreatePlaybookModal;
