import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { 
  UserCog, 
  Search, 
  Clock,
  CalendarIcon,
  User,
  Users,
  Mail,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AssignResponsibleModalProps {
  entity: any;
  isOpen: boolean;
  onClose: () => void;
}

const AssignResponsibleModal = ({ entity, isOpen, onClose }: AssignResponsibleModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState('medium');
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [notes, setNotes] = useState('');

  const users: Array<{ id: string; name: string; email: string; role: string; department: string; workload: string; skills: string[] }> = [];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.error('Selecione um responsável');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const assignedUser = users.find(u => u.id === selectedUser);
      toast.success(`${entity?.name || 'Item'} atribuído para ${assignedUser?.name ?? 'responsável'} com sucesso!`);
      onClose();
    } catch (error) {
      toast.error('Erro ao atribuir responsável');
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadBadge = (workload: string) => {
    const workloadConfig = {
      baixa: { label: 'Carga Baixa', className: 'bg-success/10 text-success border-success/20' },
      média: { label: 'Carga Média', className: 'bg-warning/10 text-warning border-warning/20' },
      alta: { label: 'Carga Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' }
    };
    
    const config = workloadConfig[workload as keyof typeof workloadConfig];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baixa', className: 'bg-success/10 text-success border-success/20' },
      medium: { label: 'Média', className: 'bg-warning/10 text-warning border-warning/20' },
      high: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      critical: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Atribuir Responsável - {entity?.name || entity?.user_name || 'Item'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Selection */}
          <div className="space-y-4">
            <div>
              <Label>Buscar Usuários</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, função ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedUser === user.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{user.name}</p>
                            {selectedUser === user.id && (
                              <Badge variant="default" className="text-xs">Selecionado</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>{user.role} • {user.department}</p>
                            <p className="text-xs">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {getWorkloadBadge(user.workload)}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {user.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredUsers.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="space-y-4">
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-1">
                {getPriorityBadge(priority)}
              </div>
            </div>

            <div>
              <Label>Data Limite (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      format(dueDate, "dd/MM/yyyy")
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione instruções ou observações relevantes..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Notificações</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Notificação no Sistema</p>
                    <p className="text-xs text-muted-foreground">Enviar notificação via plataforma</p>
                  </div>
                </div>
                <Switch
                  checked={sendNotification}
                  onCheckedChange={setSendNotification}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Notificação por Email</p>
                    <p className="text-xs text-muted-foreground">Enviar email de atribuição</p>
                  </div>
                </div>
                <Switch
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
              </div>
            </div>

            {selectedUser && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">Resumo da Atribuição</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium">
                        {users.find(u => u.id === selectedUser)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prioridade:</span>
                      {getPriorityBadge(priority)}
                    </div>
                    {dueDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data Limite:</span>
                        <span className="font-medium">{format(dueDate, "dd/MM/yyyy")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedUser}>
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Atribuindo...
              </>
            ) : (
              <>
                <UserCog className="h-4 w-4 mr-2" />
                Atribuir Responsável
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignResponsibleModal;