

## Pular CAPTCHA no ambiente de desenvolvimento

O widget do Cloudflare Turnstile nao carrega no ambiente de dev do Lovable porque o dominio `lovableproject.com` nao esta na whitelist do Cloudflare. Em vez de adicionar mais dominios, vamos fazer o codigo detectar o ambiente de dev e pular o CAPTCHA automaticamente.

### Como funciona

Uma funcao utilitaria detecta se o app esta rodando em dominios de desenvolvimento (localhost, lovable.app, lovable.dev, lovableproject.com). Quando em dev, o widget Turnstile nao e renderizado e o token CAPTCHA nao e exigido para login/cadastro.

### Alteracoes

**1. Criar `src/lib/environment.ts`** - Funcao utilitaria para detectar ambiente

```typescript
export const isDevEnvironment = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.lovable.app') ||
    hostname.endsWith('.lovable.dev') ||
    hostname.endsWith('.lovableproject.com')
  );
};
```

**2. `src/pages/Auth.tsx`** - Condicionar CAPTCHA ao ambiente

- Importar `isDevEnvironment`
- Inicializar `captchaToken` com `'dev-bypass'` quando em dev
- Nao renderizar o widget `<Turnstile>` quando em dev
- Pular a verificacao de CAPTCHA vazio no `handleSignIn`

**3. `src/components/auth/AuthModal.tsx`** - Mesma logica

- Importar `isDevEnvironment`
- Inicializar `loginCaptchaToken` e `signupCaptchaToken` com `'dev-bypass'` quando em dev
- Nao renderizar os widgets `<Turnstile>` quando em dev

### Seguranca

- Em producao (`apoc.com.br`), o CAPTCHA continua obrigatorio
- O token `'dev-bypass'` so funciona no frontend; o Supabase nao valida CAPTCHA quando nenhum token real e enviado em ambientes de teste
- Nenhuma alteracao no backend

