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
- [Proteção SSRF](#proteção-ssrf)
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

### 🛡️ Proteção de Dados (LGPD/GDPR)
- **Classificação de dados** por nível (public/internal/confidential/restricted)
- **Mascaramento automático de PII** em logs (email, CPF, telefone, IP)
- **Auditoria de acesso** a dados pessoais (append-only, imutável)
- **Retenção automática** com exclusão e anonimização programadas
- **Exportação de dados pessoais** (portabilidade em JSON)
- **Exclusão de conta** com opção imediata ou agendada (30 dias)

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
| **Segurança** | AES-256-GCM, HMAC-SHA256, RLS, Rate Limiting, PII Sanitization |
| **Privacidade** | LGPD/GDPR compliant, Data Classification, Audit Trail |

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
| `cleanup-pii-data` | Cron job de limpeza de dados (LGPD) |
| `export-user-data` | Exporta dados pessoais do usuário |
| `delete-user-account` | Exclui conta (soft/hard delete) |
| `public-api` | API pública com rate limiting |
| `process-job-queue` | Processa fila de jobs assíncronos |

---

## 📨 Job Queue (Processamento Assíncrono)

O APOC utiliza uma fila de jobs para processamento assíncrono de tarefas pesadas como sincronização de integrações, verificações de compliance e geração de relatórios.

### Arquitetura

| Componente | Descrição |
|------------|-----------|
| `job_queue` | Tabela PostgreSQL com jobs, status e metadados |
| `process-job-queue` | Edge Function que processa a fila em lotes |
| `useJobQueue` | Hook React para criar e monitorar jobs |
| `/jobs` | Página de gestão para administradores |

### Tipos de Jobs

| Tipo | Descrição | Prioridade Padrão |
|------|-----------|-------------------|
| `sync_integration` | Sincroniza recursos de integrações externas | Alta (2) |
| `run_compliance_check` | Executa verificação de compliance em recursos | Normal (3) |
| `generate_report` | Gera relatórios de compliance em PDF/Excel | Normal (3) |
| `send_notification` | Envia notificações por email ou Slack | Baixa (4) |
| `cleanup_data` | Limpeza de dados antigos e expirados | Mínima (5) |

### Status de Jobs

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando processamento |
| `processing` | Sendo executado no momento |
| `completed` | Finalizado com sucesso |
| `failed` | Falhou após todas as tentativas |
| `cancelled` | Cancelado manualmente |

### Retry com Exponential Backoff

- **Max Attempts**: 3 tentativas por job
- **Backoff**: 1 min → 5 min → 15 min entre tentativas
- **Stuck Jobs**: Jobs "travados" (processing > 15min) são resetados automaticamente

### Prioridades

| Nível | Nome | Processamento |
|-------|------|---------------|
| 1 | Urgente | Primeiro da fila |
| 2 | Alta | Prioridade elevada |
| 3 | Normal | Padrão |
| 4 | Baixa | Quando não há urgentes |
| 5 | Mínima | Últimos a processar |

### Uso no Código

```typescript
import { useCreateJob, useJobStatus } from '@/hooks/useJobQueue';

// Criar um job
const { mutate: createJob, data: jobId } = useCreateJob();

createJob({
  jobType: 'sync_integration',
  payload: { provider: 'aws', integrationId: 'abc123' },
  priority: 2, // Alta
  metadata: { triggeredBy: 'user_action' }
});

// Monitorar status (polling automático enquanto pending/processing)
const { data: job } = useJobStatus(jobId);
// job.status: 'pending' | 'processing' | 'completed' | 'failed'
```

### Funções SQL Auxiliares

| Função | Descrição |
|--------|-----------|
| `enqueue_job()` | Adiciona job à fila com validações |
| `claim_pending_jobs()` | Busca e marca jobs para processamento (FOR UPDATE SKIP LOCKED) |
| `complete_job()` | Marca job como concluído com resultado |
| `fail_job()` | Marca job como falho, agenda retry se possível |
| `reset_stuck_jobs()` | Reseta jobs travados há mais de 15min |
| `calculate_next_retry()` | Calcula próximo horário de retry com backoff |

### Página de Gestão (/jobs)

Acessível apenas para `admin` e `master_admin`:

- **Cards de Métricas**: Pendentes, Processando, Concluídos (24h), Falhos (24h), Taxa/hora
- **Gráfico**: Jobs processados por hora (últimas 24h)
- **Tabela**: Lista de jobs com filtros (status, tipo, período)
- **Ações**: Ver detalhes, Retry (failed), Cancelar (pending)

---

## 📁 Segurança de Uploads

O sistema implementa múltiplas camadas de validação para uploads de arquivos:

### Tipos Permitidos

| Tipo | Extensão | Magic Bytes (Hex) |
|------|----------|-------------------|
| PDF | .pdf | 25 50 44 46 (%PDF) |
| PNG | .png | 89 50 4E 47 0D 0A 1A 0A |
| JPEG | .jpg, .jpeg | FF D8 FF |
| DOCX | .docx | 50 4B 03 04 (ZIP) |
| XLSX | .xlsx | 50 4B 03 04 (ZIP) |
| CSV | .csv | Texto válido (sem binários) |

### Tipos Bloqueados

Executáveis e scripts são **sempre rejeitados**, independentemente da extensão declarada:

```
.exe, .sh, .bat, .cmd, .ps1, .vbs, .js, .html, .htm, .php, 
.asp, .aspx, .jsp, .msi, .dll, .com, .scr, .pif, .jar, .py, .rb, .pl
```

Magic bytes bloqueados: `MZ` (Windows EXE), `#!` (shebang), `<?php`, `<script>`, ELF, Mach-O, Java class.

### Limites de Quota

| Limite | Valor | Escopo |
|--------|-------|--------|
| Tamanho por arquivo | 25MB | Por upload individual |
| Uploads diários | 100MB | Por usuário |
| Armazenamento total | 1GB | Por organização |

### Sanitização

1. **Renomeação UUID**: Arquivos são renomeados para UUID (nome original preservado em metadata)
2. **EXIF Stripping**: Metadados EXIF removidos automaticamente de imagens JPEG
3. **Hash SHA-256**: Calculado para cada arquivo (detecção de duplicatas)

### Armazenamento Seguro

- **Buckets privados**: `evidence` e `documents` não são públicos
- **URLs assinadas**: Expiram em 1 hora, renovadas automaticamente via `useSignedUrl`
- **RLS**: Usuários só acessam seus próprios arquivos via pasta `user_id/`

### Validação em Camadas

| Camada | Local | Validações |
|--------|-------|------------|
| 1. Cliente | Browser | Magic bytes, extensão, tamanho (25MB) |
| 2. Edge Function | Servidor | Re-validação magic bytes, quota user/org, EXIF strip, hash |
| 3. Storage | Supabase | RLS policies, bucket policies |

### Componentes

| Componente | Descrição |
|------------|-----------|
| `SecureFileUpload` | Componente React com validação client-side e progress |
| `useSignedUrl` | Hook para URLs assinadas com auto-refresh |
| `secure-upload` | Edge Function com validação server-side |
| `file_uploads` | Tabela de tracking com hash e quotas |

### Uso no Código

```typescript
import SecureFileUpload from '@/components/common/SecureFileUpload';

// Upload seguro com callbacks
<SecureFileUpload
  bucket="evidence"
  folder="audit-evidence"
  multiple={true}
  maxFiles={5}
  onUploadComplete={(files) => console.log('Uploaded:', files)}
  onError={(error) => console.error('Error:', error)}
/>

// URL assinada com auto-refresh
import { useSignedUrl } from '@/hooks/useSignedUrl';

const { signedUrl, loading, timeRemaining } = useSignedUrl(
  'documents', 
  'user-id/folder/file.pdf'
);
```

---

## 🔐 Gerenciamento de Sessões

O sistema implementa controle avançado de sessões para máxima segurança:

### Limites

| Limite | Valor | Ação |
|--------|-------|------|
| Sessões simultâneas | 5 por usuário | Revoga a mais antiga automaticamente |
| Timeout por inatividade | 30 minutos | Logout automático |
| Warning antes do timeout | 5 minutos | Modal de confirmação |
| Validade da sessão | 30 dias | Requer re-autenticação |
| Update de atividade | 60 segundos | Throttled para performance |

### Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Tracking de Dispositivos** | Registra browser, OS e tipo (desktop/mobile/tablet) |
| **Geolocalização** | Detecta cidade/país via IP (ip-api.com) |
| **Warning de Inatividade** | Modal aos 25min com countdown visual |
| **Auto-logout** | Encerra sessão após 30min sem atividade |
| **Notificações de Segurança** | Alert in-app para novo dispositivo |
| **Alertas de Localização** | Aviso quando login de país diferente |

### Arquitetura

```text
┌────────────────────────────────────────────────────────────┐
│                 Session Management Flow                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Login → session-manager/create                            │
│           │                                                 │
│           ├── Parse User-Agent (browser, OS, device type)  │
│           ├── Get IP → Geolocation (city, country)         │
│           ├── Check session limit (max 5)                  │
│           ├── Create user_sessions record                  │
│           └── Send notifications (new device/country)      │
│                                                             │
│  Ativo → useSessionActivity (hook)                         │
│           │                                                 │
│           ├── Detect: mousemove, keydown, scroll, click    │
│           ├── Update last_active_at (every 60s)           │
│           ├── Warning modal at 25min                       │
│           └── Auto-logout at 30min                         │
│                                                             │
│  Gestão → /settings/security → "Sessões Ativas"           │
│           │                                                 │
│           ├── List all active sessions                     │
│           ├── Revoke individual session                    │
│           └── Revoke all other sessions                    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Componentes

| Componente | Descrição |
|------------|-----------|
| `user_sessions` | Tabela PostgreSQL com tracking completo |
| `session-manager` | Edge Function para CRUD de sessões |
| `useSessionActivity` | Hook de monitoramento de atividade |
| `useUserSessions` | Hook para listar/revogar sessões |
| `SessionTimeoutModal` | Modal de warning com countdown |
| `ManageSessionsModal` | UI de gestão em Settings |

### Segurança

| Ameaça | Mitigação |
|--------|-----------|
| Session hijacking | Token hash para invalidação |
| Brute force | Limite de 5 sessões simultâneas |
| Session fixation | Nova sessão a cada login |
| Inatividade | Timeout de 30min com warning |
| Roubo de conta | Alert para novo dispositivo |
| Acesso não autorizado | Alert para país diferente |

### Uso

```typescript
// Listar sessões ativas
import { useUserSessions } from '@/hooks/useUserSessions';
const { data: sessions, isLoading } = useUserSessions();

// Revogar sessão
import { useRevokeSession } from '@/hooks/useUserSessions';
const { mutate: revoke } = useRevokeSession();
revoke({ sessionId: 'uuid', reason: 'manual' });

// Monitorar atividade (automático no ProtectedRoute)
import { useSessionActivity } from '@/hooks/useSessionActivity';
const { showWarningModal, timeRemaining, continueSession } = useSessionActivity();
```

---

## 🛡️ Proteção SSRF

O sistema implementa proteção completa contra Server-Side Request Forgery (SSRF):

### URLs Bloqueadas

| Tipo | Exemplos |
|------|----------|
| IPs privados | 10.x.x.x, 172.16-31.x.x, 192.168.x.x |
| Localhost | 127.x.x.x, localhost, 0.0.0.0 |
| IPv6 local | ::1, fe80::, fc00::, fd00:: |
| Link-local | 169.254.x.x (APIPA) |
| Cloud metadata | 169.254.169.254, metadata.google |
| Kubernetes | kubernetes.default.svc |

### Restrições de Request

| Configuração | Valor |
|--------------|-------|
| Protocolo | Apenas HTTPS |
| Timeout | 10 segundos |
| Redirects | Não seguidos |
| SSL | Verificado |

### Aplicação

A proteção SSRF é aplicada em:
- Configuração de webhooks outbound
- Teste de webhooks (frontend e backend)
- URLs de callback OAuth
- Proxy de API requests
- Confirmação de subscrições SNS

### Logging

Todas as tentativas de webhook são logadas em `system_logs`:
- URL alvo (sanitizada)
- Status de bloqueio
- Motivo (se bloqueado)
- Tempo de resposta
- Código HTTP

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

### Proteção contra Abuso de API

Rate limiting por tier com Upstash Redis:

| Tipo de Acesso | Limite | Janela |
|----------------|--------|--------|
| Não autenticado (por IP) | 100 | 1 hora |
| Autenticado (por user_id) | 1000 | 1 hora |
| API Key Free | 100 | 1 minuto |
| API Key Pro | 5000 | 1 hora |
| API Key Enterprise | 20000 | 1 hora |
| Login | 5 | 15 minutos |

### Security Headers

Headers aplicados em todas as respostas:

| Header | Valor |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=31536000 |
| Content-Security-Policy | Restritiva (default-src 'self') |
| Referrer-Policy | strict-origin-when-cross-origin |

### Proteção contra IPs Maliciosos

- Tabela `blocked_ips` para bloqueio manual/automático
- Logs de atividade suspeita em `suspicious_activity_logs`
- Auto-bloqueio após excesso de rate limit

### Validação de Webhooks

```typescript
const isValid = await validateWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

### Conformidade LGPD/GDPR

#### Classificação de Dados

| Nível | Descrição | Exemplo |
|-------|-----------|---------|
| public | Dados públicos | Nome da organização |
| internal | Apenas membros da org | Display name |
| confidential | PII, requer auditoria | Email, CPF, IP |
| restricted | NUNCA logado | Tokens, senhas |

#### Mascaramento de PII

| Tipo | Original | Mascarado |
|------|----------|-----------|
| Email | joao@empresa.com | jo***@empresa.com |
| CPF | 123.456.789-01 | ***.456.789-** |
| Telefone | (11) 98765-4321 | ***-**21 |
| IP | 192.168.1.100 | 192.168.\*.\* |
| Token | sk_live_abc123xyz789 | sk_live_abc1\*\*\*\*z789 |

#### Auditoria de Acesso a PII

- Tabela imutável `pii_access_audit`
- Registra: quem, quando, qual dado, motivo
- Apenas service_role pode inserir (via Edge Functions)
- Admins podem visualizar logs de sua organização

#### Retenção de Dados

| Tipo de Dado | Retenção | Ação |
|--------------|----------|------|
| Contas excluídas | 30 dias | Hard delete |
| Contas inativas | 2 anos | Anonimização |
| Logs de auditoria | 7 anos | Imutável |
| Exportações | 24 horas | Delete |
| Logs de sistema | 90 dias | Delete |

#### Direitos do Titular

- **Portabilidade**: Exportar todos os dados em JSON
- **Esquecimento**: Exclusão agendada (30 dias) ou imediata
- **Acesso**: Visualizar dados pessoais em Settings

### Boas Práticas Implementadas

- ✅ Senhas verificadas contra vazamentos (HIBP API)
- ✅ Tokens de auditoria com hash SHA-256
- ✅ Logs de auditoria para ações críticas
- ✅ Expiração automática de tokens de acesso
- ✅ Sanitização de dados sensíveis em logs
- ✅ Mascaramento automático de PII em todos os logs
- ✅ Classificação de dados por nível de sensibilidade
- ✅ Auditoria imutável de acesso a dados pessoais
- ✅ Rate limiting por tier (IP, usuário, API key)
- ✅ Security headers em todas as respostas
- ✅ Auto-bloqueio de IPs suspeitos
- ✅ Retenção automática com exclusão/anonimização
- ✅ Conformidade LGPD/GDPR integrada

---

## 📜 Conformidade

### LGPD (Lei Geral de Proteção de Dados)

O APOC implementa controles nativos para conformidade com a LGPD:

| Artigo | Requisito | Implementação |
|--------|-----------|---------------|
| Art. 18, I | Acesso aos dados | Settings > Meus Dados |
| Art. 18, II | Correção | Edição de perfil |
| Art. 18, IV | Anonimização | Automática após 2 anos |
| Art. 18, V | Portabilidade | Export em JSON |
| Art. 18, VI | Eliminação | Exclusão de conta |
| Art. 37 | Registro de operações | pii_access_audit |
| Art. 46 | Segurança | AES-256, RLS, Rate Limit |

### GDPR (General Data Protection Regulation)

| Artigo | Requisito | Implementação |
|--------|-----------|---------------|
| Art. 15 | Right of access | Data export |
| Art. 17 | Right to erasure | Account deletion |
| Art. 20 | Data portability | JSON export |
| Art. 30 | Records of processing | Audit logs |
| Art. 32 | Security | Encryption, access control |

### SOC 2 Type II

O APOC auxilia na conformidade SOC 2:

- **CC6.1**: Logical and physical access controls (RLS, Auth)
- **CC6.6**: Secure transmission (HTTPS, TLS)
- **CC6.7**: Disposal (Data retention automation)
- **CC7.2**: System monitoring (Audit logs, alerts)

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
