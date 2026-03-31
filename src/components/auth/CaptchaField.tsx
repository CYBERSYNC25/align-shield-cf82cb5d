import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/lib/turnstile';

interface CaptchaFieldProps {
  onTokenChange: (token: string) => void;
  turnstileRef?: any;
}

export const CaptchaField = ({ onTokenChange, turnstileRef }: CaptchaFieldProps) => {
  return (
    <Turnstile
      ref={turnstileRef}
      siteKey={TURNSTILE_SITE_KEY}
      onSuccess={onTokenChange}
      onError={() => onTokenChange('')}
      onExpire={() => onTokenChange('')}
    />
  );
};