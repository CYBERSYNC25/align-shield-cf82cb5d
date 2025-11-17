# Referência de API de Integrações

Este documento detalha todas as funções disponíveis para consumir endpoints REST das integrações configuradas no ComplianceSync.

## Índice

1. [Google Workspace](#google-workspace)
2. [AWS](#aws)
3. [Azure](#azure)
4. [Okta](#okta)
5. [Mapeamento de Entidades](#mapeamento-de-entidades)
6. [Tratamento de Erros](#tratamento-de-erros)

---

## Google Workspace

### Edge Function: `google-workspace-sync`

Consome as APIs do Google Workspace Admin SDK para sincronizar usuários, grupos e logs de auditoria.

#### Autenticação

Requer token OAuth 2.0 válido armazenado na tabela `integration_oauth_tokens`.

#### Endpoint

```
POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-workspace-sync
```

---

### 1. Listar Usuários

Busca todos os usuários do domínio Google Workspace.

#### Parâmetros

```typescript
{
  action: "list_users",
  params: {
    maxResults?: number,      // Padrão: 100
    domain?: string,          // Padrão: "primary"
    pageToken?: string        // Para paginação
  }
}
```

#### Exemplo de Requisição

```typescript
const { data, error } = await supabase.functions.invoke('google-workspace-sync', {
  body: { 
    action: 'list_users',
    params: { maxResults: 50, domain: 'example.com' }
  }
});
```

#### Resposta de Sucesso

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "primaryEmail": "john.doe@example.com",
        "name": {
          "fullName": "John Doe",
          "givenName": "John",
          "familyName": "Doe"
        },
        "isAdmin": true,
        "suspended": false,
        "orgUnitPath": "/Engineering",
        "lastLoginTime": "2024-11-17T10:30:00Z",
        "creationTime": "2024-01-15T08:00:00Z"
      }
    ],
    "metadata": {
      "totalCount": 1,
      "syncedAt": "2024-11-17T12:00:00Z",
      "nextPageToken": null
    }
  }
}
```

#### Mapeamento para Entidade Interna (profiles)

```typescript
// Mapear usuário do Google Workspace para tabela profiles
const mappedUser = {
  user_id: user.id,
  display_name: user.name.fullName,
  avatar_url: user.thumbnailPhotoUrl,
  organization: user.orgUnitPath,
  role: user.isAdmin ? 'admin' : 'user',
};
```

---

### 2. Listar Grupos

Busca todos os grupos do domínio Google Workspace.

#### Parâmetros

```typescript
{
  action: "list_groups",
  params: {
    maxResults?: number,      // Padrão: 100
    domain?: string,          // Padrão: "primary"
    pageToken?: string        // Para paginação
  }
}
```

#### Exemplo de Requisição

```typescript
const { data, error } = await supabase.functions.invoke('google-workspace-sync', {
  body: { 
    action: 'list_groups',
    params: { maxResults: 30 }
  }
});
```

#### Resposta de Sucesso

```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "group-456",
        "email": "developers@example.com",
        "name": "Developers",
        "description": "Engineering team members",
        "directMembersCount": 32
      }
    ],
    "metadata": {
      "totalCount": 1,
      "syncedAt": "2024-11-17T12:00:00Z",
      "nextPageToken": null
    }
  }
}
```

#### Uso em Componente

```typescript
// Hook personalizado
const { syncGroups, loading } = useGoogleWorkspaceSync();

// Em um componente
const handleSync = async () => {
  const result = await syncGroups({ maxResults: 50 });
  if (result) {
    console.log('Grupos sincronizados:', result.data);
  }
};
```

---

### 3. Buscar Logs de Auditoria

Busca logs de atividades administrativas do Google Workspace.

#### Parâmetros

```typescript
{
  action: "get_audit_logs",
  params: {
    maxResults?: number,           // Padrão: 100
    startTime?: string,            // ISO 8601 (ex: "2024-01-01T00:00:00Z")
    endTime?: string,              // ISO 8601
    applicationName?: string       // Padrão: "admin"
  }
}
```

#### Exemplo de Requisição

```typescript
const { data, error } = await supabase.functions.invoke('google-workspace-sync', {
  body: { 
    action: 'get_audit_logs',
    params: { 
      maxResults: 100,
      startTime: '2024-11-01T00:00:00Z',
      applicationName: 'admin'
    }
  }
});
```

#### Resposta de Sucesso

```json
{
  "success": true,
  "data": {
    "auditLogs": [
      {
        "id": {
          "time": "2024-11-17T10:00:00Z",
          "uniqueQualifier": "log-789"
        },
        "actor": {
          "email": "admin@example.com",
          "profileId": "admin-123"
        },
        "events": [
          {
            "type": "USER_SETTINGS",
            "name": "CHANGE_PASSWORD",
            "parameters": [
              {
                "name": "USER_EMAIL",
                "value": "john.doe@example.com"
              }
            ]
          }
        ]
      }
    ],
    "metadata": {
      "totalCount": 1,
      "syncedAt": "2024-11-17T12:00:00Z",
      "nextPageToken": null
    }
  }
}
```

#### Mapeamento para Entidade Interna (audit_logs)

```typescript
// Mapear log do Google Workspace para tabela audit_logs
const mappedLog = {
  action: log.events[0].name,
  resource_type: log.events[0].type,
  user_id: await getUserIdFromEmail(log.actor.email),
  created_at: log.id.time,
  metadata: {
    uniqueQualifier: log.id.uniqueQualifier,
    parameters: log.events[0].parameters,
  },
};

// Inserir no banco de dados
await supabase.from('audit_logs').insert(mappedLog);
```

---

## AWS

### Edge Function: `aws-integration`

Consome AWS SDK para coletar informações de recursos S3 e IAM.

#### Requisição

```typescript
const { data, error } = await supabase.functions.invoke('aws-integration');
```

#### Resposta

```json
{
  "success": true,
  "data": {
    "s3Buckets": [
      {
        "name": "my-bucket",
        "encryption": "AES256",
        "creationDate": "2024-01-01T00:00:00Z"
      }
    ],
    "iamUsers": [
      {
        "userName": "developer",
        "userId": "AIDACKCEVSQ6C2EXAMPLE",
        "createDate": "2024-01-01T00:00:00Z"
      }
    ],
    "metadata": {
      "timestamp": "2024-11-17T12:00:00Z",
      "bucketCount": 1,
      "userCount": 1
    }
  }
}
```

---

## Azure

### Edge Function: `azure-integration`

Consome Azure Resource Manager API para listar recursos e grupos.

#### Requisição

```typescript
const { data, error } = await supabase.functions.invoke('azure-integration');
```

#### Resposta

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "/subscriptions/xxx/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm1",
        "name": "vm1",
        "type": "Microsoft.Compute/virtualMachines",
        "location": "eastus"
      }
    ],
    "resourceGroups": [
      {
        "id": "/subscriptions/xxx/resourceGroups/rg1",
        "name": "rg1",
        "location": "eastus"
      }
    ]
  }
}
```

---

## Okta

### Edge Function: `okta-integration`

Consome Okta API para buscar usuários, grupos e aplicações.

#### Requisição

```typescript
const { data, error } = await supabase.functions.invoke('okta-integration');
```

#### Resposta

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "00u1234",
        "status": "ACTIVE",
        "profile": {
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "groups": [
      {
        "id": "00g5678",
        "profile": {
          "name": "Developers"
        }
      }
    ]
  }
}
```

---

## Mapeamento de Entidades

### Usuários → Profiles

```typescript
interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: { fullName: string };
  isAdmin: boolean;
  orgUnitPath: string;
}

// Mapear para
interface Profile {
  user_id: string;
  display_name: string;
  organization: string;
  role: 'admin' | 'user';
}

const mapUser = (googleUser: GoogleUser): Profile => ({
  user_id: googleUser.id,
  display_name: googleUser.name.fullName,
  organization: googleUser.orgUnitPath,
  role: googleUser.isAdmin ? 'admin' : 'user',
});
```

### Logs de Auditoria → Audit Logs

```typescript
interface GoogleAuditLog {
  id: { time: string; uniqueQualifier: string };
  actor: { email: string };
  events: Array<{ type: string; name: string }>;
}

// Mapear para
interface AuditLog {
  action: string;
  resource_type: string;
  user_id: string;
  created_at: string;
  metadata: any;
}

const mapAuditLog = (googleLog: GoogleAuditLog): AuditLog => ({
  action: googleLog.events[0].name,
  resource_type: googleLog.events[0].type,
  user_id: null, // Buscar via email
  created_at: googleLog.id.time,
  metadata: { uniqueQualifier: googleLog.id.uniqueQualifier },
});
```

---

## Tratamento de Erros

### Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `TOKEN_NOT_FOUND` | Token OAuth não encontrado | Autorizar integração novamente |
| `TOKEN_EXPIRED` | Token expirado | Usar edge function de refresh |
| `INVALID_TOKEN` | Token inválido | Re-autorizar integração |
| `API_ERROR` | Erro na API externa | Verificar logs e status da API |
| `MISSING_PARAMS` | Parâmetros obrigatórios ausentes | Incluir todos os parâmetros |

### Exemplo de Tratamento

```typescript
try {
  const { data, error } = await supabase.functions.invoke('google-workspace-sync', {
    body: { action: 'list_users' }
  });

  if (error) throw error;

  if (!data.success) {
    switch (data.code) {
      case 'TOKEN_EXPIRED':
        // Tentar refresh automático
        await refreshToken();
        break;
      case 'TOKEN_NOT_FOUND':
        // Redirecionar para autorização
        window.location.href = '/integrations';
        break;
      default:
        console.error('Erro desconhecido:', data.error);
    }
  }
} catch (err) {
  console.error('Erro na requisição:', err);
  toast({
    title: 'Erro',
    description: 'Falha ao sincronizar dados',
    variant: 'destructive',
  });
}
```

---

## Exemplo Completo de Uso

```typescript
// 1. Importar hook
import { useGoogleWorkspaceSync } from '@/hooks/useGoogleWorkspaceSync';

// 2. Usar no componente
const MyComponent = () => {
  const { syncUsers, syncGroups, loading } = useGoogleWorkspaceSync();
  
  const handleFullSync = async () => {
    // Sincronizar usuários
    const users = await syncUsers({ maxResults: 100 });
    
    // Mapear e salvar no banco
    if (users) {
      for (const user of users.data) {
        await supabase.from('profiles').upsert({
          user_id: user.id,
          display_name: user.name.fullName,
          organization: user.orgUnitPath,
        });
      }
    }
    
    // Sincronizar grupos
    await syncGroups();
  };
  
  return <Button onClick={handleFullSync} disabled={loading}>Sincronizar</Button>;
};
```

---

## Próximos Passos

1. Implementar sincronização automática agendada
2. Adicionar suporte para mais integrações (Microsoft 365, CrowdStrike)
3. Criar dashboards de visualização de dados sincronizados
4. Implementar cache para reduzir chamadas à API
