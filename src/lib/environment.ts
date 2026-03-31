/**
 * Retorna true apenas em ambientes locais/preview onde o Cloudflare
 * Turnstile costuma falhar por hostname não autorizado.
 *
 * O domínio publicado (.lovable.app ou domínio customizado) continua
 * usando o captcha real em produção.
 */
export const isDevEnvironment = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.lovableproject.com') ||
    hostname.endsWith('.lovable.dev')
  );
};
