# APOC - MVP Technical Overview

**Version:** 1.0  
**Last Updated:** 2025-01-24  
**Status:** MVP Development Phase

---

## 1. Identidade do Produto

### Nome
**APOC** - Automated Platform for Online Compliance

### Propósito
SaaS de Compliance Híbrido e Monitoramento de Rede que integra:
- Gestão de conformidade (ISO 27001, SOC 2, LGPD, GDPR)
- Monitoramento de infraestrutura de rede (MikroTik)
- Integrações nativas com provedores de nuvem e identity providers
- Auditoria e gestão de evidências
- Sistema de alertas e notificações automatizadas

### Stack Tecnológica

**Frontend:**
- React 18.3.1
- TypeScript
- Tailwind CSS (Design System com tokens semânticos)
- Shadcn UI (Componentes)
- React Router DOM 6.30.1
- TanStack Query 5.83.0 (State Management)
- Recharts 2.15.4 (Visualização de dados)

**Backend:**
- Supabase (BaaS completo)
  - PostgreSQL (Database)
  - Auth (Autenticação e Autorização)
  - Storage (Arquivos e evidências)
  - Edge Functions (Deno/TypeScript)
  - Row-Level Security (RLS)

**Build & Deploy:**
- Vite 6.0.11
- Lovable Cloud Platform

---

## 2. Módulos de Integração (Status Atual)

### 2.1 Google Workspace OAuth 2.0
**Status:** ✅ Pronto e Validado

**Tecnologia:**
- OAuth 2.0 Authorization Code Flow
- Scopes: `openid`, `email`, `profile`, `directory.readonly`, `admin.directory.user.readonly`, `admin.directory.group.readonly`

**Arquitetura:**
```
User Browser → google-oauth-start (Edge Function) 
→ Google OAuth Consent Screen 
→ google-oauth-callback (Edge Function)
→ Token Storage (integration_oauth_tokens table)
→ google-workspace-sync (Edge Function) → Google Workspace APIs
```

**Edge Functions:**
- `google-oauth-start`: Inicia o fluxo OAuth, gera state/nonce, redireciona para Google
- `google-oauth-callback`: Recebe authorization code, troca por tokens, armazena no DB
- `google-oauth-validate`: Valida tokens existentes, verifica expiração
- `google-oauth-refresh`: Renova access tokens usando refresh token
- `google-oauth-revoke`: Revoga tokens e deleta do DB
- `google-workspace-sync`: Sincroniza usuários, grupos e audit logs do Workspace

**Secrets Necessários:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Hooks Frontend:**
- `useGoogleOAuthValidation`: Gerencia validação e status de tokens
- `useGoogleWorkspaceSync`: Interface para sincronização de dados
- `useGoogleWorkspaceApi`: API completa para chamadas ao Workspace

---

### 2.2 Azure AD OAuth 2.0
**Status:** ✅ Pronto e Validado

**Tecnologia:**
- OAuth 2.0 + OpenID Connect
- Microsoft Identity Platform v2.0
- Scopes: `openid`, `profile`, `email`, `User.Read`, `Directory.Read.All`

**Arquitetura:**
```
User Browser → azure-oauth-start (Edge Function)
→ Microsoft Login
→ azure-oauth-callback (Edge Function)
→ Token Storage (integration_oauth_tokens)
→ azure-integration (Edge Function) → Microsoft Graph API
```

**Edge Functions:**
- `azure-oauth-start`: Inicia fluxo OAuth com Microsoft
- `azure-oauth-callback`: Processa callback e armazena tokens
- `azure-oauth-revoke`: Revoga integração Azure AD
- `azure-integration`: Testa conexão e sincroniza dados do Azure AD
- `azure-test-connection`: Valida tokens e permissões

**Secrets Necessários:**
- Azure Client ID (configurado via frontend)
- Azure Client Secret (configurado via frontend)
- Azure Tenant ID (configurado via frontend)

**Hooks Frontend:**
- `useAzureConnection`: Gerencia teste, revogação e status da conexão

---

### 2.3 AWS Cloud (Cross-Account Role)
**Status:** ✅ Pronto e Validado

**Tecnologia:**
- AWS STS (Security Token Service)
- Cross-Account IAM Role com AssumeRole
- Princípio de Least Privilege

**Arquitetura:**
```
APOC Platform → aws-integration (Edge Function)
→ AWS STS AssumeRole
→ Temporary Credentials
→ AWS Services APIs (EC2, S3, CloudWatch, IAM, etc.)
```

**Edge Functions:**
- `aws-integration`: Integração principal para coletar dados AWS
- `aws-test-connection`: Valida Role ARN e permissões

**Configuração Necessária:**
```json
{
  "roleArn": "arn:aws:iam::123456789012:role/APOCIntegrationRole",
  "externalId": "apoc-unique-external-id",
  "regions": ["us-east-1", "sa-east-1"]
}
```

**IAM Policy Recomendada:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:List*",
        "s3:GetBucketPolicy",
        "cloudwatch:GetMetricStatistics",
        "iam:GetAccountSummary",
        "iam:ListUsers",
        "iam:ListRoles"
      ],
      "Resource": "*"
    }
  ]
}
```

**Documentação:**
- `AWS_INTEGRATION_GUIDE.md` (Guia completo de configuração)

---

### 2.4 MikroTik (Agente IoT Local)
**Status:** ✅ Pronto e Operacional

**Tecnologia:**
- Python Agent (compilado para .exe via PyInstaller)
- Comunicação unidirecional: Agent → Cloud
- Autenticação via Supabase Anon Key
- Protocolo: HTTPS POST

**Arquitetura:**
```
MikroTik Router (API) 
→ APOC Agent (Python .exe)
→ HTTPS POST (com Anon Key)
→ ingest-metrics (Edge Function)
→ device_logs (Table)
→ Dashboard Real-Time
```

**Edge Function:**
- `ingest-metrics`: Recebe métricas do agente e persiste no banco

**Payload Format:**
```json
{
  "agent_token": "uuid-do-dispositivo",
  "router_name": "MikroTik-HQ",
  "cpu": 45,
  "version": "1.0.0"
}
```

**Headers Obrigatórios:**
```
Authorization: Bearer {SUPABASE_ANON_KEY}
apikey: {SUPABASE_ANON_KEY}
Content-Type: application/json
```

**Configuração (config.ini):**
```ini
[MIKROTIK]
ip = 192.168.88.1
user = admin
password = sua_senha

[APOC]
api_url = https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics
token = {USER_UUID}
anon_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
intervalo_segundos = 5
```

**Frontend Components:**
- `MikroTikAgentModal`: Modal de instalação e configuração do agente
- `NetworkMonitoring`: Dashboard de monitoramento em tempo real

**Documentação:**
- `src/pages/TechnicalDocumentation.tsx` (Documentação interna completa)
- `docs/APOC_AGENT_EXAMPLE.md` (Exemplos em Python, Bash, Node.js)

---

## 3. Arquitetura do Backend (Supabase)

### 3.1 Banco de Dados (PostgreSQL)

**Project ID:** `ofbyxnpprwwuieabwhdo`

#### Tabelas Principais

**1. `profiles`**
- Armazena informações adicionais dos usuários
- Campos: `user_id`, `display_name`, `avatar_url`, `organization`, `role`
- RLS: Usuários podem ver/editar seu próprio perfil

**2. `user_roles`**
- Sistema de permissões baseado em roles
- Enum: `admin`, `auditor`, `compliance_officer`, `viewer`, `master_admin`, `master_ti`, `master_governance`
- RLS: Administradores gerenciam roles
- **Segurança:** Usa função `has_role()` com SECURITY DEFINER para evitar recursão RLS

**3. `integrations`**
- Armazena integrações configuradas pelo usuário
- Campos: `provider`, `name`, `status`, `configuration` (JSONB), `last_sync_at`
- RLS: Usuários gerenciam suas próprias integrações

**4. `integration_oauth_tokens`**
- Tokens OAuth de integrações (Google, Azure)
- Campos: `integration_name`, `access_token`, `refresh_token`, `expires_at`, `scope`, `metadata`
- RLS: Usuários acessam apenas seus próprios tokens
- **Segurança:** Tokens criptografados em repouso

**5. `integration_status`**
- Status de saúde das integrações
- Campos: `integration_name`, `status`, `health_score`, `last_sync_at`, `total_webhooks`, `failed_webhooks`
- RLS: Authenticated users podem visualizar

**6. `integration_webhooks`**
- Log de webhooks recebidos de integrações
- Campos: `integration_name`, `event_type`, `payload`, `status`, `error_message`, `retry_count`
- RLS: Sistema pode inserir/atualizar, usuários autenticados podem visualizar

**7. `integration_evidence_mapping`**
- Mapeamento entre integrações e evidências de compliance
- Campos: `integration_name`, `evidence_type`, `control_id`, `collection_frequency`, `config`
- RLS: Admins e compliance officers gerenciam

**8. `device_logs`**
- Logs de dispositivos de rede (MikroTik)
- Campos: `device_id`, `router_name`, `cpu_usage`, `version`, `created_at`
- RLS: **Público para INSERT** (agentes externos), autenticados para SELECT

**9. `frameworks`**
- Frameworks de compliance (ISO 27001, SOC 2, etc.)
- Campos: `name`, `description`, `version`, `status`, `compliance_score`, `total_controls`, `passed_controls`
- RLS: Usuários gerenciam seus próprios frameworks

**10. `controls`**
- Controles de segurança vinculados a frameworks
- Campos: `framework_id`, `code`, `title`, `category`, `description`, `status`, `owner`, `evidence_count`
- RLS: Usuários gerenciam seus próprios controles

**11. `control_assignments`**
- Atribuições de controles a usuários
- Campos: `control_id`, `assigned_to`, `assigned_by`, `due_date`, `status`, `notes`
- RLS: Admins/compliance officers podem atribuir, usuários veem suas atribuições

**12. `control_tests`**
- Testes automatizados de controles
- Campos: `control_id`, `test_name`, `test_type`, `status`, `result_data`, `tested_at`, `next_test_date`
- RLS: Sistema cria, usuários visualizam

**13. `evidence`**
- Evidências de compliance (documentos, screenshots, logs)
- Campos: `audit_id`, `name`, `type`, `status`, `file_url`, `uploaded_by`
- RLS: Usuários gerenciam suas próprias evidências
- **Storage:** Bucket `evidence` (privado)

**14. `audits`**
- Auditorias de compliance
- Campos: `name`, `framework`, `status`, `progress`, `start_date`, `end_date`, `auditor`
- RLS: Usuários gerenciam suas próprias auditorias

**15. `policies`**
- Políticas e procedimentos
- Campos: `name`, `category`, `version`, `description`, `status`, `owner`, `approval_status`, `file_url`, `version_history`
- RLS: Usuários gerenciam suas próprias políticas
- **Storage:** Bucket `documents` (privado)

**16. `risks`**
- Registro de riscos
- Campos: `title`, `category`, `probability`, `impact`, `level`, `risk_score`, `owner`, `status`, `trend`, `controls`
- RLS: Usuários gerenciam seus próprios riscos

**17. `vendors`**
- Gestão de fornecedores terceiros
- Campos: `name`, `category`, `criticality`, `risk_level`, `compliance_score`, `certifications`, `contract_value`
- RLS: Usuários gerenciam seus próprios vendors

**18. `risk_assessments`**
- Avaliações de risco enviadas a fornecedores
- Campos: `vendor_id`, `template`, `status`, `progress`, `sent_date`, `due_date`, `risk_flags`
- RLS: Usuários gerenciam suas próprias assessments

**19. `incidents`**
- Incidentes de segurança
- Campos: `title`, `description`, `severity`, `status`, `category`, `affected_systems`, `reported_by`, `assigned_to`
- RLS: Usuários gerenciam seus próprios incidentes

**20. `incident_playbooks`**
- Playbooks de resposta a incidentes
- Campos: `name`, `category`, `severity`, `description`, `steps`, `estimated_time`, `roles`, `triggers`
- RLS: Usuários autenticados podem CRUD

**21. `bcp_plans`**
- Planos de Continuidade de Negócios
- Campos: `name`, `status`, `rto`, `rpo`, `systems`, `coverage`, `last_tested`, `next_test`
- RLS: Usuários autenticados podem CRUD

**22. `tasks`**
- Tarefas de compliance
- Campos: `title`, `description`, `status`, `priority`, `assigned_to`, `due_date`, `category`
- RLS: Usuários gerenciam suas próprias tasks

**23. `notifications`**
- Sistema de notificações
- Campos: `title`, `message`, `type`, `priority`, `read`, `action_url`, `action_label`, `related_table`, `related_id`, `expires_at`
- RLS: Usuários gerenciam suas próprias notificações

**24. `audit_logs`**
- Logs de auditoria de ações no sistema
- Campos: `action`, `resource_type`, `resource_id`, `old_data`, `new_data`, `ip_address`, `user_agent`
- RLS: Admins e auditors podem visualizar todos, usuários criam seus próprios logs

**25. `access_anomalies`**
- Anomalias detectadas em acessos
- Campos: `user_name`, `system_name`, `anomaly_type`, `severity`, `description`, `status`, `assigned_to`
- RLS: Admins/compliance officers gerenciam, usuários autenticados visualizam

**26. `user_deletion_requests`**
- Sistema de exclusão de usuários com tripla aprovação (Master Admin, Master TI, Master Governance)
- Campos: `target_user_id`, `target_user_email`, `requested_by`, `status`, `rejection_reason`, timestamps de aprovações
- RLS: Apenas master roles podem criar e aprovar

#### Relacionamentos Principais

```
frameworks (1) → (N) controls
controls (1) → (N) control_assignments
controls (1) → (N) control_tests
controls (1) → (N) integration_evidence_mapping
audits (1) → (N) evidence
vendors (1) → (N) risk_assessments
```

#### Funções do Banco de Dados

**1. `has_role(_user_id uuid, _role app_role)`**
- Verifica se usuário possui role específica
- **SECURITY DEFINER:** Evita recursão RLS
- Retorna: `boolean`

**2. `get_user_roles(_user_id uuid)`**
- Retorna todas as roles de um usuário
- **SECURITY DEFINER**
- Retorna: `TABLE(role app_role)`

**3. `create_notification(...)`**
- Cria notificação para usuário
- **SECURITY DEFINER**
- Parâmetros: `user_id`, `title`, `message`, `type`, `priority`, `action_url`, etc.
- Retorna: `uuid` (ID da notificação criada)

**4. `assign_first_admin()`**
- Trigger que atribui role 'admin' ao primeiro usuário registrado
- **SECURITY DEFINER**

**5. `handle_new_user()`**
- Trigger que cria perfil automático para novos usuários
- **SECURITY DEFINER**

**6. `update_updated_at_column()`**
- Trigger genérico para atualizar `updated_at` em tabelas

**7. `update_integration_webhooks_updated_at()`**
- Trigger específico para `integration_webhooks`

#### Storage Buckets

**1. `evidence` (Privado)**
- Armazena evidências de compliance (PDFs, screenshots, logs)
- RLS aplicado

**2. `documents` (Privado)**
- Armazena políticas, procedimentos, manuais
- RLS aplicado

---

### 3.2 Edge Functions (Deno/TypeScript)

#### Google Workspace Integration
- `google-oauth-start`: Inicia OAuth flow
- `google-oauth-callback`: Processa callback e armazena tokens
- `google-oauth-validate`: Valida tokens existentes
- `google-oauth-refresh`: Renova access tokens
- `google-oauth-revoke`: Revoga tokens
- `google-workspace-sync`: Sincroniza usuários, grupos e audit logs

#### Azure AD Integration
- `azure-oauth-start`: Inicia OAuth flow com Microsoft
- `azure-oauth-callback`: Processa callback
- `azure-oauth-revoke`: Revoga integração
- `azure-integration`: Sincroniza dados do Azure AD
- `azure-test-connection`: Testa conexão e permissões

#### AWS Integration
- `aws-integration`: Integração principal com AWS APIs
- `aws-test-connection`: Valida Role ARN e permissões

#### MikroTik / IoT
- `ingest-metrics`: Recebe métricas de agentes locais

#### Webhooks
- `integration-webhook`: Endpoint genérico para receber webhooks de integrações externas

#### Notifications
- `send-notification-email`: Envia emails de notificação (future)

#### Generic API Proxy
- `proxy-api-request`: Proxy genérico para chamadas API externas (com rate limiting e retry)

#### Okta Integration (Placeholder)
- `okta-integration`: Estrutura para futura integração Okta

---

### 3.3 Segurança

#### Row-Level Security (RLS)
- **TODAS as tabelas** possuem RLS habilitado
- Políticas baseadas em `auth.uid()` e funções `has_role()`
- Tabelas multi-tenant: usuários só acessam seus próprios dados
- Exceção: `device_logs` permite INSERT público (com autenticação via Anon Key no header)

#### Anon Key
- Usada para chamadas públicas autenticadas (como agentes IoT)
- **Chave:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYnl4bnBwcnd3dWllYWJ3aGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDY4NTEsImV4cCI6MjA3MzE4Mjg1MX0.aHH2NWUQZnvV6FALdBIP5SB02YbrE8u12lXI1DtIbiw`

#### Service Role Key
- Usada em Edge Functions para operações privilegiadas
- Não exposta no frontend

#### OAuth Tokens
- Armazenados criptografados na tabela `integration_oauth_tokens`
- Acessíveis apenas pelo owner (RLS)
- Refresh automático implementado

#### CORS
- Todas as Edge Functions configuradas com CORS headers apropriados
- Suporte a OPTIONS preflight

---

## 4. O Agente IoT (MikroTik)

### 4.1 Arquitetura do Agente

**Linguagem:** Python 3.x  
**Build:** PyInstaller (Windows .exe)  
**Deployment:** On-premises (rede do cliente)  

**Componentes:**
1. **Coletor de Métricas**: Lê dados do MikroTik via API REST
2. **Configuração**: Arquivo `config.ini` (UTF-8)
3. **Cliente HTTP**: Envia dados via HTTPS POST
4. **Loop de Envio**: Intervalo configurável (padrão: 5 segundos)

### 4.2 Fluxo de Dados

```
┌─────────────────┐
│  MikroTik API   │ (192.168.x.x)
└────────┬────────┘
         │ (REST API)
         ▼
┌─────────────────┐
│  APOC Agent.exe │ (Windows)
└────────┬────────┘
         │ (HTTPS POST)
         │ Authorization: Bearer {anon_key}
         ▼
┌─────────────────┐
│ Edge Function   │ (ingest-metrics)
│ Supabase Cloud  │
└────────┬────────┘
         │ (SQL INSERT)
         ▼
┌─────────────────┐
│  device_logs    │ (PostgreSQL)
│     Table       │
└────────┬────────┘
         │ (Real-time subscription)
         ▼
┌─────────────────┐
│   Dashboard     │ (React)
│  (Recharts)     │
└─────────────────┘
```

### 4.3 Estrutura do config.ini

```ini
[MIKROTIK]
ip = 192.168.88.1
user = admin
password = sua_senha_aqui

[APOC]
api_url = https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics
token = {UUID_DO_USUARIO_OU_DISPOSITIVO}
anon_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
intervalo_segundos = 5
```

### 4.4 Compilação do Agente

**Comando:**
```bash
python -m PyInstaller --onefile --name APOC_Agent main.py
```

**Output:**
```
dist/
  └── APOC_Agent.exe  (executável standalone)
```

**Distribuição:**
- `APOC_Agent.exe` + `config.ini` em .zip
- Download via modal no frontend

### 4.5 Tratamento de Erros

**Erro 401 Unauthorized:**
- Causa: Anon Key incorreta ou ausente
- Solução: Verificar `config.ini` e copiar chave do modal

**Erro de Timeout:**
- Causa: IP do MikroTik inacessível
- Solução: Verificar conectividade de rede, firewall

**Janela fecha imediatamente:**
- Causa: `config.ini` não encontrado
- Solução: Garantir que config.ini está na mesma pasta do .exe

---

## 5. Funcionalidades do Frontend

### 5.1 Dashboard (Página Principal)

**Rota:** `/`

**Componentes:**
- `ComplianceScoreCard`: Card principal com score geral de compliance
- `MetricsGrid`: Grid de KPIs (Frameworks, Controles, Riscos, Tarefas)
- `ComplianceChart`: Gráfico de evolução de compliance (Recharts)
- `RealTimeMetrics`: Métricas em tempo real (atualização a cada 30s)
- `TasksPanel`: Painel de tarefas pendentes
- `NetworkMonitoring`: Monitoramento de rede MikroTik em tempo real
- `DashboardOnboarding`: Tour guiado para novos usuários

**Funcionalidades:**
- Overview de compliance em tempo real
- Gráficos interativos (Line, Bar, Area charts)
- Indicadores de saúde de integrações
- Lista de tarefas com filtros
- Monitoramento de CPU de dispositivos de rede

### 5.2 Integrações (Hub de Integrações)

**Rota:** `/integrations`

**Componentes:**
- `IntegrationsStats`: Estatísticas gerais de integrações
- `AvailableIntegrations`: Grid de integrações disponíveis
  - Google Workspace (OAuth)
  - Azure AD (OAuth)
  - AWS Cloud (Role ARN)
  - MikroTik (Agente Local)
- `ConnectedIntegrations`: Lista de integrações ativas
- `IntegrationLogs`: Logs de sincronização
- `WebhookMonitor`: Monitor de webhooks recebidos

**Modais:**
- `GoogleWorkspaceOAuth`: Configuração OAuth Google
- `AzureIntegrationCard`: Configuração OAuth Azure
- `ConnectAwsModal`: Configuração AWS Role
- `MikroTikAgentModal`: Download e configuração do agente

**Funcionalidades:**
- Conectar/desconectar integrações
- Validar tokens OAuth
- Testar conexões
- Visualizar logs de sincronização
- Gerenciar webhooks
- Download do agente MikroTik

### 5.3 Controles e Frameworks

**Rota:** `/controls-frameworks`

**Componentes:**
- `FrameworksOverview`: Visão geral de frameworks (ISO 27001, SOC 2, LGPD, etc.)
- `ControlsMatrix`: Matriz de controles com status
- `GapAssessment`: Avaliação de gaps de compliance
- `AdvancedFiltersModal`: Filtros avançados para controles

**Modais:**
- `CreateControlModal`: Criar novo controle
- `EditControlModal`: Editar controle existente
- `ControlDetailsModal`: Detalhes completos do controle
- `UploadEvidenceModal`: Upload de evidências para controle
- `EditFrameworkModal`: Editar framework
- `DeleteFrameworkModal`: Excluir framework

**Funcionalidades:**
- CRUD completo de frameworks
- CRUD completo de controles
- Atribuição de controles a usuários
- Upload de evidências (Storage integrado)
- Gap analysis automática
- Filtros e busca avançada

### 5.4 Gestão de Riscos

**Rota:** `/risk-management`

**Componentes:**
- `RiskStats`: Estatísticas de riscos
- `RiskMatrix`: Matriz de riscos (Probabilidade x Impacto)
- `RiskRegistry`: Registro completo de riscos
- `RiskAssessments`: Avaliações de risco para vendors
- `VendorManagement`: Gestão de fornecedores

**Modais:**
- `CreateRiskModal`: Criar novo risco
- `EditRiskModal`: Editar risco
- `CreateVendorModal`: Criar vendor
- `NewAssessmentModal`: Nova avaliação de risco
- `ViewAssessmentModal`: Visualizar avaliação
- `UseTemplateModal`: Usar template de avaliação

**Funcionalidades:**
- CRUD de riscos
- Cálculo automático de risk score
- Matriz de riscos interativa
- Gestão de vendors
- Assessments de terceiros
- Templates de questionários

### 5.5 Políticas e Treinamentos

**Rota:** `/policies-training`

**Componentes:**
- `PoliciesStats`: Estatísticas de políticas
- `PoliciesLibrary`: Biblioteca de políticas
- `PolicyApprovalWorkflow`: Workflow de aprovação
- `AttestationTracking`: Tracking de atestações
- `TrainingPrograms`: Programas de treinamento
- `PolicyVersionHistory`: Histórico de versões

**Modais:**
- `CreatePolicyModal`: Criar nova política
- `EditPolicyModal`: Editar política
- `PolicyAttestationModal`: Atestar política
- `SendRemindersModal`: Enviar lembretes
- `CreateTrainingModal`: Criar treinamento

**Funcionalidades:**
- CRUD de políticas
- Upload de documentos (PDF, DOCX)
- Workflow de aprovação multi-stage
- Controle de versão
- Atestações de leitura
- Treinamentos obrigatórios
- Sistema de lembretes

### 5.6 Auditoria

**Rota:** `/audit-portal`

**Componentes:**
- `AuditStats`: Estatísticas de auditorias
- `FrameworkChecklists`: Checklists por framework
- `EvidenceLocker`: Cofre de evidências
- `AuditorAccess`: Acesso para auditores externos
- `AuditWorkflowVisualizer`: Visualização do workflow

**Modais:**
- `CreateAuditModal`: Criar nova auditoria
- `EditAuditModal`: Editar auditoria
- `EvidenceUploadModal`: Upload de evidências
- `EvidenceViewModal`: Visualizar evidência
- `SearchEvidenceModal`: Buscar evidências
- `ConfigureAuditorModal`: Configurar auditor externo
- `ControlEvidenceModal`: Evidências de controle específico
- `AuditReportModal`: Gerar relatório de auditoria

**Funcionalidades:**
- CRUD de auditorias
- Gerenciamento de evidências
- Acesso granular para auditores
- Checklists automatizados
- Geração de relatórios
- Exportação de dados

### 5.7 Gestão de Incidentes

**Rota:** `/incidents`

**Componentes:**
- `IncidentStats`: Estatísticas de incidentes
- `ActiveIncidents`: Incidentes ativos
- `IncidentPlaybooks`: Playbooks de resposta
- `BusinessContinuity`: Planos de continuidade (BCP/DR)

**Modais:**
- `ReportIncidentModal`: Reportar novo incidente
- `CreatePlaybookModal`: Criar playbook
- `ViewPlaybookModal`: Visualizar playbook
- `BCPReportModal`: Relatório de teste BCP
- `TestDetailsModal`: Detalhes de teste BCP

**Funcionalidades:**
- Reporte de incidentes
- Classificação automática de severidade
- Playbooks de resposta
- Tracking de resolução
- Planos BCP/DR
- Testes de continuidade

### 5.8 Revisão de Acessos

**Rota:** `/access-reviews`

**Componentes:**
- `AccessReviewsStats`: Estatísticas de revisões
- `ActiveCampaigns`: Campanhas ativas de revisão
- `SystemsInventory`: Inventário de sistemas integrados
- `AnomaliesDetection`: Detecção de anomalias de acesso

**Modais:**
- `CreateCampaignModal`: Criar campanha de revisão
- `EditCampaignModal`: Editar campanha
- `ManageUsersModal`: Gerenciar usuários
- `SystemDetailsModal`: Detalhes do sistema
- `ConfigureIntegrationModal`: Configurar integração
- `AssignResponsibleModal`: Atribuir responsável
- `AddCommentModal`: Adicionar comentário
- `ViewHistoryModal`: Histórico de revisões

**Funcionalidades:**
- Campanhas de revisão de acessos
- Inventário de sistemas
- Detecção de anomalias (ML-ready)
- Atribuição de responsáveis
- Workflow de aprovação

### 5.9 Relatórios e Exportações

**Rota:** `/reports`

**Componentes:**
- `ReportsStats`: Estatísticas de relatórios
- `ReadyReports`: Relatórios prontos
- `CustomReports`: Relatórios customizados
- `ScheduledReports`: Agendamento de relatórios

**Modais:**
- `CreateReportModal`: Criar relatório
- `ConfigureReportModal`: Configurar relatório
- `ReportPreviewModal`: Preview do relatório
- `ShareReportModal`: Compartilhar relatório
- `EditScheduleModal`: Editar agendamento
- `ManageRecipientsModal`: Gerenciar destinatários

**Funcionalidades:**
- Relatórios pré-configurados (Compliance, Riscos, Auditorias)
- Report builder customizado
- Exportação (PDF, Excel, CSV)
- Agendamento de envios
- Distribuição por email

### 5.10 Notificações

**Rota:** `/notifications`

**Componentes:**
- `NotificationCenter`: Centro de notificações
- `AutomatedAlertsPanel`: Alertas automatizados
- `NotificationRulesManager`: Gerenciador de regras

**Funcionalidades:**
- Centro unificado de notificações
- Regras de automação
- Alertas em tempo real
- Priorização de notificações
- Ações rápidas (CTA)

### 5.11 Analytics

**Rota:** `/analytics`

**Componentes:**
- `PerformanceKPIs`: KPIs de performance
- `RiskEvolution`: Evolução de riscos
- `RiskMatrix`: Matriz de riscos analítica
- `FrameworkDetails`: Detalhes por framework

**Funcionalidades:**
- Dashboards analíticos avançados
- Gráficos interativos (Recharts)
- Tendências históricas
- Comparativos entre períodos
- Drill-down por categoria

### 5.12 Configurações

**Rota:** `/settings`

**Componentes:**
- `UserRolesManagement`: Gestão de roles e permissões
- `AuditLogsViewer`: Visualizador de logs de auditoria
- Perfil do usuário (avatar, nome, organização)
- Configurações de segurança (2FA, sessões)
- Backup e exportação de dados

**Modais:**
- `ChangePasswordModal`: Trocar senha
- `Setup2FAModal`: Configurar autenticação 2FA
- `ManageSessionsModal`: Gerenciar sessões ativas
- `BackupDataModal`: Backup de dados
- `DeleteAccountModal`: Excluir conta
- `ViewLogsModal`: Visualizar logs
- `MasterUserDeletionModal`: Sistema de exclusão com tripla aprovação

**Funcionalidades:**
- Gestão de perfil
- Segurança avançada
- Auditoria de ações
- Controle de sessões
- Sistema de exclusão de usuários (tripla aprovação)

### 5.13 Documentação Técnica (Interna)

**Rota:** `/technical-documentation`

**Componentes:**
- `TechnicalDocumentation`: Página completa de documentação

**Conteúdo:**
- Visão geral da arquitetura APOC
- Documentação do Agente Python
- Guia de compilação (PyInstaller)
- Estrutura do config.ini
- Troubleshooting de erros comuns

**Funcionalidades:**
- Documentação técnica em Markdown
- Code blocks com syntax highlighting
- Accordion para organização de conteúdo
- Link para APOC_AGENT_EXAMPLE.md

---

## 6. Próximos Passos (Roadmap MVP)

### 6.1 Fase 1: Consolidação (Curto Prazo - 2 semanas)

**Alertas Automatizados:**
- [ ] Sistema de alertas baseado em CPU do MikroTik (threshold configurável)
- [ ] Alertas de vencimento de controles (next_review)
- [ ] Alertas de tokens OAuth expirando (7 dias antes)
- [ ] Notificações de incidentes críticos

**Dashboard Enhancements:**
- [ ] Adicionar gráfico de histórico de CPU (últimas 24h, 7 dias, 30 dias)
- [ ] Adicionar mapa de calor de disponibilidade de rede
- [ ] Widget de "Top 5 Riscos Críticos"
- [ ] Widget de "Próximos Vencimentos"

**Testes e Validação:**
- [ ] Testes E2E de todas as integrações
- [ ] Testes de carga no Edge Function `ingest-metrics`
- [ ] Validação de RLS em todas as tabelas
- [ ] Testes de UI/UX com usuários reais

### 6.2 Fase 2: Automação (Médio Prazo - 1 mês)

**Coleta Automática de Evidências:**
- [ ] Sincronização automática de logs do Google Workspace como evidências
- [ ] Sincronização de compliance reports do Azure AD
- [ ] Sincronização de compliance reports do AWS (Config, Security Hub)
- [ ] Webhook listeners para eventos de compliance

**Relatórios Avançados:**
- [ ] Geração automática de relatórios em PDF (React-PDF)
- [ ] Templates de relatório por framework (ISO 27001, SOC 2, LGPD)
- [ ] Dashboard executivo com resumo visual
- [ ] Exportação de dados para Power BI / Tableau

**Integrações Adicionais:**
- [ ] Okta (Identity Provider)
- [ ] Slack (Notificações)
- [ ] Microsoft Teams (Notificações)
- [ ] Jira (Integração de tarefas)
- [ ] ServiceNow (Tickets de incidente)

### 6.3 Fase 3: Inteligência (Longo Prazo - 2 meses)

**Machine Learning e IA:**
- [ ] Detecção de anomalias de acesso (ML model)
- [ ] Predição de riscos baseada em dados históricos
- [ ] Chatbot de compliance (GPT-4 integration)
- [ ] Recomendações automáticas de controles

**Compliance Contínuo:**
- [ ] Testes automatizados de controles (scheduled jobs)
- [ ] Remediação sugerida para gaps
- [ ] Score de maturidade de compliance
- [ ] Benchmarking contra indústria

**Mobile App:**
- [ ] App React Native para aprovações mobile
- [ ] Notificações push
- [ ] Dashboard resumido
- [ ] Assinatura de políticas via mobile

### 6.4 Fase 4: Escalabilidade (Futuro - 3+ meses)

**Performance:**
- [ ] Migração de gráficos para WebGL (high-performance)
- [ ] Implementação de caching (Redis)
- [ ] Otimização de queries (indexes, views)
- [ ] CDN para assets estáticos

**Multi-Tenancy Avançado:**
- [ ] Organização hierárquica (matriz/filiais)
- [ ] Delegação de compliance por unidade
- [ ] Consolidação de relatórios multi-organização

**White-Label:**
- [ ] Customização de marca (logo, cores)
- [ ] Domínio próprio
- [ ] Customização de workflows

**Marketplace:**
- [ ] Marketplace de integrações customizadas
- [ ] Marketplace de templates de políticas
- [ ] Marketplace de playbooks de incidentes

---

## 7. Dependências Externas

### 7.1 APIs Consumidas

**Google Workspace:**
- Admin SDK (Directory API)
- Reports API (Audit logs)
- OAuth 2.0

**Microsoft Azure:**
- Microsoft Graph API
- Azure AD API
- OAuth 2.0 / OpenID Connect

**AWS:**
- EC2 API
- S3 API
- CloudWatch API
- IAM API
- STS (AssumeRole)

**MikroTik:**
- RouterOS REST API

### 7.2 Bibliotecas Principais

**Frontend:**
- `@tanstack/react-query`: Data fetching e caching
- `react-hook-form` + `zod`: Validação de formulários
- `recharts`: Visualização de dados
- `sonner`: Toast notifications
- `date-fns`: Manipulação de datas
- `react-dropzone`: Upload de arquivos

**Backend (Edge Functions):**
- `@supabase/supabase-js`: Cliente Supabase
- Deno standard library

---

## 8. Documentação Adicional

### 8.1 Documentos de Arquitetura
- `AWS_INTEGRATION_GUIDE.md`: Guia completo de integração AWS
- `INTEGRATIONS_ARCHITECTURE.md`: Arquitetura de integrações
- `OAUTH_COMPLETE_GUIDE.md`: Guia OAuth completo

### 8.2 Documentos de Validação
- `GOOGLE_OAUTH_VALIDATION_GUIDE.md`: Validação Google OAuth
- `INTEGRATION_VALIDATION_GUIDE.md`: Validação de integrações
- `INTEGRATION_TESTING_GUIDE.md`: Guia de testes

### 8.3 Documentos de Desenvolvimento
- `TECHNICAL_DOCUMENTATION.md`: Documentação técnica geral
- `APOC_AGENT_EXAMPLE.md`: Exemplos do agente em múltiplas linguagens
- `DYNAMIC_API_CONNECTOR.md`: Conector API dinâmico
- `WEBHOOK_DOCUMENTATION.md`: Documentação de webhooks

### 8.4 Documentos de UX
- `UX_WRITING_GUIDELINES.md`: Guidelines de UX Writing
- `UX_WRITING_IMPROVEMENTS_APPLIED.md`: Melhorias aplicadas
- `USER_TESTING_SCRIPT.md`: Script de testes com usuários

### 8.5 Documentos de Auditoria
- `AUDIT_REPORT.md`: Relatório de auditoria
- `AUDIT_CONTINUOUS_DOCUMENTATION.md`: Documentação de auditoria contínua

---

## 9. Notas de Implementação

### 9.1 Design System
- Uso de tokens semânticos CSS (HSL colors)
- Componentes Shadcn UI customizados
- Tema claro/escuro completo
- Responsividade mobile-first

### 9.2 Estado da Aplicação
- TanStack Query para server state
- React hooks para local state
- Context API para temas e auth
- LocalStorage para preferências de UI

### 9.3 Roteamento
- React Router DOM v6
- Protected routes com `ProtectedRoute` component
- Lazy loading de páginas (code splitting)

### 9.4 Tratamento de Erros
- Boundary errors (React Error Boundary)
- Toast notifications para feedback
- Logging de erros no console
- Retry automático em requisições (TanStack Query)

### 9.5 Autenticação
- Supabase Auth (email/password)
- Session management automático
- Refresh token handling
- Logout automático em caso de erro 401

### 9.6 Performance
- Code splitting por rota
- Memoização de componentes pesados
- Debounce em inputs de busca
- Virtualização de listas longas (future)

---

## 10. Contatos e Suporte

**Documentação:**
- Documentação interna: `/technical-documentation`
- Repositório: [Link do Git]

**Suporte Técnico:**
- Email: suporte@apoc.com.br
- Slack: #apoc-dev

**Equipe:**
- Lead Architect: [Nome]
- Backend Developer: [Nome]
- Frontend Developer: [Nome]
- DevOps: [Nome]

---

**Última Atualização:** 2025-01-24  
**Versão do Documento:** 1.0  
**Status:** MVP em Desenvolvimento Ativo  
**Próxima Revisão:** 2025-02-15
