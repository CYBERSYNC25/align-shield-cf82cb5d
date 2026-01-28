import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Smartphone, Shield, ShieldCheck, Copy, Download, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMFA } from '@/hooks/useMFA';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface Setup2FAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = 'intro' | 'qrcode' | 'verify' | 'backup' | 'complete';

export const Setup2FAModal = ({ open, onOpenChange }: Setup2FAModalProps) => {
  const [step, setStep] = useState<SetupStep>('intro');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupData, setSetupData] = useState<{
    qrCodeUrl: string;
    otpauthUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const { toast } = useToast();
  const { setupMfa, verifyCode } = useMFA();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('intro');
      setVerificationCode('');
      setSetupData(null);
      setCopiedSecret(false);
      setCopiedCodes(false);
    }
  }, [open]);

  const handleStartSetup = async () => {
    try {
      const data = await setupMfa.mutateAsync();
      setSetupData(data);
      setStep('qrcode');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Digite o código de 6 dígitos do seu app autenticador",
        variant: "destructive"
      });
      return;
    }

    try {
      await verifyCode.mutateAsync({ code: verificationCode, action: 'setup' });
      setStep('backup');
    } catch (error) {
      setVerificationCode('');
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'codes') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
      }
      toast({
        title: "Copiado!",
        description: type === 'secret' ? "Código secreto copiado" : "Códigos de backup copiados",
      });
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive"
      });
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const content = `APOC - Códigos de Backup MFA
================================
Gerado em: ${new Date().toLocaleString('pt-BR')}

IMPORTANTE: Guarde estes códigos em local seguro!
Cada código só pode ser usado uma vez.

Códigos:
${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

================================
Se você perder acesso ao seu app autenticador,
use um destes códigos para entrar na sua conta.
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apoc-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado",
      description: "Guarde o arquivo em local seguro!"
    });
  };

  const extractSecret = (url: string) => {
    const match = url.match(/secret=([A-Z2-7]+)/);
    return match ? match[1] : '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === 'complete' ? 'MFA Ativado!' : 'Configurar Autenticação 2FA'}
          </DialogTitle>
          {step !== 'complete' && (
            <DialogDescription>
              Adicione uma camada extra de segurança à sua conta
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A autenticação de dois fatores (2FA) protege sua conta exigindo um código 
              adicional além da senha para fazer login.
            </p>
            
            <div className="grid gap-3">
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Apps compatíveis</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Google Authenticator, Authy, Microsoft Authenticator, 1Password
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">10 códigos de backup</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Códigos de uso único caso perca acesso ao app
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStartSetup} disabled={setupMfa.isPending}>
                {setupMfa.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparando...
                  </>
                ) : (
                  <>
                    Começar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: QR Code */}
        {step === 'qrcode' && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Escaneie o QR code com seu app autenticador
              </p>
              
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={setupData.qrCodeUrl} 
                  alt="QR Code para configuração MFA" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Ou digite o código manualmente:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                  {extractSecret(setupData.otpauthUrl)}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(extractSecret(setupData.otpauthUrl), 'secret')}
                >
                  {copiedSecret ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('intro')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep('verify')}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Verify */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Smartphone className="h-10 w-10 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Digite o código de 6 dígitos do seu app autenticador
              </p>
            </div>

            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('qrcode')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleVerify} 
                disabled={verificationCode.length !== 6 || verifyCode.isPending}
              >
                {verifyCode.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Backup Codes */}
        {step === 'backup' && setupData && (
          <div className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                <strong>Salve seus códigos de backup!</strong> Eles só serão mostrados uma vez.
                Use-os para acessar sua conta se perder o app autenticador.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {setupData.backupCodes.map((code, index) => (
                <code 
                  key={index} 
                  className="text-sm font-mono py-1 px-2 bg-background rounded text-center"
                >
                  {code}
                </code>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'codes')}
              >
                {copiedCodes ? <CheckCircle className="h-4 w-4 mr-2 text-success" /> : <Copy className="h-4 w-4 mr-2" />}
                Copiar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={downloadBackupCodes}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>

            <DialogFooter>
              <Button onClick={() => setStep('complete')}>
                Concluir
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="h-8 w-8 text-success" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">MFA Ativado com Sucesso!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sua conta agora está protegida com autenticação de dois fatores.
                A partir de agora, você precisará de um código do seu app autenticador para fazer login.
              </p>
            </div>

            <DialogFooter className="justify-center pt-4">
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
