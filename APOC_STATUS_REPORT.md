# APOC - Relatório de Status Técnico Consolidado

> **Data:** 23 de Dezembro de 2024  
> **Versão:** 1.0.0  
> **Classificação:** Interno - Time de Desenvolvimento  
> **Elaborado por:** CTO / Tech Lead

---

## Resumo Executivo

O projeto **APOC** evoluiu de uma proposta inicial de "Otimização de Processos" para uma **Plataforma de GRC (Governance, Risk & Compliance) Enterprise**. Este documento reflete a verdade absoluta sobre o estado atual do código e serve como referência oficial para o time.

### Principais Conquistas
- ✅ Pivô de produto concluído (GRC Enterprise)
- ✅ 4 integrações funcionais com backend real
- ✅ Banco de dados populado com ISO 27001, LGPD e SOC 2
- ✅ Self-signup removido (acesso apenas por convite)
- ✅ Arquitetura responsiva padronizada

---

## 1. Pivô de Produto - Landing Page

### Confirmação: Plataforma GRC

| Aspecto | Valor Atual |
|---------|-------------|
| **Tagline Principal** | "GRC enterprise para empresas que levam compliance a sério" |
| **Subtítulo** | "Automatize frameworks como LGPD, ISO 27001 e SOC 2 com integração direta à sua infraestrutura" |
| **Posicionamento** | GRC + Automação + Compliance Enterprise |

### Estrutura da Home (`/welcome`)

```
┌─────────────────────────────────────────────────────────────┐
│                        HERO SECTION                         │
│   Logo APOC + Tagline + Subtítulo + CTA "Criar conta"      │
├─────────────────────────────────────────────────────────────┤
│                      FEATURES GRID                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 🌐 Integração│  │ 🛡️ Gestão   │  │ ✅ Pronto   │        │
│  │    Real     │  │ Completa GRC│  │ p/ Auditar  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                        FOOTER                               │
│        © 2024 APOC | LGPD | ISO 27001 | SOC 2             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Matriz de Integrações - A Verdade Técnica

### Legenda de Status
- ✅ **[FUNCIONAL]** - Edge Functions + Secrets + Dados Reais
- ⚠️ **[PARCIAL]** - Backend existe mas incompleto ou não testado
- 🔴 **[MOCKUP/UI ONLY]** - Apenas card visual no frontend

### Tabela Completa

| # | Integração | Categoria | Status | Edge Functions | Secrets Configurados |
|---|------------|-----------|--------|----------------|---------------------|
| 1 | **Amazon Web Services** | Cloud | ✅ FUNCIONAL | `aws-integration`, `aws-sync-resources`, `aws-test-connection` | Requer config manual |
| 2 | **Google Workspace** | IAM | ✅ FUNCIONAL | `google-oauth-start`, `google-oauth-callback`, `google-oauth-refresh`, `google-oauth-revoke`, `google-oauth-validate`, `google-workspace-sync` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| 3 | **Microsoft Entra ID** | IAM | ✅ FUNCIONAL | `azure-oauth-start`, `azure-oauth-callback`, `azure-oauth-revoke`, `azure-integration`, `azure-test-connection` | Requer config manual |
| 4 | **AgentAPOC** | Cloud | ⚠️ PARCIAL | Hooks existem | - |
| 5 | **Okta** | IAM | ⚠️ PARCIAL | `okta-integration` (não testado) | - |
| 6 | **Cloudflare** | Cloud | 🔴 UI ONLY | ❌ | - |
| 7 | **GitHub** | SDLC | 🔴 UI ONLY | ❌ | - |
| 8 | **GitLab** | SDLC | 🔴 UI ONLY | ❌ | - |
| 9 | **Jira** | Productivity | 🔴 UI ONLY | ❌ | - |
| 10 | **Slack** | Productivity | 🔴 UI ONLY | ❌ | - |
| 11 | **BambooHR** | Productivity | 🔴 UI ONLY | ❌ | - |
| 12 | **CrowdStrike Falcon** | Endpoint | 🔴 UI ONLY | ❌ | - |
| 13 | **Microsoft Intune** | Endpoint | 🔴 UI ONLY | ❌ | - |

### Definição Técnica por Status

#### ✅ FUNCIONAL (4 integrações)
Possuem fluxo OAuth completo ou API Key, Edge Functions implantadas, e capacidade de trazer dados reais para a plataforma.

#### ⚠️ PARCIAL (2 integrações)
Código backend existe mas precisa de validação/testes ou configuração de secrets.

#### 🔴 MOCKUP/UI ONLY (7 integrações)
**IMPORTANTE**: Estas integrações existem APENAS como cards visuais no catálogo (`src/lib/integrations-catalog.ts`). Não possuem nenhum backend conectado. O botão "Conectar" não executa nenhuma ação funcional.

---

## 3. UX & Layout - Estratégia de Refatoração

### Componente PageContainer (Padrão Global)
```typescript
// Aplicado em todas as páginas protegidas
<main className="ml-72 pt-16 min-h-screen bg-background">
  <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8">
    {children}
  </div>
</main>
```

### Sistema de Grid
| Breakpoint | Colunas | Uso |
|------------|---------|-----|
| `lg:grid-cols-12` | 12 | Layout principal |
| `col-span-8` + `col-span-4` | 8+4 | Conteúdo + Sidebar |
| `col-span-6` + `col-span-6` | 6+6 | Dois painéis iguais |
| `col-span-full` | 12 | Largura total |

### Cards Padronizados
- Todos os cards usam `Card`, `CardHeader`, `CardContent` do shadcn
- Heights equalizadas com `h-full` ou `flex flex-col`
- Espaçamento interno: `p-6`
- Gap entre cards: `gap-6`

### Sidebar
- Largura fixa: `w-72` (288px)
- Posição: `fixed left-0 top-16`
- Navegação com ícones + labels

---

## 4. Dados e Segurança

### Banco de Dados

**Total de Tabelas Públicas:** 27

```
access_anomalies    control_tests           incidents               risks
audit_logs          controls                integration_*           tasks
audits              device_logs             integrations            user_deletion_requests
bcp_plans           evidence                notifications           user_invites
control_assignments frameworks              policies                user_roles
                                            profiles                vendors
                                            risk_assessments
```

### Frameworks Populados (Seed Realizado)

| Framework | Controles | Status |
|-----------|-----------|--------|
| ISO 27001:2022 | ~50 | ✅ Populado |
| LGPD | ~30 | ✅ Populado |
| SOC 2 Type II | ~30 | ✅ Populado |

**Total de Controles no Banco:** 62 registros

### Configuração de Autenticação

| Funcionalidade | Status |
|----------------|--------|
| Self-signup público | ❌ **REMOVIDO** |
| Login com email/senha | ✅ Ativo |
| Tab de cadastro na UI | ❌ Removida |
| Mensagem de acesso restrito | ✅ Implementada |
| CAPTCHA (Cloudflare Turnstile) | ✅ Ativo |
| Validação de senha (Zod) | ✅ Ativo |
| Have I Been Pwned API | ✅ Ativo |
| Convite por administrador | ✅ Funcional |

### Secrets Configurados no Supabase

| Secret | Status | Uso |
|--------|--------|-----|
| `SUPABASE_URL` | ✅ | Core |
| `SUPABASE_ANON_KEY` | ✅ | Core |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Edge Functions |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth Google |
| `TOKEN_ENCRYPTION_KEY` | ✅ | Criptografia de tokens |
| `WEBHOOK_SIGNING_SECRET` | ✅ | Validação de webhooks |
| `AWS_ACCESS_KEY_ID` | ⚠️ | Precisa configurar valor |
| `AWS_SECRET_ACCESS_KEY` | ⚠️ | Precisa configurar valor |
| `AWS_REGION` | ⚠️ | Precisa configurar valor |

---

## 5. Próximos Passos Recomendados

### Priorização de Integrações (por complexidade e valor)

| Prioridade | Integração | Dificuldade | Justificativa |
|------------|------------|-------------|---------------|
| 🥇 **1** | GitHub | 🟢 Baixa | OAuth padrão, REST API excelente, alto valor para SDLC |
| 🥈 **2** | Slack | 🟢 Baixa | Webhook + OAuth, notificações em tempo real |
| 🥉 **3** | Jira | 🟡 Média | OAuth 2.0 Atlassian, tracking de vulnerabilidades |
| **4** | GitLab | 🟡 Média | Similar ao GitHub, cobertura de mercado |
| **5** | Cloudflare | 🟡 Média | API Key simples, WAF e DNS audit |
| **6** | Okta | 🟡 Média | Edge function já existe, precisa validação |
| **7** | BambooHR | 🟡 Média | API REST, onboarding/offboarding |
| **8** | Intune | 🔴 Alta | Microsoft Graph API complexa |
| **9** | CrowdStrike | 🔴 Alta | API Enterprise, documentação restrita |

### Ações Técnicas Imediatas

1. **Validar Okta** - Edge function existe, precisa teste e documentação
2. **Configurar AWS** - Adicionar valores reais aos secrets no Supabase Dashboard
3. **Implementar GitHub** - Seguir padrão OAuth do Google Workspace
4. **Criar Slack Webhook** - Notificações de incidentes e alertas

### Roadmap Sugerido Q1 2025

```
Janeiro:
├── Semana 1-2: GitHub OAuth + Sync de repos
├── Semana 3-4: Slack Webhook + Notificações

Fevereiro:
├── Semana 1-2: Jira Integration
├── Semana 3-4: GitLab (clone do GitHub)

Março:
├── Semana 1-2: Cloudflare API
├── Semana 3-4: Validação Okta + BambooHR
```

---

## Apêndice A: Edge Functions Disponíveis

```
supabase/functions/
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
├── invite-user/
├── okta-integration/
├── proxy-api-request/
├── seed-compliance-data/
├── send-notification-email/
└── _shared/
    └── crypto-utils.ts
```

---

## Apêndice B: Arquivos-Chave do Frontend

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/integrations-catalog.ts` | Catálogo de todas as integrações |
| `src/pages/IntegrationsHub.tsx` | Página principal de integrações |
| `src/pages/Welcome.tsx` | Landing page pública |
| `src/pages/Auth.tsx` | Autenticação (login only) |
| `src/components/layout/PageContainer.tsx` | Container padrão |
| `src/hooks/useIntegrations.tsx` | Estado das integrações |

---

**Fim do Relatório**

*Este documento deve ser atualizado sempre que houver mudanças significativas na arquitetura ou integrações do projeto.*
