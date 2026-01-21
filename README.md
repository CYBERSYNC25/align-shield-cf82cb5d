# 🛡️ APOC - Automated Platform for Online Compliance

<div align="center">

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)

**Plataforma SaaS de Governança, Risco e Compliance (GRC) para automação de conformidade corporativa**

[Demo](https://align-shield.lovable.app) · [Documentação](#documentação) · [Integrações](#integrações-suportadas)

</div>

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Integrações Suportadas](#integrações-suportadas)
- [Motor de Compliance](#motor-de-compliance-automatizado)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Estrutura de Páginas](#estrutura-de-páginas)
- [Edge Functions](#edge-functions-api)
- [Segurança](#segurança)
- [Documentação](#documentação)

---

## 🎯 Visão Geral

O **APOC** é uma plataforma enterprise de GRC (Governance, Risk & Compliance) que automatiza o monitoramento de conformidade para frameworks regulatórios como:

- 🇧🇷 **LGPD** - Lei Geral de Proteção de Dados
- 🔒 **ISO 27001** - Gestão de Segurança da Informação
- 📊 **SOC 2** - Service Organization Control
- 🏥 **HIPAA** - Health Insurance Portability and Accountability
- 💳 **PCI-DSS** - Payment Card Industry Data Security Standard
- 🏛️ **NIST CSF** - Cybersecurity Framework

### Público-Alvo

- **CISOs** e equipes de Segurança da Informação
- **Compliance Officers** e auditores internos
- **Gestores de Risco** corporativo
- **Equipes de TI** responsáveis por conformidade

---

## ✨ Funcionalidades

### 🏠 Dashboard Principal
Centro de ação com visão unificada de:
- **Score de Compliance** em tempo real (0-100%)
- **Testes Falhando** com contagem por severidade (Critical/High/Medium)
- **SLA Countdown** para remediação de issues
- **Métricas de Performance** (MTTR, taxa de resolução)
- **Status de Conexões** das integrações ativas

### 🎛️ Controles & Frameworks
- Gestão completa de múltiplos frameworks simultaneamente
- Mapeamento de controles por categoria
- Upload de evidências manuais
- Gap Assessment automático
- Histórico de verificações

### 🔌 Hub de Integrações
- **14 integrações funcionais** com coleta automática
- Interface marketplace com busca e filtros
- Conexão self-service via credenciais API
- Logs de sincronização em tempo real
- Webhooks para eventos automáticos

### ⚠️ Gestão de Riscos
- Registro centralizado de riscos
- Matriz de risco 5x5 interativa
- Workflow de aceitação de risco com aprovações
- Gestão de fornecedores (vendor management)
- Avaliações de risco periódicas

### 📋 Auditoria
- **Portal do Auditor** read-only para auditores externos
- Locker de evidências centralizado
- Checklists por framework
- Geração automática de relatórios de auditoria
- Histórico de verificações com timeline

### 📜 Políticas & Treinamentos
- Biblioteca de políticas com versionamento
- Workflow de aprovação multi-nível
- Rastreamento de atestações de funcionários
- Programas de treinamento com tracking

### 🚨 Gestão de Incidentes
- Registro e categorização de incidentes
- Playbooks de resposta automatizados
- Planos de Continuidade de Negócio (BCP)
- Integração com SLA de resolução

### 📊 Analytics Avançados
- **Evolução do Score** (gráfico de 90 dias)
- **MTTR por Severidade** (tempo médio de remediação)
- **Top Regras Falhando** com tendências
- **Heatmap de Compliance** (Dia x Hora)
- **Comparação de Períodos** (mês atual vs anterior)
- Exportação para PNG

### 🗃️ Inventário de Ativos
- Visão centralizada de todos os recursos coletados
- Categorização: Identidades, Infraestrutura, Segurança, Produtividade
- Busca global e filtros por categoria
- Exportação CSV para evidências de auditoria
- Status de compliance individual por ativo

### 📝 Questionários de Segurança
- Suporte a CAIQ, VSA, SIG e outros formatos
- **Automação de respostas com IA** (Claude 3.5 Sonnet)
- Biblioteca de respostas aprovadas
- Mapeamento automático para controles
- Score de confiança por resposta

### 🌐 Trust Center
- Página pública de transparência
- Customização de branding (cores, logo)
- Exibição de score e frameworks
- Domínio customizado opcional

---

## 🔗 Integrações Suportadas

### ☁️ Cloud & Infraestrutura

| Integração | Recursos Coletados | Controles Automatizados |
|------------|-------------------|------------------------|
| **AWS** | Usuários IAM, Buckets S3, Logs CloudTrail | MFA, buckets públicos, políticas |
| **Cloudflare** | Zonas DNS, Regras WAF, Configurações | HTTPS forçado, WAF ativo |
| **Datadog** | Monitors, Logs, Security Signals | Alertas de segurança |

### 🔐 Identidade & Acesso (IAM)

| Integração | Recursos Coletados | Controles Automatizados |
|------------|-------------------|------------------------|
| **Microsoft Entra ID** | Usuários, Grupos, Apps, Logs | MFA, contas ativas, privilégios |
| **Google Workspace** | Usuários, Grupos, Apps OAuth | MFA, 2SV, administradores |
| **Auth0** | Usuários, Conexões, Logs | MFA habilitado, configurações |
| **Okta** | Usuários, Grupos, Apps, Fatores | MFA, status de contas |

### 💻 Controle de Código (SDLC)

| Integração | Recursos Coletados | Controles Automatizados |
|------------|-------------------|------------------------|
| **GitHub** | Repositórios, Membros, Branches | Repos públicos, branch protection |
| **GitLab** | Projetos, Membros, Pipelines | Visibilidade, proteções |

### 📱 Produtividade & RH

| Integração | Recursos Coletados | Controles Automatizados |
|------------|-------------------|------------------------|
| **Jira** | Projetos, Issues, Usuários | Gestão de projetos |
| **Slack** | Canais, Usuários, Apps | MFA de admins, apps aprovados |
| **BambooHR** | Funcionários, Departamentos | Dados de RH para compliance |

### 🛡️ Segurança de Endpoint

| Integração | Recursos Coletados | Controles Automatizados |
|------------|-------------------|------------------------|
| **CrowdStrike Falcon** | Dispositivos, Detecções, Políticas | Devices protegidos |
| **Microsoft Intune** | Dispositivos, Compliance Policies | Conformidade de dispositivos |

---

## ⚙️ Motor de Compliance Automatizado

O APOC executa **14+ regras de segurança automatizadas** que avaliam os recursos coletados:

### Regras Críticas (Critical)

| ID da Regra | Descrição | Condição de Falha |
|-------------|-----------|-------------------|
| `github-public-repo` | Repositórios privados expostos | `visibility = "public"` |
| `slack-admin-no-mfa` | Admins do Slack sem MFA | `is_admin = true AND has_2fa = false` |
| `intune-noncompliant-device` | Dispositivos não-conformes | `complianceState != "compliant"` |
| `cloudflare-no-https` | Zonas sem HTTPS forçado | `always_use_https = false` |
| `aws-public-bucket` | Buckets S3 públicos | `is_public = true` |
| `crowdstrike-unprotected` | Dispositivos sem proteção | `status != "normal"` |

### Regras de Alta Severidade (High)

| ID da Regra | Descrição | Condição de Falha |
|-------------|-----------|-------------------|
| `azure-no-mfa` | Usuários Azure sem MFA | `mfaEnabled = false` |
| `google-no-2sv` | Usuários Google sem 2SV | `isEnrolledIn2Sv = false` |
| `okta-no-mfa` | Usuários Okta sem MFA | `mfaFactors.length = 0` |
| `auth0-no-mfa` | Usuários Auth0 sem MFA | `multifactor.length = 0` |

### Regras de Média Severidade (Medium)

| ID da Regra | Descrição | Condição de Falha |
|-------------|-----------|-------------------|
| `azure-inactive-user` | Usuários inativos há 90+ dias | `lastSignInDateTime > 90 days` |
| `cloudflare-no-waf` | Zonas sem WAF ativo | `waf_enabled = false` |
| `github-no-branch-protection` | Repos sem branch protection | `protected = false` |

### Cálculo do Score de Compliance

```
Score = (Testes Passando + Riscos Aceitos) / Total de Testes × 100
```

### SLA por Severidade

| Severidade | Tempo para Remediar |
|------------|---------------------|
| Critical | 24 horas |
| High | 72 horas |
| Medium | 168 horas (7 dias) |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui    │
│  React Query + React Router + React Hook Form + Zod         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │    Auth     │  │   Edge Functions    │  │
│  │  (40+ RLS)  │  │  (Supabase) │  │  (30+ Endpoints)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Storage   │  │  Realtime   │  │   Secrets Vault     │  │
│  │ (Evidências)│  │ (Subscrip.) │  │ (AES-256-GCM)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  INTEGRAÇÕES EXTERNAS                        │
│  AWS · Azure · Google · GitHub · Slack · Jira · Okta · ...  │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 18, TypeScript 5, Vite, Tailwind CSS, Shadcn/ui |
| **Estado** | TanStack Query (React Query), React Context |
| **Formulários** | React Hook Form + Zod |
| **Gráficos** | Recharts |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Segurança** | AES-256-GCM, HMAC-SHA256, RLS, Rate Limiting |

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Supabase (projeto configurado)
- Git

### Passos

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd apoc

# 2. Instalar dependências
npm install
# ou
bun install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Editar .env com suas credenciais Supabase
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-anon-key

# 5. Iniciar servidor de desenvolvimento
npm run dev
# ou
bun dev
```

### Build para Produção

```bash
npm run build
# ou
bun run build
```

---

## 📖 Como Usar

### 1️⃣ Primeiro Acesso

1. Acesse a aplicação e crie uma conta
2. Vá em **Configurações** e clique em **"Seed Frameworks"** para popular os frameworks padrão
3. O sistema criará automaticamente ISO 27001, LGPD, SOC 2, HIPAA, PCI-DSS e NIST CSF

### 2️⃣ Conectar Integrações

1. Acesse o **Hub de Integrações** (`/integrations`)
2. Clique em uma integração (ex: GitHub)
3. Insira suas credenciais API (Access Token)
4. Clique em **"Conectar"**
5. Aguarde a sincronização automática de recursos

### 3️⃣ Visualizar Compliance

1. Retorne ao **Dashboard** (`/`)
2. Visualize o **Score de Compliance** atualizado
3. Veja os **Testes Falhando** no Action Center
4. Cada issue mostra:
   - Severidade (Critical/High/Medium)
   - Recursos afetados
   - Tempo restante (SLA)
   - Guia de remediação

### 4️⃣ Remediar Issues

Para cada issue no Action Center:

1. Clique para abrir o **Issue Details Sheet**
2. Leia o **Guia de Remediação** com passos educativos
3. Corrija o problema no sistema de origem (ex: habilitar MFA no GitHub)
4. Clique em **"Sincronizar"** para verificar a correção
5. Alternativamente:
   - **Aceitar Risco**: Criar exceção temporária com justificativa
   - **Criar Ticket**: Gerar ticket no Jira/Linear para acompanhamento

### 5️⃣ Gerar Relatórios

1. Acesse **Relatórios** (`/reports`)
2. Escolha um relatório pré-configurado ou crie um customizado
3. Selecione o período e filtros desejados
4. Exporte em PDF, Excel ou CSV

### 6️⃣ Configurar Portal do Auditor

1. Acesse **Configurações** > **Auditor Access**
2. Crie um link de acesso com prazo de validade
3. Defina as permissões (evidências, score, frameworks)
4. Compartilhe o link com o auditor externo

### 7️⃣ Configurar Trust Center

1. Acesse **Configurações** > **Trust Center**
2. Configure seu slug (ex: `sua-empresa`)
3. Personalize cores e logo
4. Selecione quais informações exibir publicamente
5. A página estará disponível em `/trust/sua-empresa`

---

## 🗺️ Estrutura de Páginas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Dashboard | Centro de ação principal com score e issues |
| `/welcome` | Welcome | Landing page pública |
| `/auth` | Autenticação | Login e registro |
| `/controls` | Controles & Frameworks | Gestão de controles e frameworks |
| `/integrations` | Hub de Integrações | Conectar e gerenciar integrações |
| `/risks` | Gestão de Riscos | Registro e matriz de riscos |
| `/audit` | Auditoria | Evidências, checklists, relatórios |
| `/policies` | Políticas & Treinamentos | Biblioteca de políticas |
| `/incidents` | Incidentes | Gestão de incidentes e playbooks |
| `/access-reviews` | Revisão de Acessos | Campanhas de revisão de acessos |
| `/reports` | Relatórios | Geração e exportação de relatórios |
| `/analytics` | Analytics | Dashboards analíticos |
| `/advanced-analytics` | Analytics Avançados | Métricas detalhadas e histórico |
| `/inventory` | Inventário de Ativos | Visão de recursos coletados |
| `/questionnaires` | Questionários | Automação de questionários com IA |
| `/notifications` | Notificações | Central de notificações |
| `/tasks` | Tarefas | Gestão de tarefas |
| `/settings` | Configurações | Usuários, roles, Trust Center |
| `/auditor-portal` | Portal do Auditor | Acesso externo read-only |
| `/auditor-portal/:auditId` | Auditoria Específica | Detalhes de uma auditoria |
| `/trust/:slug` | Trust Center | Página pública de compliance |

---

## 🔧 Edge Functions (API)

### Autenticação OAuth

| Função | Descrição |
|--------|-----------|
| `google-oauth-start` | Inicia fluxo OAuth do Google Workspace |
| `google-oauth-callback` | Processa callback do Google |
| `google-oauth-refresh` | Renova tokens do Google |
| `google-oauth-revoke` | Revoga acesso ao Google |
| `azure-oauth-start` | Inicia fluxo OAuth do Azure AD |
| `azure-oauth-callback` | Processa callback do Azure |
| `azure-oauth-revoke` | Revoga acesso ao Azure |

### Integrações

| Função | Descrição |
|--------|-----------|
| `save-integration-credentials` | Salva credenciais criptografadas |
| `sync-integration-data` | Sincroniza recursos de uma integração |
| `aws-integration` | Coleta recursos AWS |
| `azure-integration` | Coleta recursos Azure AD |
| `auth0-integration` | Coleta recursos Auth0 |
| `okta-integration` | Coleta recursos Okta |
| `datadog-integration` | Coleta recursos Datadog |

### Compliance

| Função | Descrição |
|--------|-----------|
| `check-compliance-drift` | Executa regras de compliance |
| `create-remediation-ticket` | Cria ticket de remediação |
| `ingest-metrics` | Ingere métricas de dispositivos |

### Webhooks

| Função | Descrição |
|--------|-----------|
| `integration-webhook` | Recebe webhooks de integrações |
| `integration-webhook-handler` | Processa eventos de webhook |

### Outros

| Função | Descrição |
|--------|-----------|
| `generate-questionnaire-answers` | Gera respostas com IA |
| `send-notification-email` | Envia emails de notificação |
| `invite-user` | Convida novos usuários |
| `seed-compliance-data` | Popula dados iniciais |
| `health-check` | Verifica saúde do sistema |

---

## 🔐 Segurança

### Criptografia de Credenciais

- **Algoritmo**: AES-256-GCM
- **Chave**: Armazenada em Supabase Secrets (`TOKEN_ENCRYPTION_KEY`)
- **IV**: Gerado aleatoriamente por credencial (12 bytes)
- **Auth Tag**: Validação de integridade (16 bytes)

### Row Level Security (RLS)

Todas as 40+ tabelas possuem políticas RLS que garantem:
- Usuários só acessam seus próprios dados
- Admins têm acesso expandido
- Auditores têm acesso read-only limitado

### Rate Limiting

- **Redis**: Upstash Redis para controle de rate limit
- **Limites**: 100 req/min para APIs críticas
- **Webhooks**: Validação HMAC-SHA256

### Validação de Webhooks

```typescript
const isValid = await validateWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

### Boas Práticas Implementadas

- ✅ Senhas verificadas contra vazamentos (HIBP API)
- ✅ Tokens de auditoria com hash SHA-256
- ✅ Logs de auditoria para ações críticas
- ✅ Expiração automática de tokens de acesso
- ✅ Sanitização de dados sensíveis em logs

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| `docs/APOC_COMPLETE_TECHNICAL_DOCUMENTATION.md` | Documentação técnica completa |
| `docs/APOC_TECHNICAL_DOCUMENTATION.md` | Visão geral técnica |
| `docs/INTEGRATIONS_ARCHITECTURE.md` | Arquitetura de integrações |
| `docs/AUTH_FLOW_DOCUMENTATION.md` | Fluxos de autenticação |
| `docs/OAUTH_COMPLETE_GUIDE.md` | Guia completo de OAuth |
| `docs/WEBHOOK_DOCUMENTATION.md` | Documentação de webhooks |
| `docs/RISK_MANAGEMENT_DOCUMENTATION.md` | Gestão de riscos |
| `docs/POLICIES_TRAINING_DOCUMENTATION.md` | Políticas e treinamentos |
| `docs/DASHBOARD_DOCUMENTATION.md` | Documentação do dashboard |
| `docs/DESIGN_SYSTEM_TOKENS.md` | Tokens do design system |

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

<div align="center">

**Desenvolvido com ❤️ para automação de compliance**

[⬆ Voltar ao topo](#-apoc---automated-platform-for-online-compliance)

</div>
