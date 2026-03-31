const TURNSTILE_FALLBACK_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ||
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ||
  TURNSTILE_FALLBACK_SITE_KEY;

/** Número de falhas antes de exibir o captcha de forma explícita */
export const CAPTCHA_THRESHOLD = 3;

/**
 * Com o Bot Protection do Supabase ativo, o login sempre precisa de um captcha_token.
 * Por isso não fazemos bypass no preview/app; o token deve ser gerado em todos os logins.
 */
export const shouldBypassTurnstile = (): boolean => false;

export const getDefaultCaptchaToken = (): string => '';

export const normalizeCaptchaToken = (captchaToken?: string): string | undefined => {
  const normalizedToken = captchaToken?.trim();
  return normalizedToken || undefined;
};
