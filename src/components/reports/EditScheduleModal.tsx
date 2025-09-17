import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Repeat,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportName: string;
  currentSchedule?: {
    frequency: string;
    time: string;
    dayOfWeek?: string;
    dayOfMonth?: string;
    timezone: string;
  };
}

const EditScheduleModal = ({ isOpen, onClose, reportName, currentSchedule }: EditScheduleModalProps) => {
  const [frequency, setFrequency] = useState(currentSchedule?.frequency || 'weekly');
  const [time, setTime] = useState(currentSchedule?.time || '08:00');
  const [dayOfWeek, setDayOfWeek] = useState(currentSchedule?.dayOfWeek || 'monday');
  const [dayOfMonth, setDayOfMonth] = useState(currentSchedule?.dayOfMonth || '1');
  const [timezone, setTimezone] = useState(currentSchedule?.timezone || 'America/Sao_Paulo');
  const [autoRetry, setAutoRetry] = useState(true);
  const [notifyFailures, setNotifyFailures] = useState(true);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Agendamento Atualizado",
      description: `Configurações de "${reportName}" foram salvas com sucesso.`,
    });
    onClose();
  };

  const getNextRun = () => {
    const now = new Date();
    const [hour, minute] = time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hour, minute, 0, 0);
    
    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = days.indexOf(dayOfWeek);
        const currentDay = nextRun.getDay();
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        break;
      case 'monthly':
        nextRun.setDate(parseInt(dayOfMonth));
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }
    
    return nextRun.toLocaleDateString('pt-BR') + ' às ' + time;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Calendar className="h-5 w-5" />
            Editar Agendamento: {reportName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fuso Horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Day Selection */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Segunda-feira</SelectItem>
                  <SelectItem value="tuesday">Terça-feira</SelectItem>
                  <SelectItem value="wednesday">Quarta-feira</SelectItem>
                  <SelectItem value="thursday">Quinta-feira</SelectItem>
                  <SelectItem value="friday">Sexta-feira</SelectItem>
                  <SelectItem value="saturday">Sábado</SelectItem>
                  <SelectItem value="sunday">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Dia do Mês</Label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger>
                  <SelectValue />  
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      Dia {day}
                    </SelectItem>
                  ))}
                  <SelectItem value="last">Último dia do mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Advanced Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Configurações Avançadas</h4>
            
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tentar Novamente em Caso de Falha</Label>
                  <p className="text-sm text-muted-foreground">
                    Reagendar automaticamente se a execução falhar
                  </p>
                </div>
                <Switch checked={autoRetry} onCheckedChange={setAutoRetry} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificar Falhas</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificação em caso de erro na geração
                  </p>
                </div>
                <Switch checked={notifyFailures} onCheckedChange={setNotifyFailures} />
              </div>
            </div>
          </div>

          {/* Schedule Preview */}
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Repeat className="h-4 w-4 text-primary" />
              <span className="font-medium">Próxima Execução</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {getNextRun()}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <AlertCircle className="h-4 w-4 mr-2" />
                Testar Agendamento
              </Button>
              <Button onClick={handleSave}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditScheduleModal;