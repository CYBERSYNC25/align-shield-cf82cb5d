
# Plano: Fortalecimento da Segurança de Credenciais de Integrações

## Análise do Estado Atual

### ✅ O que já está implementado:
| Item | Status | Detalhes |
|------|--------|----------|
| AES-256-GCM | ✅ | Implementado em `crypto-utils.ts` |
| IV único por credencial | ✅ | 12 bytes aleatórios gerados a cada criptografia |
| IV armazenado com dados | ✅ | Formato `iv:ciphertext` (hex-encoded) |
| TOKEN_ENCRYPTION_KEY | ✅ | Armazenado em Supabase Secrets |
| RLS por organização | ✅ | `org_id = get_user_org_id(auth.uid())` |
| OAuth Token Refresh | ✅ | Implementado para Google Workspace |

### ⚠️ Gaps identificados:
| Item | Severidade | Descrição |
|------|------------|-----------|
| Credenciais retornadas ao frontend | **High** | `save-integration-credentials` pode retornar dados descriptografados |
| Sem Key Rotation | **Medium** | Mesma chave usada indefinidamente |
| Sem Supabase Vault | **Medium** | Chave em variável de ambiente, não no Vault |
| Sem logging de acessos | **Medium** | Não há audit trail de quando credenciais são usadas |
| Sem revogação automática | **Low** | Credenciais inativas não são limpas |
| Sem detecção de expiração | **Low** | Usuários não são alertados sobre tokens expirados |
| Salt inconsistente | **Low** | `sync-integration-data` usa salt diferente do `crypto-utils.ts` |

---

## Plano de Implementação

### Fase 1: Correções Críticas

#### 1.1 Garantir que credenciais NUNCA retornem ao frontend

Atualizar `save-integration-credentials/index.ts` para redatar credenciais na resposta:

```typescript
// Resposta segura - nunca retorna credenciais
return new Response(JSON.stringify({
  success: true,
  message: 'Integration connected successfully',
  integration: {
    id: integration.id,
    provider: integration.provider,
    name: integration.name,
    status: integration.status,
    // NUNCA incluir: configuration, credentials, tokens
    connected_at: integration.created_at,
  }
}), { headers: corsHeaders });
```

#### 1.2 Unificar salt de derivação de chave

O `sync-integration-data` usa `lovable-integration-salt` mas `crypto-utils.ts` usa `apoc-token-encryption-salt-v1`. Isso pode causar falhas de descriptografia.

```typescript
// supabase/functions/_shared/crypto-utils.ts
// Salt ÚNICO para todo o sistema
const ENCRYPTION_SALT = 'apoc-token-encryption-salt-v1';
```

---

### Fase 2: Logging de Acesso a Credenciais

#### 2.1 Criar função de logging centralizada

Novo arquivo: `supabase/functions/_shared/credential-access-logger.ts`

```typescript
interface CredentialAccessLog {
  user_id: string;
  org_id?: string;
  integration_name: string;
  action: 'decrypt' | 'encrypt' | 'refresh' | 'revoke';
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}

export async function logCredentialAccess(
  supabase: any,
  log: CredentialAccessLog
): Promise<void> {
  await supabase.from('system_audit_logs').insert({
    user_id: log.user_id,
    action_type: 'credential_access',
    action_category: 'security',
    resource_type: 'integration_credential',
    resource_id: log.integration_name,
    description: `${log.action} credential for ${log.integration_name}`,
    metadata: {
      action: log.action,
      success: log.success,
      error: log.error_message,
    },
    ip_address: log.ip_address,
    created_at: new Date().toISOString(),
  });
}
```

#### 2.2 Integrar logging em todas as funções que acessam credenciais

Funções a atualizar:
- `sync-integration-data/index.ts`
- `google-workspace-sync/index.ts`
- `azure-sync-resources/index.ts`
- `aws-sync-resources/index.ts`
- `okta-integration/index.ts`

---

### Fase 3: Key Rotation

#### 3.1 Criar tabela de histórico de chaves

```sql
CREATE TABLE public.encryption_key_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_version INT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL, -- SHA-256 do hash da chave (para verificação, não a chave)
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false
);

-- RLS: apenas service_role pode acessar
ALTER TABLE public.encryption_key_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only service role"
  ON public.encryption_key_history
  FOR ALL
  USING (auth.role() = 'service_role');
```

#### 3.2 Modificar formato de criptografia para incluir versão

```typescript
// Novo formato: version:iv:ciphertext
// Ex: v1:a1b2c3...:d4e5f6...

export async function encryptTokenWithVersion(
  plainText: string, 
  encryptionKey: string,
  keyVersion: number = 1
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(encryptionKey);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText)
  );
  
  return `v${keyVersion}:${bytesToHex(iv)}:${bytesToHex(new Uint8Array(encrypted))}`;
}

export async function decryptTokenWithVersion(
  encryptedText: string,
  getKeyByVersion: (version: number) => Promise<string>
): Promise<string> {
  const parts = encryptedText.split(':');
  
  let version = 1;
  let ivHex: string, ciphertextHex: string;
  
  if (parts[0].startsWith('v')) {
    version = parseInt(parts[0].substring(1));
    ivHex = parts[1];
    ciphertextHex = parts[2];
  } else {
    // Legacy format (sem versão)
    ivHex = parts[0];
    ciphertextHex = parts[1];
  }
  
  const encryptionKey = await getKeyByVersion(version);
  // ... resto da descriptografia
}
```

#### 3.3 Edge Function para rotação de chaves

Nova função: `supabase/functions/rotate-encryption-key/index.ts`

- Gera nova chave
- Re-criptografa todas as credenciais com a nova versão
- Marca chave antiga como deprecated (mas mantém para legacy)
- Agenda limpeza de chaves antigas após 180 dias

---

### Fase 4: Detecção e Alertas de Tokens Expirados

#### 4.1 Função schedulada para verificar tokens

Nova função: `supabase/functions/check-token-expiration/index.ts`

```typescript
// Executar diariamente via cron
Deno.serve(async (req) => {
  const supabase = createClient(/* service role */);
  
  // Buscar tokens expirando em 7 dias
  const { data: expiringTokens } = await supabase
    .from('integration_oauth_tokens')
    .select('user_id, integration_name, expires_at')
    .lt('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .gt('expires_at', new Date().toISOString());
  
  // Enviar notificação para cada usuário
  for (const token of expiringTokens) {
    await supabase.rpc('create_notification', {
      p_user_id: token.user_id,
      p_title: 'Token expirando',
      p_message: `Seu token ${token.integration_name} expira em breve.`,
      p_type: 'warning',
      p_category: 'integration',
    });
  }
  
  // Marcar tokens já expirados
  const { data: expiredTokens } = await supabase
    .from('integration_oauth_tokens')
    .select('id, user_id, integration_name')
    .lt('expires_at', new Date().toISOString());
  
  // Atualizar status da integração para 'expired'
  for (const token of expiredTokens) {
    await supabase
      .from('integration_status')
      .upsert({
        user_id: token.user_id,
        integration_name: token.integration_name,
        status: 'expired',
        health_score: 0,
      });
  }
});
```

---

### Fase 5: Revogação Automática de Credenciais Inativas

#### 5.1 Adicionar campo last_used_at

```sql
ALTER TABLE public.integrations 
ADD COLUMN last_used_at TIMESTAMPTZ;

ALTER TABLE public.integration_oauth_tokens 
ADD COLUMN last_used_at TIMESTAMPTZ;
```

#### 5.2 Atualizar last_used_at em cada uso

```typescript
// Em sync-integration-data, google-workspace-sync, etc.
await supabaseAdmin
  .from('integrations')
  .update({ last_used_at: new Date().toISOString() })
  .eq('id', integrationId);
```

#### 5.3 Job de revogação automática

```typescript
// check-token-expiration/index.ts - adicionar
const { data: staleIntegrations } = await supabase
  .from('integrations')
  .select('id, user_id, provider, name')
  .lt('last_used_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
  .eq('status', 'connected');

for (const integration of staleIntegrations) {
  // Notificar usuário
  await supabase.rpc('create_notification', {
    p_user_id: integration.user_id,
    p_title: 'Integração inativa',
    p_message: `${integration.name} não é usada há 90 dias e será revogada em 14 dias.`,
    p_type: 'warning',
    p_category: 'integration',
  });
  
  // Marcar para revogação
  await supabase
    .from('integrations')
    .update({ 
      status: 'pending_revocation',
      metadata: { revocation_scheduled_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }
    })
    .eq('id', integration.id);
}
```

---

### Fase 6: Supabase Vault (Nota)

O Supabase Vault é uma feature enterprise que armazena secrets diretamente no banco de dados com criptografia. A implementação atual com `Deno.env.get('TOKEN_ENCRYPTION_KEY')` é segura para o tier atual, mas pode ser migrada para Vault quando disponível.

**Alternativa atual**: A chave já está em Supabase Secrets, que é criptografada em repouso e só acessível por Edge Functions. Isso atende o requisito.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/_shared/credential-access-logger.ts` | **NOVO** | Logging centralizado de acessos |
| `supabase/functions/_shared/crypto-utils.ts` | Modificar | Adicionar versionamento de chaves |
| `supabase/functions/save-integration-credentials/index.ts` | Modificar | Remover credenciais da resposta |
| `supabase/functions/sync-integration-data/index.ts` | Modificar | Unificar salt, adicionar logging |
| `supabase/functions/check-token-expiration/index.ts` | **NOVO** | Verificar tokens expirados |
| `supabase/functions/google-workspace-sync/index.ts` | Modificar | Adicionar logging |
| **Database Migration** | Criar | Tabela `encryption_key_history`, colunas `last_used_at` |

---

## Benefícios da Implementação

1. **Credenciais nunca expostas**: Frontend nunca recebe tokens descriptografados
2. **Audit trail completo**: Cada acesso a credenciais é logado com metadados
3. **Key rotation**: Capacidade de trocar chaves sem downtime
4. **Alertas proativos**: Usuários notificados antes de tokens expirarem
5. **Higiene automática**: Credenciais inativas revogadas automaticamente
6. **Conformidade**: Requisitos de SOC2, ISO27001, LGPD

---

## Seção Técnica: Detalhes de Implementação

### Formato de Criptografia Versionado

```text
Formato Legacy: iv:ciphertext (24 chars hex : N chars hex)
Formato Novo:   vN:iv:ciphertext (version : 24 chars hex : N chars hex)

Exemplo:
- Legacy: a1b2c3d4e5f6g7h8i9j0k1l2:m3n4o5p6q7r8...
- v1:    v1:a1b2c3d4e5f6g7h8i9j0k1l2:m3n4o5p6q7r8...
- v2:    v2:b2c3d4e5f6g7h8i9j0k1l2m3:n4o5p6q7r8s9...
```

### Fluxo de Rotação de Chaves

```text
1. Admin inicia rotação
2. Nova chave gerada e armazenada como v(N+1)
3. Job em background re-criptografa cada credencial:
   - Descriptografa com chave v(N)
   - Criptografa com chave v(N+1)
   - Atualiza registro no banco
4. Após 100% migradas, marca v(N) como deprecated
5. Após 180 dias, remove v(N) do sistema
```

### Estrutura de Logging

```json
{
  "action_type": "credential_access",
  "action_category": "security",
  "resource_type": "integration_credential",
  "resource_id": "github",
  "description": "decrypt credential for github",
  "metadata": {
    "action": "decrypt",
    "success": true,
    "key_version": 1,
    "function": "sync-integration-data"
  },
  "ip_address": "203.0.113.45",
  "user_agent": "Supabase Edge Runtime"
}
```
