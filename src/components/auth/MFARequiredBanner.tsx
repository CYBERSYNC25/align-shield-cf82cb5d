import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import { Setup2FAModal } from '@/components/settings/Setup2FAModal';

interface MFARequiredBannerProps {
  variant?: 'warning' | 'subtle';
}

export const MFARequiredBanner = ({ variant = 'warning' }: MFARequiredBannerProps) => {
  const { mfaStatus } = useMFA();
  const [showSetup, setShowSetup] = useState(false);

  // Don't show if MFA is enabled or doesn't require MFA
  if (!mfaStatus || mfaStatus.enabled || !mfaStatus.requiresMfa) {
    return null;
  }

  if (variant === 'subtle') {
    return (
      <>
        <Alert className="border-primary/20 bg-primary/5 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Proteja sua conta</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Ative a autenticação de dois fatores para maior segurança.</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => setShowSetup(true)}
            >
              Configurar MFA
            </Button>
          </AlertDescription>
        </Alert>
        
        <Setup2FAModal open={showSetup} onOpenChange={setShowSetup} />
      </>
    );
  }

  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <Shield className="h-4 w-4" />
        <AlertTitle>MFA Obrigatório</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Como administrador, você deve habilitar autenticação de dois fatores.</span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="ml-4"
            onClick={() => setShowSetup(true)}
          >
            Configurar Agora
          </Button>
        </AlertDescription>
      </Alert>
      
      <Setup2FAModal open={showSetup} onOpenChange={setShowSetup} />
    </>
  );
};
