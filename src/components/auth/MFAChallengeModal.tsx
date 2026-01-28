import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, KeyRound } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MFAChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  actionDescription?: string;
  action?: 'login' | 'sensitive';
}

export const MFAChallengeModal = ({ 
  open, 
  onOpenChange, 
  onVerified,
  actionDescription = 'esta ação',
  action = 'sensitive'
}: MFAChallengeModalProps) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const { verifyCode } = useMFA();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setCode('');
      setBackupCode('');
      setUseBackupCode(false);
      setError('');
    }
  }, [open]);

  const handleVerify = async () => {
    setError('');
    
    const codeToVerify = useBackupCode ? backupCode : code;
    
    if (!useBackupCode && codeToVerify.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }
    
    if (useBackupCode && codeToVerify.length < 8) {
      setError('Digite o código de backup completo');
      return;
    }

    try {
      await verifyCode.mutateAsync({ code: codeToVerify, action });
      onVerified();
      onOpenChange(false);
    } catch {
      setError('Código inválido. Tente novamente.');
      if (!useBackupCode) {
        setCode('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verificação MFA
          </DialogTitle>
          <DialogDescription>
            Digite o código do seu app autenticador para {actionDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!useBackupCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                  onKeyDown={handleKeyDown}
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
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setUseBackupCode(true)}
                >
                  <KeyRound className="h-3 w-3 mr-1" />
                  Usar código de backup
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code">Código de Backup</Label>
                <Input
                  id="backup-code"
                  placeholder="XXXX-XXXX"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  className="text-center font-mono"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Cada código de backup só pode ser usado uma vez
                </p>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setUseBackupCode(false)}
                >
                  Usar código do app
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={verifyCode.isPending || (!useBackupCode && code.length !== 6)}
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
      </DialogContent>
    </Dialog>
  );
};
