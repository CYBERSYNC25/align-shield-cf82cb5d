# Exemplos Práticos do Fluxo OAuth 2.0 Google Workspace

Este documento fornece exemplos detalhados de cada etapa do fluxo OAuth, incluindo requisições, respostas, tratamento de erros e logs.

## Índice
- [1. Iniciar OAuth (google-oauth-start)](#1-iniciar-oauth)
- [2. Callback OAuth (google-oauth-callback)](#2-callback-oauth)
- [3. Renovar Token (google-oauth-refresh)](#3-renovar-token)
- [4. Revogar Acesso (google-oauth-revoke)](#4-revogar-acesso)
- [5. Consumir APIs (google-workspace-sync)](#5-consumir-apis)
- [6. Tratamento de Erros Comuns](#6-tratamento-de-erros)

---

## 1. Iniciar OAuth

### Requisição Frontend → Edge Function

```typescript
// src/components/integrations/GoogleWorkspaceOAuth.tsx
const handleConnect = async () => {
  const { data, error } = await supabase.functions.invoke('google-oauth-start', { 
    body: {} 
  });
  
  // Redireciona para Google
  window.location.href = data.authUrl;
};
```

### Logs da Edge Function

```log
[2025-11-17 19:30:15] Google OAuth Start: Initiating OAuth flow
[2025-11-17 19:30:15] Google OAuth: User abc-123 starting OAuth flow
[2025-11-17 19:30:15] Generated state: eyJ1c2VySWQiOiJhYmMtMTIzIiwidGltZXN0YW1wIjoxNzAwMjQxMDE1fQ==
[2025-11-17 19:30:15] Google OAuth: URL generated successfully
```

### Resposta Sucesso

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx.apps.googleusercontent.com&redirect_uri=https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback&response_type=code&scope=openid%20email%20profile%20https://www.googleapis.com/auth/admin.directory.user.readonly%20https://www.googleapis.com/auth/admin.directory.group.readonly&state=eyJ1c2VySWQiOiJhYmMtMTIzIiwidGltZXN0YW1wIjoxNzAwMjQxMDE1fQ==&access_type=offline&prompt=consent"
}
```

### Resposta Erro (Secrets não configuradas)

```json
{
  "error": "Google OAuth credentials not configured",
  "required": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  "instructions": "Configure estas secrets no Supabase Dashboard > Settings > Edge Functions > Secrets"
}
```

---

## 2. Callback OAuth

### Requisição Google → Edge Function

```
GET https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback?code=4/0AeanJ3...&state=eyJ1c2VySWQiOiJhYmMtMTIzIiwidGltZXN0YW1wIjoxNzAwMjQxMDE1fQ==&scope=openid+email+profile+...
```

### Logs da Edge Function

```log
[2025-11-17 19:30:45] Google OAuth Callback: Processing callback
[2025-11-17 19:30:45] Google OAuth Callback: Processing for user abc-123
[2025-11-17 19:30:45] Exchanging code for tokens...
[2025-11-17 19:30:46] Token exchange successful, expires in 3600 seconds
[2025-11-17 19:30:46] Storing tokens in database...
[2025-11-17 19:30:46] Tokens stored successfully with ID: token-xyz-789
[2025-11-17 19:30:46] Creating success notification for user...
[2025-11-17 19:30:46] Notification created: notif-123
[2025-11-17 19:30:46] Redirecting to app with success
```

### Requisição para Google (Token Exchange)

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=4/0AeanJ3...
client_id=xxx.apps.googleusercontent.com
client_secret=GOCSPX-xxx...
redirect_uri=https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
grant_type=authorization_code
```

### Resposta Google (Token Exchange Sucesso)

```json
{
  "access_token": "ya29.a0AcM612x...",
  "refresh_token": "1//0gB3k9x...",
  "expires_in": 3600,
  "scope": "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/admin.directory.group.readonly",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

### Dados Armazenados no Banco

```sql
-- Tabela: integration_oauth_tokens
INSERT INTO integration_oauth_tokens (
  user_id,
  integration_name,
  access_token,
  refresh_token,
  token_type,
  scope,
  expires_at,
  metadata
) VALUES (
  'abc-123',
  'google_workspace',
  'ya29.a0AcM612x...',
  '1//0gB3k9x...',
  'Bearer',
  'openid email profile ...',
  '2025-11-17T20:30:45Z', -- now() + 1 hora
  '{"email": "user@domain.com", "domain": "domain.com"}'
);
```

### Redirecionamento Final

```
HTTP 302 Found
Location: https://lovable.app/integrations?success=google_workspace&message=Conexão%20estabelecida%20com%20sucesso
```

---

## 3. Renovar Token

### Caso de Uso 1: Renovação Automática (Token Expirado)

```typescript
// src/components/integrations/GoogleConnectionStatus.tsx
useEffect(() => {
  if (tokenExpirado && !autoRefreshing) {
    handleAutoRefresh(); // Chamado automaticamente
  }
}, [tokenExpirado]);
```

### Caso de Uso 2: Renovação Manual (Usuário clica no botão)

```typescript
// src/components/integrations/GoogleWorkspaceOAuth.tsx
const handleRefreshToken = async () => {
  const { data, error } = await supabase.functions.invoke('google-oauth-refresh');
  // Processa resposta
};
```

### Logs da Edge Function

```log
[2025-11-17 20:35:00] Google OAuth Refresh: Starting token refresh
[2025-11-17 20:35:00] [TokenRefresh] User: abc-123
[2025-11-17 20:35:00] [TokenRefresh] Fetching current token from database...
[2025-11-17 20:35:00] [TokenRefresh] Current token found, expires_at: 2025-11-17T20:30:45Z
[2025-11-17 20:35:00] [TokenRefresh] Token is expired, refreshing...
[2025-11-17 20:35:01] [TokenRefresh] Google API request successful
[2025-11-17 20:35:01] [TokenRefresh] New token obtained, expires in 3600 seconds
[2025-11-17 20:35:01] [TokenRefresh] Updating database...
[2025-11-17 20:35:01] [TokenRefresh] Database updated successfully
[2025-11-17 20:35:01] [TokenRefresh] Audit log created
[2025-11-17 20:35:01] Token refresh completed successfully
```

### Requisição para Google

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id=xxx.apps.googleusercontent.com
client_secret=GOCSPX-xxx...
refresh_token=1//0gB3k9x...
grant_type=refresh_token
```

### Resposta Google (Refresh Sucesso)

```json
{
  "access_token": "ya29.a0AcM612y...",
  "expires_in": 3600,
  "scope": "openid https://www.googleapis.com/auth/userinfo.email ...",
  "token_type": "Bearer"
}
```

### Resposta Edge Function (Sucesso)

```json
{
  "success": true,
  "accessToken": "ya29.a0AcM612y...",
  "expiresAt": "2025-11-17T21:35:01Z",
  "message": "Token refreshed successfully"
}
```

### Resposta Edge Function (Erro - Refresh Token Inválido)

```json
{
  "success": false,
  "error": "Invalid refresh token. Please reconnect your account.",
  "code": "INVALID_GRANT"
}
```

---

## 4. Revogar Acesso

### Requisição Frontend → Edge Function

```typescript
const handleRevoke = async () => {
  const { data, error } = await supabase.functions.invoke('google-oauth-revoke');
};
```

### Logs da Edge Function

```log
[2025-11-17 21:00:00] Google OAuth Revoke: Starting revocation process
[2025-11-17 21:00:00] [Revoke] User: abc-123
[2025-11-17 21:00:00] [Revoke] Fetching token from database...
[2025-11-17 21:00:00] [Revoke] Token found, revoking with Google...
[2025-11-17 21:00:01] [Revoke] Token revoked with Google API
[2025-11-17 21:00:01] [Revoke] Deleting token from database...
[2025-11-17 21:00:01] [Revoke] Token deleted from database
[2025-11-17 21:00:01] [Revoke] Creating notification...
[2025-11-17 21:00:01] Revocation completed successfully
```

### Requisição para Google

```http
POST https://oauth2.googleapis.com/revoke
Content-Type: application/x-www-form-urlencoded

token=1//0gB3k9x...
```

### Resposta Google (Sucesso)

```
HTTP 200 OK
(corpo vazio)
```

---

## 5. Consumir APIs

### Exemplo 1: Obter Perfil do Usuário

```typescript
// Frontend
const { getUserProfile } = useGoogleWorkspaceApi();
const profile = await getUserProfile();
```

**Logs:**
```log
[2025-11-17 21:10:00] [GoogleAPI] Calling get_user_profile {}
[2025-11-17 21:10:00] [API] Action: get_user_profile, User: abc-123
[2025-11-17 21:10:00] [API] Fetching token...
[2025-11-17 21:10:00] [API] Token expires at: 2025-11-17T21:35:01Z (valid)
[2025-11-17 21:10:00] [API] Calling Google API: https://www.googleapis.com/oauth2/v2/userinfo
[2025-11-17 21:10:01] [API] Request successful (HTTP 200)
[2025-11-17 21:10:01] [GoogleAPI] Success: {...}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "profile": {
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
  }
}
```

### Exemplo 2: Listar Usuários do Domínio

```typescript
const { listUsers } = useGoogleWorkspaceApi();
const result = await listUsers({ maxResults: 50, domain: 'empresa.com' });
```

**Logs:**
```log
[2025-11-17 21:15:00] [GoogleAPI] Calling list_users {"maxResults":50,"domain":"empresa.com"}
[2025-11-17 21:15:00] [API] Action: list_users, User: abc-123
[2025-11-17 21:15:00] [API] Calling Google API: https://admin.googleapis.com/admin/directory/v1/users
[2025-11-17 21:15:01] [API] Request successful (HTTP 200), users found: 42
[2025-11-17 21:15:01] [GoogleAPI] Success: {...}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
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
        "creationTime": "2023-01-15T10:30:00.000Z",
        "lastLoginTime": "2025-11-17T08:00:00.000Z"
      }
    ],
    "metadata": {
      "totalCount": 42,
      "syncedAt": "2025-11-17T21:15:01Z",
      "nextPageToken": null
    }
  }
}
```

---

## 6. Tratamento de Erros

### Erro 1: Token Expirado (401)

**Request:**
```typescript
const result = await listUsers();
```

**Logs:**
```log
[2025-11-17 21:20:00] [API] Calling Google API...
[2025-11-17 21:20:01] [API] Request failed (HTTP 401): Invalid Credentials
[2025-11-17 21:20:01] [API] Error detected: TOKEN_EXPIRED
[2025-11-17 21:20:01] [GoogleAPI] API error: TOKEN_EXPIRED
```

**Resposta:**
```json
{
  "success": false,
  "error": "Token expirado. Por favor, renove o token.",
  "code": "TOKEN_EXPIRED"
}
```

**Toast exibido:**
```
🔑 Token expirado
Seu token OAuth expirou. Clique em "Renovar Token" na aba OAuth 2.0.
```

### Erro 2: Sem Permissão (403)

**Logs:**
```log
[2025-11-17 21:25:00] [API] Request failed (HTTP 403): Insufficient Permission
[2025-11-17 21:25:00] [API] Error detected: FORBIDDEN
```

**Resposta:**
```json
{
  "success": false,
  "error": "Você não tem permissão para acessar este recurso. Verifique os scopes autorizados.",
  "code": "FORBIDDEN"
}
```

### Erro 3: Rate Limit (429)

**Logs:**
```log
[2025-11-17 21:30:00] [API] Request failed (HTTP 429): Rate Limit Exceeded
[2025-11-17 21:30:00] [API] Error detected: RATE_LIMIT
```

**Resposta:**
```json
{
  "success": false,
  "error": "Limite de requisições excedido. Aguarde alguns minutos.",
  "code": "RATE_LIMIT"
}
```

### Erro 4: Erro do Servidor Google (500+)

**Logs:**
```log
[2025-11-17 21:35:00] [API] Request failed (HTTP 503): Service Temporarily Unavailable
[2025-11-17 21:35:00] [API] Error detected: SERVER_ERROR
```

**Resposta:**
```json
{
  "success": false,
  "error": "Erro temporário do Google. Tente novamente em alguns instantes.",
  "code": "SERVER_ERROR"
}
```

---

## Fluxo Completo com Logs

### Cenário: Novo Usuário Conectando e Usando a API

```log
# 1. Usuário clica em "Conectar Google Workspace"
[19:30:15] [GoogleWorkspaceOAuth] handleConnect() called
[19:30:15] [Frontend] Toast: 🚀 Iniciando conexão - Gerando URL de autorização...
[19:30:15] [Edge Function] google-oauth-start: Initiating OAuth flow
[19:30:15] [Edge Function] User abc-123 starting OAuth flow
[19:30:15] [Edge Function] URL generated successfully
[19:30:15] [Frontend] Toast: ✅ URL gerada - Redirecionando para o Google...
[19:30:16] [Browser] Redirecting to Google consent screen

# 2. Usuário autoriza no Google
[19:30:45] [Google] User authorized, redirecting to callback...
[19:30:45] [Edge Function] google-oauth-callback: Processing callback
[19:30:45] [Edge Function] Processing for user abc-123
[19:30:46] [Edge Function] Token exchange successful
[19:30:46] [Edge Function] Tokens stored successfully
[19:30:46] [Browser] Redirected to app with success=true

# 3. Frontend detecta sucesso
[19:30:47] [GoogleWorkspaceOAuth] useEffect detected success parameter
[19:30:47] [Frontend] Toast: ✅ Conexão estabelecida com sucesso!
[19:30:47] [GoogleConnectionStatus] checkStatus() called
[19:30:47] [GoogleConnectionStatus] Token encontrado: expires_at=20:30:45

# 4. Usuário testa API (lista usuários)
[19:31:00] [GoogleApiTester] handleListUsers() called
[19:31:00] [Frontend] Toast: ⏳ Buscando usuários...
[19:31:00] [Edge Function] google-workspace-sync: list_users
[19:31:01] [Edge Function] Request successful, users found: 42
[19:31:01] [Frontend] Toast: ✅ Usuários carregados - 42 usuários encontrados

# 5. Token expira (1 hora depois)
[20:30:46] [GoogleConnectionStatus] updateTimer: Token expirado
[20:30:46] [GoogleConnectionStatus] handleAutoRefresh() called
[20:30:46] [Edge Function] google-oauth-refresh: Starting token refresh
[20:30:47] [Edge Function] Token refresh completed successfully
[20:30:47] [Frontend] Toast: 🔄 Token renovado automaticamente

# 6. Usuário continua usando normalmente
[20:31:00] [GoogleApiTester] handleGetProfile() called
[20:31:01] [Edge Function] get_user_profile successful
[20:31:01] [Frontend] Toast: ✅ Perfil carregado
```

---

## Dicas de Debugging

### Como ver logs em tempo real:

1. **Edge Functions**: https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions/{function_name}/logs
2. **Browser Console**: F12 > Console (filtre por `[Google` para ver apenas logs da integração)
3. **Network Tab**: F12 > Network > filter por `functions/v1/google`

### Logs importantes para diagnosticar problemas:

```typescript
// Verificar se token está válido
console.log('Token expires at:', tokenInfo?.expires_at);
console.log('Is expired:', new Date(tokenInfo.expires_at) < new Date());

// Verificar scopes autorizados
console.log('Authorized scopes:', tokenInfo?.scope);

// Verificar resposta de erro da API
console.error('API Error:', {
  status: error.status,
  message: error.message,
  code: error.code
});
```
