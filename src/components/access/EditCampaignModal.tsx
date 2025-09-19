import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditCampaignModalProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: any) => void;
}

const EditCampaignModal = ({ campaign, isOpen, onClose, onSave }: EditCampaignModalProps) => {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    start_date: campaign?.start_date ? new Date(campaign.start_date) : new Date(),
    end_date: campaign?.end_date ? new Date(campaign.end_date) : new Date(),
    systems: campaign?.systems || [],
    reviewers: campaign?.reviewers || []
  });
  const [loading, setLoading] = useState(false);
  const [newSystem, setNewSystem] = useState('');
  const [newReviewer, setNewReviewer] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave({
        ...formData,
        id: campaign.id
      });
      toast.success('Campanha atualizada com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar campanha');
    } finally {
      setLoading(false);
    }
  };

  const addSystem = () => {
    if (newSystem.trim() && !formData.systems.includes(newSystem.trim())) {
      setFormData(prev => ({
        ...prev,
        systems: [...prev.systems, newSystem.trim()]
      }));
      setNewSystem('');
    }
  };

  const removeSystem = (system: string) => {
    setFormData(prev => ({
      ...prev,
      systems: prev.systems.filter(s => s !== system)
    }));
  };

  const addReviewer = () => {
    if (newReviewer.trim() && !formData.reviewers.includes(newReviewer.trim())) {
      setFormData(prev => ({
        ...prev,
        reviewers: [...prev.reviewers, newReviewer.trim()]
      }));
      setNewReviewer('');
    }
  };

  const removeReviewer = (reviewer: string) => {
    setFormData(prev => ({
      ...prev,
      reviewers: prev.reviewers.filter(r => r !== reviewer)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Campanha</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? (
                        format(formData.start_date, "dd/MM/yyyy")
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date || new Date() }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? (
                        format(formData.end_date, "dd/MM/yyyy")
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date || new Date() }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Sistemas</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar sistema..."
                    value={newSystem}
                    onChange={(e) => setNewSystem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSystem())}
                  />
                  <Button type="button" onClick={addSystem} variant="outline">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.systems.map((system) => (
                    <Badge key={system} variant="outline" className="gap-1">
                      {system}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeSystem(system)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Revisores</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar revisor..."
                    value={newReviewer}
                    onChange={(e) => setNewReviewer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReviewer())}
                  />
                  <Button type="button" onClick={addReviewer} variant="outline">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.reviewers.map((reviewer) => (
                    <Badge key={reviewer} variant="outline" className="gap-1">
                      {reviewer}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeReviewer(reviewer)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCampaignModal;