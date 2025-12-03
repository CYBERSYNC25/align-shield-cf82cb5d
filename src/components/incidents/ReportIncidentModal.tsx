import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ReportIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportIncidentModal = ({ open, onOpenChange }: ReportIncidentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: '',
    impactLevel: '',
    affectedSystems: '',
    assignedTo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate incident reporting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Incidente Reportado",
        description: `Incidente "${formData.title}" foi registrado com sucesso.`,
      });
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        severity: '',
        impactLevel: '',
        affectedSystems: '',
        assignedTo: ''
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao reportar o incidente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar Novo Incidente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título do Incidente</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Descreva o incidente brevemente..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva os detalhes do incidente..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <Label>Impacto</Label>
              <Select value={formData.impactLevel} onValueChange={(value) => setFormData({...formData, impactLevel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo Impacto</SelectItem>
                  <SelectItem value="medium">Médio Impacto</SelectItem>
                  <SelectItem value="high">Alto Impacto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="systems">Sistemas Afetados</Label>
            <Input
              id="systems"
              value={formData.affectedSystems}
              onChange={(e) => setFormData({...formData, affectedSystems: e.target.value})}
              placeholder="Ex: API, Database, Frontend..."
            />
          </div>

          <div>
            <Label htmlFor="assigned">Responsável</Label>
            <Input
              id="assigned"
              value={formData.assignedTo}
              onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
              placeholder="Nome do responsável..."
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Reportando...' : 'Reportar Incidente'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIncidentModal;