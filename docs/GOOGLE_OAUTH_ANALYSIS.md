# Análise Completa da Integração OAuth com Google Workspace

## 📊 Status da Análise
**Data:** 18 de novembro de 2025  
**Projeto Supabase:** ofbyxnpprwwuieabwhdo  
**Ambiente:** Produção

---

## ✅ 1. REDIRECT_URI - VERIFICAÇÃO DE CONFORMIDADE

### Configuração Atual
```
Redirect URI usado: https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
```

### ✅ Pontos Positivos Identificados
- **HTTPS:** Corretamente configurado (obrigatório para produção)
- **Consistência:** Mesmo URI usado em `google-oauth-start` e `google-oauth-callback`
- **Formato:** Estrutura correta seguindo padrão Supabase Edge Functions

### ⚠️ Pontos de Atenção

#### CRÍTICO: Verificar no Google Cloud Console
O redirect_uri **DEVE** estar cadastrado **EXATAMENTE** como:
```
https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
```

**Verificações obrigatórias:**
1. Sem barra final (`/`) no final da URL
2. Sem espaços antes ou depois
3. Case-sensitive: todas as letras minúsculas
4. Protocolo HTTPS (não HTTP)
5. Deve estar na lista de "Authorized redirect URIs" do OAuth Client ID

#### Como Verificar no Google Cloud Console
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Selecione seu projeto
3. Clique no OAuth 2.0 Client ID
4. Em "Authorized redirect URIs", verifique se contém EXATAMENTE:
   ```
   https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
   ```

#### Erro Comum: `redirect_uri_mismatch`
Se você receber este erro, significa que:
- O URI não está cadastrado no Google Cloud Console
- Há diferença de maiúsculas/minúsculas
- Há uma barra final extra ou faltando
- O protocolo está errado (HTTP vs HTTPS)

**Solução:** Copie e cole o URI exato mostrado acima no Google Cloud Console.

---

## 🔐 2. ESCOPOS (SCOPES) - ANÁLISE DE ADEQUAÇÃO

### Escopos Atualmente Solicitados
```javascript
const scopes = [
  'https://www.googleapis.com/auth/admin.directory.user.readonly',    // Usuários do diretório
  'https://www.googleapis.com/auth/admin.directory.group.readonly',   // Grupos do diretório
  'https://www.googleapis.com/auth/admin.reports.audit.readonly',     // Logs de auditoria
  'https://www.googleapis.com/auth/drive.metadata.readonly',          // Metadados do Drive
  'openid',                                                             // Identificação OpenID
  'profile',                                                            // Perfil do usuário
  'email'                                                               // Email do usuário
];
```

### ⚠️ IMPORTANTE: Tipo de Conta Google

#### Para Contas Pessoais (@gmail.com)
**❌ NÃO FUNCIONARÁ com os escopos atuais**

Os seguintes escopos requerem Google Workspace:
- `admin.directory.user.readonly` - Requer conta de domínio
- `admin.directory.group.readonly` - Requer conta de domínio
- `admin.reports.audit.readonly` - Requer conta de domínio

**✅ Para testar com conta pessoal, use apenas:**
```javascript
const scopesForPersonalAccount = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive.metadata.readonly'  // Opcional
];
```

#### Para Contas Google Workspace (domínio próprio)
**✅ Todos os escopos atuais são adequados**

**Requisitos adicionais:**
1. Conta deve ter privilégios de administrador
2. Domínio deve estar autorizado na tela de consentimento
3. APIs Admin SDK devem estar habilitadas

### 🎯 Recomendação por Ambiente

#### Desenvolvimento/Teste
```javascript
// Usar escopos mínimos para validar OAuth
const scopesForTesting = [
  'openid',
  'profile', 
  'email'
];
```

#### Produção (Google Workspace)
```javascript
// Escopos completos já configurados
// Manter configuração atual
```

---

## 👥 3. TELA DE CONSENTIMENTO E TEST USERS

### Status de Publicação

#### ⚠️ VERIFICAR: App em Produção?

**Se o app NÃO está publicado (modo Testing):**

1. **Adicionar Test Users obrigatório:**
   - Vá em: https://console.cloud.google.com/apis/credentials/consent
   - Seção "Test users"
   - Adicione o email exato da conta que vai testar
   - Limite: 100 test users

2. **Usuários permitidos:**
   - ✅ Contas pessoais (@gmail.com) - Se adicionadas como test users
   - ✅ Contas do domínio - Se domínio autorizado
   - ❌ Outras contas - Receberão erro "access_denied"

**Se o app está publicado (Production):**
- ✅ Qualquer conta Google pode autorizar
- Revisão do Google necessária para escopos sensíveis
- Política de privacidade obrigatória

### Configuração Recomendada para Testes

```
Status: Testing
Publishing status: In development
User type: External

Test users:
- seu-email@gmail.com
- equipe@seudominio.com
```

### Erros Comuns

#### Erro: "This app isn't verified"
**Solução:**
- Em modo Testing: Clicar em "Advanced" → "Go to [App name]"
- Em Produção: Submeter para verificação do Google

#### Erro: "Access blocked: This app's request is invalid"
**Possíveis causas:**
- Test user não adicionado (se em modo Testing)
- Escopos não autorizados para tipo de conta
- Domínio não autorizado

---

## 🔌 4. APIs HABILITADAS - VERIFICAÇÃO

### APIs Necessárias

Para os escopos atuais, estas APIs **DEVEM** estar habilitadas:

```
✅ Google People API
✅ Admin SDK API
✅ Google Drive API
✅ Google Workspace Admin SDK Reports API
```

### Como Verificar e Habilitar

1. **Acesse:** https://console.cloud.google.com/apis/library
2. **Pesquise cada API:**
   - "Admin SDK API"
   - "Google People API"
   - "Google Drive API"
   - "Admin SDK Reports API"

3. **Para cada API:**
   - Clique na API
   - Verifique se mostra "API enabled" (verde)
   - Se não: Clique em "ENABLE"

### ⚠️ Tempo de Propagação
- APIs habilitadas podem levar até 5 minutos para ficarem ativas
- Se receber erro 403 após habilitar, aguarde alguns minutos

### Erros Relacionados

#### Erro: "accessNotConfigured"
```json
{
  "error": {
    "code": 403,
    "message": "Admin SDK API has not been used in project XXXXXX before or it is disabled"
  }
}
```
**Solução:** Habilitar a API correspondente no Google Cloud Console.

---

## 🔗 5. PARÂMETROS DA URL DE AUTORIZAÇÃO

### Parâmetros Atuais (Validados nos Logs)

```javascript
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

// ✅ Parâmetros obrigatórios presentes
authUrl.searchParams.set('client_id', clientId);              // ✅ Presente
authUrl.searchParams.set('redirect_uri', redirectUri);        // ✅ Presente
authUrl.searchParams.set('response_type', 'code');            // ✅ Presente
authUrl.searchParams.set('scope', scopes.join(' '));          // ✅ Presente
authUrl.searchParams.set('access_type', 'offline');           // ✅ Presente
authUrl.searchParams.set('prompt', 'consent');                // ✅ Presente
authUrl.searchParams.set('state', encodedState);              // ✅ Presente (CSRF protection)
```

### Análise dos Parâmetros

| Parâmetro | Valor | Status | Descrição |
|-----------|-------|--------|-----------|
| `client_id` | [Configurado via secret] | ✅ | ID do cliente OAuth |
| `redirect_uri` | `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback` | ✅ | URI de callback |
| `response_type` | `code` | ✅ | Fluxo Authorization Code |
| `scope` | Lista de escopos separados por espaço | ✅ | Permissões solicitadas |
| `access_type` | `offline` | ✅ | Permite refresh token |
| `prompt` | `consent` | ✅ | Força tela de consentimento |
| `state` | Base64 com userId + timestamp + random | ✅ | Proteção CSRF |

### ✅ Conformidade OAuth 2.0
Todos os parâmetros obrigatórios estão presentes e corretos.

### Segurança CSRF
```javascript
// State inclui:
{
  userId: "user-uuid",
  timestamp: 1763487276117,
  random: "184c7cf9fc31d12ec95e02c64d9c62c8..."
}
// Validado no callback com limite de 10 minutos
```

---

## 🚫 6. RESTRIÇÕES DE CONTA GOOGLE

### Possíveis Bloqueios Empresariais

Se estiver testando com conta corporativa, verifique:

#### Políticas de Admin do Google Workspace
1. **OAuth App Access:**
   - Admin pode ter bloqueado apps de terceiros
   - Verificar em: Admin Console → Security → API controls

2. **Trusted Apps:**
   - Pode ser necessário adicionar seu app à lista de confiança
   - Admin deve autorizar manualmente

3. **Domain-Wide Delegation:**
   - Para escopos de Admin, pode ser necessário
   - Requer configuração adicional pelo administrador

### Contas Pessoais (@gmail.com)

#### ✅ Sem Restrições
- Não há políticas de admin
- Usuário tem controle total
- **MAS:** Escopos de Admin SDK não funcionarão

#### ⚠️ Limitações
Contas pessoais não podem usar:
- `admin.directory.*`
- `admin.reports.*`
- Qualquer escopo que requer Google Workspace

### Recomendação para Testes

**Opção 1: Conta de Teste Pessoal**
```javascript
// Modificar escopos temporariamente
const testScopes = ['openid', 'profile', 'email'];
```

**Opção 2: Conta Google Workspace de Teste**
- Criar trial gratuito do Google Workspace (14 dias)
- Usar conta com privilégios de admin
- Testar com todos os escopos

---

## 📋 RESUMO DE INCONSISTÊNCIAS E AÇÕES

### 🔴 CRÍTICAS (Impedem funcionamento)

#### 1. Verificar Redirect URI no Google Cloud Console
**Status:** ⚠️ PENDENTE VERIFICAÇÃO  
**Ação:** 
1. Acessar https://console.cloud.google.com/apis/credentials
2. Verificar se contém: `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback`
3. Se não: Adicionar exatamente este URI

#### 2. Escopos vs Tipo de Conta
**Status:** ⚠️ INCOMPATIBILIDADE PROVÁVEL  
**Problema:** Escopos de Admin SDK não funcionam com contas pessoais  
**Ação:** 
- **Para teste rápido:** Modificar escopos para apenas `openid profile email`
- **Para produção:** Usar conta Google Workspace

#### 3. Verificar Test Users (se app não publicado)
**Status:** ⚠️ PENDENTE VERIFICAÇÃO  
**Ação:**
1. Ir em https://console.cloud.google.com/apis/credentials/consent
2. Adicionar email da conta de teste em "Test users"

### 🟡 IMPORTANTES (Podem causar erros)

#### 4. Habilitar APIs Necessárias
**Status:** ⚠️ PENDENTE VERIFICAÇÃO  
**Ação:**
1. Verificar se APIs estão habilitadas:
   - Admin SDK API
   - Google People API
   - Drive API
2. Habilitar as que estiverem desabilitadas

#### 5. Tela de Consentimento
**Status:** ⚠️ PENDENTE CONFIGURAÇÃO  
**Ação:**
1. Preencher informações obrigatórias
2. Adicionar domínio autorizado
3. Configurar política de privacidade (se for publicar)

### 🟢 CONFORMES (Funcionando corretamente)

#### ✅ Estrutura de Redirect URI
- Formato correto
- HTTPS configurado
- Consistência entre funções

#### ✅ Parâmetros OAuth
- Todos os obrigatórios presentes
- CSRF protection implementado
- Access type offline (permite refresh)

#### ✅ Tratamento de Erros
- Validação de state
- Timeout de 10 minutos
- Error handling completo

#### ✅ Armazenamento de Tokens
- Tokens salvos no Supabase
- Suporte a refresh token
- Metadados do usuário incluídos

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Passo 1: Validação Imediata (5-10 min)
```bash
# Checklist rápido
☐ Verificar redirect_uri no Google Cloud Console
☐ Confirmar tipo de conta que será usado (pessoal vs workspace)
☐ Adicionar test user se necessário
☐ Verificar APIs habilitadas
```

### Passo 2: Ajuste para Teste Rápido (se conta pessoal)
```typescript
// Em supabase/functions/google-oauth-start/index.ts
// Modificar temporariamente:
const scopes = [
  'openid',
  'profile',
  'email',
  // Comentar escopos de Admin por enquanto
  // 'https://www.googleapis.com/auth/admin.directory.user.readonly',
  // 'https://www.googleapis.com/auth/admin.directory.group.readonly',
  // 'https://www.googleapis.com/auth/admin.reports.audit.readonly',
];
```

### Passo 3: Teste de Conexão
1. Limpar cache do navegador
2. Tentar conectar novamente
3. Observar logs da edge function
4. Verificar resposta do Google

### Passo 4: Normalização para Produção
Após testes bem-sucedidos:
1. Restaurar escopos completos
2. Configurar conta Google Workspace
3. Adicionar domínios autorizados
4. Submeter para verificação do Google (se necessário)

---

## 📊 LOGS DE DIAGNÓSTICO

### Últimos Logs Analisados (Edge Functions)

```
[2025-11-18 17:34:36] Google OAuth Start: Initiating OAuth flow
[2025-11-18 17:34:36] Google OAuth: User 4d817a59-4db1-4019-be6c-b7e2c5583d41 starting OAuth flow
[2025-11-18 17:34:36] Google OAuth: Redirect URI: https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
[2025-11-18 17:34:36] Google OAuth: Scopes: https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/admin.directory.group.readonly https://www.googleapis.com/auth/admin.reports.audit.readonly https://www.googleapis.com/auth/drive.metadata.readonly openid profile email
[2025-11-18 17:34:36] Google OAuth: Authorization URL generated successfully
```

**Análise:** Edge function executou corretamente. URL de autorização foi gerada.

### Requisições de Rede

```
POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-start
Status: 200 OK
Response: {"success":true,"authUrl":"https://accounts.google.com/o/oauth2/v2/auth?..."}
```

**Análise:** Requisição bem-sucedida. Usuário foi redirecionado para Google.

```
GET https://ofbyxnpprwwuieabwhdo.supabase.co/rest/v1/integration_oauth_tokens?...
Status: 406 Not Acceptable
Error: PGRST116 - The result contains 0 rows
```

**Análise:** Normal. Indica que ainda não há token armazenado (usuário ainda não completou OAuth).

---

## 🔧 SCRIPTS DE DIAGNÓSTICO

### Verificar Configuração Atual

```javascript
// Executar no Console do navegador em /integrations
const checkOAuthConfig = async () => {
  const { data, error } = await supabase.functions.invoke('google-oauth-start');
  
  if (data?.authUrl) {
    const url = new URL(data.authUrl);
    console.log('✅ OAuth Start está funcionando');
    console.log('Redirect URI:', url.searchParams.get('redirect_uri'));
    console.log('Scopes:', url.searchParams.get('scope'));
    console.log('Client ID:', url.searchParams.get('client_id')?.substring(0, 20) + '...');
  } else {
    console.error('❌ Erro:', error);
  }
};

checkOAuthConfig();
```

### Verificar Token Existente

```javascript
// Verificar se há token armazenado
const checkToken = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    console.error('❌ Usuário não autenticado');
    return;
  }

  const { data, error } = await supabase
    .from('integration_oauth_tokens')
    .select('*')
    .eq('user_id', session.session.user.id)
    .eq('integration_name', 'google_workspace')
    .maybeSingle();

  if (data) {
    console.log('✅ Token encontrado:', {
      created: data.created_at,
      expires: data.expires_at,
      metadata: data.metadata
    });
  } else {
    console.log('ℹ️ Nenhum token armazenado ainda');
  }
};

checkToken();
```

---

## 📚 REFERÊNCIAS

### Documentação Oficial
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Admin SDK](https://developers.google.com/admin-sdk)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Links Diretos do Projeto
- [OAuth Credentials](https://console.cloud.google.com/apis/credentials)
- [Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- [API Library](https://console.cloud.google.com/apis/library)

### Documentação do Projeto
- `docs/OAUTH_FLOW_DOCUMENTATION.md` - Fluxo completo do OAuth
- `docs/GOOGLE_API_USAGE.md` - Uso das APIs do Google
- `docs/USER_GUIDE_INTEGRATIONS.md` - Guia do usuário

---

## ✅ CHECKLIST FINAL

### Antes de Testar
```
☐ Redirect URI verificado no Google Cloud Console
☐ Test user adicionado (se app não publicado)
☐ Tipo de conta decidido (pessoal vs workspace)
☐ Escopos ajustados para tipo de conta
☐ APIs necessárias habilitadas
☐ Tela de consentimento configurada
☐ Secrets verificados no Supabase
```

### Durante o Teste
```
☐ Abrir DevTools → Network tab
☐ Limpar cookies/cache
☐ Clicar em "Conectar ao Google Workspace"
☐ Observar URL de redirecionamento
☐ Autorizar permissões no Google
☐ Verificar callback no Supabase
☐ Confirmar token armazenado
```

### Após Sucesso
```
☐ Testar listagem de usuários
☐ Testar refresh de token
☐ Verificar expiration do token
☐ Documentar configuração final
☐ Restaurar escopos completos (se modificados)
```

---

**Análise gerada automaticamente em:** 2025-11-18 17:39:24 UTC  
**Última atualização do código:** 2025-11-18 17:34:36 UTC
