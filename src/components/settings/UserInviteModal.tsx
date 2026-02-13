import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, UserPlus } from 'lucide-react';
import { useUserRoles, ALL_ROLE_LABELS, ALL_ROLE_DESCRIPTIONS } from '@/hooks/useUserRoles';

interface UserInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent?: () => void;
}

export const UserInviteModal = ({ open, onOpenChange, onInviteSent }: UserInviteModalProps) => {
  const { toast } = useToast();
  const { getAssignableRoles } = useUserRoles();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const assignableRoles = getAssignableRoles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, insira o email do usuário a ser convidado',
        variant: 'destructive'
      });
      return;
    }

    if (!role) {
      toast({
        title: 'Permissão obrigatória',
        description: 'Por favor, selecione uma permissão para o usuário',
        variant: 'destructive'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Não autenticado',
          description: 'Você precisa estar logado para convidar usuários',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: email.trim().toLowerCase(), role }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Convite enviado',
        description: `Um email de convite foi enviado para ${email} com a role ${ALL_ROLE_LABELS[role as keyof typeof ALL_ROLE_LABELS] || role}`,
      });

      setEmail('');
      setRole('');
      onOpenChange(false);
      onInviteSent?.();

    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Erro ao enviar convite',
        description: error.message || 'Não foi possível enviar o convite',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Envie um convite por email. O usuário receberá a role selecionada automaticamente ao criar a conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Permissão</Label>
            {assignableRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você não tem permissão para atribuir funções.
              </p>
            ) : (
              <>
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((roleKey) => (
                      <SelectItem key={roleKey} value={roleKey}>
                        <div className="flex flex-col items-start">
                          <span>{ALL_ROLE_LABELS[roleKey]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {role && (
                  <p className="text-xs text-muted-foreground">
                    {ALL_ROLE_DESCRIPTIONS[role as keyof typeof ALL_ROLE_DESCRIPTIONS]}
                  </p>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || assignableRoles.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Convite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
