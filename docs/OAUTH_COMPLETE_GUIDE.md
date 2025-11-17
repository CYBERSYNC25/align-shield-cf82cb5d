# Guia Completo - OAuth 2.0 Google Workspace

Documentação abrangente do fluxo OAuth, consumo de APIs, logs, exemplos práticos e troubleshooting.

## 📚 Documentos Relacionados

- [Exemplos Práticos](./OAUTH_FLOW_EXAMPLES.md) - Requisições, respostas e exemplos de cada etapa
- [Referência de Logs](./OAUTH_LOGS_REFERENCE.md) - Todos os logs do sistema organizados
- [Documentação OAuth](./OAUTH_FLOW_DOCUMENTATION.md) - Detalhes técnicos do fluxo OAuth
- [Uso da API Google](./GOOGLE_API_USAGE.md) - Como consumir APIs do Google Workspace

---

## 🎯 Quick Start

### 1. Configurar Secrets (Obrigatório)

Acesse o Supabase Dashboard e adicione as secrets:

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx...
```

**Onde obter:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie/selecione um projeto
3. Ative APIs necessárias (Admin SDK, People API)
4. Configure OAuth Consent Screen
5. Crie credenciais OAuth 2.0 Client ID

### 2. Conectar Integração

```typescript
// Frontend (botão "Conectar Google Workspace")
const handleConnect = async () => {
  const { data } = await supabase.functions.invoke('google-oauth-start');
  window.location.href = data.authUrl; // Redireciona para Google
};
```

### 3. Consumir APIs

```typescript
import { useGoogleWorkspaceApi } from '@/hooks/useGoogleWorkspaceApi';

const { getUserProfile, listUsers, loading } = useGoogleWorkspaceApi();

// Obter perfil
const profile = await getUserProfile();
console.log(profile.email);

// Listar usuários
const result = await listUsers({ maxResults: 50 });
console.log(result.users);
```

---

## 🔄 Fluxo Completo Ilustrado

```
┌─────────────────────────────────────────────────────────────────────┐
│                        1. INICIAR OAUTH                              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Frontend: handleConnect()                             │
    │   └─► supabase.functions.invoke('google-oauth-start')│
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Edge Function: google-oauth-start                     │
    │   1. Valida secrets (CLIENT_ID, CLIENT_SECRET)        │
    │   2. Gera state (CSRF protection)                     │
    │   3. Cria URL de autorização Google                   │
    │   4. Retorna authUrl para frontend                    │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Browser: Redirect para Google                         │
    │ https://accounts.google.com/o/oauth2/v2/auth?         │
    │   client_id=xxx&                                      │
    │   redirect_uri=xxx&                                   │
    │   response_type=code&                                 │
    │   scope=openid+email+profile+admin.directory...&      │
    │   state=eyJ1c2VySWQ...&                               │
    │   access_type=offline&                                │
    │   prompt=consent                                      │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    2. USUÁRIO AUTORIZA NO GOOGLE                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Google: Callback com code                             │
    │ GET /functions/v1/google-oauth-callback?             │
    │   code=4/0AeanJ3...&                                  │
    │   state=eyJ1c2VySWQ...&                               │
    │   scope=openid+email...                               │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Edge Function: google-oauth-callback                  │
    │   1. Valida state (CSRF check)                        │
    │   2. Troca code por tokens (POST Google)              │
    │   3. Armazena tokens no banco                         │
    │   4. Cria notificação de sucesso                      │
    │   5. Redireciona para app                             │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Banco de Dados: integration_oauth_tokens              │
    │   user_id: abc-123                                    │
    │   integration_name: google_workspace                  │
    │   access_token: ya29.a0AcM612x... (1h válido)         │
    │   refresh_token: 1//0gB3k9x... (permanente)           │
    │   expires_at: 2025-11-17T20:30:45Z                    │
    │   metadata: {email, domain}                           │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Browser: Redirecionado para app                       │
    │ /integrations?success=google_workspace                │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     3. CONSUMIR APIS GOOGLE                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Frontend: listUsers()                                 │
    │   └─► supabase.functions.invoke(                     │
    │         'google-workspace-sync',                      │
    │         {action: 'list_users', params: {...}}        │
    │       )                                               │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Edge Function: google-workspace-sync                  │
    │   1. Busca access_token do banco                      │
    │   2. Verifica se expirou                              │
    │   3. Chama API Google com token                       │
    │   4. Retorna dados formatados                         │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Google API: Directory API                             │
    │ GET https://admin.googleapis.com/admin/directory/v1/  │
    │     users?maxResults=50&domain=empresa.com            │
    │ Headers:                                              │
    │   Authorization: Bearer ya29.a0AcM612x...             │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Resposta: Lista de usuários                           │
    │ {                                                     │
    │   users: [...],                                       │
    │   metadata: {totalCount: 42, syncedAt: "..."}        │
    │ }                                                     │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   4. RENOVAÇÃO DE TOKEN (1 hora depois)              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Frontend: Timer detecta token expirado                │
    │   └─► handleAutoRefresh()                            │
    │   └─► supabase.functions.invoke(                     │
    │         'google-oauth-refresh'                        │
    │       )                                               │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Edge Function: google-oauth-refresh                   │
    │   1. Busca refresh_token do banco                     │
    │   2. Chama Google token endpoint                      │
    │   3. Obtém novo access_token                          │
    │   4. Atualiza banco com novo token                    │
    │   5. Cria audit log                                   │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Google OAuth: Token Refresh                           │
    │ POST https://oauth2.googleapis.com/token              │
    │   client_id=xxx                                       │
    │   client_secret=xxx                                   │
    │   refresh_token=1//0gB3k9x...                         │
    │   grant_type=refresh_token                            │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Novo Token Armazenado                                 │
    │   access_token: ya29.a0AcM612y... (novo, 1h)          │
    │   expires_at: 2025-11-17T21:30:45Z (atualizado)       │
    └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ Frontend: Toast de sucesso                            │
    │ "🔄 Token renovado automaticamente"                   │
    └──────────────────────────────────────────────────────┘
```

---

## 📊 Dados Armazenados

### Tabela: integration_oauth_tokens

```sql
CREATE TABLE integration_oauth_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_name TEXT NOT NULL, -- 'google_workspace'
  access_token TEXT NOT NULL,     -- Token de acesso (1 hora de validade)
  refresh_token TEXT,             -- Token de renovação (permanente)
  token_type TEXT,                -- 'Bearer'
  scope TEXT,                     -- Scopes autorizados
  expires_at TIMESTAMPTZ NOT NULL,-- Quando access_token expira
  metadata JSONB,                 -- {email, domain, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Exemplo de Registro

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "abc-123-def-456",
  "integration_name": "google_workspace",
  "access_token": "ya29.a0AcM612xJKL...", // ~200 caracteres
  "refresh_token": "1//0gB3k9xYz...",     // ~100 caracteres
  "token_type": "Bearer",
  "scope": "openid email profile https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/admin.directory.group.readonly",
  "expires_at": "2025-11-17T20:30:45Z",
  "metadata": {
    "email": "user@domain.com",
    "domain": "domain.com",
    "name": "João Silva",
    "picture": "https://lh3.googleusercontent.com/..."
  },
  "created_at": "2025-11-17T19:30:45Z",
  "updated_at": "2025-11-17T19:30:45Z"
}
```

---

## 🧪 Testando a Integração

### 1. Conectar Conta

```typescript
// src/components/integrations/GoogleWorkspaceOAuth.tsx
<Button onClick={handleConnect}>
  Conectar Google Workspace
</Button>
```

**Logs esperados:**
```log
[OAuth] Iniciando fluxo de conexão
[OAuth] URL gerada com sucesso (245ms)
[OAuth] Redirecionando para Google...
```

### 2. Após Autorizar no Google

**URL de retorno:**
```
/integrations?success=google_workspace&message=Conexão%20estabelecida%20com%20sucesso
```

**Logs esperados:**
```log
[GoogleWorkspaceOAuth] useEffect detected success parameter
[GoogleConnectionStatus] Token encontrado: expires_at=20:30:45
```

### 3. Testar API - Obter Perfil

```typescript
const { getUserProfile } = useGoogleWorkspaceApi();
const profile = await getUserProfile();
```

**Resposta esperada:**
```json
{
  "id": "123456789",
  "email": "user@domain.com",
  "verified_email": true,
  "name": "João Silva",
  "given_name": "João",
  "family_name": "Silva",
  "picture": "https://lh3.googleusercontent.com/...",
  "locale": "pt-BR",
  "hd": "domain.com"
}
```

### 4. Testar API - Listar Usuários

```typescript
const { listUsers } = useGoogleWorkspaceApi();
const result = await listUsers({ maxResults: 10 });
```

**Resposta esperada:**
```json
{
  "users": [
    {
      "id": "user-id-1",
      "primaryEmail": "joao@empresa.com",
      "name": {
        "fullName": "João Silva",
        "givenName": "João",
        "familyName": "Silva"
      },
      "isAdmin": false,
      "suspended": false,
      "orgUnitPath": "/",
      "creationTime": "2023-01-15T10:30:00.000Z"
    }
  ],
  "metadata": {
    "totalCount": 10,
    "syncedAt": "2025-11-17T21:15:01Z",
    "nextPageToken": null
  }
}
```

### 5. Forçar Renovação de Token

```typescript
// Clicar no botão "Renovar Token" na interface
const handleRefreshToken = async () => {
  const { data } = await supabase.functions.invoke('google-oauth-refresh');
  console.log('Novo token expira em:', data.expiresAt);
};
```

---

## 🚨 Tratamento de Erros Comuns

### Erro 1: "Google OAuth credentials not configured"

**Causa:** Secrets não configuradas no Supabase

**Solução:**
```bash
# Adicionar no Supabase Dashboard:
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx...
```

### Erro 2: "redirect_uri_mismatch"

**Causa:** Redirect URI não está configurada no Google Cloud Console

**Solução:**
1. Acesse Google Cloud Console
2. APIs & Services > Credentials
3. Edite seu OAuth 2.0 Client ID
4. Adicione em "Authorized redirect URIs":
   ```
   https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
   ```

### Erro 3: "Token expirado" (401)

**Causa:** Access token expirou (após 1 hora)

**Solução:**
```typescript
// Renovação automática já implementada
// Ou renovação manual:
await supabase.functions.invoke('google-oauth-refresh');
```

### Erro 4: "Insufficient Permission" (403)

**Causa:** Scopes insuficientes ou usuário sem permissão

**Solução:**
1. Verificar scopes solicitados no OAuth
2. Garantir que usuário tem permissões de Admin no Google Workspace
3. Reconectar com novos scopes se necessário

### Erro 5: "Invalid grant"

**Causa:** Refresh token inválido ou revogado

**Solução:**
```typescript
// Reconectar completamente:
await supabase.functions.invoke('google-oauth-revoke'); // Limpar
await handleConnect(); // Conectar novamente
```

---

## 📈 Monitoramento e Logs

### Ver Logs no Browser

```javascript
// F12 > Console
// Filtrar por:
[OAuth]        // Fluxo OAuth
[GoogleAPI]    // Consumo de APIs
[AutoRefresh]  // Renovação automática
```

### Ver Logs das Edge Functions

Acesse o Supabase Dashboard:
- [google-oauth-start logs](https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions/google-oauth-start/logs)
- [google-oauth-callback logs](https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions/google-oauth-callback/logs)
- [google-oauth-refresh logs](https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions/google-oauth-refresh/logs)
- [google-workspace-sync logs](https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions/google-workspace-sync/logs)

### Consultar Tokens no Banco

```sql
-- Ver tokens ativos
SELECT 
  id,
  user_id,
  integration_name,
  expires_at,
  (expires_at > NOW()) AS is_valid,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/3600 AS hours_until_expiry,
  metadata->>'email' AS email,
  metadata->>'domain' AS domain
FROM integration_oauth_tokens
WHERE integration_name = 'google_workspace'
ORDER BY created_at DESC;
```

---

## 🔐 Segurança

### Boas Práticas Implementadas

✅ **CSRF Protection**: State aleatório validado no callback
✅ **Secrets Seguros**: Credenciais armazenadas em Supabase Secrets
✅ **Tokens Criptografados**: Armazenamento seguro no banco
✅ **HTTPS Only**: Todas as comunicações via HTTPS
✅ **Token Refresh**: Renovação automática sem re-autenticação
✅ **Scopes Mínimos**: Apenas permissões necessárias

### O Que NÃO Fazer

❌ Nunca expor CLIENT_SECRET no frontend
❌ Nunca logar access_token completo em produção
❌ Nunca armazenar tokens em localStorage (usar banco)
❌ Nunca compartilhar tokens entre usuários
❌ Nunca usar tokens expirados sem renovar

---

## 📚 Recursos Adicionais

- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google Admin SDK](https://developers.google.com/admin-sdk)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Exemplos Práticos](./OAUTH_FLOW_EXAMPLES.md)
- [Referência de Logs](./OAUTH_LOGS_REFERENCE.md)
