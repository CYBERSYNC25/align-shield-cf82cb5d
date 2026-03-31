import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { shouldBypassTurnstile, TURNSTILE_SITE_KEY, CAPTCHA_THRESHOLD } from '@/lib/turnstile';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaptchaFieldProps {
  onTokenChange: (token: string) => void;
  turnstileRef?: any;
  /** Number of failed login attempts. CAPTCHA only shows after CAPTCHA_THRESHOLD failures. */
  failedAttempts?: number;
}

export const CaptchaField = ({ onTokenChange, turnstileRef, failedAttempts = 0 }: CaptchaFieldProps) => {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Bypass in dev/preview environments
  if (shouldBypassTurnstile()) {
    onTokenChange('bypass');
    return null;
  }

  // Don't show captcha until threshold is reached
  if (failedAttempts < CAPTCHA_THRESHOLD) {
    // Auto-grant token so login isn't blocked
    onTokenChange('not-required');
    return null;
  }

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
      <div className="flex flex-col items-center gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>Erro na verificação de segurança</span>
        </div>
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
      onSuccess={onTokenChange}
      onError={handleError}
      onExpire={() => onTokenChange('')}
    />
  );
};
