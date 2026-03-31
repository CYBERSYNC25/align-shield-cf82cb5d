import { isDevEnvironment } from '@/lib/environment';

export const TURNSTILE_BYPASS_TOKEN = 'dev-bypass';

const TURNSTILE_FALLBACK_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_FALLBACK_SITE_KEY;

export const shouldBypassTurnstile = (): boolean => isDevEnvironment();

export const getDefaultCaptchaToken = (): string =>
  shouldBypassTurnstile() ? TURNSTILE_BYPASS_TOKEN : '';

export const normalizeCaptchaToken = (captchaToken?: string): string | undefined => {
  const normalizedToken = captchaToken?.trim();

  if (!normalizedToken || normalizedToken === TURNSTILE_BYPASS_TOKEN) {
    return undefined;
  }

  return normalizedToken;
};