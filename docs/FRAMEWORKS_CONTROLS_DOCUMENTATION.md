# 📋 Documentação Completa: CRUD de Frameworks e Controles

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Frameworks Suportados](#frameworks-suportados)
4. [Operações CRUD](#operações-crud)
5. [Análise de Gaps](#análise-de-gaps)
6. [Upload de Evidências](#upload-de-evidências)
7. [Exemplos de JSON](#exemplos-de-json)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Checklist de Validação](#checklist-de-validação)
10. [Edge Cases](#edge-cases)

---

## 🎯 Visão Geral

Sistema completo de gerenciamento de frameworks de compliance (ISO 27001, SOC 2, LGPD, GDPR) e seus controles associados. Permite cadastro, edição, exclusão, visualização e análise automática de gaps de conformidade.

### Funcionalidades Principais

- ✅ **CRUD completo** para frameworks e controles
- 📊 **Análise automática de gaps** (obrigatórios vs implementados)
- 📁 **Upload seguro de evidências** via Supabase Storage
- 🔍 **Validação robusta** de entrada com Zod
- 🛡️ **Segurança** via RLS (Row Level Security)
- 📈 **Métricas em tempo real** de conformidade

---

## 🏗️ Arquitetura

### Componentes Principais

```
src/
├── hooks/
│   └── useFrameworks.tsx         # Hook principal com toda lógica CRUD
├── components/
│   └── controls/
│       ├── CreateControlModal.tsx      # Criar novo controle
│       ├── EditControlModal.tsx        # Editar controle existente
│       ├── EditFrameworkModal.tsx      # Editar framework
│       ├── DeleteFrameworkModal.tsx    # Excluir framework
│       ├── UploadEvidenceModal.tsx     # Upload de evidências
│       ├── FrameworksOverview.tsx      # Visão geral de frameworks
│       ├── ControlsMatrix.tsx          # Matriz de controles
│       └── GapAssessment.tsx           # Análise de gaps
└── pages/
    └── ControlsFrameworks.tsx    # Página principal
```

### Banco de Dados (Supabase)

**Tabela: `frameworks`**
```sql
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  compliance_score INTEGER DEFAULT 0,
  total_controls INTEGER DEFAULT 0,
  passed_controls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Tabela: `controls`**
```sql
CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  framework_id UUID REFERENCES frameworks(id),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  owner TEXT,
  evidence_count INTEGER DEFAULT 0,
  last_verified DATE,
  next_review DATE,
  findings TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Storage Bucket: `evidence`**
- Bucket público: Não
- RLS habilitado: Sim
- Tamanho máximo por arquivo: 10MB
- Tipos aceitos: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, PNG, GIF, WEBP, ZIP, RAR, LOG

---

## 📚 Frameworks Suportados

### 1. ISO 27001:2022
- **Descrição**: Sistema de Gestão de Segurança da Informação
- **Total de Controles**: 114 (anexo A)
- **Categorias**: 
  - A.5: Políticas de segurança
  - A.6: Organização da segurança da informação
  - A.7: Segurança em recursos humanos
  - A.8: Gestão de ativos
  - ... (93 controles)

### 2. SOC 2 Type II
- **Descrição**: System and Organization Controls para Serviços
- **Total de Controles**: 64
- **Trust Service Criteria**:
  - CC (Common Criteria): 20 controles
  - Security: 15 controles
  - Availability: 10 controles
  - Confidentiality: 8 controles
  - Privacy: 11 controles

### 3. LGPD (Lei 13.709/2018)
- **Descrição**: Lei Geral de Proteção de Dados Pessoais - Brasil
- **Total de Controles**: 42
- **Categorias**:
  - Consentimento e base legal
  - Direitos do titular
  - Tratamento de dados
  - Segurança e incidentes
  - Governança e DPO

### 4. GDPR (Regulamento UE 2016/679)
- **Descrição**: General Data Protection Regulation
- **Total de Controles**: 38
- **Capítulos**:
  - Princípios
  - Direitos dos titulares
  - Obrigações do controlador
  - Transferências internacionais

---

## ⚙️ Operações CRUD

### 1. Criar Framework

**Arquivo**: `src/hooks/useFrameworks.tsx` → `createFramework()`

**Função**:
```typescript
/**
 * Cria um novo framework de compliance
 * 
 * @param frameworkData - Dados do framework (sem user_id)
 * @returns Promise<Framework> - Framework criado
 * @throws {Error} Se validação falhar ou insert falhar
 * 
 * Validações:
 * - name: obrigatório, 3-200 caracteres
 * - status: enum ['active', 'inactive']
 * - version: opcional, max 50 caracteres
 * 
 * Edge Cases:
 * - Nome duplicado: permitido (pode haver múltiplas versões)
 * - Usuário não autenticado: erro 401
 * - user_id inserido automaticamente
 */
async createFramework(
  frameworkData: Omit<FrameworkInsert, 'user_id'>
): Promise<Framework>
```

**Exemplo de Uso**:
```tsx
const { createFramework } = useFrameworks();

await createFramework({
  name: 'ISO 27001:2022',
  description: 'Sistema de Gestão de Segurança da Informação',
  version: '2022',
  status: 'active',
  total_controls: 114,
  passed_controls: 0,
  compliance_score: 0
});
```

### 2. Atualizar Framework

**Arquivo**: `src/components/controls/EditFrameworkModal.tsx`

**Função**:
```typescript
/**
 * Atualiza um framework existente
 * 
 * @param id - UUID do framework
 * @param updates - Campos a atualizar
 * @returns Promise<void>
 * @throws {Error} Se framework não encontrado ou user não é dono
 * 
 * Validações:
 * - name: se fornecido, min 3 caracteres
 * - status: enum ['active', 'inactive']
 * 
 * Edge Cases:
 * - Framework com controles: permite atualização
 * - Mudar para 'inactive': controles não são afetados
 * - Concorrência: last write wins
 */
async updateFramework(
  id: string,
  updates: FrameworkUpdate
): Promise<void>
```

**Exemplo JSON de Entrada**:
```json
{
  "name": "ISO 27001:2022 (Updated)",
  "description": "Sistema de Gestão de Segurança da Informação - Versão Atualizada",
  "version": "2022.1",
  "status": "active",
  "compliance_score": 85
}
```

### 3. Excluir Framework

**Arquivo**: `src/components/controls/DeleteFrameworkModal.tsx`

**Função**:
```typescript
/**
 * Exclui um framework permanentemente
 * 
 * @param id - UUID do framework
 * @returns Promise<void>
 * @throws {Error} Se framework tem dependências ou user não é dono
 * 
 * Comportamento de Cascata:
 * - ❌ NÃO exclui controles automaticamente (ficam órfãos)
 * - ❌ NÃO exclui evidências (ficam no storage)
 * - Recomendação: excluir/reatribuir controles manualmente primeiro
 * 
 * Edge Cases:
 * - Framework com controles: mostra aviso, mas permite exclusão
 * - Framework em auditoria ativa: BLOQUEIA exclusão (erro 409)
 * - Framework já excluído: erro 404
 */
async deleteFramework(id: string): Promise<void>
```

**Fluxo de Exclusão**:
1. Usuário clica em "Excluir"
2. Modal mostra aviso com contagem de controles
3. Usuário confirma
4. Sistema valida se há auditorias ativas
5. Se OK: exclui framework, controles ficam órfãos
6. Se NOK: mostra erro e sugere ações

### 4. Criar Controle

**Arquivo**: `src/components/controls/CreateControlModal.tsx`

**Função**:
```typescript
/**
 * Cria um novo controle de segurança
 * 
 * @param controlData - Dados do controle
 * @returns Promise<FrameworkControl>
 * @throws {Error} Se validação falhar
 * 
 * Validações:
 * - code: obrigatório, 2-50 chars, alfanumérico + '.', '-'
 * - title: obrigatório, 5-200 chars
 * - category: obrigatório, enum de categorias
 * - status: enum ['passed', 'failed', 'pending', 'na']
 * 
 * Edge Cases:
 * - Código duplicado: permitido (diferentes frameworks)
 * - Framework inexistente: cria controle órfão
 * - next_review no passado: mostra aviso
 */
async createControl(
  controlData: Omit<FrameworkControl, 'id' | 'user_id'>
): Promise<FrameworkControl>
```

**Exemplo JSON**:
```json
{
  "code": "CC6.1",
  "title": "Controles de Acesso Lógico",
  "category": "Controle de Acesso",
  "description": "A entidade implementa controles de acesso lógico para proteger informações e sistemas críticos.",
  "status": "pending",
  "owner": "Equipe de Segurança",
  "framework_id": "uuid-do-framework",
  "next_review": "2024-12-31",
  "evidence_count": 0,
  "last_verified": null,
  "findings": []
}
```

### 5. Atualizar Controle

**Arquivo**: `src/components/controls/EditControlModal.tsx`

**Exemplo de Atualização de Status**:
```typescript
// Aprovar controle
await updateControl('control-uuid', {
  status: 'passed',
  last_verified: new Date().toISOString(),
  findings: [] // limpa findings
});

// Reprovar controle
await updateControl('control-uuid', {
  status: 'failed',
  findings: [
    'MFA não implementado para todos os usuários',
    'Logs de acesso incompletos',
    'Política de senhas não em conformidade'
  ]
});
```

---

## 📊 Análise de Gaps

**Arquivo**: `src/components/controls/GapAssessment.tsx`

### Lógica de Cálculo

```typescript
/**
 * Calcula gaps de compliance automaticamente
 * 
 * Gap = Controles Obrigatórios - Controles Implementados
 * 
 * Status dos Controles:
 * - passed: controle implementado e validado
 * - partial: controle parcialmente implementado
 * - missing: controle não implementado
 * - pending: controle em análise
 * 
 * Severidade:
 * - critical: controle obrigatório não implementado (alto risco)
 * - high: controle importante não implementado
 * - medium: controle recomendado não implementado
 * - low: controle opcional não implementado
 */
interface Gap {
  control: string;           // Código do controle (ex: CC6.1)
  title: string;             // Nome do controle
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'missing' | 'partial' | 'identified';
  requiredActions: string[]; // Ações corretivas necessárias
  estimatedEffort: string;   // Horas estimadas
  priority: number;          // 1-5 (5 = mais urgente)
  frameworks: string[];      // Frameworks afetados
  deadline: string;          // Data limite para correção
}
```

### Exemplo de Gap Detectado

```json
{
  "control": "CC6.2",
  "title": "Autenticação Multifator",
  "severity": "critical",
  "status": "missing",
  "requiredActions": [
    "Implementar MFA para todos os usuários administrativos",
    "Configurar política de MFA no Azure AD",
    "Treinar usuários sobre novo fluxo de autenticação",
    "Documentar procedimentos de recuperação de MFA"
  ],
  "estimatedEffort": "40-60 horas",
  "priority": 5,
  "frameworks": ["SOC 2", "ISO 27001", "GDPR"],
  "deadline": "2024-02-15",
  "impact": "Sem MFA, acesso não autorizado pode comprometer sistemas críticos",
  "recommendation": "Usar solução enterprise (Okta, Azure AD) ao invés de SMS"
}
```

### Cálculo de Score de Compliance

```typescript
/**
 * Calcula score de compliance por framework
 * 
 * Score = (Passed + (Partial * 0.5)) / Total * 100
 * 
 * Exemplo:
 * - Total: 114 controles
 * - Passed: 100 controles
 * - Partial: 10 controles
 * - Missing: 4 controles
 * 
 * Score = (100 + (10 * 0.5)) / 114 * 100 = 92.1%
 */
function calculateComplianceScore(
  passed: number,
  partial: number,
  total: number
): number {
  return Math.round(((passed + (partial * 0.5)) / total) * 100);
}
```

### Relatório de Gaps (Export)

O sistema gera relatório em texto com:
- 📋 Resumo executivo
- 🔴 Gaps críticos
- 🟡 Gaps de alta prioridade
- 📈 Roadmap de correção
- 💰 Estimativa de esforço

---

## 📁 Upload de Evidências

**Arquivo**: `src/components/controls/UploadEvidenceModal.tsx`

### Tipos de Arquivo Aceitos

| Categoria | Tipos | Extensões | Uso |
|-----------|-------|-----------|-----|
| **Documentos** | PDF, Word, Excel | .pdf, .doc, .docx, .xls, .xlsx | Políticas, procedimentos, relatórios |
| **Imagens** | JPG, PNG, GIF, WEBP | .jpg, .jpeg, .png, .gif, .webp | Screenshots, diagramas, fotos |
| **Logs** | Text, CSV | .txt, .log, .csv | Logs de sistema, auditoria |
| **Arquivos** | ZIP, RAR, 7Z | .zip, .rar, .7z | Múltiplos arquivos, backups |

### Tipos Rejeitados (Segurança)

❌ **Nunca aceite**:
- Executáveis: .exe, .bat, .sh, .cmd, .com
- Scripts: .js, .php, .py, .rb (risco de injeção)
- System files: .dll, .sys, .drv
- Temporários: .tmp, .temp, .bak

### Validação de Upload

```typescript
/**
 * Valida arquivo antes do upload
 * 
 * Regras:
 * 1. Tipo de arquivo deve estar na lista de aceitos
 * 2. Tamanho máximo: 10MB (10 * 1024 * 1024 bytes)
 * 3. Nome do arquivo: max 255 caracteres, sem caracteres especiais
 * 4. Extensão deve corresponder ao MIME type
 * 
 * Segurança:
 * - Validação client-side E server-side
 * - Geração de nome UUID (evita path traversal)
 * - Scan de vírus no server (Supabase)
 * - RLS policies para acesso
 * 
 * @param file - File object do navegador
 * @returns boolean - true se válido
 * @throws {Error} Se validação falhar
 */
function validateFile(file: File): boolean {
  // Validação de tamanho
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. Máximo: 10MB');
  }

  // Validação de tipo
  const acceptedTypes = [...]; // Lista de MIME types
  if (!acceptedTypes.includes(file.type)) {
    throw new Error(`Tipo ${file.type} não suportado`);
  }

  // Validação de extensão
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!acceptedExtensions.includes(`.${ext}`)) {
    throw new Error(`Extensão .${ext} não permitida`);
  }

  return true;
}
```

### Exemplo de Upload Bem-Sucedido

```json
{
  "success": true,
  "data": {
    "id": "evidence-uuid",
    "control_id": "control-uuid",
    "file_name": "audit_report_2024.pdf",
    "file_url": "https://ofbyxnpprwwuieabwhdo.supabase.co/storage/v1/object/public/evidence/control-uuid/uuid.pdf",
    "file_size": 2458624,
    "mime_type": "application/pdf",
    "uploaded_by": "user@example.com",
    "uploaded_at": "2024-01-15T10:30:00Z",
    "description": "Relatório de auditoria anual 2024"
  }
}
```

### Exemplo de Upload com Erro

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Arquivo muito grande. Máximo: 10MB",
    "details": {
      "file_size": 15728640,
      "max_size": 10485760,
      "file_name": "large_report.pdf"
    },
    "suggestion": "Comprima o arquivo ou divida em partes menores"
  }
}
```

---

## 🔧 Tratamento de Erros

### Códigos de Erro HTTP

| Código | Descrição | Ação Sugerida |
|--------|-----------|---------------|
| **400** | Bad Request - dados inválidos | Verificar validação do formulário |
| **401** | Unauthorized - não autenticado | Redirecionar para login |
| **403** | Forbidden - sem permissão | Verificar RLS policies |
| **404** | Not Found - recurso não existe | Mostrar mensagem de erro amigável |
| **409** | Conflict - conflito de dados | Resolver conflito manualmente |
| **413** | Payload Too Large - arquivo grande | Reduzir tamanho do arquivo |
| **415** | Unsupported Media Type | Usar tipo de arquivo aceito |
| **422** | Unprocessable Entity - validação | Corrigir dados do formulário |
| **500** | Internal Server Error | Tentar novamente, contatar suporte |
| **507** | Insufficient Storage | Limpar arquivos antigos, upgrade plano |

### Exemplos de Tratamento

```typescript
try {
  await createFramework(data);
} catch (error) {
  if (error.code === '23505') {
    // Unique violation (PostgreSQL)
    toast({
      title: 'Framework já existe',
      description: 'Já existe um framework com esse nome',
      variant: 'warning'
    });
  } else if (error.message.includes('RLS')) {
    // RLS policy violation
    toast({
      title: 'Sem permissão',
      description: 'Você não tem permissão para criar frameworks',
      variant: 'destructive'
    });
  } else {
    // Erro genérico
    toast({
      title: 'Erro ao criar framework',
      description: 'Tente novamente ou contate o suporte',
      variant: 'destructive'
    });
  }
}
```

---

## ✅ Checklist de Validação

### Checklist de Funcionalidades

- [ ] **Frameworks**
  - [ ] Criar novo framework
  - [ ] Editar framework existente
  - [ ] Excluir framework
  - [ ] Listar frameworks com filtros
  - [ ] Ver detalhes do framework
  - [ ] Calcular score de compliance

- [ ] **Controles**
  - [ ] Criar novo controle
  - [ ] Editar controle existente
  - [ ] Excluir controle
  - [ ] Vincular controle a framework
  - [ ] Atualizar status do controle
  - [ ] Listar controles por framework
  - [ ] Filtrar controles por status/categoria

- [ ] **Evidências**
  - [ ] Upload de arquivo
  - [ ] Validação de tipo e tamanho
  - [ ] Preview de arquivo
  - [ ] Download de evidência
  - [ ] Excluir evidência
  - [ ] Listar evidências por controle

- [ ] **Gap Analysis**
  - [ ] Identificar controles faltantes
  - [ ] Calcular gaps por framework
  - [ ] Priorizar ações corretivas
  - [ ] Exportar relatório de gaps
  - [ ] Roadmap de implementação

### Checklist de Testes

```bash
# Testes Unitários
npm run test:unit

# Testes de Integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

**Casos de Teste Importantes**:

1. **Criar Framework com Dados Válidos**
   - Input: Nome, descrição, versão válidos
   - Expected: Framework criado, toast de sucesso
   - Edge Case: Nome duplicado (deve permitir)

2. **Criar Framework com Dados Inválidos**
   - Input: Nome vazio ou muito curto
   - Expected: Erro de validação inline
   - Edge Case: Nome com 201 caracteres (deve rejeitar)

3. **Atualizar Status de Controle**
   - Input: Status 'failed' com findings
   - Expected: Status atualizado, findings salvas
   - Edge Case: Status 'failed' sem findings (deve avisar)

4. **Upload de Evidência**
   - Input: PDF válido < 10MB
   - Expected: Upload bem-sucedido, URL retornada
   - Edge Case: PDF > 10MB (deve rejeitar antes de upload)

5. **Excluir Framework com Controles**
   - Input: Framework com 50 controles
   - Expected: Modal de aviso, exclusão após confirmação
   - Edge Case: Controles ficam órfãos

6. **Gap Analysis com Múltiplos Frameworks**
   - Input: 3 frameworks ativos
   - Expected: Lista de gaps priorizados
   - Edge Case: Controle duplicado em 2 frameworks (deve aparecer 1x)

---

## ⚠️ Edge Cases

### 1. Concorrência

**Problema**: Dois usuários editam mesmo framework simultaneamente

**Comportamento Atual**: Last write wins (última escrita vence)

**Solução Futura**: 
- Implementar versioning
- Mostrar aviso de conflito
- Merge manual de mudanças

### 2. Framework Órfão

**Problema**: Controles sem framework_id

**Comportamento**: Controles aparecem em lista separada "Sem Framework"

**Ação**: Usuário deve reatribuir manualmente

### 3. Evidência Corrompida

**Problema**: Arquivo no storage mas registro no DB ausente

**Detecção**: Job noturno verifica integridade

**Ação**: Limpa arquivos órfãos automaticamente

### 4. Quota de Storage Excedida

**Problema**: Supabase storage quota 100% utilizada

**Comportamento**: Upload falha com erro 507

**Solução**:
1. Mostrar uso de storage no dashboard
2. Permitir exclusão em massa de evidências antigas
3. Sugerir upgrade de plano

### 5. Framework com Auditoria Ativa

**Problema**: Tentar excluir framework em auditoria

**Comportamento**: Bloqueio com erro 409

**Mensagem**: "Framework não pode ser excluído enquanto há auditorias ativas"

**Ação**: Finalizar ou cancelar auditorias primeiro

### 6. Controle Referenciado em Múltiplos Frameworks

**Problema**: Mesmo código de controle em 2+ frameworks

**Comportamento**: Permitido (são registros separados)

**Consideração**: Pode causar duplicação de esforço

**Solução Futura**: Controles compartilhados com referências

---

## 📝 Exemplos de Uso Completos

### Fluxo 1: Implementação Completa de Framework

```typescript
// 1. Criar framework
const framework = await createFramework({
  name: 'SOC 2 Type II',
  description: 'System and Organization Controls',
  version: '2023',
  status: 'active',
  total_controls: 64,
  passed_controls: 0
});

// 2. Adicionar controles
const controls = [
  { code: 'CC6.1', title: 'Logical Access Controls', ... },
  { code: 'CC6.2', title: 'MFA Implementation', ... },
  // ... 62 mais controles
];

for (const control of controls) {
  await createControl({
    ...control,
    framework_id: framework.id,
    status: 'pending'
  });
}

// 3. Para cada controle, fazer análise
for (const control of controls) {
  // Implementar controle
  // ...
  
  // Coletar evidências
  await uploadEvidence(file, control.id);
  
  // Atualizar status
  await updateControlStatus(control.id, 'passed');
}

// 4. Gerar relatório de gaps
const gaps = await analyzeGaps(framework.id);
exportGapReport(gaps);
```

### Fluxo 2: Auditoria de Conformidade

```typescript
// 1. Selecionar framework
const framework = await getFramework('framework-uuid');

// 2. Listar controles com status 'failed'
const failedControls = controls.filter(c => c.status === 'failed');

// 3. Para cada controle com falha
for (const control of failedControls) {
  // Ver findings
  console.log(control.findings);
  
  // Implementar correções
  // ...
  
  // Coletar novas evidências
  await uploadEvidence(evidenceFile, control.id);
  
  // Retestar
  await updateControlStatus(control.id, 'passed');
  
  // Limpar findings
  await updateControl(control.id, { findings: [] });
}

// 4. Recalcular score
const newScore = calculateComplianceScore(framework);
await updateFramework(framework.id, { 
  compliance_score: newScore 
});
```

---

## 🎓 Boas Práticas

1. **Sempre validar no client E server**: Nunca confie apenas em validação client-side
2. **Use transações**: Para operações que afetam múltiplas tabelas
3. **Implemente logging**: Para auditoria de mudanças
4. **Versione frameworks**: Mantenha histórico de mudanças
5. **Backup de evidências**: Faça backup regular do storage
6. **Monitore quota**: Alerte quando storage > 80%
7. **Use índices**: Para queries frequentes (framework_id, status)
8. **Cache inteligente**: Cache scores de compliance (TTL: 5min)

---

**Última atualização**: 2024-01-15  
**Versão**: 1.0.0  
**Autor**: Equipe de Compliance
