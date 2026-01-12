# Documentação: Sistema de Coleta e Persistência de Dados de Integrações

> **Data de Atualização**: Janeiro 2026  
> **Versão**: 1.0  
> **Status**: Produção

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura de Integrações](#2-arquitetura-de-integrações)
3. [Segurança de Credenciais](#3-segurança-de-credenciais)
4. [Edge Functions](#4-edge-functions)
5. [Tabela de Dados Coletados](#5-tabela-de-dados-coletados)
6. [Dados Coletados por Provider](#6-dados-coletados-por-provider)
7. [Hooks de Consumo de Dados](#7-hooks-de-consumo-de-dados)
8. [Detecção de Anomalias](#8-detecção-de-anomalias)
9. [Componentes de UI](#9-componentes-de-ui)
10. [Secrets Necessários](#10-secrets-necessários)
11. [Query Keys](#11-query-keys)
12. [Fluxo Completo de Dados](#12-fluxo-completo-de-dados)

---

## 1. Visão Geral do Sistema

### Modelo Self-Service

O APOC utiliza um modelo **Self-Service** (similar à Vanta) onde os próprios usuários fornecem suas credenciais de API para cada integração. Isso elimina a necessidade de configurar secrets globais no backend para cada cliente.

### 15 Integrações Funcionais

Todas as 15 integrações do catálogo são **totalmente funcionais** e suportam:
- Conexão via credenciais fornecidas pelo usuário
- Criptografia de credenciais antes do armazenamento
- Coleta de dados em tempo real
- Persistência de recursos na base de dados
- Re-sincronização manual sob demanda

### Arquitetura de Dados Persistentes

O sistema migrou de **dados mockados** para **dados reais persistentes**:

| Antes | Depois |
|-------|--------|
| Arrays hardcoded em componentes | Dados do banco via hooks |
| Dados perdidos ao recarregar | Persistência em `integration_collected_data` |
| Status em localStorage | Status em `integration_status` table |
| Sem auditoria | Timestamps de coleta rastreáveis |

---

## 2. Arquitetura de Integrações

### Catálogo de Integrações

**Arquivo**: `src/lib/integrations-catalog.ts`

| Categoria | Integrações | Status |
|-----------|-------------|--------|
| Cloud & Infraestrutura | AWS, AgentAPOC (MikroTik), Cloudflare | ✅ Funcional |
| Identidade & Acesso (IAM) | Azure AD, Google Workspace, Auth0, Okta | ✅ Funcional |
| Controle de Código (SDLC) | GitHub, GitLab | ✅ Funcional |
| Produtividade & RH | Jira, Slack, BambooHR | ✅ Funcional |
| Segurança de Endpoint | CrowdStrike, Intune | ✅ Funcional |

### Fluxo de Conexão

```
┌─────────────────┐
│ Usuário clica   │
│ "Conectar"      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ConnectionModal                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Campos dinâmicos baseados no provider:                   │    │
│  │ - API Token / API Key                                    │    │
│  │ - Client ID / Client Secret                              │    │
│  │ - Domain / Subdomain                                     │    │
│  │ - Instruções passo-a-passo                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Edge Function: save-integration-credentials         │
├─────────────────────────────────────────────────────────────────┤
│ 1. ✓ Autenticar usuário via JWT                                 │
│ 2. ✓ Testar conexão com API do provider                         │
│ 3. ✓ Criptografar credenciais (AES-256-GCM)                     │
│ 4. ✓ Salvar na tabela `integrations`                            │
│ 5. ✓ Coletar dados completos do provider                        │
│ 6. ✓ Persistir em `integration_collected_data`                  │
│ 7. ✓ Atualizar status em `integration_status`                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Segurança de Credenciais

### Criptografia AES-256-GCM

**Arquivo**: `supabase/functions/_shared/crypto-utils.ts`

| Aspecto | Implementação |
|---------|---------------|
| **Algoritmo** | AES-256-GCM (authenticated encryption) |
| **Derivação de Chave** | PBKDF2 com 100.000 iterações |
| **Salt** | Fixo: `apoc-token-encryption-salt-v1` |
| **IV** | Random 12 bytes por criptografia |
| **Hash** | SHA-256 |
| **Formato Armazenado** | `{iv_hex}:{ciphertext_hex}` |

### Funções Exportadas

```typescript
/**
 * Criptografa um token para armazenamento seguro
 * @param plainText - Token em texto puro
 * @param encryptionKey - Chave de criptografia (TOKEN_ENCRYPTION_KEY)
 * @returns String no formato "iv:ciphertext" (hex-encoded)
 */
export async function encryptToken(
  plainText: string, 
  encryptionKey: string
): Promise<string>

/**
 * Descriptografa um token armazenado
 * @param encryptedText - Token criptografado (formato iv:ciphertext)
 * @param encryptionKey - Chave de criptografia
 * @returns Token original em texto puro
 */
export async function decryptToken(
  encryptedText: string, 
  encryptionKey: string
): Promise<string>

/**
 * Verifica se um token está criptografado
 * @param token - String a verificar
 * @returns true se estiver no formato iv:ciphertext
 */
export function isEncrypted(token: string): boolean
```

### Exemplo de Token Criptografado

```
a1b2c3d4e5f6a1b2c3d4e5f6:7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a...
└────────────────────────┘ └────────────────────────────────────────────────────┘
         IV (24 chars)                    Ciphertext (variável)
```

---

## 4. Edge Functions

### `save-integration-credentials`

**Arquivo**: `supabase/functions/save-integration-credentials/index.ts`

**Responsabilidades**:
1. Autenticar usuário via header `Authorization`
2. Validar provider e credenciais
3. Testar conexão real com API do provider
4. Criptografar todas as credenciais sensíveis
5. Salvar na tabela `integrations` (upsert)
6. Coletar dados completos do provider
7. Persistir recursos em `integration_collected_data`
8. Atualizar status em `integration_status`

**Request**:
```typescript
POST /save-integration-credentials

{
  "provider": "github",
  "credentials": {
    "apiToken": "ghp_xxxxxxxxxxxx",
    "organization": "my-org"
  }
}
```

**Response (Sucesso)**:
```typescript
{
  "success": true,
  "message": "Integration connected successfully",
  "resourcesCollected": 45,
  "detectedResources": {
    "users": 12,
    "repositories": 28,
    "org_members": 5
  }
}
```

**Providers com Teste de Conexão**:

| Provider | Endpoint de Teste |
|----------|-------------------|
| Cloudflare | `GET /zones` |
| GitHub | `GET /user` |
| GitLab | `GET /user` |
| Slack | `GET /auth.test` |
| Jira | `GET /myself` |
| BambooHR | `GET /employees/directory` |
| CrowdStrike | `GET /devices/queries/devices/v1` |
| Intune | `GET /deviceManagement/managedDevices` |

---

### `sync-integration-data`

**Arquivo**: `supabase/functions/sync-integration-data/index.ts`

**Responsabilidades**:
1. Autenticar usuário
2. Buscar credenciais criptografadas da tabela `integrations`
3. Descriptografar credenciais usando `TOKEN_ENCRYPTION_KEY`
4. Re-coletar dados frescos do provider
5. Atualizar `integration_collected_data` (upsert)
6. Atualizar `last_sync_at` em `integration_status`

**Request**:
```typescript
POST /sync-integration-data

{
  "provider": "github"
}
```

**Response**:
```typescript
{
  "success": true,
  "message": "Synchronized 45 resources from github",
  "resourcesCollected": 45
}
```

**Funções de Coleta por Provider**:

```typescript
// Cloudflare
async function collectCloudflareData(credentials, userId, supabase): Promise<number>
// Coleta: zones, dns_records

// GitHub
async function collectGitHubData(credentials, userId, supabase): Promise<number>
// Coleta: users, repositories, org_members

// Slack
async function collectSlackData(credentials, userId, supabase): Promise<number>
// Coleta: users, channels

// Jira
async function collectJiraData(credentials, userId, supabase): Promise<number>
// Coleta: users, projects

// BambooHR
async function collectBambooHRData(credentials, userId, supabase): Promise<number>
// Coleta: employees

// CrowdStrike
async function collectCrowdStrikeData(credentials, userId, supabase): Promise<number>
// Coleta: devices

// Intune
async function collectIntuneData(credentials, userId, supabase): Promise<number>
// Coleta: devices, compliance_policies
```

---

## 5. Tabela de Dados Coletados

### Schema: `integration_collected_data`

```sql
CREATE TABLE public.integration_collected_data (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id),
  integration_name TEXT     NOT NULL,
  resource_type TEXT        NOT NULL,
  resource_id   TEXT,
  resource_data JSONB       NOT NULL,
  collected_at  TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ
);
```

### Colunas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único do registro |
| `user_id` | UUID | FK para `auth.users` - proprietário dos dados |
| `integration_name` | TEXT | Nome do provider (github, slack, cloudflare) |
| `resource_type` | TEXT | Tipo do recurso (users, repositories, devices) |
| `resource_id` | TEXT | ID único do recurso no provider (opcional) |
| `resource_data` | JSONB | Dados completos do recurso |
| `collected_at` | TIMESTAMPTZ | Timestamp da coleta |
| `expires_at` | TIMESTAMPTZ | Expiração dos dados (opcional) |

### Constraints

```sql
-- UNIQUE constraint para upsert atômico
ALTER TABLE integration_collected_data 
ADD CONSTRAINT integration_collected_data_unique_resource 
UNIQUE (user_id, integration_name, resource_type, resource_id);
```

### Índices de Performance

```sql
-- Busca por usuário + integração
CREATE INDEX idx_integration_collected_data_user_integration 
ON integration_collected_data(user_id, integration_name);

-- Busca por tipo de recurso
CREATE INDEX idx_integration_collected_data_resource_type 
ON integration_collected_data(user_id, resource_type);

-- Ordenação por data de coleta
CREATE INDEX idx_integration_collected_data_collected_at 
ON integration_collected_data(collected_at DESC);
```

### RLS (Row Level Security)

```sql
-- Usuários só veem seus próprios dados
CREATE POLICY "Users can view own integration data"
ON integration_collected_data FOR SELECT
USING (auth.uid() = user_id);

-- Service role pode inserir/atualizar para qualquer usuário
CREATE POLICY "Service role can manage all data"
ON integration_collected_data FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 6. Dados Coletados por Provider

### GitHub

| resource_type | Campos Principais |
|---------------|-------------------|
| `users` | `login`, `name`, `email`, `two_factor_authentication`, `avatar_url` |
| `repositories` | `name`, `full_name`, `visibility`, `default_branch`, `language`, `private` |
| `org_members` | `login`, `organization`, `site_admin`, `role` |

### Slack

| resource_type | Campos Principais |
|---------------|-------------------|
| `users` | `name`, `real_name`, `email`, `is_admin`, `is_owner`, `has_2fa`, `status` |
| `channels` | `name`, `is_private`, `is_archived`, `num_members`, `topic` |

### Jira

| resource_type | Campos Principais |
|---------------|-------------------|
| `users` | `displayName`, `emailAddress`, `active`, `accountType` |
| `projects` | `key`, `name`, `projectTypeKey`, `style`, `isPrivate` |

### Cloudflare

| resource_type | Campos Principais |
|---------------|-------------------|
| `zones` | `name`, `status`, `name_servers`, `paused`, `type` |
| `dns_records` | `name`, `type`, `content`, `proxied`, `ttl` |

### BambooHR

| resource_type | Campos Principais |
|---------------|-------------------|
| `employees` | `displayName`, `workEmail`, `department`, `jobTitle`, `location`, `status` |

### CrowdStrike

| resource_type | Campos Principais |
|---------------|-------------------|
| `devices` | `hostname`, `platform_name`, `os_version`, `status`, `last_seen`, `device_id` |

### Intune

| resource_type | Campos Principais |
|---------------|-------------------|
| `devices` | `deviceName`, `operatingSystem`, `complianceState`, `lastSyncDateTime`, `enrolledDateTime` |
| `compliance_policies` | `displayName`, `description`, `platformType`, `assignmentStatus` |

---

## 7. Hooks de Consumo de Dados

### `useIntegrationData`

**Arquivo**: `src/hooks/useIntegrationData.tsx`

```typescript
interface IntegrationDataFilters {
  integrationName?: string;
  resourceType?: string;
}

function useIntegrationData(filters?: IntegrationDataFilters) {
  // Retorna dados coletados com filtros opcionais
  return useQuery({
    queryKey: ['integration-data', filters?.integrationName, filters?.resourceType, userId],
    queryFn: async () => {
      // Fetch from integration_collected_data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

**Exemplos de Uso**:

```typescript
// Todos os dados coletados
const { data: allResources } = useIntegrationData();

// Apenas dados do GitHub
const { data: githubData } = useIntegrationData({ 
  integrationName: 'github' 
});

// Apenas usuários de todas as integrações
const { data: allUsers } = useIntegrationData({ 
  resourceType: 'users' 
});

// Usuários específicos do Slack
const { data: slackUsers } = useIntegrationData({ 
  integrationName: 'slack',
  resourceType: 'users' 
});
```

---

### `useIntegrationDataStats`

**Arquivo**: `src/hooks/useIntegrationData.tsx`

```typescript
interface DataStat {
  integration_name: string;
  resource_type: string;
  count: number;
}

function useIntegrationDataStats() {
  // Retorna contagens agregadas por integração e tipo
  return useQuery<DataStat[]>({
    queryKey: ['integration-data-stats', userId],
    queryFn: async () => {
      // Aggregate counts from integration_collected_data
    }
  });
}
```

**Exemplo de Resposta**:

```typescript
[
  { integration_name: 'github', resource_type: 'users', count: 12 },
  { integration_name: 'github', resource_type: 'repositories', count: 45 },
  { integration_name: 'slack', resource_type: 'users', count: 28 },
  { integration_name: 'slack', resource_type: 'channels', count: 15 },
]
```

---

### `useIntegratedSystems`

**Arquivo**: `src/hooks/useIntegratedSystems.tsx`

Hook que transforma dados brutos em formatos consumíveis pelos componentes de UI:

```typescript
interface UseIntegratedSystemsReturn {
  systems: SystemInventory[];      // Sistemas para Access Reviews
  anomalies: AccessAnomaly[];      // Anomalias detectadas
  totalUsers: number;              // Total de usuários
  totalResources: number;          // Total de recursos
  isLoading: boolean;
  hasRealData: boolean;            // true se há dados reais
}

function useIntegratedSystems(): UseIntegratedSystemsReturn
```

**SystemInventory**:

```typescript
interface SystemInventory {
  id: string;
  name: string;                    // Nome do sistema (ex: "GitHub")
  type: 'saas' | 'on-premise' | 'cloud';
  users: number;                   // Contagem de usuários
  lastSync: string;                // Data da última sincronização
  status: 'active' | 'pending' | 'inactive';
  riskLevel: 'low' | 'medium' | 'high';
}
```

---

## 8. Detecção de Anomalias

O hook `useIntegratedSystems` detecta automaticamente anomalias nos dados coletados:

### Tipos de Anomalias

| Tipo | Severidade | Condição de Detecção |
|------|------------|----------------------|
| `unused_access` | medium | Usuário sem `last_activity` há 90+ dias |
| `excessive_privileges` | high | Usuário `is_admin` em 3+ sistemas |
| `policy_violation` | critical | Usuário admin com `has_2fa: false` |

### Interface AccessAnomaly

```typescript
interface AccessAnomaly {
  id: string;
  user_name: string;
  system_name: string;
  anomaly_type: 'unused_access' | 'excessive_privileges' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
}
```

### Lógica de Detecção

```typescript
// Em useIntegratedSystems.tsx

// 1. Detectar admins sem 2FA
if (user.is_admin && !user.has_2fa) {
  anomalies.push({
    anomaly_type: 'policy_violation',
    severity: 'critical',
    description: `Admin user without 2FA enabled in ${systemName}`
  });
}

// 2. Detectar acesso inativo
if (user.last_activity && daysSinceActivity > 90) {
  anomalies.push({
    anomaly_type: 'unused_access',
    severity: 'medium',
    description: `No activity for ${daysSinceActivity} days`
  });
}

// 3. Detectar privilégios excessivos
if (adminSystemCount >= 3) {
  anomalies.push({
    anomaly_type: 'excessive_privileges',
    severity: 'high',
    description: `User is admin in ${adminSystemCount} systems`
  });
}
```

---

## 9. Componentes de UI

### `ConnectionModal`

**Arquivo**: `src/components/integrations/ConnectionModal.tsx`

Modal genérico e dinâmico que adapta campos e instruções baseado no provider selecionado.

**Características**:
- Campos dinâmicos por provider (definidos em `PROVIDER_CONFIGS`)
- Instruções passo-a-passo para obter credenciais
- Links para documentação oficial do provider
- Toggle de visibilidade para campos de senha
- Estados: `form` → `testing` → `success` | `error`
- Exibe contagem de recursos detectados após sucesso

**PROVIDER_CONFIGS**:

```typescript
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  cloudflare: {
    fields: [
      { name: 'apiToken', label: 'API Token', type: 'password', required: true },
      { name: 'accountId', label: 'Account ID', type: 'text', required: false }
    ],
    instructions: [
      { step: 1, text: 'Acesse dash.cloudflare.com' },
      { step: 2, text: 'Vá em My Profile > API Tokens' },
      // ...
    ],
    docsUrl: 'https://developers.cloudflare.com/...'
  },
  github: { /* ... */ },
  slack: { /* ... */ },
  // ...
};
```

---

### `SyncIntegrationButton`

**Arquivo**: `src/components/integrations/SyncIntegrationButton.tsx`

Botão para re-sincronização manual de dados de uma integração conectada.

```typescript
interface SyncIntegrationButtonProps {
  provider: string;      // Nome do provider (github, slack, etc)
  disabled?: boolean;    // Desabilitar botão
}
```

**Comportamento**:
1. Ao clicar, chama Edge Function `sync-integration-data`
2. Exibe spinner durante sincronização
3. Invalida queries `integration-data` e `integration-status` após sucesso
4. Exibe toast de sucesso/erro

---

### Indicador de Dados Reais

**Arquivo**: `src/pages/AccessReviews.tsx`

Badge visual que distingue a origem dos dados exibidos:

```tsx
{hasRealData ? (
  <Badge variant="default" className="bg-green-500">
    <Database className="mr-1 h-3 w-3" />
    Dados Reais
  </Badge>
) : (
  <Badge variant="secondary">
    <AlertCircle className="mr-1 h-3 w-3" />
    Dados de Demonstração
  </Badge>
)}
```

---

## 10. Secrets Necessários

Secrets configurados no Supabase (Edge Functions):

| Secret | Obrigatório | Descrição |
|--------|-------------|-----------|
| `SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | ✅ | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave service role (para upsert em qualquer user_id) |
| `TOKEN_ENCRYPTION_KEY` | ✅ | Chave para criptografia AES-256-GCM de credenciais |

### Gerando TOKEN_ENCRYPTION_KEY

```bash
# Gerar uma chave segura de 256 bits (32 bytes)
openssl rand -base64 32
```

---

## 11. Query Keys

Query keys utilizados pelo React Query para cache e invalidação:

```typescript
// src/lib/query-keys.ts

// Dados coletados de integrações
['integration-data', integrationName?, resourceType?, userId]

// Estatísticas agregadas
['integration-data-stats', userId]

// Status das integrações
['integration-status']

// Lista de integrações conectadas
['integrations']
```

### Invalidação Após Sync

```typescript
// Após sincronização bem-sucedida
queryClient.invalidateQueries({ queryKey: ['integration-data'] });
queryClient.invalidateQueries({ queryKey: ['integration-status'] });
```

---

## 12. Fluxo Completo de Dados

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO DE DADOS COMPLETO                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                        1. CONEXÃO INICIAL                                  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────────────────────────────┐        │
│  │ IntegrationCard │────────▶│           ConnectionModal               │        │
│  │ (botão Conectar)│         │  ┌─────────────────────────────────┐    │        │
│  └─────────────────┘         │  │ • Campos dinâmicos por provider │    │        │
│                              │  │ • Instruções passo-a-passo      │    │        │
│                              │  │ • Validação de formulário       │    │        │
│                              │  └─────────────────────────────────┘    │        │
│                              └──────────────────┬──────────────────────┘        │
│                                                 │                                │
│                                                 ▼                                │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                     2. PROCESSAMENTO NO BACKEND                           ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │              Edge Function: save-integration-credentials                 │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                          │    │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │    │
│  │  │ 1. Auth JWT  │───▶│ 2. Test API  │───▶│ 3. Encrypt Credentials   │   │    │
│  │  └──────────────┘    └──────────────┘    └────────────┬─────────────┘   │    │
│  │                                                        │                 │    │
│  │                                                        ▼                 │    │
│  │  ┌──────────────────────────┐    ┌────────────────────────────────────┐ │    │
│  │  │ 4. Save to `integrations`│───▶│ 5. Collect Data from Provider API  │ │    │
│  │  │    (encrypted creds)     │    │    (users, repos, devices, etc)    │ │    │
│  │  └──────────────────────────┘    └────────────────┬───────────────────┘ │    │
│  │                                                    │                     │    │
│  │                                                    ▼                     │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │    │
│  │  │ 6. Upsert to `integration_collected_data` + Update `status`        │ │    │
│  │  └────────────────────────────────────────────────────────────────────┘ │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                         3. ARMAZENAMENTO                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────┐  ┌────────────────────┐   │
│  │    integrations     │  │ integration_collected_  │  │ integration_status │   │
│  │                     │  │ data                    │  │                    │   │
│  │ • provider          │  │                         │  │ • status           │   │
│  │ • configuration     │  │ • integration_name      │  │ • last_sync_at     │   │
│  │   (encrypted)       │  │ • resource_type         │  │ • health_score     │   │
│  │ • user_id           │  │ • resource_data (JSONB) │  │ • metadata         │   │
│  │                     │  │ • collected_at          │  │                    │   │
│  └─────────────────────┘  └─────────────────────────┘  └────────────────────┘   │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                      4. CONSUMO NO FRONTEND                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────────────────────────┐    │
│  │ useIntegrationData  │────────▶│         useIntegratedSystems            │    │
│  │                     │         │                                         │    │
│  │ • Raw collected     │         │ Transform to:                           │    │
│  │   resources         │         │ • SystemInventory[]                     │    │
│  │ • Filters by        │         │ • AccessAnomaly[]                       │    │
│  │   provider/type     │         │ • totalUsers, totalResources            │    │
│  └─────────────────────┘         │ • hasRealData boolean                   │    │
│                                  └──────────────────┬──────────────────────┘    │
│                                                     │                            │
│                                                     ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         UI Components                                    │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │    │
│  │  │  Access Reviews  │  │ Dashboard Metrics│  │ Systems Inventory      │ │    │
│  │  │  (anomalies)     │  │ (counts, charts) │  │ (list, status)         │ │    │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                      5. RE-SINCRONIZAÇÃO MANUAL                           ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────────────────────────┐    │
│  │ SyncIntegration     │────────▶│   Edge Function: sync-integration-data  │    │
│  │ Button              │         │                                         │    │
│  │                     │         │  1. Fetch encrypted creds               │    │
│  │ (no IntegrationCard)│         │  2. Decrypt with TOKEN_ENCRYPTION_KEY   │    │
│  └─────────────────────┘         │  3. Re-collect from provider API        │    │
│                                  │  4. Upsert to collected_data            │    │
│                                  │  5. Invalidate React Query cache        │    │
│                                  └─────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Conclusão

O sistema de coleta e persistência de dados de integrações do APOC implementa uma arquitetura robusta e segura que:

1. **Segurança**: Criptografa todas as credenciais com AES-256-GCM antes do armazenamento
2. **Self-Service**: Permite que usuários conectem suas próprias integrações sem configuração de backend
3. **Persistência**: Armazena todos os dados coletados no banco, eliminando dependência de estado temporário
4. **Automação**: Detecta anomalias de segurança automaticamente nos dados coletados
5. **Flexibilidade**: Suporta re-sincronização manual sob demanda
6. **Escalabilidade**: Índices otimizados e constraints garantem performance com volume de dados

Para adicionar novas integrações, basta:
1. Adicionar configuração em `PROVIDER_CONFIGS` no `ConnectionModal`
2. Adicionar função de coleta no `save-integration-credentials` e `sync-integration-data`
3. Atualizar `FUNCTIONAL_INTEGRATIONS` em `integrations-catalog.ts`
