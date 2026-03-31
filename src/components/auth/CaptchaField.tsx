import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/lib/turnstile';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaptchaFieldProps {
  onTokenChange: (token: string) => void;
  turnstileRef?: any;
}

export const CaptchaField = ({ onTokenChange, turnstileRef }: CaptchaFieldProps) => {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleError = () => {
    setHasError(true);
    onTokenChange('');
  };

  const handleRetry = () => {
    setHasError(false);
    setRetryKey(prev => prev + 1);
  };

  if (hasError) {
    return (
      <div className="w-full rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Erro na verificação de segurança
        </div>
        <p className="text-xs text-muted-foreground">
          Verifique se o domínio está autorizado no Cloudflare Turnstile.
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1">
          <RefreshCw className="h-3 w-3" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <Turnstile
      key={retryKey}
      ref={turnstileRef}
      siteKey={TURNSTILE_SITE_KEY}
      onSuccess={(token) => {
        setHasError(false);
        onTokenChange(token);
      }}
      onError={handleError}
      onExpire={() => onTokenChange('')}
    />
  );
};