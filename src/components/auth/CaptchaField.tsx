import { useCallback, useEffect, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CAPTCHA_THRESHOLD, TURNSTILE_SITE_KEY } from '@/lib/turnstile';

interface CaptchaFieldProps {
  onTokenChange: (token: string) => void;
  turnstileRef?: any;
  failedAttempts?: number;
}

export const CaptchaField = ({ onTokenChange, turnstileRef, failedAttempts = 0 }: CaptchaFieldProps) => {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const shouldShowExplicitCaptcha = failedAttempts >= CAPTCHA_THRESHOLD;

  useEffect(() => {
    onTokenChange('');
    setHasError(false);
  }, [onTokenChange, retryKey, shouldShowExplicitCaptcha]);

  const handleSuccess = useCallback((token: string) => {
    setHasError(false);
    onTokenChange(token);
  }, [onTokenChange]);

  const handleError = useCallback(() => {
    setHasError(true);
    onTokenChange('');
  }, [onTokenChange]);

  const handleExpire = useCallback(() => {
    onTokenChange('');
  }, [onTokenChange]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setRetryKey((prev) => prev + 1);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>Erro na verificação de segurança</span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleRetry} className="gap-1">
          <RefreshCw className="h-3 w-3" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <Turnstile
      key={`${shouldShowExplicitCaptcha ? 'explicit' : 'silent'}-${retryKey}`}
      ref={turnstileRef}
      siteKey={TURNSTILE_SITE_KEY}
      options={{
        appearance: shouldShowExplicitCaptcha ? 'always' : 'interaction-only',
        execution: 'render',
        retry: 'auto',
        refreshExpired: 'auto',
        refreshTimeout: 'auto',
      }}
      onSuccess={handleSuccess}
      onError={handleError}
      onExpire={handleExpire}
    />
  );
};
