

## Plano: Exportação LGPD e Exclusão de Conta

### Objetivo
Implementar funcionalidade de exportação completa de dados (direito de portabilidade LGPD) e exclusão de conta com soft delete (30 dias de retenção).

---

### Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND - Settings Page                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────┐                           │
│  │ Gerenciamento de Dados (LGPD)                │                           │
│  │                                              │                           │
│  │  [📥 Exportar meus dados]  [🗑️ Excluir conta]│                           │
│  │                                              │                           │
│  │  Status: Última exportação: 2024-01-15      │                           │
│  └──────────────────────────────────────────────┘                           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ EDGE FUNCTIONS                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  export-user-data         │  delete-user-account                            │
│  ────────────────────────│──────────────────────────────                    │
│  • Coleta dados de 20+   │  • Soft delete: marca deleted_at                 │
│    tabelas               │  • 30 dias retenção                              │
│  • Remove credenciais    │  • Revoga sessões                                │
│  • Gera JSON estruturado │  • Envia email confirmação                       │
│  • Envia por email       │  • Hard delete agendado                          │
│                          │                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Migração de Banco de Dados

Criar tabela para rastrear solicitações de exportação/exclusão e adicionar coluna `deleted_at` na tabela `profiles`:

```sql
-- Tabela para rastrear exportações e exclusões
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_url TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coluna para soft delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- RLS policies
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON data_export_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### Fase 2: Edge Function - export-user-data

Criar Edge Function que coleta todos os dados do usuário/organização:

**Arquivo:** `supabase/functions/export-user-data/index.ts`

**Tabelas exportadas (sem credenciais sensíveis):**

| Categoria | Tabelas |
|-----------|---------|
| **Perfil** | profiles, user_roles, organizations |
| **Compliance** | frameworks, controls, control_tests, compliance_alerts |
| **Riscos** | risks, risk_assessments, risk_acceptances, vendors |
| **Auditoria** | audits, evidence, audit_logs |
| **Políticas** | policies, tasks |
| **Incidentes** | incidents, incident_playbooks, bcp_plans |
| **Integrações** | integrations (sem configuration), integration_status, integration_collected_data |
| **Notificações** | notifications |
| **Questionários** | security_questionnaires, questionnaire_questions |

**Estrutura do JSON exportado:**
```json
{
  "export_metadata": {
    "generated_at": "2024-01-20T10:30:00Z",
    "user_id": "uuid",
    "organization": "Nome da Org",
    "total_records": 1234,
    "lgpd_compliance": true,
    "format_version": "1.0"
  },
  "profile": { ... },
  "organization": { ... },
  "frameworks": [ ... ],
  "controls": [ ... ],
  "risks": [ ... ],
  "policies": [ ... ],
  "audits": [ ... ],
  "evidence": [ ... ],
  "incidents": [ ... ],
  "integrations": [
    {
      "name": "GitHub",
      "provider": "github",
      "status": "connected",
      "last_sync_at": "...",
      // SEM credentials/tokens
    }
  ],
  "collected_resources": [ ... ],
  "notifications": [ ... ],
  "activity_log": [ ... ]
}
```

**Fluxo da Edge Function:**
1. Autenticar usuário via JWT
2. Criar registro em `data_export_requests` com status "processing"
3. Consultar todas as tabelas relevantes
4. Filtrar dados sensíveis (tokens, senhas, credenciais)
5. Gerar JSON estruturado
6. Fazer upload para Supabase Storage (bucket privado)
7. Enviar email com link temporário (24h)
8. Atualizar status para "completed"

---

### Fase 3: Edge Function - delete-user-account

Criar Edge Function para exclusão de conta com soft delete:

**Arquivo:** `supabase/functions/delete-user-account/index.ts`

**Processo de exclusão (soft delete):**
1. Verificar autenticação e senha atual
2. Marcar `profiles.deleted_at = now()`
3. Definir `profiles.deletion_scheduled_for = now() + 30 days`
4. Revogar todas as sessões ativas
5. Enviar email de confirmação com opção de cancelar
6. Criar job agendado para hard delete após 30 dias

**Dados excluídos no hard delete:**
- Perfil e roles
- Todos os dados criados pelo usuário em todas as tabelas
- Arquivos no Storage (evidências, documentos)
- Tokens OAuth de integrações
- Logs de atividade (opcional, pode manter por compliance)

---

### Fase 4: Componentes Frontend

**Novo componente:** `ExportDataModal.tsx`

```typescript
interface ExportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Mostra categorias de dados a serem exportados
// - Indica tempo estimado de processamento
// - Exibe histórico de exportações anteriores
// - Status em tempo real durante exportação
// - Link para download quando pronto
```

**Atualizar:** `DeleteAccountModal.tsx`

```typescript
// Mudanças:
// - Adicionar verificação de senha real via Supabase Auth
// - Chamar Edge Function delete-user-account
// - Mostrar período de retenção (30 dias)
// - Adicionar opção de cancelar exclusão agendada
// - Email de confirmação
```

---

### Fase 5: Atualizar Settings Page

**Arquivo:** `src/pages/Settings.tsx`

Adicionar nova seção no card "Gerenciamento de Dados":

```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Scale className="w-5 h-5" />
      Seus Direitos (LGPD)
    </CardTitle>
    <CardDescription>
      Gerencie seus dados conforme a Lei Geral de Proteção de Dados
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Exportar Dados */}
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Exportar Meus Dados</p>
        <p className="text-sm text-muted-foreground">
          Baixe todos os seus dados em formato JSON (portabilidade)
        </p>
      </div>
      <Button variant="outline" onClick={() => setShowExportModal(true)}>
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
    </div>
    
    <Separator />
    
    {/* Status de exportações anteriores */}
    {lastExport && (
      <div className="bg-muted p-3 rounded-lg text-sm">
        Última exportação: {formatDate(lastExport.completed_at)}
        {lastExport.file_url && (
          <Button variant="link" size="sm">Baixar novamente</Button>
        )}
      </div>
    )}
  </CardContent>
</Card>
```

---

### Fase 6: Hook useDataExport

**Arquivo:** `src/hooks/useDataExport.tsx`

```typescript
interface UseDataExportReturn {
  requestExport: () => Promise<void>;
  exportRequests: ExportRequest[];
  isExporting: boolean;
  cancelDeletion: () => Promise<void>;
  deletionScheduled: boolean;
  deletionDate: Date | null;
}
```

---

### Fase 7: Template de Email

Adicionar templates no `send-notification-email/index.ts`:

**data_export_ready:**
```html
<h1>Sua exportação de dados está pronta</h1>
<p>Você solicitou uma cópia de todos os seus dados...</p>
<a href="{{download_link}}">Baixar meus dados</a>
<p>Este link expira em 24 horas.</p>
```

**account_deletion_scheduled:**
```html
<h1>Sua conta foi agendada para exclusão</h1>
<p>Sua conta e todos os dados serão excluídos em 30 dias.</p>
<p>Se você não solicitou isso, cancele imediatamente:</p>
<a href="{{cancel_link}}">Cancelar Exclusão</a>
```

---

### Estrutura de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx_data_export_table.sql` | Criar | Tabela data_export_requests |
| `supabase/functions/export-user-data/index.ts` | Criar | Edge Function de exportação |
| `supabase/functions/delete-user-account/index.ts` | Criar | Edge Function de exclusão |
| `src/components/settings/ExportDataModal.tsx` | Criar | Modal de exportação LGPD |
| `src/components/settings/DeleteAccountModal.tsx` | Modificar | Integrar com Edge Function |
| `src/hooks/useDataExport.tsx` | Criar | Hook para gerenciar exportações |
| `src/pages/Settings.tsx` | Modificar | Adicionar seção LGPD |
| `supabase/functions/send-notification-email/index.ts` | Modificar | Adicionar templates |
| `supabase/config.toml` | Modificar | Registrar novas Edge Functions |

---

### Fluxo de Exportação

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SOLICITAÇÃO                                                              │
│    ├── Usuário clica "Exportar meus dados"                                  │
│    ├── Modal exibe categorias de dados                                      │
│    └── Usuário confirma exportação                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. PROCESSAMENTO                                                            │
│    ├── Frontend chama Edge Function export-user-data                        │
│    ├── Cria registro em data_export_requests (status: processing)           │
│    ├── Edge Function consulta todas as tabelas                              │
│    ├── Remove dados sensíveis (tokens, senhas)                              │
│    └── Modal mostra progresso                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. ENTREGA                                                                  │
│    ├── JSON salvo no Storage com URL temporária                             │
│    ├── Email enviado com link de download (24h)                             │
│    ├── Status atualizado para "completed"                                   │
│    └── Usuário pode baixar imediatamente ou via email                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fluxo de Exclusão

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SOLICITAÇÃO                                                              │
│    ├── Usuário clica "Excluir minha conta"                                  │
│    ├── Modal exibe consequências                                            │
│    ├── Checkboxes de confirmação                                            │
│    ├── Digitar "EXCLUIR MINHA CONTA"                                        │
│    └── Confirmar senha atual                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. SOFT DELETE                                                              │
│    ├── Edge Function verifica senha                                         │
│    ├── profiles.deleted_at = now()                                          │
│    ├── profiles.deletion_scheduled_for = now() + 30 days                    │
│    ├── Revoga todas as sessões ativas                                       │
│    └── Email de confirmação enviado                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. PERÍODO DE RETENÇÃO (30 dias)                                            │
│    ├── Usuário pode cancelar via link no email                              │
│    ├── Dados ainda existem mas conta inacessível                            │
│    └── Job agendado para hard delete                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. HARD DELETE (após 30 dias)                                               │
│    ├── Job executa exclusão permanente                                      │
│    ├── Todos os dados removidos de todas as tabelas                         │
│    ├── Arquivos do Storage excluídos                                        │
│    └── Email final de confirmação                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Segurança e Conformidade

| Aspecto | Implementação |
|---------|---------------|
| **Autenticação** | JWT obrigatório em todas as Edge Functions |
| **Verificação de senha** | Requerida para exclusão de conta |
| **Dados sensíveis** | Tokens, senhas e credenciais removidos da exportação |
| **Links temporários** | URLs de download expiram em 24h |
| **Auditoria** | Todas as ações registradas em audit_logs |
| **Email** | Notificação obrigatória para exportação e exclusão |
| **Retenção** | 30 dias antes de hard delete (conforme LGPD) |

---

### Configuração Necessária

**supabase/config.toml:**
```toml
[functions.export-user-data]
verify_jwt = true

[functions.delete-user-account]
verify_jwt = true
```

**Secrets necessários:**
- `RESEND_API_KEY` (para envio de emails) - **A CONFIGURAR**

---

### Ordem de Implementação

1. Criar migração do banco de dados (tabela + colunas)
2. Criar Edge Function `export-user-data`
3. Criar Edge Function `delete-user-account`
4. Criar hook `useDataExport`
5. Criar `ExportDataModal.tsx`
6. Atualizar `DeleteAccountModal.tsx` com integração real
7. Atualizar `Settings.tsx` com seção LGPD
8. Adicionar templates de email
9. Atualizar `config.toml` com novas funções
10. Testar fluxos completos

