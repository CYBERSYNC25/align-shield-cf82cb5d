import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Mail,
  X,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastDelivery?: string;
}

interface ManageRecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportName: string;
  currentRecipients?: Recipient[];
}

const ManageRecipientsModal = ({ isOpen, onClose, reportName, currentRecipients = [] }: ManageRecipientsModalProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>(currentRecipients.length > 0 ? currentRecipients : [
    {
      id: '1',
      name: 'Carlos Silva',
      email: 'carlos.silva@empresa.com',
      role: 'CISO',
      status: 'active',
      lastDelivery: '18/11/2024 08:00'
    },
    {
      id: '2',
      name: 'Ana Santos',
      email: 'ana.santos@empresa.com', 
      role: 'Compliance Officer',
      status: 'active',
      lastDelivery: '18/11/2024 08:00'
    },
    {
      id: '3',
      name: 'Roberto Lima',
      email: 'roberto.lima@auditfirm.com',
      role: 'External Auditor',
      status: 'inactive',
      lastDelivery: '11/11/2024 08:00'
    }
  ]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const { toast } = useToast();

  const handleAddRecipient = () => {
    if (!newEmail || !newName) {
      toast({
        title: "Campos Obrigatórios",
        description: "Nome e email são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newRecipient: Recipient = {
      id: Date.now().toString(),
      name: newName,
      email: newEmail,
      role: newRole || 'Stakeholder',
      status: 'active'
    };

    setRecipients([...recipients, newRecipient]);
    setNewEmail('');
    setNewName('');
    setNewRole('');

    toast({
      title: "Destinatário Adicionado",
      description: `${newName} foi adicionado à lista de destinatários.`,
    });
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
    toast({
      title: "Destinatário Removido",
      description: "Destinatário removido da lista.",
    });
  };

  const handleToggleStatus = (id: string) => {
    setRecipients(recipients.map(r => 
      r.id === id 
        ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' }
        : r
    ));
  };

  const handleSave = () => {
    toast({
      title: "Lista Atualizada",
      description: `Destinatários de "${reportName}" foram atualizados.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            Gerenciar Destinatários: {reportName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Recipient */}
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Destinatário
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="newName">Nome *</Label>
                <Input
                  id="newName"
                  placeholder="Nome completo"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newEmail">Email *</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="email@empresa.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newRole">Cargo</Label>
                <Input
                  id="newRole"
                  placeholder="Ex: Manager, Auditor"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddRecipient} className="mt-3" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Current Recipients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Destinatários Atuais ({recipients.length})</h4>
              <Badge variant="outline">
                {recipients.filter(r => r.status === 'active').length} ativos
              </Badge>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {recipient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-sm text-muted-foreground">{recipient.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {recipient.role}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            recipient.status === 'active' 
                              ? 'bg-success/10 text-success border-success/20' 
                              : 'bg-muted/10 text-muted-foreground'
                          }`}
                        >
                          {recipient.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {recipient.lastDelivery && (
                      <div className="text-xs text-muted-foreground text-right mr-3">
                        <div>Última entrega:</div>
                        <div>{recipient.lastDelivery}</div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(recipient.id)}
                    >
                      {recipient.status === 'active' ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Statistics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/10 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{recipients.filter(r => r.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">Destinatários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{recipients.filter(r => r.status === 'inactive').length}</div>
              <div className="text-sm text-muted-foreground">Inativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Taxa de Entrega</div>
            </div>
          </div>

          {/* Warning */}
          {recipients.filter(r => r.status === 'active').length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Atenção: Nenhum destinatário ativo. O relatório não será enviado.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Testar Envio
              </Button>
              <Button onClick={handleSave}>
                <UserCheck className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageRecipientsModal;