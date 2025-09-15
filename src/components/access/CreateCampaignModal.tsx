import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAccess } from '@/hooks/useAccess';
import { toast } from 'sonner';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCampaignModal = ({ isOpen, onClose }: CreateCampaignModalProps) => {
  const { createCampaign } = useAccess();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [systemInput, setSystemInput] = useState('');
  const [reviewerInput, setReviewerInput] = useState('');
  const [loading, setLoading] = useState(false);

  const availableSystems = [
    'SAP', 'Salesforce', 'Office 365', 'AWS', 'Azure AD', 'Okta', 'ServiceNow', 'Jira'
  ];

  const availableReviewers = [
    'admin@empresa.com', 'supervisor@empresa.com', 'auditor@empresa.com', 'gestor@empresa.com'
  ];

  const addSystem = (system: string) => {
    if (system && !selectedSystems.includes(system)) {
      setSelectedSystems([...selectedSystems, system]);
      setSystemInput('');
    }
  };

  const removeSystem = (system: string) => {
    setSelectedSystems(selectedSystems.filter(s => s !== system));
  };

  const addReviewer = (reviewer: string) => {
    if (reviewer && !selectedReviewers.includes(reviewer)) {
      setSelectedReviewers([...selectedReviewers, reviewer]);
      setReviewerInput('');
    }
  };

  const removeReviewer = (reviewer: string) => {
    setSelectedReviewers(selectedReviewers.filter(r => r !== reviewer));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await createCampaign({
        name,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        systems: selectedSystems,
        reviewers: selectedReviewers,
        status: 'draft',
        progress: 0,
        total_users: 0,
        certified_users: 0
      });
      
      toast.success('Campanha criada com sucesso!');
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Erro ao criar campanha');
      console.error('Error creating campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedSystems([]);
    setSelectedReviewers([]);
    setSystemInput('');
    setReviewerInput('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Campanha de Revisão</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Revisão Q1 2024"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Término *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: ptBR}) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sistemas</Label>
            <div className="flex space-x-2">
              <Select value={systemInput} onValueChange={(value) => {
                addSystem(value);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um sistema" />
                </SelectTrigger>
                <SelectContent>
                  {availableSystems.filter(s => !selectedSystems.includes(s)).map((system) => (
                    <SelectItem key={system} value={system}>{system}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedSystems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSystems.map((system) => (
                  <Badge key={system} variant="secondary" className="flex items-center space-x-1">
                    <span>{system}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSystem(system)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Revisores</Label>
            <div className="flex space-x-2">
              <Select value={reviewerInput} onValueChange={(value) => {
                addReviewer(value);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um revisor" />
                </SelectTrigger>
                <SelectContent>
                  {availableReviewers.filter(r => !selectedReviewers.includes(r)).map((reviewer) => (
                    <SelectItem key={reviewer} value={reviewer}>{reviewer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedReviewers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedReviewers.map((reviewer) => (
                  <Badge key={reviewer} variant="secondary" className="flex items-center space-x-1">
                    <span>{reviewer}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeReviewer(reviewer)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Campanha'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignModal;