const TURNSTILE_FALLBACK_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ||
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ||
  TURNSTILE_FALLBACK_SITE_KEY;

/** Número de falhas antes de exibir o captcha de forma explícita */
export const CAPTCHA_THRESHOLD = 3;

/**
 * Domínios de produção onde o Turnstile deve ser ativado.
 * Em qualquer outro domínio (preview, localhost, etc.) o captcha é ignorado
 * pois o Cloudflare Turnstile rejeita hostnames não whitelistados (erro 110200).
 */
const PRODUCTION_HOSTS = ['apoc.com.br', 'align-shield.lovable.app'];

export const shouldBypassTurnstile = (): boolean => {
  const host = window.location.hostname;
  return !PRODUCTION_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
};

/**
 * Retorna um token padrão.
 * Em ambientes bypass retorna 'bypass' para que o botão de login fique habilitado.
 */
export const getDefaultCaptchaToken = (): string => {
  return shouldBypassTurnstile() ? 'bypass' : '';
};

/**
 * Normaliza o token antes de enviar ao Supabase.
 * Tokens internos ('bypass') são convertidos em undefined para que
 * nenhum captchaToken inválido seja enviado ao backend.
 */
export const normalizeCaptchaToken = (captchaToken?: string): string | undefined => {
  const normalizedToken = captchaToken?.trim();
  if (!normalizedToken || normalizedToken === 'bypass') return undefined;
  return normalizedToken;
};
