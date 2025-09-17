import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { 
  Share2, 
  Mail, 
  Link, 
  Calendar,
  Shield,
  Copy,
  Clock
} from 'lucide-react';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportName: string;
}

const ShareReportModal = ({ isOpen, onClose, reportName }: ShareReportModalProps) => {
  const [emails, setEmails] = useState('');
  const [message, setMessage] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [requireAuth, setRequireAuth] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const { toast } = useToast();

  const shareLink = 'https://secure-reports.example.com/share/abc123def456';

  const handleSendEmail = () => {
    toast({
      title: "Relatório Compartilhado",
      description: `Link seguro enviado para os destinatários selecionados.`,
    });
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link Copiado",
      description: "Link seguro copiado para a área de transferência.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Share2 className="h-5 w-5" />
            Compartilhar: {reportName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Method */}
          <div className="space-y-4">
            <h4 className="font-medium">Método de Compartilhamento</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/5">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-medium">Email Direto</span>
                </div>
                <p className="text-sm text-muted-foreground">Enviar link seguro por email</p>
              </div>
              <div className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/5">
                <div className="flex items-center gap-3 mb-2">
                  <Link className="h-5 w-5 text-success" />
                  <span className="font-medium">Link Seguro</span>
                </div>
                <p className="text-sm text-muted-foreground">Gerar link compartilhável</p>
              </div>
            </div>
          </div>

          {/* Email Recipients */}
          <div className="space-y-2">
            <Label htmlFor="emails">Destinatários (Email)</Label>
            <Input
              id="emails"
              placeholder="email1@example.com, email2@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separe múltiplos emails com vírgula
            </p>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem Personalizada (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Adicione uma mensagem personalizada para os destinatários..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Security Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Configurações de Segurança
            </h4>
            
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Exigir Autenticação</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários devem fazer login para acessar
                  </p>
                </div>
                <Switch checked={requireAuth} onCheckedChange={setRequireAuth} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Permitir Download</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários podem baixar o relatório
                  </p>
                </div>
                <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Expiração do Link (dias)</Label>
                <Input
                  id="expiration"
                  type="number"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Generated Link Preview */}
          <div className="space-y-2 p-4 bg-muted/10 rounded-lg">
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link Seguro Gerado
            </Label>
            <div className="flex items-center gap-2">
              <Input value={shareLink} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expira em {expirationDays} dias
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {requireAuth ? 'Autenticação obrigatória' : 'Acesso livre'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
              <Button onClick={handleSendEmail} disabled={!emails.trim()}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareReportModal;