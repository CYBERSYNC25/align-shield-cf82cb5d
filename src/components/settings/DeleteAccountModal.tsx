import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Clock, Undo2, Loader2, Calendar } from 'lucide-react';
import { useDataExport } from '@/hooks/useDataExport';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RETENTION_DAYS = 30;

export const DeleteAccountModal = ({ open, onOpenChange }: DeleteAccountModalProps) => {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const { 
    requestDeletion, 
    cancelDeletion, 
    isDeleting, 
    deletionStatus 
  } = useDataExport();

  const requiredConfirmations = [
    'understand_permanent',
    'backup_data', 
    'cancel_subscriptions'
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setConfirmText('');
      setPassword('');
      setConfirmations([]);
    }
  }, [open]);

  const handleConfirmationChange = (confirmationId: string, checked: boolean) => {
    if (checked) {
      setConfirmations(prev => [...prev, confirmationId]);
    } else {
      setConfirmations(prev => prev.filter(id => id !== confirmationId));
    }
  };

  const canDelete = confirmText === 'EXCLUIR MINHA CONTA' && 
                   password.length > 0 && 
                   confirmations.length === requiredConfirmations.length;

  const handleDelete = async () => {
    if (!canDelete) return;
    
    const result = await requestDeletion(password, 'Solicitação do usuário');
    if (result?.success) {
      onOpenChange(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);
    const success = await cancelDeletion();
    setIsCancelling(false);
    if (success) {
      onOpenChange(false);
    }
  };

  // Se já tem exclusão agendada, mostrar tela de cancelamento
  if (deletionStatus.isScheduled && deletionStatus.scheduledFor) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <Clock className="h-5 w-5" />
              <DialogTitle>Exclusão de Conta Agendada</DialogTitle>
            </div>
            <DialogDescription>
              Sua conta está agendada para exclusão permanente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Data de exclusão permanente:</h4>
                    <p className="text-lg font-bold text-amber-600">
                      {format(deletionStatus.scheduledFor, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(deletionStatus.scheduledFor, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Você ainda pode acessar sua conta durante o período de retenção</p>
              <p>• Após {RETENTION_DAYS} dias, todos os dados serão permanentemente excluídos</p>
              <p>• Cancele agora se você mudou de ideia</p>
            </div>

            {deletionStatus.reason && (
              <div className="text-sm">
                <span className="text-muted-foreground">Motivo: </span>
                <span>{deletionStatus.reason}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCancelling}
            >
              Fechar
            </Button>
            <Button 
              variant="default"
              onClick={handleCancelDeletion}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Cancelar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Excluir Conta</DialogTitle>
          </div>
          <DialogDescription>
            Sua conta será excluída permanentemente após {RETENTION_DAYS} dias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-destructive">Período de retenção:</h4>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      {RETENTION_DAYS} dias
                    </Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sua conta ficará inativa por {RETENTION_DAYS} dias</li>
                    <li>• Durante esse período, você pode cancelar a exclusão</li>
                    <li>• Após {RETENTION_DAYS} dias, todos os dados serão permanentemente excluídos</li>
                    <li>• Documentos, evidências e configurações não poderão ser recuperados</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Label>Confirme que você entende as consequências:</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="understand_permanent"
                  checked={confirmations.includes('understand_permanent')}
                  onCheckedChange={(checked) => 
                    handleConfirmationChange('understand_permanent', checked as boolean)
                  }
                />
                <label htmlFor="understand_permanent" className="text-sm">
                  Eu entendo que após {RETENTION_DAYS} dias a exclusão será permanente
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="backup_data"
                  checked={confirmations.includes('backup_data')}
                  onCheckedChange={(checked) => 
                    handleConfirmationChange('backup_data', checked as boolean)
                  }
                />
                <label htmlFor="backup_data" className="text-sm">
                  Eu já exportei meus dados importantes
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cancel_subscriptions"
                  checked={confirmations.includes('cancel_subscriptions')}
                  onCheckedChange={(checked) => 
                    handleConfirmationChange('cancel_subscriptions', checked as boolean)
                  }
                />
                <label htmlFor="cancel_subscriptions" className="text-sm">
                  Eu entendo que minhas assinaturas serão canceladas
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Digite "EXCLUIR MINHA CONTA" para confirmar:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR MINHA CONTA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Digite sua senha atual:</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha atual"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Agendar Exclusão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};