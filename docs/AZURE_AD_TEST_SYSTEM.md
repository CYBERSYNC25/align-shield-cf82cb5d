# Sistema de Teste Automatizado - Azure AD / Entra ID

## Visão Geral

Sistema completo de teste e validação automatizada para integração OAuth 2.0 com Microsoft Azure Active Directory (Entra ID), incluindo validação de tokens, chamadas ao Microsoft Graph API, gerenciamento de conexão e relatórios detalhados.

## Arquitetura do Sistema

### Componentes Backend

#### 1. Edge Function: `azure-test-connection`
**Localização**: `supabase/functions/azure-test-connection/index.ts`

**Funcionalidades**:
- ✅ Recupera tokens OAuth armazenados
- ✅ Valida expiração de tokens
- ✅ Renova tokens automaticamente se necessário
- ✅ Realiza chamada ao Microsoft Graph API (`/me` endpoint)
- ✅ Registra eventos de sucesso/falha
- ✅ Retorna relatório detalhado do teste

**Fluxo de Teste**:
```
1. Recuperar Token → 2. Validar Expiração → 3. Renovar (se necessário)
                                                    ↓
4. Chamar Graph API ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
                                                    ↓
5. Validar Resposta → 6. Registrar Log → 7. Retornar Resultado
```

**Resposta de Sucesso**:
```json
{
  "success": true,
  "step": "completed",
  "message": "Conexão validada com sucesso",
  "user_info": {
    "name": "Nome do Usuário",
    "email": "usuario@empresa.com",
    "id": "user-azure-id"
  },
  "token_status": {
    "valid": true,
    "expires_at": "2025-12-18T10:00:00Z",
    "scopes": "User.Read.All Group.Read.All"
  },
  "test_summary": {
    "token_retrieval": "✓ Aprovado",
    "token_validation": "✓ Aprovado",
    "graph_api_call": "✓ Aprovado",
    "user_data_retrieval": "✓ Aprovado"
  }
}
```

**Resposta de Erro**:
```json
{
  "success": false,
  "step": "graph_api_call",
  "error": "Permissões insuficientes",
  "recommendation": "Verifique se os escopos User.Read estão configurados",
  "status_code": 403
}
```

#### 2. Edge Function: `azure-oauth-revoke`
**Localização**: `supabase/functions/azure-oauth-revoke/index.ts`

**Funcionalidades**:
- ✅ Remove tokens do banco de dados
- ✅ Registra evento de revogação
- ✅ Limpa dados de integração do usuário

### Componentes Frontend

#### 1. Hook: `useAzureConnection`
**Localização**: `src/hooks/useAzureConnection.tsx`

**Interface**:
```typescript
interface AzureTestResult {
  success: boolean;
  step: string;
  message?: string;
  error?: string;
  recommendation?: string;
  user_info?: {
    name: string;
    email: string;
    id: string;
  };
  token_status?: {
    valid: boolean;
    expires_at: string;
    scopes: string;
  };
  test_summary?: Record<string, string>;
  details?: any;
  status_code?: number;
}
```

**Métodos**:
- `testConnection()`: Executa teste completo da integração
- `revokeConnection()`: Desconecta e remove tokens
- `checkConnectionStatus()`: Verifica status atual da conexão

#### 2. Componente: `AzureConnectionStatus`
**Localização**: `src/components/integrations/AzureConnectionStatus.tsx`

**Características**:
- 📊 Exibe status da conexão em tempo real
- 🔄 Mostra validade do token
- 🔐 Lista escopos configurados
- ▶️ Botão para executar teste
- 🔌 Botão para desconectar
- 📋 Relatório detalhado de teste

**UI do Relatório de Teste**:

**Aprovado**:
```
✅ Teste Aprovado

Informações do Usuário
👤 João Silva
📧 joao.silva@empresa.com

Resumo do Teste
✓ token_retrieval: ✓ Aprovado
✓ token_validation: ✓ Aprovado
✓ graph_api_call: ✓ Aprovado
✓ user_data_retrieval: ✓ Aprovado
```

**Reprovado**:
```
❌ Teste Reprovado

Etapa com falha: graph_api_call
Permissões insuficientes

Recomendação: Verifique se os escopos User.Read estão configurados
Código HTTP: 403
```

## Fluxo de Uso

### 1. Conexão Inicial
```
Usuário → Escolhe Azure AD → Configura credenciais → OAuth flow
                                                            ↓
                                            Token armazenado em DB
```

### 2. Execução de Teste
```
Usuário → Clica "Executar Teste" → Edge function validação
                                              ↓
                        Resultado exibido na interface + Log registrado
```

### 3. Desconexão
```
Usuário → Clica "Desconectar" → Tokens removidos do DB
                                          ↓
                                Log de revogação
```

## Validações Realizadas

### 1. Token Retrieval ✅
- Verifica se existe token armazenado
- Confirma que token pertence ao usuário correto
- Valida estrutura dos dados

### 2. Token Validation ✅
- Verifica data de expiração
- Tenta renovar se expirado
- Valida presença de refresh token

### 3. Graph API Call ✅
- Faz requisição ao `/me` endpoint
- Valida status HTTP 200
- Verifica presença de dados do usuário

### 4. User Data Retrieval ✅
- Extrai displayName
- Extrai userPrincipalName/email
- Extrai ID do usuário

## Tratamento de Erros

### Erros Comuns e Soluções

#### 1. Token Expirado (Status 401)
**Erro**: `Token inválido ou expirado`
**Solução Automática**: Sistema tenta renovar usando refresh_token
**Ação do Usuário**: Se falhar, reconectar a integração

#### 2. Permissões Insuficientes (Status 403)
**Erro**: `Permissões insuficientes`
**Recomendação**: Verificar escopos configurados no Azure Portal
**Ação do Usuário**: 
1. Acessar Azure Portal
2. Ir em API Permissions
3. Adicionar `User.Read` ou `User.Read.All`
4. Conceder consentimento de admin

#### 3. Conexão Não Encontrada (Status 404)
**Erro**: `Nenhuma conexão Azure AD encontrada`
**Recomendação**: Complete o fluxo de autenticação OAuth primeiro
**Ação do Usuário**: Configurar integração na aba "Conectar"

#### 4. Erro de Rede/Servidor (Status 500)
**Erro**: Mensagem específica do erro
**Recomendação**: Verificar logs para mais detalhes
**Ação do Usuário**: Tentar novamente ou contactar suporte

## Logs e Auditoria

### Eventos Registrados

#### Evento: `test_success`
```json
{
  "integration_name": "azure_ad",
  "event_type": "test_success",
  "status": "success",
  "payload": {
    "user_id": "user-uuid",
    "user_info": {
      "displayName": "João Silva",
      "userPrincipalName": "joao@empresa.com",
      "mail": "joao@empresa.com",
      "id": "azure-user-id"
    }
  }
}
```

#### Evento: `test_failed`
```json
{
  "integration_name": "azure_ad",
  "event_type": "test_failed",
  "status": "error",
  "payload": {
    "user_id": "user-uuid",
    "error": "Permissões insuficientes",
    "status_code": 403,
    "graph_error": { ... }
  }
}
```

#### Evento: `oauth_revoked`
```json
{
  "integration_name": "azure_ad",
  "event_type": "oauth_revoked",
  "status": "success",
  "payload": {
    "user_id": "user-uuid",
    "revoked_at": "2025-01-18T10:00:00Z"
  }
}
```

## Segurança

### Proteção de Dados
- ✅ Tokens criptografados em repouso
- ✅ Comunicação HTTPS obrigatória
- ✅ Isolamento por usuário (RLS)
- ✅ Logs não expõem credenciais

### Boas Práticas
- ✅ Refresh automático de tokens
- ✅ Validação antes de cada uso
- ✅ Revogação limpa de tokens
- ✅ Auditoria de todas as ações

## Extensibilidade

O sistema foi projetado para ser facilmente adaptado a outras APIs:

1. **Criar edge functions similares**:
   - `[provider]-test-connection`
   - `[provider]-oauth-revoke`

2. **Criar componente de status**:
   - `[Provider]ConnectionStatus.tsx`

3. **Criar hook de conexão**:
   - `use[Provider]Connection.tsx`

4. **Atualizar `ApiIntegrationFlow.tsx`**:
   - Adicionar novo case no switch

## Troubleshooting

### Teste Sempre Falha
1. Verificar credenciais no Azure Portal
2. Confirmar redirect URI correto
3. Verificar permissões da aplicação
4. Checar se aplicação está publicada (ou usuário é test user)

### Token Não Renova
1. Verificar se refresh_token está presente
2. Confirmar que client_secret está correto
3. Verificar se aplicação tem permissão offline_access

### Dados do Usuário Não Aparecem
1. Confirmar scope User.Read
2. Verificar se usuário tem perfil completo no Azure
3. Checar logs para erros específicos

## Acesso aos Logs

### Via Interface
1. Acessar IntegrationsHub
2. Tab "Conectar APIs"
3. Selecionar Azure AD (se conectado)
4. Visualizar logs em tempo real

### Via Supabase Dashboard
```sql
SELECT * FROM integration_webhooks
WHERE integration_name = 'azure_ad'
ORDER BY created_at DESC;
```

### Via Edge Function Logs
https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions/azure-test-connection/logs

## Próximos Passos

1. ✅ Sistema de teste automatizado implementado
2. ✅ Validação completa de tokens
3. ✅ Chamada ao Microsoft Graph API
4. ✅ Relatórios detalhados
5. ⏳ Adicionar mais endpoints do Graph API
6. ⏳ Implementar sincronização automática de usuários
7. ⏳ Expandir para outras APIs (Okta, AWS IAM)

## Links Úteis

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/overview)
- [Azure AD OAuth 2.0](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Edge Functions Logs](https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions/azure-test-connection/logs)
- [Integration Webhooks Table](https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/editor)
