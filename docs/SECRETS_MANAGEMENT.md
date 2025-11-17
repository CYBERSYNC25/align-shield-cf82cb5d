# Gerenciamento de Secrets e Credenciais - ComplianceSync

## 🔒 Princípios de Segurança

### Regra de Ouro
**NUNCA** armazene credenciais, tokens ou qualquer informação sensível diretamente no código-fonte. Todas as credenciais devem ser gerenciadas através do Supabase Secrets.

---

## Arquitetura de Secrets

```mermaid
graph TB
    subgraph "Frontend"
        UI[Interface do Usuário]
        FORM[Formulário de Credenciais]
    end
    
    subgraph "Edge Functions"
        EF[Edge Function]
        ENV[Deno.env.get]
    end
    
    subgraph "Supabase Platform"
        SECRETS[Supabase Secrets]
        ENCRYPT[Encryption Layer]
        VAULT[Secure Vault]
    end
    
    subgraph "External APIs"
        AWS[AWS API]
        AZURE[Azure API]
        GCP[GCP API]
        OKTA[Okta API]
    end
    
    UI --> FORM
    FORM -.Não envia credenciais.-> UI
    FORM -.Admin configura via Dashboard.-> SECRETS
    
    EF --> ENV
    ENV --> SECRETS
    SECRETS --> ENCRYPT
    ENCRYPT --> VAULT
    
    EF --> AWS
    EF --> AZURE
    EF --> GCP
    EF --> OKTA
    
    style SECRETS fill:#10b981
    style ENCRYPT fill:#10b981
    style VAULT fill:#10b981
    style FORM fill:#f59e0b
```

---

## Como Adicionar Novas Credenciais

### Passo 1: Identificar as Credenciais Necessárias

Antes de adicionar uma integração, identifique quais credenciais são necessárias:

**Exemplo - AWS:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_ACCOUNT_ID`

**Exemplo - Azure:**
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_SUBSCRIPTION_ID`

### Passo 2: Adicionar Secrets no Supabase Dashboard

1. **Acesse o Supabase Dashboard:**
   - URL: `https://supabase.com/dashboard/project/{PROJECT_ID}/settings/functions`

2. **Navegue até "Edge Functions Secrets"**

3. **Adicione cada secret individualmente:**
   - Clique em "Add new secret"
   - Nome: Use UPPERCASE com underscores (ex: `AWS_ACCESS_KEY_ID`)
   - Valor: Cole a credencial
   - Clique em "Save"

4. **Repita para todas as credenciais da integração**

### Passo 3: Documentar as Secrets Adicionadas

Sempre documente quais secrets foram adicionadas e para qual finalidade:

```markdown
## Secrets Configuradas

### AWS Integration
- `AWS_ACCESS_KEY_ID` - Access Key ID da conta AWS
- `AWS_SECRET_ACCESS_KEY` - Secret Access Key da conta AWS
- `AWS_REGION` - Região padrão (ex: us-east-1)
- `AWS_ACCOUNT_ID` - ID da conta AWS

**Data de Configuração:** 2025-01-15
**Configurado por:** Admin
**Validade:** Sem expiração
```

### Passo 4: Nunca Commitar Credenciais

❌ **NUNCA FAÇA ISSO:**
```typescript
// ❌ ERRADO - Credenciais hardcoded
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

// ❌ ERRADO - Credenciais em arquivo .env commitado
// .env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

✅ **FAÇA ISSO:**
```typescript
// ✅ CORRETO - Usar Supabase Secrets via Edge Functions
const AWS_KEY = Deno.env.get('AWS_ACCESS_KEY_ID');
const AWS_SECRET = Deno.env.get('AWS_SECRET_ACCESS_KEY');

if (!AWS_KEY || !AWS_SECRET) {
  throw new Error('AWS credentials not configured');
}
```

---

## Uso Prático em Edge Functions

### Exemplo 1: Integração AWS

```typescript
// supabase/functions/aws-integration/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, ListBucketsCommand } from 'npm:@aws-sdk/client-s3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ Buscar credenciais dos Supabase Secrets
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';

    // Validar que todas as credenciais existem
    if (!accessKeyId || !secretAccessKey) {
      console.error('Missing AWS credentials');
      return new Response(
        JSON.stringify({ 
          error: 'AWS credentials not configured. Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to Supabase Secrets.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar as credenciais de forma segura
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Realizar operações
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    console.log(`Successfully listed ${response.Buckets?.length || 0} S3 buckets`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        bucketsCount: response.Buckets?.length || 0,
        buckets: response.Buckets?.map(b => b.Name) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AWS Integration Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to AWS',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Exemplo 2: Integração Azure com OAuth

```typescript
// supabase/functions/azure-integration/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ Buscar credenciais dos Supabase Secrets
    const tenantId = Deno.env.get('AZURE_TENANT_ID');
    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
    const subscriptionId = Deno.env.get('AZURE_SUBSCRIPTION_ID');

    // Validar credenciais
    if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
      console.error('Missing Azure credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Azure credentials not configured',
          required: ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_SUBSCRIPTION_ID']
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter token OAuth
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://management.azure.com/.default',
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to obtain Azure token: ${tokenResponse.status}`);
    }

    const { access_token } = await tokenResponse.json();

    // Usar o token para chamar Azure APIs
    const resourcesUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01`;
    const resourcesResponse = await fetch(resourcesUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resourcesResponse.ok) {
      throw new Error(`Failed to fetch Azure resources: ${resourcesResponse.status}`);
    }

    const resources = await resourcesResponse.json();

    console.log(`Successfully fetched ${resources.value?.length || 0} Azure resources`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        resourcesCount: resources.value?.length || 0,
        resources: resources.value 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Azure Integration Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to Azure',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Exemplo 3: Integração Google Cloud

```typescript
// supabase/functions/gcp-integration/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ Buscar Service Account Key dos Supabase Secrets
    const serviceAccountKey = Deno.env.get('GCP_SERVICE_ACCOUNT_KEY');
    const projectId = Deno.env.get('GCP_PROJECT_ID');

    if (!serviceAccountKey || !projectId) {
      console.error('Missing GCP credentials');
      return new Response(
        JSON.stringify({ 
          error: 'GCP credentials not configured',
          required: ['GCP_SERVICE_ACCOUNT_KEY', 'GCP_PROJECT_ID']
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do Service Account Key (JSON)
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (e) {
      console.error('Invalid GCP Service Account Key format');
      return new Response(
        JSON.stringify({ error: 'Invalid GCP_SERVICE_ACCOUNT_KEY format. Must be valid JSON.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar JWT para autenticação
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Assinar JWT (simplificado - em produção use biblioteca)
    const encoder = new TextEncoder();
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      encoder.encode(credentials.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(claim));
    const signatureInput = `${header}.${payload}`;
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      encoder.encode(signatureInput)
    );
    
    const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

    // Obter access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Usar o token para listar recursos
    const resourcesUrl = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`;
    const resourcesResponse = await fetch(resourcesUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    const project = await resourcesResponse.json();

    console.log(`Successfully connected to GCP project: ${project.projectId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        project: {
          id: project.projectId,
          name: project.name,
          number: project.projectNumber
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('GCP Integration Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to GCP',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Exemplo 4: Integração Okta

```typescript
// supabase/functions/okta-integration/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ Buscar credenciais dos Supabase Secrets
    const oktaDomain = Deno.env.get('OKTA_DOMAIN');
    const oktaApiToken = Deno.env.get('OKTA_API_TOKEN');

    if (!oktaDomain || !oktaApiToken) {
      console.error('Missing Okta credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Okta credentials not configured',
          required: ['OKTA_DOMAIN', 'OKTA_API_TOKEN']
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Listar usuários do Okta
    const usersUrl = `https://${oktaDomain}/api/v1/users?limit=10`;
    const usersResponse = await fetch(usersUrl, {
      headers: {
        'Authorization': `SSWS ${oktaApiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!usersResponse.ok) {
      throw new Error(`Okta API error: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();

    // Listar grupos
    const groupsUrl = `https://${oktaDomain}/api/v1/groups?limit=10`;
    const groupsResponse = await fetch(groupsUrl, {
      headers: {
        'Authorization': `SSWS ${oktaApiToken}`,
        'Accept': 'application/json',
      },
    });

    const groups = await groupsResponse.json();

    console.log(`Successfully fetched ${users.length} users and ${groups.length} groups from Okta`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats: {
          usersCount: users.length,
          groupsCount: groups.length,
        },
        users: users.map((u: any) => ({ id: u.id, email: u.profile.email, status: u.status })),
        groups: groups.map((g: any) => ({ id: g.id, name: g.profile.name }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Okta Integration Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to Okta',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Chamando Edge Functions do Frontend

### ❌ NUNCA faça chamadas diretas com credenciais

```typescript
// ❌ ERRADO - Expõe credenciais no frontend
const response = await fetch('https://api.aws.com', {
  headers: {
    'Authorization': `AWS ${AWS_KEY}:${AWS_SECRET}` // NUNCA FAÇA ISSO!
  }
});
```

### ✅ SEMPRE use Edge Functions como proxy

```typescript
// ✅ CORRETO - Chama Edge Function que usa secrets server-side
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('aws-integration', {
  body: { operation: 'listBuckets' }
});

if (error) {
  console.error('Error:', error);
  toast({
    title: 'Erro na integração',
    description: error.message,
    variant: 'destructive'
  });
} else {
  console.log('Buckets:', data.buckets);
  toast({
    title: 'Integração bem-sucedida',
    description: `${data.bucketsCount} buckets encontrados`
  });
}
```

---

## Configuração do config.toml

Sempre atualize o `supabase/config.toml` ao criar novas edge functions:

```toml
project_id = "ofbyxnpprwwuieabwhdo"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[functions.aws-integration]
verify_jwt = true

[functions.azure-integration]
verify_jwt = true

[functions.gcp-integration]
verify_jwt = true

[functions.okta-integration]
verify_jwt = true
```

---

## Rotação de Credenciais

### Quando Rotacionar
- **Imediatamente:** Se houver suspeita de comprometimento
- **Periodicamente:** A cada 90 dias (ou conforme política da empresa)
- **Automaticamente:** Quando o provider suporta rotação automática

### Como Rotacionar

1. **Gere novas credenciais no provider**
2. **Adicione as novas credenciais no Supabase Secrets** (com mesmo nome)
3. **Teste a integração**
4. **Remova as credenciais antigas do provider**
5. **Documente a rotação**

### Exemplo de Rotação

```bash
# 1. Gerar nova API Key no AWS (fazer via console)

# 2. Atualizar secret no Supabase Dashboard
# Supabase > Settings > Edge Functions > Secrets
# Editar: AWS_ACCESS_KEY_ID
# Novo valor: [nova key]
# Salvar

# 3. Editar: AWS_SECRET_ACCESS_KEY
# Novo valor: [novo secret]
# Salvar

# 4. Testar
curl -X POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/aws-integration

# 5. Se OK, deletar credenciais antigas no AWS console
```

---

## Monitoramento de Secrets

### Logs de Uso

Sempre adicione logs quando usar secrets:

```typescript
// ✅ Bom logging
const apiKey = Deno.env.get('AWS_ACCESS_KEY_ID');
if (!apiKey) {
  console.error('AWS_ACCESS_KEY_ID not found in environment');
  throw new Error('Missing AWS credentials');
}
console.log('AWS credentials loaded successfully');
// Nunca logue o valor da secret!
```

### Alertas

Configure alertas para:
- Falhas de autenticação repetidas
- Secrets não encontradas
- Tokens expirados

---

## Checklist de Segurança

- [ ] ✅ Todas as credenciais estão no Supabase Secrets
- [ ] ✅ Nenhuma credencial está hardcoded no código
- [ ] ✅ Nenhuma credencial está em arquivos .env commitados
- [ ] ✅ Edge Functions validam a existência de secrets
- [ ] ✅ Erros de secrets são logados (sem expor valores)
- [ ] ✅ Frontend nunca acessa APIs externas diretamente
- [ ] ✅ Todas as chamadas passam por Edge Functions
- [ ] ✅ CORS está configurado corretamente
- [ ] ✅ JWT verification está ativo (exceto para funções públicas)
- [ ] ✅ Há documentação de todas as secrets necessárias
- [ ] ✅ Existe plano de rotação de credenciais

---

## Secrets Obrigatórias por Integração

### AWS
```bash
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=
```

### Azure
```bash
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_SUBSCRIPTION_ID=
```

### Google Cloud
```bash
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GCP_PROJECT_ID=
```

### Okta
```bash
OKTA_DOMAIN=dev-123456.okta.com
OKTA_API_TOKEN=
```

### Microsoft 365
```bash
M365_TENANT_ID=
M365_CLIENT_ID=
M365_CLIENT_SECRET=
```

### CrowdStrike
```bash
CROWDSTRIKE_CLIENT_ID=
CROWDSTRIKE_CLIENT_SECRET=
CROWDSTRIKE_BASE_URL=https://api.crowdstrike.com
```

### Slack
```bash
SLACK_TOKEN=xoxb-
SLACK_WORKSPACE_ID=
```

### GitHub
```bash
GITHUB_TOKEN=ghp_
GITHUB_ORG=
```

---

## Solução de Problemas

### Erro: "Credentials not configured"

**Causa:** Secret não foi adicionada no Supabase ou nome está incorreto

**Solução:**
1. Verifique o nome da secret no código
2. Acesse Supabase Dashboard > Settings > Edge Functions > Secrets
3. Adicione a secret com o nome exato (case-sensitive)
4. Redesploy a edge function (automático)

### Erro: "Invalid credentials"

**Causa:** Credenciais estão incorretas ou expiradas

**Solução:**
1. Verifique se as credenciais são válidas no provider
2. Gere novas credenciais se necessário
3. Atualize no Supabase Secrets
4. Teste novamente

### Erro: "Permission denied"

**Causa:** Credenciais não têm as permissões necessárias

**Solução:**
1. Verifique as permissões/scopes necessários na documentação do provider
2. Atualize as permissões no provider
3. Regere credenciais se necessário
4. Atualize no Supabase Secrets

---

## Referências

- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [OWASP - Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Azure Key Vault Best Practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs/best-practices)

---

**Última Atualização:** 2025-11-17  
**Versão:** 1.0  
**Autor:** ComplianceSync Team
