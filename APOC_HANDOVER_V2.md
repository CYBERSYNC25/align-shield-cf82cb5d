# APOC Platform - Technical Handover Document v2.0

> **Data de Geração:** 08 de Dezembro de 2024  
> **Status:** ✅ Em Produção  
> **URL de Produção:** https://apoc.com.br

---

## 1. Visão Geral do Projeto

### 1.1 Descrição
**APOC** (Audit, Policy, Operations & Compliance) é uma plataforma SaaS enterprise para Governança, Risco e Compliance (GRC). A aplicação gerencia frameworks de compliance, controles de segurança, gestão de riscos, auditorias, políticas e integrações com provedores cloud.

### 1.2 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Estilização** | Tailwind CSS, Shadcn/ui |
| **Estado** | React Query (TanStack) |
| **Roteamento** | React Router DOM v6 |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Autenticação** | Supabase Auth + Cloudflare Turnstile |

### 1.3 Identidade Visual (Rebranding Concluído)

| Item | Status | Descrição |
|------|--------|-----------|
| **Favicon** | ✅ Atualizado | Escudo de Segurança (ShieldCheck) em gradiente azul |
| **Logo** | ✅ Atualizado | "APOC" com ícone de escudo |
| **Marca Lovable** | ✅ Removida | Footer e referências removidas |
| **Meta Tags SEO** | ✅ Configuradas | Título, descrição e Open Graph otimizados |

---

## 2. Estado do Banco de Dados (Supabase)

### 2.1 Informações de Conexão

| Parâmetro | Valor |
|-----------|-------|
| **Project ID** | `ofbyxnpprwwuieabwhdo` |
| **Region** | South America (São Paulo) |
| **PostgreSQL Version** | 15 |

### 2.2 Tabelas Principais

| Tabela | Registros | RLS | Descrição |
|--------|-----------|-----|-----------|
| `frameworks` | 3 | ✅ | Frameworks de compliance (ISO 27001, LGPD, SOC 2) |
| `controls` | 62 | ✅ | Controles de segurança vinculados aos frameworks |
| `policies` | 8 | ✅ | Políticas organizacionais |
| `risks` | 0 | ✅ | Registro de riscos |
| `incidents` | 0 | ✅ | Gestão de incidentes |
| `integrations` | 10 | ✅ | Integrações configuradas |
| `user_roles` | 1 | ✅ | Papéis de usuários (RBAC) |
| `profiles` | - | ✅ | Perfis de usuários |
| `audits` | - | ✅ | Auditorias |
| `evidence` | - | ✅ | Evidências de controles |
| `vendors` | - | ✅ | Gestão de fornecedores |
| `tasks` | - | ✅ | Tarefas e atividades |
| `notifications` | - | ✅ | Sistema de notificações |
| `integration_oauth_tokens` | - | ✅ | Tokens OAuth criptografados |
| `audit_logs` | - | ✅ | Logs de auditoria |

### 2.3 Dados de Seed (Populados)

#### Frameworks Ativos
| Framework | Versão | Controles | Status |
|-----------|--------|-----------|--------|
| **ISO 27001:2022** | 2022 | 18 | Ativo |
| **LGPD** | Lei 13.709 | 19 | Ativo |
| **SOC 2 Type II** | 2024 | 25 | Ativo |

#### Distribuição de Controles por Status
- ✅ **Passed:** ~40%
- ⏳ **Pending:** ~40%
- ❌ **Failed:** ~20%

### 2.4 Row Level Security (RLS)

**Status:** ✅ Habilitado em todas as tabelas

Políticas implementadas:
- Usuários só acessam seus próprios dados (`auth.uid() = user_id`)
- Admins têm acesso expandido via função `has_role()`
- Tokens OAuth protegidos por usuário
- Logs de auditoria somente leitura para auditores

### 2.5 Funções de Banco de Dados

```sql
-- Funções Security Definer (evitam recursão RLS)
public.has_role(_user_id uuid, _role app_role) → boolean
public.get_user_roles(_user_id uuid) → TABLE(role app_role)
public.create_notification(...) → uuid
public.handle_new_user() → trigger
public.assign_role_from_invite() → trigger
```

### 2.6 Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `evidence` | ❌ | Evidências de auditoria |
| `documents` | ❌ | Documentos de políticas |

---

## 3. Integrações e Segurança

### 3.1 Status das Integrações

| Integração | Status | Edge Functions | Observações |
|------------|--------|----------------|-------------|
| **Google Workspace** | ✅ Configurado | `google-oauth-start`, `google-oauth-callback`, `google-oauth-refresh`, `google-oauth-revoke`, `google-workspace-sync` | OAuth 2.0 com refresh automático |
| **Azure AD** | ⚠️ Parcial | `azure-oauth-start`, `azure-oauth-callback`, `azure-oauth-revoke`, `azure-test-connection` | Aguardando credenciais de admin |
| **AWS** | ✅ Configurado | `aws-integration`, `aws-test-connection`, `aws-sync-resources` | IAM Access Keys configuradas |
| **MikroTik** | ✅ Funcional | Via webhooks | Agente local envia logs |

### 3.2 Secrets Configurados (Supabase)

| Secret | Status | Uso |
|--------|--------|-----|
| `GOOGLE_CLIENT_ID` | ✅ | OAuth Google Workspace |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth Google Workspace |
| `TOKEN_ENCRYPTION_KEY` | ✅ | Criptografia AES-256-GCM de tokens |
| `WEBHOOK_SIGNING_SECRET` | ✅ | Validação HMAC de webhooks |
| `AWS_ACCESS_KEY_ID` | ✅ (Supabase) | Integração AWS |
| `AWS_SECRET_ACCESS_KEY` | ✅ (Supabase) | Integração AWS |
| `AWS_REGION` | ✅ (Supabase) | Região AWS padrão |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (Supabase) | Operações admin |

### 3.3 Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  • Supabase Client com Anon Key (pública)                   │
│  • Autenticação via Supabase Auth + Turnstile               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │ Edge Funcs  │  │ Auth + Storage      │  │
│  │ + RLS       │  │ + Secrets   │  │ + Realtime          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRAÇÕES EXTERNAS                      │
│  • Google Workspace (OAuth 2.0)                             │
│  • Azure AD (OAuth 2.0 + Graph API)                         │
│  • AWS (IAM + STS)                                          │
│  • MikroTik (Webhook Inbound)                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Decisões de Arquitetura

| Decisão | Justificativa |
|---------|---------------|
| **Secrets em Edge Functions** | Chaves sensíveis nunca expostas ao frontend |
| **RLS em todas as tabelas** | Proteção a nível de banco de dados |
| **Tokens OAuth criptografados** | AES-256-GCM com `TOKEN_ENCRYPTION_KEY` |
| **Anon Key pública** | Segura pois RLS protege os dados |
| **Sem .env no frontend** | Variáveis hardcoded ou via Supabase config |

---

## 4. Estrutura de Arquivos

```
apoc/
├── src/
│   ├── components/
│   │   ├── access/          # Revisão de acessos
│   │   ├── analytics/       # Dashboards analíticos
│   │   ├── audit/           # Portal de auditoria
│   │   ├── auth/            # Autenticação
│   │   ├── controls/        # Gestão de controles
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── incidents/       # Gestão de incidentes
│   │   ├── integrations/    # Hub de integrações
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── notifications/   # Sistema de alertas
│   │   ├── policies/        # Políticas e treinamentos
│   │   ├── reports/         # Relatórios
│   │   ├── risk/            # Gestão de riscos
│   │   ├── settings/        # Configurações
│   │   └── ui/              # Componentes Shadcn
│   ├── hooks/
│   │   ├── integrations/    # Hooks de sync (AWS, Azure, Google)
│   │   └── use*.tsx         # Hooks de domínio
│   ├── pages/               # Páginas da aplicação
│   └── integrations/
│       └── supabase/        # Client e Types
├── supabase/
│   ├── config.toml          # Configuração local
│   └── functions/           # Edge Functions
├── public/
│   ├── favicon.svg          # Escudo de segurança
│   └── robots.txt
└── docs/                    # Documentação técnica
```

---

## 5. Changelog Recente

### v2.0.0 (08/12/2024)

#### 🌐 Infraestrutura
- [x] Domínio customizado configurado: `apoc.com.br`
- [x] DNS propagado e SSL ativo
- [x] Redirecionamento www → apex configurado

#### 🎨 Rebranding
- [x] Favicon atualizado para ShieldCheck (escudo de segurança)
- [x] Logo "APOC" implementado no Header
- [x] Referências à marca Lovable removidas
- [x] Meta tags SEO otimizadas para "APOC Compliance Platform"

#### 🗄️ Banco de Dados
- [x] Script SQL de seed executado
- [x] 3 Frameworks criados (ISO 27001, LGPD, SOC 2)
- [x] 62 Controles reais inseridos
- [x] RLS validado em todas as tabelas

#### 🔐 Segurança
- [x] `TOKEN_ENCRYPTION_KEY` configurado para criptografia de tokens
- [x] `WEBHOOK_SIGNING_SECRET` configurado para validação HMAC
- [x] Credenciais Google OAuth configuradas
- [x] Credenciais AWS configuradas

---

## 6. Próximos Passos Técnicos

### 6.1 Alta Prioridade

| Task | Status | Responsável |
|------|--------|-------------|
| Configurar Azure AD Client ID/Secret | ⏳ Pendente | Admin |
| Popular tabela `risks` com dados demo | ⏳ Pendente | DBA |
| Popular tabela `incidents` com dados demo | ⏳ Pendente | DBA |
| Testar fluxo completo Google OAuth | 🔄 Em teste | Dev |

### 6.2 Média Prioridade

- [ ] Implementar refresh automático de tokens Azure
- [ ] Configurar alertas de expiração de tokens
- [ ] Adicionar mais controles NIST CSF
- [ ] Implementar export de relatórios PDF

### 6.3 Baixa Prioridade

- [ ] Integração com Slack/Teams para notificações
- [ ] Dashboard de métricas em tempo real
- [ ] API pública documentada (Swagger)

---

## 7. Credenciais e Acessos

### 7.1 Supabase Dashboard
- **URL:** https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo
- **SQL Editor:** https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/sql/new
- **Edge Functions:** https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions
- **Secrets:** https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/settings/functions

### 7.2 Para Completar Azure AD

1. Acesse [Azure Portal](https://portal.azure.com)
2. Vá em **Azure Active Directory → App registrations**
3. Crie um novo app ou use existente
4. Configure Redirect URI: `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/azure-oauth-callback`
5. Copie **Application (client) ID** e **Client Secret**
6. Adicione como secrets no Supabase:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_CLIENT_SECRET`
   - `AZURE_AD_TENANT_ID`

---

## 8. Contatos e Recursos

| Recurso | Link |
|---------|------|
| **Produção** | https://apoc.com.br |
| **Supabase Docs** | https://supabase.com/docs |
| **Shadcn/ui** | https://ui.shadcn.com |
| **Tailwind CSS** | https://tailwindcss.com |

---

**Documento gerado automaticamente em 08/12/2024**  
**Versão: 2.0.0**
