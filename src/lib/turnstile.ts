const TURNSTILE_FALLBACK_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_FALLBACK_SITE_KEY;

export const getDefaultCaptchaToken = (): string => '';

export const normalizeCaptchaToken = (captchaToken?: string): string | undefined => {
  const normalizedToken = captchaToken?.trim();
  if (!normalizedToken) return undefined;
  return normalizedToken;
};