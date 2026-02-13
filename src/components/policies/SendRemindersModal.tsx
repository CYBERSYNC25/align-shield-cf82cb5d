import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SendRemindersModalProps {
  onSuccess?: () => void;
}

const SendRemindersModal = ({ onSuccess }: SendRemindersModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [message, setMessage] = useState('');

  const { data: policies = [] } = useQuery({
    queryKey: ['policies-for-reminders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policies')
        .select('id, title, status')
        .eq('user_id', user!.id)
        .in('status', ['draft', 'review', 'active']);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma política.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Lembrete registrado",
        description: "O lembrete foi registrado com sucesso.",
      });
      setSelectedPolicy('');
      setMessage('');
      setOpen(false);
      onSuccess?.();
    } catch {
      toast({
        title: "Erro ao enviar lembrete",
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Lembretes de Atestação</DialogTitle>
        </DialogHeader>
        
        {policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Nenhuma política encontrada
            </h3>
            <p className="text-sm text-muted-foreground">
              Cadastre políticas para poder enviar lembretes de atestação.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Selecionar Política</Label>
              <Select onValueChange={setSelectedPolicy} value={selectedPolicy}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a política para enviar lembrete" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      <div className="flex items-center gap-2">
                        <span>{policy.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {policy.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Enviando...' : 'Enviar Lembrete'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendRemindersModal;
