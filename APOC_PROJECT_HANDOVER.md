# APOC Project Handover - Estado Atual

**Data de Geração:** 2025-12-03  
**Versão:** 1.0  
**Status:** Produção/Beta Avançado

---

## 1. Visão Geral do Projeto

### 1.1 O que é o APOC?
APOC (Audit, Policy, Operations & Compliance) é uma plataforma SaaS enterprise de GRC (Governance, Risk & Compliance) desenvolvida para gerenciar:
- Frameworks de compliance (ISO 27001, SOC 2, LGPD, etc.)
- Controles de segurança
- Gestão de riscos
- Auditorias
- Políticas e treinamentos
- Gestão de incidentes
- Revisões de acesso
- Integrações com provedores cloud

### 1.2 Público-Alvo
- Compliance Officers
- CISOs (Chief Information Security Officers)
- Auditores internos e externos
- Gestores de Risco
- Equipes de TI/Segurança

---

## 2. Stack Tecnológica

### 2.1 Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | ^18.3.1 | Framework UI |
| TypeScript | - | Type safety |
| Vite | - | Build tool |
| Tailwind CSS | - | Styling |
| Shadcn/ui | - | Componentes UI |
| React Query | ^5.83.0 | State management/cache |
| React Router DOM | ^6.30.1 | Roteamento |
| Recharts | ^2.15.4 | Gráficos |
| Lucide React | ^0.462.0 | Ícones |
| React Hook Form | ^7.61.1 | Formulários |
| Zod | ^3.25.76 | Validação |

### 2.2 Backend (Supabase)
| Serviço | Status | Descrição |
|---------|--------|-----------|
| PostgreSQL | ✅ Ativo | Banco de dados principal |
| Auth | ✅ Ativo | Autenticação JWT |
| Storage | ✅ Ativo | Armazenamento de arquivos |
| Edge Functions | ✅ Ativo | Lógica serverless |
| RLS | ✅ Ativo | Row Level Security |
| Realtime | 🔶 Parcial | Notificações |

### 2.3 Integrações Externas
| Integração | Status | Descrição |
|------------|--------|-----------|
| Google Workspace | ✅ OAuth implementado | Sync de usuários/grupos |
| Azure AD | ✅ OAuth implementado | Sync de diretório |
| AWS | ✅ Credenciais | IAM, EC2, S3 |
| MikroTik | ✅ Agent-based | Logs de dispositivos |
| Cloudflare Turnstile | ✅ Ativo | Captcha |

---

## 3. Estrutura do Projeto

```
src/
├── assets/                    # Imagens e assets estáticos
├── components/
│   ├── access/               # Revisões de acesso
│   ├── analytics/            # Dashboard analítico
│   ├── audit/                # Portal de auditoria
│   ├── auth/                 # Autenticação
│   ├── common/               # Componentes reutilizáveis
│   ├── controls/             # Controles e frameworks
│   ├── dashboard/            # Dashboard principal
│   ├── incidents/            # Gestão de incidentes
│   ├── integrations/         # Hub de integrações
│   ├── layout/               # Header, Sidebar, Footer
│   ├── notifications/        # Sistema de notificações
│   ├── policies/             # Políticas e treinamentos
│   ├── reports/              # Relatórios
│   ├── risk/                 # Gestão de riscos
│   ├── settings/             # Configurações
│   ├── tasks/                # Tarefas
│   ├── theme/                # ThemeProvider
│   └── ui/                   # Shadcn components
├── hooks/                    # Custom hooks
├── integrations/
│   └── supabase/            # Cliente e tipos Supabase
├── lib/                      # Utilitários
├── pages/                    # Páginas da aplicação
└── main.tsx                  # Entry point

supabase/
├── config.toml              # Configuração Supabase
└── functions/               # Edge Functions
    ├── aws-integration/
    ├── aws-sync-resources/
    ├── aws-test-connection/
    ├── azure-integration/
    ├── azure-oauth-callback/
    ├── azure-oauth-revoke/
    ├── azure-oauth-start/
    ├── azure-test-connection/
    ├── google-oauth-callback/
    ├── google-oauth-refresh/
    ├── google-oauth-revoke/
    ├── google-oauth-start/
    ├── google-oauth-validate/
    ├── google-workspace-sync/
    ├── ingest-metrics/
    ├── integration-webhook/
    ├── okta-integration/
    ├── proxy-api-request/
    └── send-notification-email/
```

---

## 4. Modelo de Dados (Database Schema)

### 4.1 Tabelas Principais

| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `profiles` | Perfis de usuário | ✅ |
| `user_roles` | Roles dos usuários | ✅ |
| `frameworks` | Frameworks de compliance | ✅ |
| `controls` | Controles de segurança | ✅ |
| `control_tests` | Testes automatizados | ✅ |
| `control_assignments` | Atribuições de controles | ✅ |
| `risks` | Registro de riscos | ✅ |
| `risk_assessments` | Avaliações de risco | ✅ |
| `vendors` | Fornecedores | ✅ |
| `audits` | Auditorias | ✅ |
| `evidence` | Evidências | ✅ |
| `policies` | Políticas | ✅ |
| `incidents` | Incidentes | ✅ |
| `incident_playbooks` | Playbooks de resposta | ✅ |
| `bcp_plans` | Planos de continuidade | ✅ |
| `tasks` | Tarefas | ✅ |
| `notifications` | Notificações | ✅ |
| `audit_logs` | Logs de auditoria | ✅ |
| `access_anomalies` | Anomalias de acesso | ✅ |
| `integrations` | Integrações configuradas | ✅ |
| `integration_oauth_tokens` | Tokens OAuth | ✅ |
| `integration_webhooks` | Webhooks recebidos | ✅ |
| `integration_status` | Status das integrações | ✅ |
| `integration_evidence_mapping` | Mapeamento evidências | ✅ |
| `device_logs` | Logs MikroTik | ✅ |
| `user_deletion_requests` | Solicitações de exclusão | ✅ |

### 4.2 Enums
```sql
app_role: 'admin' | 'auditor' | 'compliance_officer' | 'viewer' | 
          'master_admin' | 'master_ti' | 'master_governance'
```

### 4.3 Funções do Banco
- `has_role(user_id, role)` - Verifica se usuário tem role
- `get_user_roles(user_id)` - Retorna roles do usuário
- `handle_new_user()` - Trigger para criar perfil
- `assign_first_admin()` - Primeiro usuário vira admin
- `create_notification(...)` - Cria notificação
- `update_updated_at_column()` - Atualiza timestamps

### 4.4 Storage Buckets
- `evidence` (privado) - Arquivos de evidência
- `documents` (privado) - Documentos de políticas

---

## 5. Sistema de Autenticação

### 5.1 Fluxo de Auth
```
1. Usuário acessa /auth
2. Cloudflare Turnstile valida captcha
3. Supabase Auth processa login/signup
4. JWT armazenado em localStorage
5. AuthProvider gerencia estado global
6. ProtectedRoute verifica autenticação
```

### 5.2 Hierarquia de Roles
```
master_admin (Super Admin)
    └── master_ti (TI Master)
    └── master_governance (Governance Master)
        └── admin (Administrador)
            └── compliance_officer (Compliance)
            └── auditor (Auditor)
                └── viewer (Visualizador)
```

### 5.3 Arquivos Relevantes
- `src/hooks/useAuth.tsx` - Hook principal de auth
- `src/hooks/useUserRoles.tsx` - Verificação de roles
- `src/components/auth/AuthModal.tsx` - Modal de login
- `src/components/auth/ProtectedRoute.tsx` - Rota protegida
- `src/pages/Auth.tsx` - Página de autenticação

---

## 6. Integrações - Estado Detalhado

### 6.1 Google Workspace
**Status:** ✅ Implementado (OAuth 2.0)

**Edge Functions:**
- `google-oauth-start` - Inicia fluxo OAuth
- `google-oauth-callback` - Processa callback
- `google-oauth-refresh` - Renova tokens
- `google-oauth-revoke` - Revoga acesso
- `google-oauth-validate` - Valida configuração
- `google-workspace-sync` - Sincroniza recursos

**Scopes Configurados:**
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/admin.directory.user.readonly`
- `https://www.googleapis.com/auth/admin.directory.group.readonly`
- `https://www.googleapis.com/auth/admin.reports.audit.readonly`

**Limitações Conhecidas:**
- Admin Directory API requer conta Google Workspace corporativa
- Contas Gmail pessoais só têm acesso ao perfil básico
- Modal já trata graciosamente erros 403 para contas pessoais

**Secrets Configurados:**
- `GOOGLE_CLIENT_ID` ✅
- `GOOGLE_CLIENT_SECRET` ✅

### 6.2 Azure AD
**Status:** ✅ Implementado (OAuth 2.0)

**Edge Functions:**
- `azure-oauth-start` - Inicia fluxo OAuth
- `azure-oauth-callback` - Processa callback
- `azure-oauth-revoke` - Revoga acesso
- `azure-integration` - Operações gerais
- `azure-test-connection` - Testa conexão

**Componentes:**
- `src/components/integrations/AzureIntegrationCard.tsx`
- `src/components/integrations/AzureConnectionStatus.tsx`
- `src/components/integrations/connectors/AzureAdConnector.tsx`

### 6.3 AWS
**Status:** ✅ Implementado (Credenciais)

**Edge Functions:**
- `aws-integration` - Operações gerais
- `aws-sync-resources` - Sincroniza recursos
- `aws-test-connection` - Testa conexão

**Secrets Configurados:**
- `AWS_ACCESS_KEY_ID` ✅
- `AWS_SECRET_ACCESS_KEY` ✅
- `AWS_REGION` ✅

**Componentes:**
- `src/components/integrations/ConnectAwsModal.tsx`
- `src/components/integrations/AwsResourcesModal.tsx`

### 6.4 MikroTik
**Status:** ✅ Agent-based

**Fluxo:**
1. Agent instalado no roteador MikroTik
2. Agent envia logs via webhook
3. `integration-webhook` processa dados
4. Dados salvos em `device_logs`

**Componentes:**
- `src/components/integrations/MikroTikAgentModal.tsx`

---

## 7. Páginas da Aplicação

| Rota | Componente | Status |
|------|------------|--------|
| `/` | Index.tsx | ✅ Dashboard principal |
| `/auth` | Auth.tsx | ✅ Autenticação |
| `/analytics` | Analytics.tsx | ✅ Analytics |
| `/controls` | ControlsFrameworks.tsx | ✅ Controles |
| `/risk` | RiskManagement.tsx | ✅ Riscos |
| `/audit` | AuditPortal.tsx | ✅ Auditorias |
| `/policies` | PoliciesTraining.tsx | ✅ Políticas |
| `/access` | AccessReviews.tsx | ✅ Revisões |
| `/incidents` | IncidentsManagement.tsx | ✅ Incidentes |
| `/integrations` | IntegrationsHub.tsx | ✅ Integrações |
| `/reports` | ReportsExports.tsx | ✅ Relatórios |
| `/notifications` | NotificationsHub.tsx | ✅ Notificações |
| `/tasks` | Tasks.tsx | ✅ Tarefas |
| `/settings` | Settings.tsx | ✅ Configurações |
| `/compliance-readiness` | ComplianceReadiness.tsx | ✅ Readiness |
| `/files` | FileManagement.tsx | ✅ Arquivos |
| `/policy-documents` | PolicyDocuments.tsx | ✅ Documentos |
| `*` | NotFound.tsx | ✅ 404 |

---

## 8. Hooks Customizados

| Hook | Propósito |
|------|-----------|
| `useAuth` | Autenticação global |
| `useUserRoles` | Verificação de permissões |
| `useFrameworks` | CRUD frameworks |
| `useRisks` | CRUD riscos |
| `useAudits` | CRUD auditorias |
| `usePolicies` | CRUD políticas |
| `useIncidents` | CRUD incidentes |
| `useTasks` | CRUD tarefas |
| `useNotifications` | Notificações |
| `useReports` | Relatórios |
| `useAccess` | Revisões de acesso |
| `useIntegrations` | Gestão integrações |
| `useIntegrationStatus` | Status integrações |
| `useAuditLogs` | Logs de auditoria |
| `useFileUpload` | Upload de arquivos |
| `useAzureConnection` | Conexão Azure |
| `useGoogleOAuthValidation` | Validação Google |
| `useGoogleWorkspaceSync` | Sync Google |
| `useGoogleWorkspaceApi` | API Google |
| `useWebhookMonitor` | Monitor webhooks |
| `useNetworkAlerts` | Alertas de rede |
| `useComplianceReadiness` | Readiness |
| `useOnboardingTour` | Tour onboarding |

---

## 9. Secrets Configurados no Supabase

| Secret | Status | Uso |
|--------|--------|-----|
| `SUPABASE_URL` | ✅ | URL do projeto |
| `SUPABASE_ANON_KEY` | ✅ | Chave anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave admin |
| `SUPABASE_DB_URL` | ✅ | URL do banco |
| `SUPABASE_PUBLISHABLE_KEY` | ✅ | Chave pública |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth Google |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | ✅ | AWS IAM |
| `AWS_REGION` | ✅ | AWS Region |

---

## 10. Design System

### 10.1 Tema
- Dark mode por padrão
- Light mode suportado
- Cores via CSS variables HSL
- Tokens semânticos em `index.css`

### 10.2 Componentes UI (Shadcn)
Todos os componentes padrão do Shadcn/ui estão disponíveis:
- Button, Card, Dialog, Sheet, Tabs
- Form, Input, Select, Checkbox
- Table, Badge, Avatar, Tooltip
- Toast, Sonner (notificações)
- etc.

### 10.3 Gradientes Customizados
```css
.bg-gradient-dashboard - Gradiente principal
.bg-gradient-card - Cards
.bg-gradient-sidebar - Sidebar
```

---

## 11. Funcionalidades Removidas Recentemente

| Feature | Data | Motivo |
|---------|------|--------|
| Inventário de Ativos | 2025-12-03 | Solicitação do usuário |
| API Monitor | 2025-12-03 | Solicitação do usuário |

---

## 12. Issues Conhecidos

### 12.1 Google Workspace
- Erro 403 em `list_users`/`list_groups` com contas Gmail pessoais
- **Status:** Tratado graciosamente no frontend
- **Solução:** Modal exibe mensagem explicativa

### 12.2 Credenciais Hardcoded
- `src/integrations/supabase/client.ts` contém URL e key hardcoded
- **Recomendação:** Usar variáveis de ambiente em produção

### 12.3 RLS Policies
- Todas as tabelas têm RLS habilitado
- Verificar policies antes de adicionar novas features

---

## 13. Configuração do Supabase

**Project ID:** `ofbyxnpprwwuieabwhdo`
**URL:** `https://ofbyxnpprwwuieabwhdo.supabase.co`
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 14. Como Continuar o Desenvolvimento

### 14.1 Setup Local
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### 14.2 Edge Functions
- Localizadas em `supabase/functions/`
- Deploy automático pelo Lovable
- Logs disponíveis no Supabase Dashboard

### 14.3 Migrações
- Usar ferramenta de migração do Lovable
- Nunca editar `src/integrations/supabase/types.ts` manualmente

---

## 15. Próximos Passos Sugeridos

1. **Segurança**
   - Implementar rate limiting
   - Adicionar 2FA

2. **Integrações**
   - Completar Okta integration
   - Adicionar GitHub/GitLab

3. **Features**
   - Dashboard de compliance score
   - Exportação de relatórios PDF
   - Notificações por email

4. **Performance**
   - Implementar paginação server-side
   - Otimizar queries N+1

---

## 16. Contatos e Recursos

- **Documentação Lovable:** https://docs.lovable.dev/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo
- **Edge Function Logs:** https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/functions

---

*Este documento foi gerado automaticamente e deve ser atualizado conforme o projeto evolui.*
