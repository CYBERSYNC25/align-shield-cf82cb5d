import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Smartphone, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Setup2FAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Setup2FAModal = ({ open, onOpenChange }: Setup2FAModalProps) => {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Erro",
        description: "Digite um código de 6 dígitos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate 2FA setup
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sucesso",
        description: "Autenticação de dois fatores ativada!"
      });
      onOpenChange(false);
      setStep(1);
      setVerificationCode('');
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurar Autenticação 2FA
          </DialogTitle>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta.
            </p>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <QrCode className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">1. Escaneie o código QR</h4>
                    <p className="text-xs text-muted-foreground">
                      Use um app como Google Authenticator ou Authy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted p-4 rounded-lg flex justify-center">
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center border-2 border-dashed">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Código de backup:</p>
              <code className="bg-muted px-2 py-1 rounded text-sm">ABCD-EFGH-IJKL-MNOP</code>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep(2)}>
                Próximo
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerification}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="text-sm font-medium">2. Digite o código de verificação</h4>
                  <p className="text-xs text-muted-foreground">
                    Digite o código de 6 dígitos do seu app autenticador
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Código de Verificação</Label>
                <Input
                  id="verification-code"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Verificando..." : "Ativar 2FA"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};