# 🎯 Documentação Completa: Módulo de Gestão de Riscos

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Cálculo de Score de Risco](#cálculo-de-score-de-risco)
4. [Operações CRUD](#operações-crud)
5. [Matriz de Risco Interativa](#matriz-de-risco-interativa)
6. [Logs de Auditoria](#logs-de-auditoria)
7. [Exemplos de JSON](#exemplos-de-json)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Edge Cases](#edge-cases)
10. [Checklist de Validação](#checklist-de-validação)

---

## 🎯 Visão Geral

Sistema completo de gestão de riscos organizacionais com cálculo automático de score baseado em probabilidade × impacto, matriz visual interativa, vinculação com controles e auditoria completa de mudanças.

### Funcionalidades Principais

- ✅ **CRUD completo** de riscos com validação
- 🧮 **Cálculo automático** de score (Probabilidade × Impacto)
- 📊 **Matriz de risco interativa** (heatmap visual)
- 👤 **Atribuição de responsáveis** com cargo
- 🔗 **Vinculação** com controles mitigadores
- 📝 **Logs de auditoria** para todas as mudanças
- 📈 **Tendências** de risco (aumentando/estável/diminuindo)
- 🎯 **Níveis de risco** com código de cores

---

## 🏗️ Arquitetura

### Componentes Principais

```
src/
├── hooks/
│   └── useRisks.tsx                  # Hook principal com lógica CRUD
├── components/
│   └── risk/
│       ├── CreateRiskModal.tsx       # Criar novo risco
│       ├── EditRiskModal.tsx         # Editar risco com cálculo automático
│       ├── RiskScoreCalculator.tsx   # Componente visual de cálculo
│       ├── RiskMatrix.tsx            # Matriz de risco interativa
│       ├── RiskRegistry.tsx          # Lista de riscos
│       └── RiskStats.tsx             # Estatísticas
└── pages/
    └── RiskManagement.tsx            # Página principal
```

### Banco de Dados (Supabase)

**Tabela: `risks`**
```sql
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  probability TEXT NOT NULL CHECK (probability IN ('low', 'medium', 'high')),
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high', 'critical')),
  owner TEXT,
  owner_role TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'accepted', 'transferred')),
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  last_review DATE,
  next_review DATE,
  controls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risks_user_id ON risks(user_id);
CREATE INDEX idx_risks_level ON risks(level);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_score ON risks(risk_score DESC);
```

**Tabela: `audit_logs`**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## 🧮 Cálculo de Score de Risco

### Fórmula Base

```
Score = Probabilidade × Impacto
```

### Mapeamento de Valores

**Probabilidade:**
| Nível | Valor | Descrição | Percentual |
|-------|-------|-----------|------------|
| Baixa | 1 | Evento raro, improvável de ocorrer | < 25% |
| Média | 2 | Evento possível, pode ocorrer | 25-50% |
| Alta | 3 | Evento provável, esperado que ocorra | > 50% |

**Impacto:**
| Nível | Valor | Descrição | Financeiro |
|-------|-------|-----------|------------|
| Baixo | 1 | Impacto mínimo, facilmente recuperável | < $10k |
| Médio | 2 | Impacto significativo, requer esforço para recuperar | $10k-$100k |
| Alto | 3 | Impacto severo, grandes consequências | $100k-$1M |
| Crítico | 4 | Impacto catastrófico, ameaça à continuidade | > $1M |

### Determinação do Nível de Risco

```typescript
/**
 * Determina o nível de risco baseado no score calculado
 * 
 * @param score - Score calculado (1-12)
 * @returns Nível de risco
 */
function determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 2) return 'low';       // 1-2: Zona Verde
  if (score <= 4) return 'medium';    // 3-4: Zona Amarela
  if (score <= 8) return 'high';      // 6-8: Zona Laranja
  return 'critical';                  // 9-12: Zona Vermelha
}
```

### Matriz de Score

|             | **Baixo (1)** | **Médio (2)** | **Alto (3)** | **Crítico (4)** |
|-------------|---------------|---------------|--------------|-----------------|
| **Alta (3)** | 3 (Médio) | 6 (Alto) | 9 (Crítico) | 12 (Crítico) |
| **Média (2)** | 2 (Baixo) | 4 (Médio) | 6 (Alto) | 8 (Alto) |
| **Baixa (1)** | 1 (Baixo) | 2 (Baixo) | 3 (Médio) | 4 (Médio) |

### Recomendações por Nível

| Nível | Score | Ação Recomendada | Prazo | Revisão |
|-------|-------|------------------|-------|---------|
| **Baixo** | 1-2 | Monitorar, aceitar | Nenhum | Anual |
| **Médio** | 3-4 | Avaliar controles existentes | 90 dias | Semestral |
| **Alto** | 6-8 | Implementar mitigações | 30 dias | Trimestral |
| **Crítico** | 9-12 | Ação imediata obrigatória | 7 dias | Mensal |

---

## ⚙️ Operações CRUD

### 1. Criar Risco

**Arquivo**: `src/components/risk/CreateRiskModal.tsx`

**Função**:
```typescript
/**
 * Cria um novo risco com cálculo automático de score
 * 
 * @param riskData - Dados do risco
 * @returns Promise<Risk> - Risco criado
 * @throws {Error} Se validação falhar
 * 
 * Validações:
 * - title: obrigatório, 5-200 caracteres
 * - description: opcional, max 2000 caracteres
 * - category: obrigatório, enum
 * - probability: obrigatório, ['low', 'medium', 'high']
 * - impact: obrigatório, ['low', 'medium', 'high', 'critical']
 * - owner: opcional, max 100 caracteres
 * 
 * Cálculo Automático:
 * - riskScore: calculado automaticamente
 * - level: determinado baseado no score
 * - created_at: timestamp atual
 * - updated_at: timestamp atual
 */
async createRisk(riskData: Omit<Risk, 'id' | 'riskScore' | 'level' | 'created_at' | 'updated_at'>): Promise<Risk>
```

**Exemplo de Uso**:
```tsx
const { createRisk } = useRisks();

await createRisk({
  title: 'Falha no Sistema de Backup',
  description: 'Risco de perda de dados críticos por falha no sistema de backup principal',
  category: 'Operacional',
  probability: 'medium',
  impact: 'high',
  owner: 'Carlos Silva',
  ownerRole: 'Infrastructure Lead',
  status: 'active',
  trend: 'stable',
  controls: ['Backup Secundário', 'Monitoramento 24/7', 'Testes Mensais'],
  nextReview: '2024-03-15'
});
// Score será calculado automaticamente: 2 × 3 = 6 (Alto)
```

**JSON de Entrada**:
```json
{
  "title": "Vazamento de Dados Pessoais",
  "description": "Exposição não autorizada de dados de clientes por vulnerabilidade no sistema",
  "category": "Segurança",
  "probability": "low",
  "impact": "critical",
  "owner": "Ana Rodrigues",
  "ownerRole": "DPO",
  "status": "active",
  "trend": "decreasing",
  "controls": ["Criptografia", "DLP", "MFA", "Treinamento LGPD"],
  "nextReview": "2024-02-01"
}
```

**JSON de Saída (Sucesso)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Vazamento de Dados Pessoais",
    "description": "Exposição não autorizada de dados de clientes por vulnerabilidade no sistema",
    "category": "Segurança",
    "probability": "low",
    "impact": "critical",
    "riskScore": 4,
    "level": "medium",
    "owner": "Ana Rodrigues",
    "ownerRole": "DPO",
    "status": "active",
    "trend": "decreasing",
    "lastReview": null,
    "nextReview": "2024-02-01",
    "controls": ["Criptografia", "DLP", "MFA", "Treinamento LGPD"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Atualizar Risco

**Arquivo**: `src/components/risk/EditRiskModal.tsx`

**Função**:
```typescript
/**
 * Atualiza um risco existente com recálculo automático de score
 * 
 * @param riskId - UUID do risco
 * @param updates - Campos a atualizar
 * @returns Promise<void>
 * @throws {Error} Se risco não encontrado ou user não é dono
 * 
 * Recálculo Automático:
 * - Se probability ou impact mudar: recalcula score e level
 * - updated_at: atualizado automaticamente
 * 
 * Auditoria:
 * - Captura valores antigos e novos
 * - Cria log de auditoria automático
 * - Registra quem fez a mudança e quando
 * 
 * Edge Cases:
 * - Mudar para status 'mitigated': verifica se há controles implementados
 * - Aumentar score acima de 8: gera alerta automático
 * - Next review no passado: mostra aviso
 */
async updateRisk(riskId: string, updates: Partial<Risk>): Promise<void>
```

**Exemplo de Atualização de Probabilidade**:
```typescript
// Risco original: probability = 'low', impact = 'critical', score = 4
await updateRisk('risk-uuid', {
  probability: 'medium',  // Mudou de 'low' para 'medium'
  trend: 'increasing'
});
// Novo score: 2 × 4 = 8 (Alto)
// Nível muda de 'medium' para 'high'
// Gera alerta automático
```

**JSON de Entrada (Atualização)**:
```json
{
  "probability": "high",
  "trend": "increasing",
  "status": "active"
}
```

**JSON de Saída (Sucesso)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "riskScore": 12,
    "level": "critical",
    "probability": "high",
    "trend": "increasing",
    "updated_at": "2024-01-15T14:45:00Z"
  },
  "audit": {
    "log_id": "audit-uuid",
    "changes": {
      "probability": {"old": "medium", "new": "high"},
      "riskScore": {"old": 8, "new": 12},
      "level": {"old": "high", "new": "critical"},
      "trend": {"old": "stable", "new": "increasing"}
    }
  }
}
```

### 3. Excluir Risco

**Função**:
```typescript
/**
 * Exclui um risco permanentemente
 * 
 * @param riskId - UUID do risco
 * @returns Promise<void>
 * @throws {Error} Se risco não existe ou user não é dono
 * 
 * Comportamento:
 * - Soft delete: marca como deleted ao invés de remover
 * - Mantém histórico de auditoria
 * - Remove vinculações com controles
 * 
 * Edge Cases:
 * - Risco crítico ativo: requer confirmação extra
 * - Risco com incidentes associados: bloqueia exclusão
 * - Risco referenciado em relatórios: mantém histórico
 */
async deleteRisk(riskId: string): Promise<void>
```

---

## 📊 Matriz de Risco Interativa

**Arquivo**: `src/components/risk/RiskMatrix.tsx`

### Estrutura Visual

A matriz exibe riscos em uma grade 3×4:
- **Eixo Y (Probabilidade)**: Baixa, Média, Alta
- **Eixo X (Impacto)**: Baixo, Médio, Alto, Crítico
- **Células**: Coloridas baseadas no score

### Código de Cores

```css
/* Baixo (1-2): Verde */
.risk-low {
  background: hsl(var(--success) / 0.2);
  border: 1px solid hsl(var(--success) / 0.3);
}

/* Médio (3-4): Azul */
.risk-medium {
  background: hsl(var(--info) / 0.2);
  border: 1px solid hsl(var(--info) / 0.3);
}

/* Alto (6-8): Laranja */
.risk-high {
  background: hsl(var(--warning) / 0.2);
  border: 1px solid hsl(var(--warning) / 0.3);
}

/* Crítico (9-12): Vermelho */
.risk-critical {
  background: hsl(var(--destructive) / 0.2);
  border: 1px solid hsl(var(--destructive) / 0.3);
}
```

### Interatividade

**Hover**:
- Mostra lista de riscos naquela célula
- Exibe título e descrição resumida
- Indica número de riscos

**Click**:
- Filtra lista de riscos para aquela célula
- Permite ações em massa

**Intensidade de Cor**:
- Quanto mais riscos, mais intensa a cor
- 0 riscos: opacidade 5%
- 1 risco: opacidade 20%
- 2-3 riscos: opacidade 40%
- 4+ riscos: opacidade 60%

### Exemplo de Dados da Matriz

```json
{
  "matrix": [
    [
      {
        "probability": "high",
        "impact": "low",
        "score": 3,
        "level": "medium",
        "count": 2,
        "risks": [
          {
            "id": "uuid-1",
            "title": "Falha de Hardware Não-Crítico"
          },
          {
            "id": "uuid-2",
            "title": "Atraso em Fornecimento"
          }
        ]
      },
      {
        "probability": "high",
        "impact": "medium",
        "score": 6,
        "level": "high",
        "count": 5,
        "risks": [...]
      }
    ]
  ],
  "summary": {
    "total_risks": 24,
    "critical": 3,
    "high": 8,
    "medium": 10,
    "low": 3
  }
}
```

---

## 📝 Logs de Auditoria

### Estrutura do Log

**Campos Principais**:
- `id`: UUID do log
- `user_id`: Quem fez a mudança
- `action`: Tipo de ação ('risk_created', 'risk_updated', 'risk_deleted')
- `resource_type`: 'risk'
- `resource_id`: UUID do risco
- `old_data`: Estado anterior (JSON)
- `new_data`: Estado novo (JSON)
- `ip_address`: IP do usuário (opcional)
- `user_agent`: Browser do usuário (opcional)
- `created_at`: Timestamp da ação

### Tipos de Ações

| Ação | Descrição | Campos Capturados |
|------|-----------|-------------------|
| `risk_created` | Novo risco criado | new_data: todos os campos |
| `risk_updated` | Risco atualizado | old_data + new_data: campos alterados |
| `risk_deleted` | Risco excluído | old_data: todos os campos |
| `risk_status_changed` | Status mudou | old/new: status, motivo |
| `risk_escalated` | Score aumentou para crítico | old/new: score, level |

### Exemplo de Log Completo

```json
{
  "id": "log-uuid",
  "user_id": "user-uuid",
  "action": "risk_updated",
  "resource_type": "risk",
  "resource_id": "risk-uuid",
  "old_data": {
    "title": "Data Breach Risk",
    "probability": "low",
    "impact": "critical",
    "riskScore": 4,
    "level": "medium",
    "status": "active",
    "trend": "stable"
  },
  "new_data": {
    "title": "Data Breach Risk - URGENT",
    "probability": "high",
    "impact": "critical",
    "riskScore": 12,
    "level": "critical",
    "status": "active",
    "trend": "increasing"
  },
  "changes": {
    "title": {
      "old": "Data Breach Risk",
      "new": "Data Breach Risk - URGENT"
    },
    "probability": {
      "old": "low",
      "new": "high"
    },
    "riskScore": {
      "old": 4,
      "new": 12
    },
    "level": {
      "old": "medium",
      "new": "critical"
    },
    "trend": {
      "old": "stable",
      "new": "increasing"
    }
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0",
  "created_at": "2024-01-15T14:45:23.456Z"
}
```

### Consulta de Logs

```typescript
/**
 * Consulta logs de auditoria de um risco específico
 * 
 * @param riskId - UUID do risco
 * @returns Array de logs ordenados por data (mais recente primeiro)
 */
async function getRiskAuditLogs(riskId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', 'risk')
    .eq('resource_id', riskId)
    .order('created_at', { ascending: false });
  
  return data;
}
```

---

## 🔧 Tratamento de Erros

### Códigos de Erro Específicos

| Código | Descrição | Ação Sugerida |
|--------|-----------|---------------|
| **RISK_001** | Título obrigatório | Preencher campo título |
| **RISK_002** | Probabilidade inválida | Selecionar valor válido |
| **RISK_003** | Impacto inválido | Selecionar valor válido |
| **RISK_004** | Score fora do range | Verificar cálculo |
| **RISK_005** | Risco não encontrado | Verificar ID |
| **RISK_006** | Usuário sem permissão | Verificar ownership |
| **RISK_007** | Next review no passado | Atualizar data |
| **RISK_008** | Controle não existe | Verificar vinculação |

### Exemplo de Tratamento

```typescript
try {
  await createRisk(riskData);
} catch (error) {
  if (error.code === 'RISK_001') {
    toast({
      title: 'Título obrigatório',
      description: 'Por favor, preencha o título do risco',
      variant: 'destructive'
    });
  } else if (error.code === 'RISK_007') {
    toast({
      title: 'Data de revisão inválida',
      description: 'A próxima revisão deve ser uma data futura',
      variant: 'warning'
    });
  } else {
    toast({
      title: 'Erro ao criar risco',
      description: error.message,
      variant: 'destructive'
    });
  }
}
```

---

## ⚠️ Edge Cases

### 1. Recálculo Automático de Score

**Cenário**: Usuário muda probability de 'low' para 'high'

**Comportamento**:
- Score recalcula imediatamente (sem salvar)
- Level atualiza visualmente
- Cor do badge muda
- Se score > 8: mostra aviso "Risco Crítico!"

**Código**:
```typescript
useEffect(() => {
  const score = calculateRiskScore(probability, impact);
  setRiskScore(score);
  
  // Determinar novo nível
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (score <= 2) level = 'low';
  else if (score <= 4) level = 'medium';
  else if (score <= 8) level = 'high';
  else level = 'critical';
  
  setRiskLevel(level);
  
  // Mostrar aviso se crítico
  if (level === 'critical' && previousLevel !== 'critical') {
    showCriticalAlert();
  }
}, [probability, impact]);
```

### 2. Matriz com Muitos Riscos em Uma Célula

**Cenário**: 15 riscos com probability='high' e impact='critical'

**Comportamento**:
- Célula mostra badge "15"
- Tooltip mostra primeiros 5 riscos + "e mais 10"
- Click abre modal com lista completa
- Cor da célula: opacidade máxima (60%)

### 3. Mudança de Status para 'Mitigated'

**Cenário**: Usuário marca risco como 'mitigated'

**Validação**:
1. Verifica se há controles associados
2. Se não há: mostra aviso "Adicione controles antes de marcar como mitigado"
3. Se há: permite mudança e solicita data de mitigação

**Código**:
```typescript
const handleStatusChange = (newStatus: string) => {
  if (newStatus === 'mitigated') {
    if (controls.length === 0) {
      toast({
        title: 'Controles necessários',
        description: 'Adicione pelo menos um controle antes de marcar como mitigado',
        variant: 'warning'
      });
      return;
    }
    
    // Solicitar data e evidências
    openMitigationModal();
  }
  
  setStatus(newStatus);
};
```

### 4. Concorrência (Dois Usuários Editando)

**Cenário**: User A e User B editam mesmo risco simultaneamente

**Comportamento Atual**: Last write wins

**Solução Futura**:
- Implementar versioning com `version` field
- Mostrar aviso: "Outro usuário editou este risco. Deseja ver as mudanças?"
- Opção de merge manual

---

## ✅ Checklist de Validação

### Funcionalidades

- [ ] **CRUD de Riscos**
  - [ ] Criar novo risco
  - [ ] Editar risco existente
  - [ ] Excluir risco
  - [ ] Listar riscos com filtros
  - [ ] Pesquisar riscos

- [ ] **Cálculo de Score**
  - [ ] Score calcula corretamente (Prob × Impacto)
  - [ ] Level determina corretamente baseado no score
  - [ ] Recálculo automático ao mudar prob/impacto
  - [ ] Visual feedback durante edição

- [ ] **Matriz de Risco**
  - [ ] Exibe todos os riscos na matriz
  - [ ] Cores corretas por nível
  - [ ] Intensidade varia com número de riscos
  - [ ] Tooltip mostra riscos ao hover
  - [ ] Click filtra lista de riscos

- [ ] **Auditoria**
  - [ ] Log criado em create
  - [ ] Log criado em update com diff
  - [ ] Log criado em delete
  - [ ] Logs consultáveis por risco
  - [ ] Logs consultáveis por usuário

- [ ] **Vinculação com Controles**
  - [ ] Adicionar controles a risco
  - [ ] Remover controles de risco
  - [ ] Listar riscos por controle
  - [ ] Validação antes de marcar como mitigado

### Testes

```bash
# Teste de Cálculo de Score
describe('calculateRiskScore', () => {
  it('low probability × low impact = 1 (low)', () => {
    expect(calculateRiskScore('low', 'low')).toBe(1);
  });
  
  it('high probability × critical impact = 12 (critical)', () => {
    expect(calculateRiskScore('high', 'critical')).toBe(12);
  });
  
  it('medium probability × high impact = 6 (high)', () => {
    expect(calculateRiskScore('medium', 'high')).toBe(6);
  });
});

# Teste de Determinação de Nível
describe('determineRiskLevel', () => {
  it('score 1-2 = low', () => {
    expect(determineRiskLevel(1)).toBe('low');
    expect(determineRiskLevel(2)).toBe('low');
  });
  
  it('score 9-12 = critical', () => {
    expect(determineRiskLevel(9)).toBe('critical');
    expect(determineRiskLevel(12)).toBe('critical');
  });
});
```

---

## 📊 Exemplos de Uso Completos

### Fluxo 1: Criação e Gerenciamento de Risco

```typescript
// 1. Criar risco
const newRisk = await createRisk({
  title: 'Ransomware Attack',
  description: 'Potential ransomware attack on critical systems',
  category: 'Segurança',
  probability: 'medium',
  impact: 'critical',
  owner: 'CISO',
  ownerRole: 'Chief Information Security Officer',
  status: 'active',
  trend: 'increasing',
  controls: [],
  nextReview: '2024-02-01'
});
// Score: 8 (Alto)

// 2. Adicionar controles
await updateRisk(newRisk.id, {
  controls: [
    'Antivírus Enterprise',
    'EDR Solution',
    'Backup Offsite',
    'User Training',
    'Network Segmentation'
  ]
});

// 3. Reavaliar após implementação de controles
await updateRisk(newRisk.id, {
  probability: 'low',  // Reduziu de 'medium' para 'low'
  trend: 'decreasing',
  status: 'mitigated',
  lastReview: '2024-01-20'
});
// Novo Score: 4 (Médio)

// 4. Ver logs de auditoria
const logs = await getRiskAuditLogs(newRisk.id);
console.log('Histórico:', logs);
```

### Fluxo 2: Análise de Riscos por Matriz

```typescript
// 1. Obter todos os riscos
const { risks } = useRisks();

// 2. Analisar distribuição
const distribution = risks.reduce((acc, risk) => {
  const key = `${risk.probability}_${risk.impact}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

console.log('Distribuição:', distribution);
// {
//   "high_critical": 3,  // Zona Vermelha
//   "medium_high": 5,    // Zona Laranja
//   "low_medium": 8,     // Zona Amarela
//   "low_low": 2         // Zona Verde
// }

// 3. Identificar riscos críticos
const criticalRisks = risks.filter(r => r.level === 'critical');
console.log(`${criticalRisks.length} riscos críticos requerem ação imediata`);

// 4. Gerar relatório
const report = {
  total: risks.length,
  byLevel: {
    critical: risks.filter(r => r.level === 'critical').length,
    high: risks.filter(r => r.level === 'high').length,
    medium: risks.filter(r => r.level === 'medium').length,
    low: risks.filter(r => r.level === 'low').length,
  },
  trend: {
    increasing: risks.filter(r => r.trend === 'increasing').length,
    stable: risks.filter(r => r.trend === 'stable').length,
    decreasing: risks.filter(r => r.trend === 'decreasing').length,
  }
};
```

---

**Última atualização**: 2024-01-15  
**Versão**: 1.0.0  
**Autor**: Equipe de Risk Management
