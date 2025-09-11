import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  CalendarIcon, 
  Users, 
  Flag,
  FileText,
  Shield,
  AlertTriangle
} from 'lucide-react';
import type { Database } from '@/lib/supabase';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

interface CreateTaskModalProps {
  trigger?: React.ReactNode;
}

const CreateTaskModal = ({ trigger }: CreateTaskModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const { createTask } = useTasks();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskInsert['priority'],
    framework: '',
    assigned_to: '',
    due_date: ''
  });

  const frameworks = [
    'SOC 2 Type II',
    'ISO 27001:2022', 
    'LGPD',
    'GDPR',
    'NIST CSF',
    'CIS Controls',
    'COBIT',
    'PCI DSS',
    'HIPAA'
  ];

  const priorities = [
    { value: 'low', label: 'Baixa', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { value: 'medium', label: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { value: 'high', label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { value: 'critical', label: 'Crítica', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  const teamMembers = [
    'Ana Silva - DPO',
    'Carlos Santos - CISO', 
    'Maria Oliveira - Compliance Manager',
    'João Costa - IT Security',
    'Patrícia Lima - Internal Audit',
    'Ricardo Ferreira - Risk Manager'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.priority || !date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        framework: formData.framework || 'Geral',
        assigned_to: formData.assigned_to || 'Não atribuído',
        due_date: date.toISOString(),
        status: 'pending'
      });

      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso!",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        framework: '',
        assigned_to: '',
        due_date: ''
      });
      setDate(undefined);
      setOpen(false);
      
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <Flag className="h-4 w-4 text-blue-600" />;
      case 'medium': return <Flag className="h-4 w-4 text-yellow-600" />;
      case 'high': return <Flag className="h-4 w-4 text-orange-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Criar Nova Tarefa de Compliance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Tarefa *</Label>
            <Input
              id="title"
              placeholder="Ex: Implementar controles de acesso SOC 2"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva os detalhes da tarefa, objetivos e critérios de aceitação..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Framework */}
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select value={formData.framework} onValueChange={(value) => setFormData(prev => ({ ...prev, framework: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((framework) => (
                    <SelectItem key={framework} value={framework}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {framework}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label>Prioridade *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskInsert['priority'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(priority.value)}
                        <span>{priority.label}</span>
                        <Badge variant="secondary" className={cn("text-xs", priority.bgColor, priority.color)}>
                          {priority.label.toUpperCase()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid de campos 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsável */}
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Atribuir à" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {member}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Vencimento */}
            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Preview da prioridade selecionada */}
          {formData.priority && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {getPriorityIcon(formData.priority)}
                <span className="font-medium">Prioridade Selecionada:</span>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-sm",
                  priorities.find(p => p.value === formData.priority)?.bgColor,
                  priorities.find(p => p.value === formData.priority)?.color
                )}
              >
                {priorities.find(p => p.value === formData.priority)?.label}
              </Badge>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Criando..." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;