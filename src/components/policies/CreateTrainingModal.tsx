import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateTrainingModalProps {
  onSuccess?: () => void;
}

const CreateTrainingModal = ({ onSuccess }: CreateTrainingModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    mandatory: false,
    dueDate: '',
    frameworks: '',
    modules: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Treinamento criado com sucesso!",
        description: `O treinamento "${formData.title}" foi adicionado à biblioteca.`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        duration: '',
        mandatory: false,
        dueDate: '',
        frameworks: '',
        modules: ''
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro ao criar treinamento",
        description: "Tente novamente em alguns momentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Treinamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Treinamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Treinamento</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Segurança da Informação - Básico"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seguranca">Segurança</SelectItem>
                  <SelectItem value="privacidade">Privacidade</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="ti">Tecnologia da Informação</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva os objetivos e conteúdo do treinamento"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração Estimada</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Ex: 45 min, 2h, 1 dia"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Conclusão</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modules">Módulos (separados por vírgula)</Label>
            <Textarea
              id="modules"
              value={formData.modules}
              onChange={(e) => setFormData({ ...formData, modules: e.target.value })}
              placeholder="Ex: Introdução à Segurança, Senhas Seguras, Phishing"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frameworks">Frameworks Relacionados</Label>
            <Input
              id="frameworks"
              value={formData.frameworks}
              onChange={(e) => setFormData({ ...formData, frameworks: e.target.value })}
              placeholder="Ex: ISO 27001, SOC 2, LGPD (separados por vírgula)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="mandatory"
              checked={formData.mandatory}
              onCheckedChange={(checked) => setFormData({ ...formData, mandatory: checked })}
            />
            <Label htmlFor="mandatory">Treinamento obrigatório</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Treinamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrainingModal;