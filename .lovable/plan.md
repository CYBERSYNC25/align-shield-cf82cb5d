

## Ativar Turnstile em modo producao

O captcha esta em modo de teste porque a variavel `VITE_TURNSTILE_SITE_KEY` no arquivo `.env` usa a chave de teste do Cloudflare (`1x00000000000000000000AA`). Alem disso, o codigo tem fallbacks que voltam para essa mesma chave de teste caso a variavel esteja vazia.

### Alteracoes

**1. `.env` - Substituir a chave de teste pela chave real**

Trocar o valor de `VITE_TURNSTILE_SITE_KEY` pela Site Key real obtida no dashboard do Cloudflare Turnstile.

**2. `src/pages/Auth.tsx` - Remover fallback para chave de teste**

Na linha que usa o siteKey do Turnstile, remover o fallback `|| '1x00000000000000000000AA'` para garantir que so funcione com a chave real configurada.

**3. `src/components/auth/AuthModal.tsx` - Remover fallback para chave de teste**

Mesma correcao: remover o fallback da chave de teste no componente AuthModal.

---

### Acao necessaria do usuario

Voce precisa informar a **Site Key real** do Cloudflare Turnstile. Ela esta disponivel em:
- [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile → seu site → copiar a "Site Key"

Eu vou atualizar o `.env` com a chave que voce fornecer e remover os fallbacks de teste do codigo.

