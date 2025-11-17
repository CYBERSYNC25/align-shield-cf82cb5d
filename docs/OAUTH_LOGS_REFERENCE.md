# Referência de Logs - OAuth 2.0 Google Workspace

Guia completo de todos os logs gerados pelo sistema de integração OAuth, organizados por componente e severidade.

## Índice
- [Componentes Frontend](#componentes-frontend)
- [Edge Functions](#edge-functions)
- [Níveis de Log](#níveis-de-log)
- [Filtros Úteis](#filtros-úteis)

---

## Componentes Frontend

### GoogleWorkspaceOAuth.tsx

#### handleConnect()
```log
# Sucesso
[OAuth] Iniciando fluxo de conexão
[OAuth] URL gerada com sucesso (245ms)
[OAuth] Auth URL preview: https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx...
[OAuth] Redirecionando para Google...

# Erro - Secrets não configuradas
[OAuth] Erro ao gerar URL (180ms): Google OAuth credentials not configured
[OAuth] Exceção capturada (180ms): Error: Google OAuth credentials not configured
```

#### handleAutoRefresh()
```log
# Sucesso
[AutoRefresh] Tentando renovar token automaticamente...
[AutoRefresh] Token renovado automaticamente (520ms): {...}

# Erro - Refresh token inválido
[AutoRefresh] Erro na renovação (450ms): Invalid refresh token
```

#### handleRefreshToken()
```log
# Sucesso
[OAuth] Renovação manual iniciada pelo usuário
[OAuth] Token renovado manualmente com sucesso (380ms): {expires_at: "...", token_preview: "ya29.a0AcM612y..."}

# Erro
[OAuth] Erro na renovação manual (420ms): {...}
[OAuth] Exceção na renovação manual (420ms): Error: ...
```

#### handleRevoke()
```log
# Sucesso
[OAuth] Iniciando revogação de acesso
[OAuth] Acesso revogado com sucesso (310ms)

# Erro
[OAuth] Erro na revogação (280ms): {...}
```

### GoogleConnectionStatus.tsx

#### checkStatus()
```log
# Conectado
[GoogleConnectionStatus] Verificando status da conexão...
[GoogleConnectionStatus] Buscando token para user_id: abc-123
[GoogleConnectionStatus] Token encontrado (85ms): {
  id: "token-xyz",
  expires_at: "2025-11-17T20:30:45Z",
  is_expired: false,
  email: "user@domain.com",
  domain: "domain.com"
}

# Desconectado
[GoogleConnectionStatus] Usuário não autenticado
[GoogleConnectionStatus] Token não encontrado (120ms)

# Erro
[GoogleConnectionStatus] Erro ao verificar status (150ms): {...}
```

#### handleAutoRefresh()
```log
# Sucesso
[AutoRefresh] Iniciando renovação automática de token
[AutoRefresh] Token atual expira em: 2025-11-17T19:30:00Z
[AutoRefresh] Token renovado com sucesso (485ms): {new_expires_at: "...", token_preview: "..."}

# Erro
[AutoRefresh] Erro na chamada (520ms): {...}
[AutoRefresh] Renovação falhou (520ms): Invalid grant
[AutoRefresh] Exceção capturada (520ms): Error: ...
```

### useGoogleWorkspaceApi.tsx

#### callAPI()
```log
# Sucesso
[GoogleAPI] Calling get_user_profile {}
[GoogleAPI] Success: {profile: {...}}

# Erro - Token expirado
[GoogleAPI] Function error: {...}
[GoogleAPI] API error: {success: false, code: "TOKEN_EXPIRED", error: "..."}

# Erro - Sem permissão
[GoogleAPI] API error: {code: "FORBIDDEN", error: "Insufficient Permission"}

# Exceção
[GoogleAPI] Exception: Error: Erro desconhecido
```

---

## Edge Functions

### google-oauth-start

```log
# Início
[Timestamp] Google OAuth Start: Initiating OAuth flow

# Validação
[Timestamp] Google OAuth: User abc-123 starting OAuth flow
[Timestamp] Generated state: eyJ1c2VySWQiOiJhYmMtMTIzIiwidGltZXN0YW1wIjoxNzAwMjQxMDE1fQ==

# Sucesso
[Timestamp] Google OAuth: URL generated successfully

# Erros
[Timestamp] Google OAuth: Missing required credentials
[Timestamp] Google OAuth: Missing Supabase configuration
[Timestamp] Google OAuth: No authorization header
[Timestamp] Google OAuth: Invalid user token
```

### google-oauth-callback

```log
# Início
[Timestamp] Google OAuth Callback: Processing callback
[Timestamp] Google OAuth Callback: Processing for user abc-123

# Troca de código
[Timestamp] Exchanging code for tokens...
[Timestamp] Token exchange successful, expires in 3600 seconds

# Armazenamento
[Timestamp] Storing tokens in database...
[Timestamp] Tokens stored successfully with ID: token-xyz-789

# Notificação
[Timestamp] Creating success notification for user...
[Timestamp] Notification created: notif-123

# Redirecionamento
[Timestamp] Redirecting to app with success

# Erros
[Timestamp] Google OAuth Callback: Authorization error: access_denied
[Timestamp] Google OAuth Callback: Missing code or state
[Timestamp] OAuth Callback: State expired
[Timestamp] OAuth Callback: Failed to exchange code for tokens
[Timestamp] OAuth Callback: Failed to store tokens
```

### google-oauth-refresh

```log
# Início
[Timestamp] Google OAuth Refresh: Starting token refresh
[Timestamp] [TokenRefresh] User: abc-123

# Busca de token
[Timestamp] [TokenRefresh] Fetching current token from database...
[Timestamp] [TokenRefresh] Current token found, expires_at: 2025-11-17T20:30:45Z
[Timestamp] [TokenRefresh] Token is expired, refreshing...

# Chamada Google
[Timestamp] [TokenRefresh] Calling Google token endpoint...
[Timestamp] [TokenRefresh] Google API request successful
[Timestamp] [TokenRefresh] New token obtained, expires in 3600 seconds

# Atualização
[Timestamp] [TokenRefresh] Updating database...
[Timestamp] [TokenRefresh] Database updated successfully

# Auditoria
[Timestamp] [TokenRefresh] Creating audit log...
[Timestamp] [TokenRefresh] Audit log created

# Sucesso
[Timestamp] Token refresh completed successfully

# Erros
[Timestamp] [TokenRefresh] No token found in database
[Timestamp] [TokenRefresh] Error calling Google API: 400 Bad Request
[Timestamp] [TokenRefresh] Invalid grant - refresh token is invalid
[Timestamp] [TokenRefresh] Failed to update database
```

### google-oauth-revoke

```log
# Início
[Timestamp] Google OAuth Revoke: Starting revocation process
[Timestamp] [Revoke] User: abc-123

# Busca e revogação
[Timestamp] [Revoke] Fetching token from database...
[Timestamp] [Revoke] Token found, revoking with Google...
[Timestamp] [Revoke] Calling Google revoke endpoint...
[Timestamp] [Revoke] Token revoked with Google API

# Limpeza
[Timestamp] [Revoke] Deleting token from database...
[Timestamp] [Revoke] Token deleted from database

# Notificação
[Timestamp] [Revoke] Creating notification...
[Timestamp] [Revoke] Notification created

# Sucesso
[Timestamp] Revocation completed successfully

# Erros
[Timestamp] [Revoke] No token found for user
[Timestamp] [Revoke] Failed to revoke with Google
[Timestamp] [Revoke] Failed to delete from database
```

### google-workspace-sync

```log
# Início
[Timestamp] [Google Workspace Sync] Processing request
[Timestamp] [API] Action: list_users, User: abc-123

# Validação
[Timestamp] [API] Missing required parameters: startTime
[Timestamp] [API] Invalid action requested: invalid_action

# Token
[Timestamp] [API] Fetching token...
[Timestamp] [API] Token expires at: 2025-11-17T21:35:01Z (valid)
[Timestamp] [API] Token is expired, cannot proceed

# Chamada API
[Timestamp] [API] Calling Google API: https://admin.googleapis.com/admin/directory/v1/users
[Timestamp] [API] Request successful (HTTP 200)
[Timestamp] [API] Request successful (HTTP 200), users found: 42

# Erros HTTP
[Timestamp] [API] Request failed (HTTP 401): Invalid Credentials
[Timestamp] [API] Request failed (HTTP 403): Insufficient Permission
[Timestamp] [API] Request failed (HTTP 404): Not Found
[Timestamp] [API] Request failed (HTTP 429): Rate Limit Exceeded
[Timestamp] [API] Request failed (HTTP 500): Internal Server Error
[Timestamp] [API] Request failed (HTTP 503): Service Temporarily Unavailable

# Códigos de erro
[Timestamp] [API] Error detected: TOKEN_EXPIRED
[Timestamp] [API] Error detected: FORBIDDEN
[Timestamp] [API] Error detected: RATE_LIMIT
[Timestamp] [API] Error detected: SERVER_ERROR
```

---

## Níveis de Log

### 🟢 INFO (Normal Operation)
Operações bem-sucedidas e fluxo normal do sistema.
```log
[OAuth] URL gerada com sucesso
[GoogleConnectionStatus] Token encontrado
[API] Request successful
```

### 🟡 WARNING (Needs Attention)
Situações que precisam de atenção mas não são críticas.
```log
[AutoRefresh] Token expirando em breve
[API] Rate limit approaching (80% used)
```

### 🔴 ERROR (Requires Action)
Erros que impedem funcionalidade e requerem ação.
```log
[OAuth] Erro ao gerar URL: Missing credentials
[API] Request failed (HTTP 401): Invalid Credentials
[TokenRefresh] Invalid grant - refresh token is invalid
```

---

## Filtros Úteis

### Ver apenas logs de OAuth
```javascript
// Browser Console
console.log.filter = (log) => log.includes('[OAuth]');
// Ou filtro direto:
[OAuth]
```

### Ver apenas erros
```javascript
// Browser Console - filtrar por palavra
error
erro
failed
```

### Ver performance (tempos de resposta)
```javascript
// Browser Console - filtrar por ms
ms)
```

### Ver logs de um usuário específico
```log
# Edge Functions logs - buscar por user_id
User: abc-123
user_id: abc-123
```

### Ver logs de renovação automática
```log
[AutoRefresh]
```

### Ver logs de APIs do Google
```log
[API]
[GoogleAPI]
```

---

## Exemplos de Diagnóstico

### Problema: Token não renova automaticamente

**Logs esperados:**
```log
[GoogleConnectionStatus] Token encontrado: expires_at=...is_expired=true
[AutoRefresh] Iniciando renovação automática
[AutoRefresh] Token renovado com sucesso
```

**Se não aparecer:**
1. Verifique se `expires_at` está realmente expirado
2. Verifique se `autoRefreshing` está false
3. Verifique se há exceção em `handleAutoRefresh`

### Problema: Erro 401 ao chamar API

**Logs esperados:**
```log
[API] Token expires at: 2025-11-17T19:00:00Z (expired)
[API] Request failed (HTTP 401): Invalid Credentials
[API] Error detected: TOKEN_EXPIRED
```

**Solução:**
- Renovar token manualmente
- Verificar se renovação automática está funcionando

### Problema: Erro "Missing credentials"

**Logs esperados:**
```log
[OAuth] Erro ao gerar URL: Google OAuth credentials not configured
```

**Solução:**
1. Acessar Supabase Dashboard
2. Settings > Edge Functions > Secrets
3. Adicionar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

### Problema: State inválido no callback

**Logs esperados:**
```log
OAuth Callback: State expired
OAuth Callback: Invalid state - missing userId
```

**Solução:**
- Usuário demorou mais de 10 minutos para autorizar
- Tentar conectar novamente
