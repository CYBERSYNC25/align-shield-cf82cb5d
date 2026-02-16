
## Corrigir erro "captcha verification process failed" no ambiente de dev

### Problema
O token `'dev-bypass'` esta sendo enviado ao Supabase como `captchaToken`. O Supabase tem a validacao do Turnstile ativada no projeto, entao ele envia esse token falso ao Cloudflare, que o rejeita.

### Causa raiz
Na linha 141 de `src/hooks/useAuth.tsx`, o `captchaToken` e passado diretamente nas options do `signInWithPassword`. Quando o valor e `'dev-bypass'`, o Supabase tenta validar esse token e falha.

### Solucao
Alterar `src/hooks/useAuth.tsx` (e o `signUp` tambem) para so incluir `captchaToken` nas options quando ele for um token real, ou seja, quando **nao** for o valor `'dev-bypass'`.

### Alteracoes

**`src/hooks/useAuth.tsx`** - Funcao `signIn` (linha ~141)

Antes:
```typescript
const { error } = await supabase.auth.signInWithPassword({ 
  email, password, options: { captchaToken } 
})
```

Depois:
```typescript
const { error } = await supabase.auth.signInWithPassword({ 
  email, password, 
  options: captchaToken && captchaToken !== 'dev-bypass' 
    ? { captchaToken } 
    : {} 
})
```

Aplicar a mesma logica na funcao `signUp` (linha ~178):

Antes:
```typescript
options: {
  captchaToken,
  emailRedirectTo: redirectUrl,
  data: metadata
}
```

Depois:
```typescript
options: {
  ...(captchaToken && captchaToken !== 'dev-bypass' ? { captchaToken } : {}),
  emailRedirectTo: redirectUrl,
  data: metadata
}
```

### Resultado
- Em dev: nenhum token CAPTCHA e enviado ao Supabase, login funciona normalmente
- Em producao: token real do Turnstile continua sendo enviado e validado
