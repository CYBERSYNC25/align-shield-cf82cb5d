import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SendRemindersModalProps {
  onSuccess?: () => void;
}

const SendRemindersModal = ({ onSuccess }: SendRemindersModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  // Mock data for campaigns and pending users
  const campaigns = [
    {
      id: 'policy-security-v2',
      title: 'Política de Segurança da Informação v2.1',
      pendingCount: 11
    },
    {
      id: 'training-lgpd',
      title: 'Treinamento LGPD - Certificação Anual',
      pendingCount: 89
    },
    {
      id: 'attestation-q4',
      title: 'Atesto de Conflito de Interesses Q4',
      pendingCount: 7
    }
  ];

  const pendingUsers = [
    { id: '1', name: 'Ana Silva', department: 'Marketing', daysOverdue: 2 },
    { id: '2', name: 'Carlos Santos', department: 'Vendas', daysOverdue: 1 },
    { id: '3', name: 'Maria Oliveira', department: 'RH', daysOverdue: 0 },
    { id: '4', name: 'João Pereira', department: 'TI', daysOverdue: 0 },
    { id: '5', name: 'Laura Costa', department: 'Financeiro', daysOverdue: 0 }
  ];

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(pendingUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || selectedUsers.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma campanha e pelo menos um usuário.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Lembretes enviados com sucesso!",
        description: `${selectedUsers.length} lembrete(s) foi(ram) enviado(s).`,
      });

      // Reset form
      setSelectedCampaign('');
      setSelectedUsers([]);
      setMessage('');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro ao enviar lembretes",
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
          <Mail className="h-4 w-4" />
          Enviar Lembretes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Lembretes de Atestação</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="campaign">Selecionar Campanha</Label>
            <Select onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a campanha para enviar lembretes" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{campaign.title}</span>
                      <Badge variant="secondary" className="ml-2">
                        {campaign.pendingCount} pendentes
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCampaign && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Usuários Pendentes ({pendingUsers.length})</Label>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllUsers}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/20"
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.department}</p>
                    </div>
                    {user.daysOverdue > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {user.daysOverdue}d atraso
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedUsers.length} usuário(s) selecionado(s)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem Personalizada (Opcional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite uma mensagem personalizada para incluir no lembrete..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Se deixado em branco, será enviada a mensagem padrão do sistema.
            </p>
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
              <Mail className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : `Enviar ${selectedUsers.length} Lembrete(s)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendRemindersModal;