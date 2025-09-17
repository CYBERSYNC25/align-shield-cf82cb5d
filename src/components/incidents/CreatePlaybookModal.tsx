import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CreatePlaybookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePlaybookModal = ({ open, onOpenChange }: CreatePlaybookModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    severity: '',
    estimatedTime: '',
    roles: '',
    triggers: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Playbook Criado",
      description: `Playbook "${formData.name}" foi criado com sucesso.`,
    });
    
    setFormData({
      name: '',
      description: '',
      category: '',
      severity: '',
      estimatedTime: '',
      roles: '',
      triggers: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Playbook</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Playbook</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Resposta a Violação de Segurança..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva o propósito do playbook..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
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
            </div>

            <div>
              <Label>Severidade</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
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
            </div>
          </div>

          <div>
            <Label htmlFor="time">Tempo Estimado</Label>
            <Input
              id="time"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
              placeholder="Ex: 30min, 2h, 1 dia..."
            />
          </div>

          <div>
            <Label htmlFor="roles">Roles Necessários</Label>
            <Input
              id="roles"
              value={formData.roles}
              onChange={(e) => setFormData({...formData, roles: e.target.value})}
              placeholder="Ex: Security Admin, DevOps Engineer..."
            />
          </div>

          <div>
            <Label htmlFor="triggers">Triggers Comuns</Label>
            <Textarea
              id="triggers"
              value={formData.triggers}
              onChange={(e) => setFormData({...formData, triggers: e.target.value})}
              placeholder="Descreva os eventos que acionam este playbook..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Criar Playbook
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaybookModal;