import { isDevEnvironment } from '@/lib/environment';

const TURNSTILE_FALLBACK_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_FALLBACK_SITE_KEY;

/** Number of failed attempts before CAPTCHA is required */
export const CAPTCHA_THRESHOLD = 3;

export const shouldBypassTurnstile = (): boolean => isDevEnvironment();

export const getDefaultCaptchaToken = (): string =>
  shouldBypassTurnstile() ? 'bypass' : 'not-required';

/**
 * Normalize captcha token before sending to Supabase.
 * - 'bypass' and 'not-required' are internal placeholders → return undefined (no captcha sent)
 * - Empty/missing → return undefined
 * - Real token → return as-is
 */
export const normalizeCaptchaToken = (captchaToken?: string): string | undefined => {
  const normalizedToken = captchaToken?.trim();
  if (!normalizedToken || normalizedToken === 'bypass' || normalizedToken === 'not-required') return undefined;
  return normalizedToken;
};
