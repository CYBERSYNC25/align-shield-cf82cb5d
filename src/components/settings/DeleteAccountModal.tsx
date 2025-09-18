import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountModal = ({ open, onOpenChange }: DeleteAccountModalProps) => {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const requiredConfirmations = [
    'understand_permanent',
    'backup_data', 
    'cancel_subscriptions'
  ];

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

    setIsDeleting(true);
    
    // Simulate account deletion
    setTimeout(() => {
      setIsDeleting(false);
      toast({
        title: "Conta excluída",
        description: "Sua conta foi permanentemente excluída"
      });
      onOpenChange(false);
      // In a real app, this would redirect to login or landing page
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Excluir Conta Permanentemente</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">Atenção: Esta ação é irreversível</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Todos os seus dados serão permanentemente excluídos</li>
                    <li>• Documentos, relatórios e evidências não poderão ser recuperados</li>
                    <li>• Assinaturas ativas serão canceladas imediatamente</li>
                    <li>• Não será possível restaurar a conta após a exclusão</li>
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
                  Eu entendo que esta ação é permanente e irreversível
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
                  Eu já fiz backup de todos os dados importantes
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
                <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Conta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};