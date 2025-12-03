import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAudits } from '@/hooks/useAudits';
import { useToast } from '@/hooks/use-toast';
import { FileSearch, Plus } from 'lucide-react';

interface CreateAuditModalProps {
  onSuccess?: () => void;
}

const CreateAuditModal = ({ onSuccess }: CreateAuditModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createAudit } = useAudits();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    framework: '',
    auditor: '',
    start_date: '',
    end_date: '',
    status: 'planning' as 'planning' | 'in_progress' | 'review' | 'completed'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auditData = {
        ...formData,
        progress: 0
      };

      const result = await createAudit(auditData);
      
      if (result) {
        setOpen(false);
        setFormData({
          name: '',
          framework: '',
          auditor: '',
          start_date: '',
          end_date: '',
          status: 'planning'
        });
        toast({
          title: "Auditoria criada",
          description: "A auditoria foi cadastrada com sucesso.",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao criar a auditoria. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar auditoria:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
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
          Nova Auditoria
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Criar Nova Auditoria
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nome da Auditoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Auditoria SOC 2 - Q4 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework">Framework *</Label>
              <Select 
                value={formData.framework} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, framework: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOC 2">SOC 2</SelectItem>
                  <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                  <SelectItem value="PCI DSS">PCI DSS</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="NIST">NIST</SelectItem>
                  <SelectItem value="Custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auditor">Auditor Responsável</Label>
              <Input
                id="auditor"
                value={formData.auditor}
                onChange={(e) => setFormData(prev => ({ ...prev, auditor: e.target.value }))}
                placeholder="Nome do auditor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Conclusão</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'planning' | 'in_progress' | 'review' | 'completed') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="review">Em Revisão</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Auditoria'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAuditModal;