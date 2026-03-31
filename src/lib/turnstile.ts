import { isDevEnvironment } from '@/lib/environment';

const TURNSTILE_FALLBACK_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_FALLBACK_SITE_KEY;

export const shouldBypassTurnstile = (): boolean => isDevEnvironment();

export const getDefaultCaptchaToken = (): string =>
  shouldBypassTurnstile() ? 'bypass' : '';

export const normalizeCaptchaToken = (captchaToken?: string): string | undefined => {
  const normalizedToken = captchaToken?.trim();
  // Em dev/preview, não enviar captchaToken ao Supabase (funciona se captcha não está habilitado no projeto)
  if (!normalizedToken || normalizedToken === 'bypass') return undefined;
  return normalizedToken;
};