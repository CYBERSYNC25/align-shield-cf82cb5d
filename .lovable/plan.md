

## Integrar Cloudflare Turnstile com Supabase Auth

O Turnstile ja esta no formulario de Login da pagina `Auth.tsx`, porem o token **nao esta sendo enviado ao Supabase** e o `AuthModal.tsx` (signup) nao tem Turnstile. Vamos corrigir ambos.

---

### Alteracoes

**1. `src/hooks/useAuth.tsx` - Aceitar `captchaToken` nas funcoes `signIn` e `signUp`**

- `signIn(email, password, captchaToken?)` - passar `options.captchaToken` ao `supabase.auth.signInWithPassword`
- `signUp(email, password, metadata?, captchaToken?)` - passar `options.captchaToken` ao `supabase.auth.signUp`
- Atualizar a interface `AuthContextType` para refletir os novos parametros

**2. `src/pages/Auth.tsx` - Passar o token do Turnstile ao `signIn`**

- Na chamada `signIn(loginData.email, loginData.password)`, adicionar o `captchaToken` como terceiro argumento
- O widget Turnstile ja existe neste formulario, so falta conectar o token

**3. `src/components/auth/AuthModal.tsx` - Adicionar Turnstile no Login e Signup**

- Importar `Turnstile` de `@marsidev/react-turnstile`
- Adicionar estados `captchaToken` e `turnstileRef` para cada aba (login e signup)
- Inserir widget Turnstile antes do botao de submit em ambas as abas
- Passar `captchaToken` nas chamadas `signIn()` e `signUp()`
- Desabilitar botoes quando `captchaToken` estiver vazio
- Reset do captcha em caso de erro

---

### Detalhes Tecnicos

A integracao com Supabase usa a opcao `captchaToken` nativa:

```typescript
// signIn
supabase.auth.signInWithPassword({
  email,
  password,
  options: { captchaToken }
})

// signUp
supabase.auth.signUp({
  email,
  password,
  options: {
    captchaToken,
    emailRedirectTo: redirectUrl,
    data: metadata
  }
})
```

O site key sera lido de `import.meta.env.VITE_TURNSTILE_SITE_KEY` com fallback para a chave de teste `1x00000000000000000000AA`.

