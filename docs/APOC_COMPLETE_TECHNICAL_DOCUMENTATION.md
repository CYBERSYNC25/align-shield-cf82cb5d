# APOC - Documentação Técnica Completa
## Automated Platform for Online Compliance

**Versão:** 3.0  
**Última Atualização:** Janeiro 2026  
**Classificação:** Documento Técnico Interno

---

## Índice

1. [Sumário Executivo](#1-sumário-executivo)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Diagramas de Fluxo](#4-diagramas-de-fluxo)
5. [Módulos e Componentes](#5-módulos-e-componentes)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [Edge Functions (API Backend)](#7-edge-functions-api-backend)
8. [Catálogo de Integrações](#8-catálogo-de-integrações)
9. [Motor de Compliance](#9-motor-de-compliance)
10. [Sistema de Permissões](#10-sistema-de-permissões)
11. [Segurança](#11-segurança)
12. [Guia de Implementação](#12-guia-de-implementação)
13. [Referência de APIs](#13-referência-de-apis)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Sumário Executivo

### 1.1 Visão Geral

O **APOC (Automated Platform for Online Compliance)** é uma plataforma SaaS enterprise de GRC (Governance, Risk & Compliance) projetada para automatizar o monitoramento contínuo de conformidade com frameworks regulatórios como ISO 27001, LGPD, SOC 2, HIPAA, PCI-DSS e NIST CSF.

### 1.2 Objetivos Principais

| Objetivo | Descrição |
|----------|-----------|
| **Automação de Compliance** | Monitoramento contínuo de 20+ regras de segurança em tempo real |
| **Coleta de Evidências** | Integração com 15 provedores para coleta automatizada |
| **Gestão de Riscos** | Registro, matriz 5x5, workflow de aceitação com aprovações |
| **Portal do Auditor** | Acesso read-only seguro para auditores externos |
| **SLA Management** | Prazos automáticos (24h/7d/30d) baseados em severidade |
| **MTTR Tracking** | Métricas de tempo médio de remediação por severidade |

### 1.3 Público-Alvo

- **Compliance Officers** - Gestão de frameworks e controles
- **CISOs** - Visão executiva de postura de segurança
- **Auditores** - Acesso controlado a evidências
- **Risk Managers** - Registro e tratamento de riscos
- **Equipes de TI/DevOps** - Remediação de vulnerabilidades

### 1.4 Frameworks Suportados

| Framework | Versão | Controles | Status |
|-----------|--------|-----------|--------|
| ISO 27001 | 2022 | 93 | ✅ Completo |
| LGPD | Lei 13.709 | 65 | ✅ Completo |
| SOC 2 Type II | 2017 | 64 | ✅ Completo |
| HIPAA | 2013 | 54 | ✅ Completo |
| PCI-DSS | 4.0 | 78 | ✅ Completo |
| NIST CSF | 2.0 | 106 | ✅ Completo |

---

## 2. Arquitetura do Sistema

### 2.1 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   React     │  │  React      │  │  Tailwind   │              │
│  │   18.3.1    │  │  Query 5.x  │  │  CSS 3.4    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                         │                                        │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Supabase Client SDK                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE BACKEND                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PostgreSQL │  │  Auth       │  │  Edge       │              │
│  │  + RLS      │  │  (GoTrue)   │  │  Functions  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Row Level Security (40+ Policies)           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │  AWS   │ │ Azure  │ │ GitHub │ │ Slack  │ │ Google │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │  Okta  │ │ Auth0  │ │ Intune │ │  Jira  │ │Cloudflr│        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Camadas da Aplicação

| Camada | Responsabilidade | Tecnologias |
|--------|------------------|-------------|
| **Apresentação** | UI/UX, componentes, roteamento | React, Shadcn/ui, React Router |
| **Estado** | Cache, sincronização, mutations | React Query, Context API |
| **Serviços** | Lógica de negócio, hooks | Custom Hooks, Zod |
| **Dados** | Persistência, autenticação | Supabase Client SDK |
| **Backend** | APIs, processamento | Edge Functions (Deno) |
| **Armazenamento** | Banco de dados, arquivos | PostgreSQL, Supabase Storage |

### 2.3 Estrutura de Diretórios

```
apoc/
├── src/
│   ├── assets/                 # Imagens e assets estáticos
│   ├── components/
│   │   ├── access/            # Revisões de acesso
│   │   ├── analytics/         # Dashboards analíticos
│   │   ├── audit/             # Auditoria e evidências
│   │   ├── auditor/           # Portal do auditor
│   │   ├── auth/              # Autenticação
│   │   ├── common/            # Componentes compartilhados
│   │   ├── controls/          # Controles e frameworks
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── incidents/         # Gestão de incidentes
│   │   ├── integrations/      # Hub de integrações
│   │   ├── inventory/         # Inventário de ativos
│   │   ├── layout/            # Layout global
│   │   ├── notifications/     # Sistema de notificações
│   │   ├── policies/          # Políticas e treinamentos
│   │   ├── reports/           # Relatórios
│   │   ├── risk/              # Gestão de riscos
│   │   ├── settings/          # Configurações
│   │   ├── tasks/             # Tarefas
│   │   ├── theme/             # Tema e modo escuro
│   │   └── ui/                # Componentes Shadcn/ui
│   ├── hooks/
│   │   ├── integrations/      # Hooks de integrações
│   │   └── *.tsx              # Hooks customizados
│   ├── integrations/
│   │   └── supabase/          # Cliente e tipos Supabase
│   ├── lib/                   # Utilitários e helpers
│   ├── pages/                 # Páginas/rotas
│   └── main.tsx               # Entry point
├── supabase/
│   ├── functions/
│   │   ├── _shared/           # Código compartilhado
│   │   └── */index.ts         # Edge Functions
│   ├── migrations/            # Migrações SQL
│   └── config.toml            # Configuração Supabase
├── docs/                      # Documentação
├── tests/                     # Testes
└── public/                    # Assets públicos
```

---

## 3. Stack Tecnológico

### 3.1 Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.8.3 | Type Safety |
| Vite | 5.4.19 | Build Tool & Dev Server |
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| Shadcn/ui | Latest | Component Library |
| React Query | 5.83.0 | Server State Management |
| React Router | 6.30.1 | Routing |
| React Hook Form | 7.61.1 | Forms |
| Zod | 3.25.76 | Schema Validation |
| Recharts | 2.15.4 | Charts & Graphs |
| Lucide React | 0.462.0 | Icons |
| Sonner | 1.7.4 | Toast Notifications |
| date-fns | 4.1.0 | Date Utilities |
| Framer Motion | - | Animations |

### 3.2 Backend (Supabase)

| Tecnologia | Propósito |
|------------|-----------|
| PostgreSQL 15+ | Banco de dados relacional |
| GoTrue | Autenticação e autorização |
| PostgREST | API REST automática |
| Realtime | WebSocket subscriptions |
| Edge Functions (Deno) | Serverless functions |
| Storage | Armazenamento de arquivos |
| pg_cron | Scheduled jobs |

### 3.3 Segurança

| Tecnologia | Propósito |
|------------|-----------|
| AES-256-GCM | Criptografia de credenciais |
| HMAC-SHA256 | Validação de webhooks |
| Cloudflare Turnstile | CAPTCHA |
| Upstash Redis | Rate limiting |
| HIBP API | Password breach check |

### 3.4 DevOps & Infraestrutura

| Tecnologia | Propósito |
|------------|-----------|
| Lovable Cloud | Hosting & CI/CD |
| Supabase Cloud | Backend hosting |
| GitHub | Version control |
| ESLint | Code linting |
| Vitest | Unit testing |

---

## 4. Diagramas de Fluxo

### 4.1 Fluxo de Autenticação

<presentation-mermaid>
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant SB as Supabase Auth
    participant DB as Database

    U->>FE: Acessa /auth
    FE->>FE: Renderiza AuthModal
    U->>FE: Insere email/senha
    FE->>FE: Valida com Zod + HIBP check
    FE->>SB: signInWithPassword()
    SB-->>FE: Session + JWT
    FE->>DB: Fetch user_roles
    DB-->>FE: [roles]
    
    alt isViewer()
        FE->>FE: Redirect /compliance-readiness
    else hasEditRole()
        FE->>FE: Redirect /dashboard
    end
</presentation-mermaid>

### 4.2 Fluxo de Conexão de Integração

<presentation-mermaid>
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant EF as Edge Function
    participant DB as Database
    participant API as API Externa

    U->>FE: Clica "Conectar" (ex: GitHub)
    FE->>FE: Abre ConnectionModal
    U->>FE: Insere credenciais (token)
    FE->>EF: POST /save-integration-credentials
    
    EF->>API: Testa conexão (list repos)
    
    alt Sucesso
        API-->>EF: 200 OK + dados
        EF->>EF: Criptografa (AES-256-GCM)
        EF->>DB: UPSERT integrations
        EF->>DB: UPSERT integration_status
        EF->>API: Coleta dados iniciais
        EF->>DB: UPSERT integration_collected_data
        EF-->>FE: { success: true }
        FE->>U: Toast "Conectado com sucesso"
    else Falha
        API-->>EF: 401/403
        EF-->>FE: { error: "Credenciais inválidas" }
        FE->>U: Toast de erro
    end
</presentation-mermaid>

### 4.3 Motor de Compliance

<presentation-mermaid>
flowchart TD
    A[integration_collected_data] --> B{useComplianceStatus}
    B --> C[Aplica 20+ Regras]
    
    C --> D1[github-public-repo]
    C --> D2[aws-public-bucket]
    C --> D3[slack-admin-no-mfa]
    C --> D4[intune-noncompliant-device]
    C --> D5[...]
    
    D1 & D2 & D3 & D4 & D5 --> E{Resultado}
    
    E -->|Pass| F[✅ Compliance Score +]
    E -->|Fail| G[❌ Alerta Criado]
    E -->|Risk Accepted| H[⚠️ Exceção Ativa]
    
    G --> I[compliance_alerts]
    I --> J[SLA Countdown]
    J --> K[Action Center]
    
    K --> L{Ação do Usuário}
    L -->|Corrige| M[Sync Manual]
    L -->|Aceita Risco| N[Risk Acceptance Flow]
    L -->|Cria Ticket| O[Jira/Linear]
    
    M --> P[Revalida Regras]
    P --> E
    
    N --> Q{Severidade}
    Q -->|Critical/High| R[Requer Aprovação Admin]
    Q -->|Medium/Low| S[Auto-aprovado]
</presentation-mermaid>

### 4.4 Fluxo do Portal do Auditor

<presentation-mermaid>
sequenceDiagram
    participant Admin
    participant Portal as /audit
    participant DB as Database
    participant Auditor
    participant AP as /auditor-portal

    Admin->>Portal: Cria token de acesso
    Portal->>Portal: Define: auditor, tipo, expiração
    Portal->>DB: INSERT auditor_access_tokens
    DB-->>Portal: Token gerado
    Admin->>Auditor: Envia link: /auditor-portal?token=xxx

    Auditor->>AP: Acessa URL com token
    AP->>DB: SELECT * FROM auditor_access_tokens WHERE token=xxx
    
    alt Token Válido
        DB-->>AP: Token encontrado, não expirado
        AP->>AP: Define modo read-only
        AP->>DB: Fetch frameworks, controls, evidence
        AP->>Auditor: Renderiza: Score, Controles, MTTR, Histórico
    else Token Inválido
        DB-->>AP: Token não encontrado ou expirado
        AP->>Auditor: Erro: "Acesso negado"
    end
</presentation-mermaid>

### 4.5 Workflow de Aceitação de Risco

<presentation-mermaid>
flowchart TD
    A[Usuário identifica falha] --> B[Abre IssueDetailsSheet]
    B --> C[Clica "Aceitar Risco"]
    C --> D[AcceptRiskModal]
    
    D --> E{Preenche}
    E --> F[Justificativa]
    E --> G[Duração: 3m/6m/12m/Permanente]
    
    F & G --> H[Submit]
    H --> I{Verifica Política}
    
    I --> J[risk_approval_policies]
    J --> K{Requer Aprovação?}
    
    K -->|Sim| L[Status: pending]
    L --> M[Notifica Admins]
    M --> N[RiskApprovalModal]
    N --> O{Decisão}
    O -->|Aprovar| P[Status: approved]
    O -->|Rejeitar| Q[Status: rejected]
    
    K -->|Não| P
    
    P --> R[Risco removido do Action Center]
    R --> S[Exibido em Risk Acceptances]
    S --> T[Auditável no Portal]
</presentation-mermaid>

### 4.6 Arquitetura de Integrações

<presentation-mermaid>
graph TB
    subgraph "Cloud & Infra"
        AWS[AWS IAM/S3/CloudTrail]
        CF[Cloudflare]
        APOC_AGENT[AgentAPOC/MikroTik]
    end
    
    subgraph "Identity & Access"
        AZURE[Azure AD/Entra ID]
        GOOGLE[Google Workspace]
        OKTA[Okta]
        AUTH0[Auth0]
    end
    
    subgraph "SDLC"
        GITHUB[GitHub]
        GITLAB[GitLab]
    end
    
    subgraph "Productivity & HR"
        JIRA[Jira]
        SLACK[Slack]
        BAMBOO[BambooHR]
    end
    
    subgraph "Endpoint Security"
        INTUNE[Microsoft Intune]
        CROWD[CrowdStrike]
    end
    
    subgraph "APOC Backend"
        EF[Edge Functions]
        DB[(integration_collected_data)]
        RULES[Compliance Rules Engine]
    end
    
    AWS & CF & APOC_AGENT --> EF
    AZURE & GOOGLE & OKTA & AUTH0 --> EF
    GITHUB & GITLAB --> EF
    JIRA & SLACK & BAMBOO --> EF
    INTUNE & CROWD --> EF
    
    EF --> DB
    DB --> RULES
    RULES --> SCORE[Compliance Score]
</presentation-mermaid>

---

## 5. Módulos e Componentes

### 5.1 Mapa de Módulos

| Módulo | Rota | Componente Principal | Descrição |
|--------|------|---------------------|-----------|
| Dashboard | `/` | `Index.tsx` | Hub central com score, alertas, ações pendentes |
| Compliance Readiness | `/compliance-readiness` | `ComplianceReadiness.tsx` | Visão focada para viewers |
| Controles & Frameworks | `/controls` | `ControlsFrameworks.tsx` | Gestão ISO 27001, SOC 2, LGPD |
| Integrações | `/integrations` | `IntegrationsHub.tsx` | 15 providers com coleta automatizada |
| Revisões de Acesso | `/access-reviews` | `AccessReviews.tsx` | Anomalias: MFA, inatividade, privilégios |
| Gestão de Riscos | `/risks` | `RiskManagement.tsx` | Registro, matriz 5x5, aceitação |
| Portal de Auditoria | `/audit` | `AuditPortal.tsx` | Evidence locker, checklists |
| Portal do Auditor | `/auditor-portal` | `AuditorPortalPage.tsx` | Acesso externo read-only |
| Incidentes | `/incidents` | `IncidentsManagement.tsx` | Playbooks, BCP/DRP |
| Políticas | `/policies` | `PoliciesTraining.tsx` | Biblioteca com versionamento |
| Analytics | `/analytics` | `Analytics.tsx` | MTTR, SLA, trends, saúde |
| Inventário | `/inventory` | `Inventory.tsx` | Ativos centralizados |
| Notificações | `/notifications` | `NotificationsHub.tsx` | Central de alertas |
| Relatórios | `/reports` | `ReportsExports.tsx` | Geração e agendamento |
| Tarefas | `/tasks` | `Tasks.tsx` | Gestão de atividades |
| Configurações | `/settings` | `Settings.tsx` | Usuários, roles, audit logs |

### 5.2 Componentes do Dashboard

```
Index.tsx (Dashboard)
├── MetricsGrid.tsx
│   ├── KPICard.tsx (Score, Riscos, Controles, Integrações)
│   └── ComplianceScoreCard.tsx
├── ActionCenter.tsx
│   ├── SLACountdown.tsx
│   ├── IssueDetailsSheet.tsx
│   │   ├── AcceptRiskModal.tsx
│   │   └── RemediationGuide (from lib/remediation-guides.ts)
│   └── PassingTestsSummary.tsx
├── TasksPanel.tsx
├── RealTimeMetrics.tsx
└── ComplianceChart.tsx
```

### 5.3 Componentes de Integrações

```
IntegrationsHub.tsx
├── IntegrationsStats.tsx
├── AvailableIntegrations.tsx
│   ├── IntegrationCard.tsx
│   └── ConnectionModal.tsx (Universal)
├── ConnectedIntegrations.tsx
│   ├── SyncIntegrationButton.tsx
│   └── IntegrationDetailsModal.tsx
├── Provider-Specific Modals
│   ├── AwsResourcesModal.tsx
│   ├── AzureResourcesModal.tsx
│   ├── GoogleWorkspaceResourcesModal.tsx
│   └── Auth0ResourcesModal.tsx
└── WebhookMonitor.tsx
```

### 5.4 Componentes de Controles

```
ControlsFrameworks.tsx
├── FrameworksOverview.tsx
│   ├── FrameworkDetailsSheet.tsx
│   └── DeleteFrameworkModal.tsx
├── ControlsMatrix.tsx
│   ├── ControlDetailsModal.tsx
│   │   ├── ManageAccessModal.tsx (Object Permissions)
│   │   └── AutoEvidenceSection.tsx
│   ├── CreateControlModal.tsx
│   └── EditControlModal.tsx
└── GapAssessment.tsx
```

### 5.5 Componentes de Riscos

```
RiskManagement.tsx
├── RiskStats.tsx
├── RiskRegistry.tsx
│   ├── CreateRiskModal.tsx
│   ├── EditRiskModal.tsx
│   ├── RiskApprovalModal.tsx
│   └── ManageAccessModal.tsx
├── RiskMatrix.tsx
├── RiskAssessments.tsx
│   ├── NewAssessmentModal.tsx
│   └── ViewAssessmentModal.tsx
└── VendorManagement.tsx
    ├── VendorTable.tsx
    └── CreateVendorModal.tsx
```

### 5.6 Componentes do Portal do Auditor

```
AuditorPortalPage.tsx
├── AuditorPortalHeader.tsx (MODO LEITURA badge)
├── AuditorComplianceSummary.tsx
├── AuditorMTTRCard.tsx
├── AuditorVerificationHistory.tsx
├── AuditorAssetInventory.tsx
├── AuditorEvidenceRepository.tsx
└── AuditReportExportButton.tsx
```

---

## 6. Modelo de Dados

### 6.1 Diagrama ER Simplificado

<presentation-mermaid>
erDiagram
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ PROFILES : has
    USERS ||--o{ OBJECT_PERMISSIONS : granted
    
    USERS ||--o{ FRAMEWORKS : owns
    FRAMEWORKS ||--o{ CONTROLS : contains
    CONTROLS ||--o{ CONTROL_TESTS : has
    CONTROLS ||--o{ EVIDENCE : linked
    
    USERS ||--o{ INTEGRATIONS : owns
    INTEGRATIONS ||--o{ INTEGRATION_COLLECTED_DATA : collects
    INTEGRATIONS ||--o{ INTEGRATION_STATUS : has
    
    USERS ||--o{ COMPLIANCE_ALERTS : receives
    USERS ||--o{ RISK_ACCEPTANCES : creates
    USERS ||--o{ COMPLIANCE_CHECK_HISTORY : tracked
    
    USERS ||--o{ RISKS : owns
    USERS ||--o{ POLICIES : owns
    USERS ||--o{ INCIDENTS : reports
    USERS ||--o{ TASKS : assigned
    
    USERS ||--o{ AUDITOR_ACCESS_TOKENS : creates
    USERS ||--o{ NOTIFICATIONS : receives
</presentation-mermaid>

### 6.2 Tabelas Principais (40+)

#### Autenticação e Autorização

| Tabela | Colunas Principais | RLS |
|--------|-------------------|-----|
| `profiles` | id, user_id, display_name, organization, role, avatar_url | user_id |
| `user_roles` | id, user_id, role (app_role enum), assigned_by, assigned_at | admin only |
| `object_permissions` | id, user_id, object_type, object_id, permission_level, expires_at, notes | admin/owner |
| `user_invites` | id, email, role, invited_by, status, expires_at | admin |
| `user_deletion_requests` | id, target_user_id, requested_by, status, approvals | master roles |

#### Compliance e Frameworks

| Tabela | Colunas Principais | RLS |
|--------|-------------------|-----|
| `frameworks` | id, user_id, name, version, status, compliance_score, total_controls | user_id |
| `controls` | id, user_id, framework_id, code, title, category, status, owner, evidence_count | user_id |
| `control_tests` | id, control_id, test_name, test_type, status, result_data, tested_at | control owner |
| `control_assignments` | id, control_id, assigned_to, due_date, status | assigned user |

#### Integrações

| Tabela | Colunas Principais | RLS |
|--------|-------------------|-----|
| `integrations` | id, user_id, name, provider, status, configuration (encrypted), last_sync_at | user_id |
| `integration_collected_data` | id, user_id, integration_name, resource_type, resource_id, resource_data | user_id |
| `integration_status` | id, user_id, integration_name, status, health_score, last_sync_at, metadata | user_id |
| `integration_oauth_tokens` | id, user_id, integration_name, access_token (encrypted), refresh_token, expires_at | user_id |
| `integration_webhooks` | id, user_id, integration_name, event_type, payload, status, processed_at | user_id |
| `integration_evidence_mapping` | id, integration_name, control_id, evidence_type, collection_frequency | global |

#### Alertas e Monitoramento

| Tabela | Colunas Principais | RLS |
|--------|-------------------|-----|
| `compliance_alerts` | id, user_id, rule_id, rule_title, severity, integration_name, new_status, remediation_deadline, resolved | user_id |
| `compliance_check_history` | id, user_id, check_type, score, passing_count, failing_count, drift_detected, rules_results | user_id |
| `risk_acceptances` | id, user_id, rule_id, integration_name, justification, duration, expires_at, approval_status | user_id |
| `risk_approval_policies` | id, user_id, min_severity, approver_roles, require_approval_for_permanent | admin |
| `remediation_tickets` | id, user_id, alert_id, rule_id, external_system, external_ticket_id, ticket_status | user_id |

#### Riscos e Incidentes

| Tabela | Colunas Principais | RLS |
|--------|-------------------|-----|
| `risks` | id, user_id, title, category, probability, impact, level, status, owner, controls | user_id |
| `risk_assessments` | id, user_id, vendor_id, template, status, progress, risk_flags | user_id |
| `vendors` | id, user_id, name, category, criticality, risk_level, compliance_score | user_id |
| `incidents` | id, user_id, title, severity, status, category, affected_systems, assigned_to | user_id |
| `incident_playbooks` | id, user_id, name, category, severity, steps, triggers, roles | user_id |
| `bcp_plans` | id, user_id, name, status, rto, rpo, systems, coverage, last_tested | user_id |

#### Políticas e Evidências

| Tabela | Colunas Principais | RLS |
|--------|-------------------|-----|
| `policies` | id, user_id, name, category, version, status, approval_status, file_url, version_history | user_id |
| `evidence` | id, user_id, audit_id, name, type, status, file_url, uploaded_by | user_id |
| `audits` | id, user_id, name, framework, status, auditor, progress, start_date, end_date | user_id |
| `auditor_access_tokens` | id, user_id, token, auditor_name, auditor_email, audit_type, permissions, expires_at, is_revoked | user_id |

#### Sistema e Logs

| Tabela | Colunas Principais | RLS |
|--------|-------------------|-----|
| `notifications` | id, user_id, title, message, type, priority, read, action_url, expires_at | user_id |
| `tasks` | id, user_id, title, description, priority, status, due_date, assigned_to | user_id |
| `audit_logs` | id, user_id, action, resource_type, resource_id, old_data, new_data, ip_address | user_id |
| `system_audit_logs` | id, user_id, action_type, action_category, description, metadata, ip_address | immutable |
| `device_logs` | id, user_id, device_id, router_name, version, cpu_usage | user_id |
| `access_anomalies` | id, user_id, user_name, system_name, anomaly_type, severity, status | user_id |

### 6.3 Enum Types

```sql
-- Roles organizacionais
CREATE TYPE app_role AS ENUM (
  'master_admin',
  'master_ti',
  'master_governance',
  'admin',
  'editor',
  'view_only_admin',
  'compliance_officer',
  'auditor',
  'viewer'
);

-- Níveis de permissão de objeto
CREATE TYPE permission_level AS ENUM (
  'owner',
  'reviewer',
  'viewer'
);

-- Tipos de objeto para permissões
CREATE TYPE object_type AS ENUM (
  'control',
  'risk',
  'policy',
  'framework',
  'audit',
  'vendor'
);
```

### 6.4 Funções de Banco de Dados

| Função | Propósito | Parâmetros |
|--------|-----------|------------|
| `has_role(_user_id, _role)` | Verifica se usuário tem role específica | UUID, app_role |
| `get_user_roles(_user_id)` | Retorna todas as roles do usuário | UUID |
| `check_object_permission(_user_id, _object_type, _object_id, _required_level)` | Verifica permissão em objeto | UUID, TEXT, UUID, TEXT |
| `get_user_object_permissions(_user_id)` | Lista permissões de objeto do usuário | UUID |
| `create_notification(...)` | Cria notificação para usuário | Múltiplos |
| `handle_new_user()` | Trigger: cria profile ao registrar | - |
| `assign_role_from_invite()` | Trigger: atribui role de convite | - |
| `update_updated_at_column()` | Trigger: atualiza timestamp | - |

---

## 7. Edge Functions (API Backend)

### 7.1 Visão Geral

O APOC utiliza **28 Edge Functions** (Deno) para operações de backend que requerem:
- Acesso a APIs externas
- Processamento de dados sensíveis
- Operações assíncronas complexas
- Criptografia/descriptografia

### 7.2 Catálogo de Funções

#### Autenticação e Usuários

| Função | Método | Propósito |
|--------|--------|-----------|
| `invite-user` | POST | Envia convite por email para novo usuário |
| `send-notification-email` | POST | Envia emails de notificação via Resend |

#### Integrações - Credenciais

| Função | Método | Propósito |
|--------|--------|-----------|
| `save-integration-credentials` | POST | Valida, criptografa e salva credenciais + coleta inicial |
| `sync-integration-data` | POST | Sincroniza dados de integração existente |
| `proxy-api-request` | POST | Proxy seguro para APIs externas |
| `integration-webhook` | POST | Recebe webhooks de integrações |

#### Integrações - AWS

| Função | Método | Propósito |
|--------|--------|-----------|
| `aws-integration` | POST | Conecta AWS via Access Key |
| `aws-sync-resources` | POST | Coleta IAM Users, S3 Buckets, CloudTrail |
| `aws-test-connection` | POST | Testa credenciais AWS |

#### Integrações - Azure AD

| Função | Método | Propósito |
|--------|--------|-----------|
| `azure-integration` | POST | Conecta Azure via Client Credentials |
| `azure-oauth-start` | POST | Inicia fluxo OAuth Azure |
| `azure-oauth-callback` | GET | Callback OAuth Azure |
| `azure-oauth-revoke` | POST | Revoga conexão Azure |
| `azure-sync-resources` | POST | Coleta Users, Groups, Conditional Access |
| `azure-test-connection` | POST | Testa conexão Azure |

#### Integrações - Google Workspace

| Função | Método | Propósito |
|--------|--------|-----------|
| `google-oauth-start` | POST | Inicia fluxo OAuth Google |
| `google-oauth-callback` | GET | Callback OAuth Google |
| `google-oauth-refresh` | POST | Renova token Google |
| `google-oauth-revoke` | POST | Revoga conexão Google |
| `google-oauth-validate` | POST | Valida configuração OAuth |
| `google-workspace-sync` | POST | Coleta Users, Groups |

#### Integrações - Outros Providers

| Função | Método | Propósito |
|--------|--------|-----------|
| `auth0-integration` | POST | Coleta Users, Connections, Actions do Auth0 |
| `okta-integration` | POST | Coleta Users, Groups, Policies do Okta |

#### Compliance e Monitoramento

| Função | Método | Propósito |
|--------|--------|-----------|
| `check-compliance-drift` | POST | Monitoramento contínuo (pg_cron 6h) |
| `seed-compliance-data` | POST | Popula frameworks iniciais |
| `create-remediation-ticket` | POST | Cria tickets Jira/Linear |
| `ingest-metrics` | POST | Ingere métricas de dispositivos |

### 7.3 Código Compartilhado (`_shared/`)

| Arquivo | Propósito |
|---------|-----------|
| `crypto-utils.ts` | Criptografia AES-256-GCM para tokens |
| `rate-limiter.ts` | Rate limiting com Upstash Redis |
| `logger.ts` | Logging estruturado para Edge Functions |

### 7.4 Exemplo de Implementação

```typescript
// supabase/functions/save-integration-credentials/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/crypto-utils.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(authHeader, "save-credentials", 10);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.retryAfter.toString()
          } 
        }
      );
    }

    // 3. Parse request
    const { integrationId, credentials } = await req.json();

    // 4. Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 5. Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Test connection based on provider
    const testResult = await testProviderConnection(integrationId, credentials);
    if (!testResult.success) {
      return new Response(
        JSON.stringify({ error: testResult.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Encrypt credentials
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
    const encryptedConfig = await encryptToken(
      JSON.stringify(credentials),
      encryptionKey
    );

    // 8. Save to database
    const { error: saveError } = await supabase
      .from("integrations")
      .upsert({
        user_id: user.id,
        provider: integrationId,
        name: integrationId,
        status: "connected",
        configuration: { encrypted: encryptedConfig },
        last_sync_at: new Date().toISOString()
      }, { onConflict: "user_id,provider" });

    if (saveError) throw saveError;

    // 9. Trigger initial sync
    await collectInitialData(supabase, user.id, integrationId, credentials);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${integrationId} connected successfully`,
        resourcesCollected: testResult.resources
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 8. Catálogo de Integrações

### 8.1 Visão Geral (15 Providers)

| Categoria | Provider | Tipo Auth | Recursos Coletados |
|-----------|----------|-----------|-------------------|
| **Cloud & Infra** | AWS | Access Key + Secret | IAM Users, S3 Buckets, CloudTrail |
| | Cloudflare | API Token | Zones, DNS Records, WAF Rules |
| | AgentAPOC | API Key | Network Devices, Logs |
| **IAM** | Azure AD | Client Credentials | Users, Groups, Conditional Access |
| | Google Workspace | OAuth 2.0 | Users, Groups, MFA Status |
| | Okta | API Token (SSWS) | Users, Groups, Policies |
| | Auth0 | Client Credentials | Users, Connections, Actions |
| **SDLC** | GitHub | Personal Access Token | Repos, Users, Orgs, Branch Protection |
| | GitLab | Personal Access Token | Projects, Users, Groups |
| **Productivity** | Jira | API Token | Projects, Users (para tickets) |
| | Slack | Bot Token | Users, Channels, MFA Status |
| | BambooHR | API Key | Employees, Departments |
| **Endpoint** | Microsoft Intune | Client Credentials | Devices, Compliance State |
| | CrowdStrike | API Credentials | Devices, Sensors, Detections |

### 8.2 Configuração por Provider

#### AWS

```typescript
interface AwsCredentials {
  accessKeyId: string;      // AWS Access Key ID
  secretAccessKey: string;  // AWS Secret Access Key
  region?: string;          // Default: us-east-1
}

// Recursos coletados
interface AwsResources {
  iam: {
    users: Array<{
      userName: string;
      userId: string;
      mfaEnabled: boolean;
      createdAt: string;
    }>;
  };
  s3: {
    buckets: Array<{
      name: string;
      isPublic: boolean;
      encryption: string;
    }>;
  };
  cloudtrail: {
    enabled: boolean;
    trails: Array<{ name: string; isMultiRegion: boolean }>;
  };
}
```

#### GitHub

```typescript
interface GitHubCredentials {
  personalAccessToken: string;  // ghp_xxx...
}

// Recursos coletados
interface GitHubResources {
  user: { login: string; name: string };
  repos: Array<{
    name: string;
    private: boolean;
    defaultBranch: string;
    branchProtection: boolean;
  }>;
  organizations: Array<{ login: string; role: string }>;
}
```

#### Slack

```typescript
interface SlackCredentials {
  botToken: string;  // xoxb-xxx...
}

// Recursos coletados
interface SlackResources {
  users: Array<{
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    hasMfa: boolean;
    lastActive: string;
  }>;
  channels: Array<{ id: string; name: string; isPrivate: boolean }>;
}
```

### 8.3 Mapeamento de Evidências

O arquivo `src/lib/evidence-control-map.ts` mapeia recursos coletados para controles de compliance:

```typescript
export const EVIDENCE_CONTROL_MAP: EvidenceMapping[] = [
  {
    integration: "github",
    resourceType: "repo",
    controlCodes: ["A.8.4", "A.9.2.3", "CC6.1"],
    evidenceType: "repository_security",
    description: "Segurança de repositórios de código"
  },
  {
    integration: "slack",
    resourceType: "user",
    controlCodes: ["A.9.4.2", "A.9.2.4", "CC6.1"],
    evidenceType: "mfa_status",
    description: "Status de autenticação multi-fator"
  },
  {
    integration: "intune",
    resourceType: "device",
    controlCodes: ["A.8.1", "A.11.2.6", "CC6.6"],
    evidenceType: "device_compliance",
    description: "Conformidade de dispositivos endpoint"
  },
  // ... mais mapeamentos
];
```

---

## 9. Motor de Compliance

### 9.1 Arquitetura do Motor

O motor de compliance (`useComplianceStatus.tsx`) aplica **20+ regras automatizadas** aos dados coletados:

```typescript
interface ComplianceRule {
  id: string;           // Identificador único (ex: "github-public-repo")
  name: string;         // Nome descritivo
  severity: "critical" | "high" | "medium" | "low";
  integration: string;  // Provider relacionado
  resourceType: string; // Tipo de recurso avaliado
  evaluate: (data: ResourceData) => RuleResult;
}

interface RuleResult {
  status: "pass" | "fail" | "risk_accepted";
  affectedResources: number;
  details: ResourceDetail[];
}
```

### 9.2 Catálogo de Regras

#### Cloud & Infraestrutura

| Rule ID | Severidade | Descrição | Condição de Falha |
|---------|------------|-----------|-------------------|
| `aws-public-bucket` | Critical | Bucket S3 público | `bucket.isPublic === true` |
| `aws-unencrypted-bucket` | High | Bucket sem criptografia | `bucket.encryption === 'none'` |
| `aws-user-no-mfa` | Critical | IAM User sem MFA | `user.mfaEnabled === false` |
| `cloudflare-no-https` | Critical | HTTPS não forçado | `zone.ssl !== 'full_strict'` |
| `cloudflare-no-waf` | High | WAF desativado | `zone.wafEnabled === false` |

#### Identity & Access

| Rule ID | Severidade | Descrição | Condição de Falha |
|---------|------------|-----------|-------------------|
| `azure-user-no-mfa` | High | Usuário Azure sem MFA | `user.mfaEnabled === false` |
| `azure-guest-active` | Medium | Guest user ativo | `user.userType === 'Guest'` |
| `azure-disabled-user` | Low | Usuário desabilitado presente | `user.accountEnabled === false` |
| `azure-no-conditional-access` | High | Sem políticas de acesso condicional | `policies.length === 0` |
| `google-admin-no-mfa` | Critical | Admin Google sem 2FA | `user.isAdmin && !user.mfaEnabled` |
| `google-user-no-mfa` | Medium | Usuário sem 2FA | `!user.mfaEnabled` |
| `okta-user-no-mfa` | High | Usuário Okta sem MFA | `!user.mfaEnrolled` |
| `auth0-no-mfa` | High | Conexão sem MFA habilitado | `!connection.mfaRequired` |

#### SDLC

| Rule ID | Severidade | Descrição | Condição de Falha |
|---------|------------|-----------|-------------------|
| `github-public-repo` | Critical | Repositório público | `repo.private === false` |
| `github-no-branch-protection` | High | Branch main desprotegida | `repo.branchProtection === false` |
| `gitlab-public-project` | Critical | Projeto público | `project.visibility === 'public'` |

#### Productivity & Endpoints

| Rule ID | Severidade | Descrição | Condição de Falha |
|---------|------------|-----------|-------------------|
| `slack-admin-no-mfa` | Critical | Admin Slack sem 2FA | `user.isAdmin && !user.hasMfa` |
| `slack-inactive-user` | Medium | Usuário inativo >90 dias | `daysSince(user.lastActive) > 90` |
| `intune-noncompliant-device` | Critical | Dispositivo não conforme | `device.complianceState !== 'compliant'` |
| `crowdstrike-sensor-inactive` | High | Sensor inativo | `!sensor.isActive` |

### 9.3 Cálculo do Compliance Score

```typescript
function calculateComplianceScore(results: RuleResult[]): number {
  const total = results.length;
  const passing = results.filter(r => r.status === "pass").length;
  const riskAccepted = results.filter(r => r.status === "risk_accepted").length;
  
  // Risk accepted conta como "tratado" (não penaliza)
  const treated = passing + riskAccepted;
  
  return Math.round((treated / total) * 100);
}
```

### 9.4 SLA por Severidade

| Severidade | Prazo (SLA) | Deadline |
|------------|-------------|----------|
| Critical | 24 horas | now() + 1 day |
| High | 7 dias | now() + 7 days |
| Medium | 30 dias | now() + 30 days |
| Low | 90 dias | now() + 90 days |

### 9.5 Fluxo de Remediação

1. **Detecção**: Motor identifica falha
2. **Alerta**: Cria `compliance_alert` com SLA
3. **Notificação**: Toast + NotificationCenter
4. **Action Center**: Exibe no dashboard com countdown
5. **Resolução**:
   - **Corrigir**: Usuário corrige no provider → Sync manual → Revalida
   - **Aceitar Risco**: Risk Acceptance com justificativa
   - **Criar Ticket**: Integração Jira/Linear

---

## 10. Sistema de Permissões

### 10.1 Modelo de 2 Camadas

O APOC implementa um sistema de permissões em duas camadas para máxima flexibilidade:

#### Camada 1: Roles Organizacionais (user_roles)

Roles globais que definem capacidades em toda a organização:

| Role | Gerencia Usuários | Edita Recursos | Visualiza Tudo | Descrição |
|------|-------------------|----------------|----------------|-----------|
| `master_admin` | ✅ | ✅ | ✅ | Superadmin com todos os poderes |
| `master_ti` | ✅ | ✅ | ✅ | Admin técnico |
| `master_governance` | ✅ | ✅ | ✅ | Admin de governança |
| `admin` | ✅ | ✅ | ✅ | Administrador padrão |
| `editor` | ❌ | ✅ | ✅ | Pode editar, não gerencia usuários |
| `view_only_admin` | ❌ | ❌ | ✅ | Visualiza tudo, não edita |
| `compliance_officer` | ❌ | ✅ | ✅ | Foco em compliance |
| `auditor` | ❌ | ❌ | Parcial | Auditor interno |
| `viewer` | ❌ | ❌ | Parcial | Apenas visualização |

#### Camada 2: Permissões de Objeto (object_permissions)

Permissões granulares por objeto específico:

| Permission Level | Ações Permitidas |
|------------------|------------------|
| `owner` | Edição completa + gerenciar permissões do objeto |
| `reviewer` | Visualizar + aprovar + comentar |
| `viewer` | Somente visualização |

**Tipos de Objeto Suportados:**
- `control` - Controles de segurança
- `risk` - Registros de risco
- `policy` - Políticas
- `framework` - Frameworks de compliance
- `audit` - Auditorias
- `vendor` - Fornecedores

### 10.2 Hierarquia de Verificação

```typescript
function hasEditPermission(objectType: ObjectType, objectId: string): boolean {
  // 1. Admins sempre podem editar
  if (isAdmin() || isMasterUser()) return true;
  
  // 2. Editors podem editar qualquer objeto
  if (hasRole('editor')) return true;
  
  // 3. Compliance Officers podem editar
  if (hasRole('compliance_officer')) return true;
  
  // 4. Verifica permissão específica de objeto
  const objectPerm = getObjectPermission(objectType, objectId);
  if (objectPerm === 'owner' || objectPerm === 'reviewer') return true;
  
  // 5. Sem permissão
  return false;
}
```

### 10.3 Implementação no Frontend

```tsx
// Hook useUserRoles.tsx
const {
  // Roles
  hasRole,
  isAdmin,
  isEditor,
  isViewer,
  isMasterUser,
  
  // Capacidades agregadas
  canManageUsers,
  canEditResources,
  canViewAll,
  
  // Object-level
  hasEditPermission,
  hasViewPermission,
  canManageObjectPermissions,
  checkObjectPermission
} = useUserRoles();

// Uso em componente
{canEditResources && (
  <Button onClick={openEditModal}>Editar</Button>
)}

{hasEditPermission('control', controlId) && (
  <Button onClick={openEditModal}>Editar Controle</Button>
)}
```

### 10.4 ManageAccessModal

Componente para gerenciar permissões de objeto:

```tsx
<ManageAccessModal
  objectType="control"
  objectId={control.id}
  objectTitle={control.title}
  trigger={<Button variant="ghost"><Users className="h-4 w-4" /></Button>}
/>
```

---

## 11. Segurança

### 11.1 Visão Geral de Controles

| Controle | Implementação | Localização |
|----------|---------------|-------------|
| Criptografia de Credenciais | AES-256-GCM | `_shared/crypto-utils.ts` |
| Rate Limiting | Sliding Window (Redis) | `_shared/rate-limiter.ts` |
| Row Level Security | 40+ policies | `migrations/*.sql` |
| CAPTCHA | Cloudflare Turnstile | `AuthModal.tsx` |
| Password Breach Check | HIBP k-Anonymity | `password-security.ts` |
| Webhook Validation | HMAC-SHA256 | `integration-webhook/index.ts` |
| Sensitive Data Redaction | Regex patterns | `proxy-api-request/index.ts` |
| Audit Trail Imutável | RLS + no UPDATE/DELETE | `system_audit_logs` |
| Input Validation | Zod schemas | `auth-schemas.ts`, `form-schemas.ts` |
| CSRF Protection | SameSite cookies | Supabase Auth |

### 11.2 Criptografia de Credenciais

```typescript
// _shared/crypto-utils.ts

// Derivação de chave com PBKDF2
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("apoc-salt-v1"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Criptografar token
export async function encryptToken(
  plainText: string, 
  encryptionKey: string
): Promise<string> {
  const key = await deriveKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );
  
  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(ciphertext))}`;
}

// Descriptografar token
export async function decryptToken(
  encryptedText: string, 
  encryptionKey: string
): Promise<string> {
  const [ivHex, ciphertextHex] = encryptedText.split(":");
  const key = await deriveKey(encryptionKey);
  
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexToBytes(ivHex) },
    key,
    hexToBytes(ciphertextHex)
  );
  
  return new TextDecoder().decode(plaintext);
}
```

### 11.3 Rate Limiting

```typescript
// _shared/rate-limiter.ts

interface RateLimitConfig {
  windowMs: number;     // Janela em ms (60000 = 1 min)
  maxRequests: number;  // Requisições por janela
}

const LIMITS: Record<string, RateLimitConfig> = {
  "save-credentials": { windowMs: 60000, maxRequests: 10 },
  "sync-data": { windowMs: 60000, maxRequests: 10 },
  "compliance-check": { windowMs: 60000, maxRequests: 5 }
};

export async function checkRateLimit(
  identifier: string,
  operation: string,
  maxRequests?: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const redis = new Redis({
    url: Deno.env.get("UPSTASH_REDIS_URL")!,
    token: Deno.env.get("UPSTASH_REDIS_TOKEN")!
  });
  
  const config = LIMITS[operation] || { windowMs: 60000, maxRequests: maxRequests || 10 };
  const key = `ratelimit:${operation}:${identifier}`;
  
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.pexpire(key, config.windowMs);
  }
  
  const ttl = await redis.pttl(key);
  
  return {
    allowed: current <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current),
    retryAfter: current > config.maxRequests ? Math.ceil(ttl / 1000) : 0
  };
}
```

### 11.4 Validação de Webhooks

```typescript
// integration-webhook/index.ts

async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  
  const expectedSignature = `sha256=${bytesToHex(new Uint8Array(signatureBuffer))}`;
  return signature === expectedSignature;
}
```

### 11.5 Row Level Security (RLS)

Exemplo de políticas para `object_permissions`:

```sql
-- Admins podem gerenciar todas as permissões
CREATE POLICY "Admins manage all permissions"
ON object_permissions
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin')
);

-- Usuários visualizam suas próprias permissões
CREATE POLICY "Users view own permissions"
ON object_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owners de objetos podem gerenciar permissões do objeto
CREATE POLICY "Object owners manage object permissions"
ON object_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM object_permissions op
    WHERE op.object_type = object_permissions.object_type
    AND op.object_id = object_permissions.object_id
    AND op.user_id = auth.uid()
    AND op.permission_level = 'owner'
  )
);
```

### 11.6 Redação de Dados Sensíveis

```typescript
// proxy-api-request/index.ts

const SENSITIVE_KEYS = [
  'password', 'secret', 'token', 'api_key', 'apiKey',
  'access_token', 'refresh_token', 'private_key', 'credentials'
];

const SENSITIVE_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/g,           // GitHub PAT
  /xox[baprs]-[a-zA-Z0-9-]+/g,      // Slack tokens
  /sk_live_[a-zA-Z0-9]+/g,          // Stripe secret key
  /AKIA[A-Z0-9]{16}/g,              // AWS Access Key
];

function filterSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const filtered = { ...data };
  
  for (const key of Object.keys(filtered)) {
    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof filtered[key] === 'string') {
      let value = filtered[key];
      for (const pattern of SENSITIVE_PATTERNS) {
        value = value.replace(pattern, '[REDACTED]');
      }
      filtered[key] = value;
    } else if (typeof filtered[key] === 'object') {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  }
  
  return filtered;
}
```

---

## 12. Guia de Implementação

### 12.1 Pré-requisitos

- Node.js 18+ ou Bun
- Supabase CLI instalado
- Conta Supabase (Cloud ou Self-hosted)
- Git

### 12.2 Setup Inicial

```bash
# 1. Clonar repositório
git clone <repo-url> apoc
cd apoc

# 2. Instalar dependências
npm install
# ou
bun install

# 3. Copiar variáveis de ambiente
cp .env.example .env

# 4. Configurar .env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 12.3 Configurar Supabase

```bash
# 1. Login no Supabase
npx supabase login

# 2. Linkar projeto existente
npx supabase link --project-ref <project-id>

# 3. Aplicar migrações
npx supabase db push

# 4. Configurar secrets das Edge Functions
npx supabase secrets set TOKEN_ENCRYPTION_KEY=<chave-32-bytes-hex>
npx supabase secrets set WEBHOOK_SIGNING_SECRET=<secret>
npx supabase secrets set UPSTASH_REDIS_URL=<url>
npx supabase secrets set UPSTASH_REDIS_TOKEN=<token>

# 5. Deploy Edge Functions
npx supabase functions deploy
```

### 12.4 Seed Database

1. Acessar `/settings` no app
2. Localizar card "Seed Database"
3. Clicar "Semear Frameworks de Compliance"
4. Aguardar criação de:
   - 3 Frameworks (ISO 27001, LGPD, SOC 2)
   - 62+ Controles associados
   - Mapeamentos de evidência

### 12.5 Conectar Primeira Integração

1. Acessar `/integrations`
2. Clicar "Conectar" no provider desejado
3. Inserir credenciais (token/API key)
4. Aguardar validação + coleta inicial
5. Verificar dados em `/inventory`

### 12.6 Configurar Primeiro Usuário Admin

```sql
-- Primeiro usuário recebe master_admin automaticamente via trigger
-- Para adicionar admin manualmente:
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES ('<user-uuid>', 'admin', '<your-uuid>');
```

### 12.7 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave pública (anon) |
| `TOKEN_ENCRYPTION_KEY` | ✅ | Chave para AES-256 (32 bytes hex) |
| `WEBHOOK_SIGNING_SECRET` | ✅ | Secret para validar webhooks |
| `UPSTASH_REDIS_URL` | ✅ | URL do Redis (rate limiting) |
| `UPSTASH_REDIS_TOKEN` | ✅ | Token do Upstash Redis |
| `GOOGLE_CLIENT_ID` | OAuth | Client ID Google |
| `GOOGLE_CLIENT_SECRET` | OAuth | Client Secret Google |
| `AWS_ACCESS_KEY_ID` | AWS | Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS | Secret Access Key |
| `AUTH0_DOMAIN` | Auth0 | Domínio Auth0 |
| `AUTH0_CLIENT_ID` | Auth0 | Client ID Auth0 |
| `AUTH0_CLIENT_SECRET` | Auth0 | Client Secret Auth0 |

---

## 13. Referência de APIs

### 13.1 Padrão de Resposta

```typescript
// Sucesso
{
  "success": true,
  "data": { ... },
  "message": "Operação concluída"
}

// Erro
{
  "error": "Descrição do erro",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### 13.2 Endpoints Principais

#### POST /functions/v1/save-integration-credentials

Salva credenciais de integração criptografadas e coleta dados iniciais.

**Headers:**
```
Authorization: Bearer <jwt>
Content-Type: application/json
```

**Request Body:**
```json
{
  "integrationId": "github",
  "credentials": {
    "personalAccessToken": "ghp_xxxxxxxxxxxx"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "GitHub connected successfully",
  "resourcesCollected": {
    "user": "johndoe",
    "repos": 15,
    "organizations": 2
  }
}
```

**Response 400:**
```json
{
  "error": "Invalid credentials",
  "details": "GitHub API returned 401 Unauthorized"
}
```

---

#### POST /functions/v1/sync-integration-data

Sincroniza dados de uma integração conectada.

**Request Body:**
```json
{
  "integration_id": "uuid-da-integracao"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "resourcesUpdated": 45,
    "newResources": 3,
    "syncedAt": "2026-01-20T10:30:00Z"
  }
}
```

---

#### POST /functions/v1/check-compliance-drift

Executa verificação de compliance e detecta drifts.

**Request Body:**
```json
{
  "triggered_by": "manual" | "scheduled"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "passingCount": 17,
    "failingCount": 3,
    "driftDetected": true,
    "drifts": [
      {
        "ruleId": "github-public-repo",
        "previousStatus": "pass",
        "newStatus": "fail",
        "affectedResources": 1
      }
    ]
  }
}
```

---

#### POST /functions/v1/create-remediation-ticket

Cria ticket de remediação no Jira ou Linear.

**Request Body:**
```json
{
  "alertId": "uuid-do-alerta",
  "system": "jira" | "linear",
  "title": "Corrigir repositório público",
  "description": "O repositório X está exposto publicamente",
  "priority": "high"
}
```

**Response 200:**
```json
{
  "success": true,
  "ticketId": "APOC-1234",
  "ticketUrl": "https://company.atlassian.net/browse/APOC-1234"
}
```

---

### 13.3 Rate Limits

| Endpoint | Limite | Janela |
|----------|--------|--------|
| save-integration-credentials | 10 req | 1 min |
| sync-integration-data | 10 req | 1 min |
| check-compliance-drift | 5 req | 1 min |
| create-remediation-ticket | 20 req | 1 min |
| Outros | 30 req | 1 min |

Headers de resposta:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705749600
Retry-After: 45
```

---

## 14. Troubleshooting

### 14.1 Problemas Comuns

#### "Token inválido" ao conectar integração

**Causa:** Credenciais incorretas ou permissões insuficientes.

**Solução:**
1. Verificar se o token foi copiado corretamente
2. Confirmar permissões necessárias no provider
3. Verificar se o token não expirou

#### Score de compliance não atualiza

**Causa:** Dados desatualizados ou regras não aplicadas.

**Solução:**
1. Clicar "Sincronizar" na integração
2. Aguardar coleta completar
3. Verificar logs no console

#### Edge Function retorna 500

**Causa:** Erro interno ou secret faltando.

**Solução:**
1. Verificar logs da função: `npx supabase functions logs <nome>`
2. Confirmar secrets configurados: `npx supabase secrets list`
3. Verificar se deno.lock está correto

#### RLS blocking access

**Causa:** Política restritiva ou role incorreta.

**Solução:**
1. Verificar user_roles do usuário
2. Confirmar políticas RLS da tabela
3. Usar `has_role()` corretamente

### 14.2 Logs e Debugging

```bash
# Ver logs de Edge Function
npx supabase functions logs sync-integration-data --tail

# Ver logs do Postgres
# (via Supabase Dashboard > Logs)

# Debug local
npm run dev
# Console do navegador para erros frontend
```

### 14.3 Contatos

- **Documentação:** `/docs/`
- **Issues:** GitHub Issues
- **Suporte:** suporte@apoc.com.br

---

## Apêndices

### A. Glossário

| Termo | Definição |
|-------|-----------|
| **GRC** | Governance, Risk & Compliance |
| **RLS** | Row Level Security (PostgreSQL) |
| **MTTR** | Mean Time To Repair |
| **SLA** | Service Level Agreement |
| **MFA/2FA** | Multi-Factor Authentication |
| **PAT** | Personal Access Token |
| **HIBP** | Have I Been Pwned |

### B. Referências

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [ISO 27001:2022](https://www.iso.org/standard/82875.html)
- [LGPD - Lei 13.709](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

---

**Documento gerado automaticamente pelo sistema APOC**  
**Versão 3.0 - Janeiro 2026**
