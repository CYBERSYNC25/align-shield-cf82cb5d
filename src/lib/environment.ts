/**
 * Retorna true quando estamos em ambiente de desenvolvimento/preview
 * onde o Cloudflare Turnstile não funciona (domínio não whitelistado).
 * 
 * O captcha real só roda no domínio de produção publicado.
 */
export const isDevEnvironment = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.lovableproject.com') ||
    hostname.endsWith('.lovable.app') ||
    hostname.endsWith('.lovable.dev')
  );
};
