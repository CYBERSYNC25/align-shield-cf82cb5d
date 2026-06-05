const TURNSTILE_FALLBACK_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ||
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ||
  TURNSTILE_FALLBACK_SITE_KEY;

/** Número de falhas antes de exibir o captcha de forma explícita */
export const CAPTCHA_THRESHOLD = 3;

/**
 * Retorna um token inicial vazio. Como o Supabase Auth está com Bot Protection
 * ativo, toda tentativa de login/cadastro precisa aguardar um token real do Turnstile.
 */
export const getDefaultCaptchaToken = (): string => {
  return '';
};

/**
 * Normaliza o token antes de enviar ao Supabase.
 */
export const normalizeCaptchaToken = (captchaToken?: string): string | undefined => {
  const normalizedToken = captchaToken?.trim();
  if (!normalizedToken) return undefined;
  return normalizedToken;
};
