# APOC - Documentação de Novas Funcionalidades (Janeiro 2026)

## Índice

1. [Evidence Auto-linking](#1-evidence-auto-linking)
2. [Auditor Portal](#2-auditor-portal)
3. [Correção Estrutural de Layout](#3-correção-estrutural-de-layout)
4. [Asset Inventory System](#4-asset-inventory-system)
5. [Compliance Status Engine](#5-compliance-status-engine)
6. [Resumo de Arquivos](#6-resumo-de-arquivos)
7. [Diagrama de Fluxo de Dados](#7-diagrama-de-fluxo-de-dados)
8. [Próximos Passos](#8-próximos-passos)

---

## 1. Evidence Auto-linking

### Descrição
Sistema que conecta automaticamente dados reais coletados das integrações aos controles dos frameworks de compliance (ISO 27001, LGPD, SOC 2).

### Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/evidence-control-map.ts` | Biblioteca de mapeamento de regras |
| `src/hooks/useAutoEvidence.tsx` | Hook para processar evidências automáticas |
| `src/components/audit/AutoEvidenceSection.tsx` | Componente visual para exibir evidências |

### Regras de Mapeamento (20 regras)

| Categoria | Integração | Verificação | Controles |
|-----------|------------|-------------|-----------|
| MFA | Google Workspace | `isEnrolledIn2Sv === true` | A.8.5, CC6.1, LGPD-46 |
| MFA | Slack | `has_2fa === true` | A.8.5, CC6.1, LGPD-46 |
| MFA | Okta | `enrolledFactors.length > 0` | A.8.5, CC6.1, LGPD-46 |
| MFA | Auth0 | `multifactor.length > 0` | A.8.5, CC6.1, LGPD-46 |
| MFA | Azure AD | `mfaEnabled === true` | A.8.5, CC6.1, LGPD-46 |
| MFA | GitHub | `two_factor_authentication === true` | A.8.5, CC6.1, LGPD-46 |
| Admin MFA | Google | `isAdmin && isEnrolledIn2Sv` | A.5.1, CC6.2 |
| Repositório Privado | GitHub | `private === true` | A.8.24, CC6.1 |
| Projeto Privado | GitLab | `visibility === 'private'` | A.8.24, CC6.1 |
| HTTPS | Cloudflare | `always_use_https === 'on'` | A.8.24, LGPD-46 |
| Criptografia S3 | AWS | `encryption === true` | A.8.24, CC6.1, LGPD-46 |
| Acesso Público S3 | AWS | `BlockPublicAcls === true` | A.8.3, CC6.1 |
| Dispositivo Conforme | Intune | `complianceState === 'compliant'` | A.8.1, CC6.6 |
| EDR Ativo | CrowdStrike | `sensor_version != null` | A.8.1, CC6.6 |
| Funcionário Ativo | BambooHR | `status === 'Active'` | A.5.15, CC6.1 |

### Interface do Hook

```typescript
interface AutoEvidenceResult {
  evidences: AutoEvidence[];
  isLoading: boolean;
  getEvidencesForControl: (controlCode: string) => AutoEvidence[];
  getEvidenceStats: (controlCode: string) => AutoEvidenceStats;
  hasAutoEvidence: (controlCode: string) => boolean;
  getPassingEvidences: (controlCode: string) => AutoEvidence[];
  getFailingEvidences: (controlCode: string) => AutoEvidence[];
  getSummaryMessage: (controlCode: string) => string;
}
```

### Funcionalidades

- **Badge "⚡ Auto"**: Controles com evidências automáticas exibem badge visual
- **Resumo para Auditor**: Mensagem como "Este controle está OK porque o APOC verificou 45 usuários e 100% possuem MFA ativo"
- **Lista de Recursos**: Exibição de cada recurso verificado com status pass/fail
- **Barra de Progresso**: Visualização percentual de conformidade

---

## 2. Auditor Portal

### Descrição
Portal de acesso externo somente-leitura para auditores validarem evidências de compliance em tempo real.

### Rotas
- `/auditor-portal` - Portal público (sem autenticação)
- `/auditor-portal/:auditId` - Portal com ID de auditoria específica

### Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/AuditorPortalPage.tsx` | Página principal do portal |
| `src/components/auditor/AuditorPortalHeader.tsx` | Header simplificado com badge "MODO LEITURA" |
| `src/components/auditor/AuditorComplianceSummary.tsx` | Dashboard de conformidade read-only |
| `src/components/auditor/AuditorAssetInventory.tsx` | Inventário de ativos read-only |
| `src/components/auditor/AuditorEvidenceRepository.tsx` | Repositório de evidências por framework |
| `src/components/auditor/AuditReportExportButton.tsx` | Botão para exportar relatório |

### Características

**Elementos Presentes:**
- Dashboard de conformidade (score, testes passando/falhando)
- Inventário de ativos monitorados
- Lista de controles por framework com evidências automáticas
- Botão "Gerar Relatório de Auditoria"
- Badge "VISÃO DO AUDITOR EXTERNO - MODO LEITURA"

**Elementos Removidos/Ocultos:**
- Sidebar de navegação
- Botões de "Conectar", "Sincronizar", "Excluir"
- Configurações de perfil
- Menu de usuário
- Notificações

### Layout

```
+----------------------------------------------------------------------+
|  [APOC Logo]  "VISÃO DO AUDITOR EXTERNO - MODO LEITURA"  [Theme]     |
+----------------------------------------------------------------------+
|                                                                       |
|  +--- Portal de Transparência -----------------------------------+   |
|  | Bem-vindo ao portal de auditoria. Ambiente de somente leitura |   |
|  +---------------------------------------------------------------+   |
|                                                                       |
|  +--- Dashboard de Conformidade ---------------------------------+   |
|  |  [Score: 85%]  [Passando: 12]  [Falhando: 3]  [Risco: 1]      |   |
|  +---------------------------------------------------------------+   |
|                                                                       |
|  +--- Inventário ---+  +--- Evidências --------------------------+   |
|  | Ativos: 156      |  | Controles por Framework                 |   |
|  | Usuários: 45     |  | ISO 27001: 18 controles [Auto]          |   |
|  | Repos: 23        |  | LGPD: 19 controles [Auto]               |   |
|  +-----------------+  +------------------------------------------+   |
|                                                                       |
|  +--- [Gerar Relatório de Auditoria (PDF)] ----------------------+   |
+----------------------------------------------------------------------+
```

### Mensagem para o Auditor

> "Bem-vindo ao Portal de Transparência da APOC. Aqui você pode validar todas as nossas evidências de compliance em tempo real. Este é um ambiente de somente leitura - você pode visualizar, mas não modificar nenhum dado."

---

## 3. Correção Estrutural de Layout

### Descrição
Correção global de bugs visuais causados por uso incorreto de flexbox e falta de padronização.

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Inventory.tsx` | Adicionado `pt-16`, `ml-72`, estrutura `main` correta |
| `src/components/dashboard/ActionCenter.tsx` | Adicionado `flex-wrap`, `min-w-[70px]` nos quick stats |
| `src/components/layout/PageContainer.tsx` | Nova prop `preventOverflow` |
| `src/pages/IntegrationsHub.tsx` | `overflow-hidden` em Tabs, `scrollbar-hide` em TabsList |
| `src/pages/Index.tsx` | Responsividade melhorada no header |

### Padrão de Layout Definido

```tsx
<div className="min-h-screen bg-background flex flex-col">
  <Header />
  <div className="flex flex-1 pt-16">
    <Sidebar />
    <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <PageContainer>
        {/* Conteúdo */}
      </PageContainer>
    </main>
  </div>
</div>
```

### Regras Aplicadas

| Regra | Descrição |
|-------|-----------|
| `pt-16` | Compensa Header fixo (64px) |
| `ml-72` | Compensa Sidebar fixa (288px) |
| `max-w-[1600px]` | Limita largura em monitores ultrawide |
| `overflow-y-auto` | Permite scroll vertical no main |
| `flex-wrap` | Obrigatório em layouts flexbox dinâmicos |
| Grid em vez de Flex | Para layouts de cards |

---

## 4. Asset Inventory System

### Descrição
Sistema centralizado de inventário de ativos que unifica recursos de todas as integrações.

### Arquivo Principal
`src/hooks/useAssetInventory.tsx`

### Categorias de Ativos

| Categoria | Tipos de Recursos | Integrações |
|-----------|-------------------|-------------|
| **Identity** | user, employees | Google, Slack, Okta, Auth0, Azure AD |
| **Infrastructure** | repository, zone, bucket | GitHub, GitLab, Cloudflare, AWS |
| **Security** | device | Intune, CrowdStrike |
| **Productivity** | channel, project | Slack, Jira |

### Interface

```typescript
interface AssetInventoryResult {
  assets: Asset[];
  identityAssets: Asset[];
  infrastructureAssets: Asset[];
  securityAssets: Asset[];
  productivityAssets: Asset[];
  counts: {
    total: number;
    identity: number;
    infrastructure: number;
    security: number;
    productivity: number;
  };
  hasRealData: boolean;
  isLoading: boolean;
}
```

### Verificações de Compliance por Ativo

O sistema aplica regras automáticas para determinar o status de cada ativo:

| Integração | Verificação | Status |
|------------|-------------|--------|
| GitHub | Repositório público | ⚠️ Não Conforme |
| GitHub | Branch sem proteção | ⚠️ Não Conforme |
| Cloudflare | HTTPS não forçado | ⚠️ Não Conforme |
| Slack | Admin sem MFA | ⚠️ Não Conforme |
| Intune | Dispositivo não conforme | ⚠️ Não Conforme |
| Intune | Sem criptografia | ⚠️ Não Conforme |
| AWS | Bucket público | ⚠️ Não Conforme |
| Google/Okta | Usuário sem MFA | ⚠️ Não Conforme |

---

## 5. Compliance Status Engine

### Descrição
Motor central que processa dados de integrações e gera status de compliance automatizado.

### Arquivo Principal
`src/hooks/useComplianceStatus.tsx`

### Regras de Compliance (14 regras)

| ID | Título | Severidade | Integração |
|----|--------|------------|------------|
| `github-public-repo` | Repositório Público | 🔴 Critical | GitHub |
| `github-no-branch-protection` | Branch sem Proteção | 🟠 High | GitHub |
| `cloudflare-no-https` | HTTPS Não Forçado | 🔴 Critical | Cloudflare |
| `cloudflare-no-waf` | WAF Desativado | 🟠 High | Cloudflare |
| `slack-admin-no-mfa` | Admin Slack sem MFA | 🔴 Critical | Slack |
| `slack-inactive-user` | Usuário Inativo (90d) | 🟡 Medium | Slack |
| `intune-noncompliant-device` | Dispositivo Não Conforme | 🔴 Critical | Intune |
| `intune-unencrypted-device` | Sem Criptografia | 🟠 High | Intune |
| `aws-public-bucket` | Bucket S3 Público | 🔴 Critical | AWS |
| `aws-unencrypted-bucket` | Bucket sem Criptografia | 🟠 High | AWS |
| `google-user-no-mfa` | Usuário Google sem MFA | 🟠 High | Google |
| `google-admin-no-mfa` | Admin Google sem MFA | 🔴 Critical | Google |
| `auth0-no-mfa` | MFA não Configurado | 🟠 High | Auth0 |
| `okta-user-no-mfa` | Usuário Okta sem MFA | 🟠 High | Okta |

### Interface

```typescript
interface ComplianceStatusResult {
  tests: ComplianceTest[];
  failingTests: ComplianceTest[];
  passingTests: ComplianceTest[];
  notConfiguredTests: ComplianceTest[];
  riskAcceptedTests: ComplianceTest[];
  score: number;
  totalTests: number;
  isLoading: boolean;
}
```

### Cálculo do Score

```
Score = (Passando + Risco Aceito) / Total × 100
```

- Testes são ordenados por severidade: Critical > High > Medium > Low
- Testes "Não Configurado" não contam negativamente
- Aceite de risco conta como "passando" para o score

---

## 6. Resumo de Arquivos

### Novos Arquivos (10)

| Arquivo | Funcionalidade |
|---------|----------------|
| `src/lib/evidence-control-map.ts` | Mapeamento de evidências para controles |
| `src/hooks/useAutoEvidence.tsx` | Hook de evidências automáticas |
| `src/components/audit/AutoEvidenceSection.tsx` | Seção visual de evidências |
| `src/pages/AuditorPortalPage.tsx` | Página do portal do auditor |
| `src/components/auditor/AuditorPortalHeader.tsx` | Header do portal |
| `src/components/auditor/AuditorComplianceSummary.tsx` | Dashboard do portal |
| `src/components/auditor/AuditorAssetInventory.tsx` | Inventário do portal |
| `src/components/auditor/AuditorEvidenceRepository.tsx` | Evidências do portal |
| `src/components/auditor/AuditReportExportButton.tsx` | Exportação de relatório |

### Arquivos Modificados (7)

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Nova rota `/auditor-portal` |
| `src/pages/Inventory.tsx` | Correção de layout |
| `src/pages/IntegrationsHub.tsx` | Overflow em tabs |
| `src/pages/Index.tsx` | Responsividade |
| `src/components/dashboard/ActionCenter.tsx` | flex-wrap |
| `src/components/layout/PageContainer.tsx` | preventOverflow prop |
| `src/components/audit/FrameworkChecklists.tsx` | Badge "Auto" |

---

## 7. Diagrama de Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE DADOS APOC                              │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  INTEGRAÇÕES (15 provedores)                                         │
│  GitHub | Slack | Google | Azure | AWS | Okta | Intune | ...         │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  integration_collected_data (Tabela Supabase)                        │
│  ├── resource_type: user, repository, device, zone...               │
│  ├── resource_data: JSON com dados brutos                           │
│  └── collected_at: timestamp                                         │
└──────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│useComplianceStatus│ │useAssetInventory│ │ useAutoEvidence │
│   (14 regras)    │ │  (4 categorias) │ │   (20 regras)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DASHBOARD                                   │
│  ├── Action Center (Score + Testes Falhando)                        │
│  ├── Asset Inventory (Ativos por Categoria)                         │
│  └── Framework Checklists (Controles + Evidências Auto)             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       AUDITOR PORTAL                                 │
│  ├── Visão Read-Only de todos os dados                              │
│  ├── Sem botões de ação                                             │
│  └── Exportação de Relatório                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Próximos Passos

### Prioridade Alta

1. **Tokens de Acesso com Expiração**
   - Implementar tokens temporários para links do Auditor Portal
   - Validade configurável (24h, 7d, 30d)
   - Revogação manual pelo admin

2. **Analytics de Acesso**
   - Rastrear quando auditores acessam o portal
   - Log de downloads de relatórios
   - Dashboard de atividade

### Prioridade Média

3. **Sistema de Comentários**
   - Permitir auditores deixarem observações nos controles
   - Histórico de comentários por controle
   - Notificações para admins

4. **Notificações de Alteração**
   - Alertar quando status de compliance mudar
   - Webhook para integrações externas
   - Digest diário/semanal

### Prioridade Baixa

5. **Exportação PDF Formatado**
   - Gerar PDF real com jsPDF ou similar
   - Cabeçalho com logo
   - Gráficos visuais
   - Tabelas estilizadas

---

## Glossário

| Termo | Definição |
|-------|-----------|
| **Auto Evidence** | Evidência gerada automaticamente a partir de dados coletados |
| **Compliance Score** | Percentual de testes passando vs total |
| **Control** | Requisito específico de um framework de compliance |
| **Framework** | Conjunto de controles (ISO 27001, LGPD, SOC 2) |
| **Integration** | Conexão com provedor externo (GitHub, Slack, etc) |
| **Resource** | Ativo coletado de uma integração (usuário, repo, device) |
| **Risk Acceptance** | Decisão documentada de aceitar um risco temporariamente |

---

*Documentação gerada em Janeiro de 2026 - APOC v2.0*
*Última atualização: 13/01/2026*
