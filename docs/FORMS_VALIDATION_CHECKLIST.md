# Checklist de Validação de Formulários

## 📋 Visão Geral

Este documento fornece um checklist completo para implementação e verificação de validação de formulários em toda a aplicação ComplianceSync.

## 🎯 Objetivo

Garantir que todos os formulários tenham:
- ✅ Validação de campos obrigatórios e formatos
- ✅ Mensagens de erro claras e exemplos de dados válidos/inválidos
- ✅ Feedback visual de erro em tempo real
- ✅ Bloqueio de envio até validação completa
- ✅ Documentação completa com docstrings

---

## 📚 Schemas de Validação Centralizados

### Localização
Todos os schemas Zod estão centralizados em: `src/lib/form-schemas.ts`

### Schemas Disponíveis

| Schema | Uso | Exemplo |
|--------|-----|---------|
| `policySchema` | Criação/edição de políticas | `policySchema.safeParse(formData)` |
| `controlSchema` | Criação/edição de controles | `controlSchema.safeParse(formData)` |
| `auditSchema` | Criação/edição de auditorias | `auditSchema.safeParse(formData)` |
| `riskSchema` | Criação/edição de riscos | `riskSchema.safeParse(formData)` |
| `incidentSchema` | Reporte de incidentes | `incidentSchema.safeParse(formData)` |
| `trainingSchema` | Criação de treinamentos | `trainingSchema.safeParse(formData)` |
| `changePasswordSchema` | Alteração de senha | `changePasswordSchema.safeParse(formData)` |

### Schemas Auxiliares

| Schema | Descrição | Exemplo Válido | Exemplo Inválido |
|--------|-----------|----------------|------------------|
| `nameSchema` | Nome genérico (3-200 chars) | "Política de Segurança" | "AB" |
| `codeSchema` | Código alfanumérico | "AC-001" | "AC 001" |
| `versionSchema` | Versão de documento | "1.0", "v2.3.1" | "versão 1" |
| `emailSchema` | Email válido | "usuario@exemplo.com" | "usuario@" |
| `personNameSchema` | Nome de pessoa | "João Silva" | "João123" |
| `futureDateSchema` | Data futura | `new Date('2025-12-31')` | `new Date('2020-01-01')` |

---

## ✅ Checklist de Implementação

### 1. Criação de Formulário

#### □ Importações Necessárias
```typescript
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { [schema]Schema, formatValidationErrors } from '@/lib/form-schemas';
```

#### □ Estado do Formulário
```typescript
const [formData, setFormData] = useState({
  // Campos do formulário
});
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
const [loading, setLoading] = useState(false);
```

#### □ Função de Validação Individual
```typescript
/**
 * Valida campo individual em tempo real
 * 
 * @param {string} field - Nome do campo
 * @param {any} value - Valor do campo
 */
const validateField = (field: string, value: any) => {
  try {
    const fieldSchema = [schema]Schema.shape[field as keyof typeof [schema]Schema.shape];
    if (fieldSchema) {
      fieldSchema.parse(value);
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  } catch (error: any) {
    if (error.errors?.[0]?.message) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: error.errors[0].message
      }));
    }
  }
};
```

#### □ Handler de Mudança de Campo
```typescript
/**
 * Handler para mudanças em campos
 * 
 * @param {string} field - Nome do campo
 * @param {any} value - Novo valor
 */
const handleFieldChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  validateField(field, value);
};
```

#### □ Função de Submissão
```typescript
/**
 * Submete formulário após validação completa
 * 
 * @param {React.FormEvent} e - Evento do formulário
 * 
 * Edge cases:
 * - Campos vazios ou inválidos: bloqueado pela validação
 * - Erro de rede: tratado com toast
 */
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const validation = [schema]Schema.safeParse(formData);
  
  if (!validation.success) {
    const errors = formatValidationErrors(validation.error);
    setValidationErrors(errors);
    toast.error("Por favor, corrija os erros no formulário");
    return;
  }
  
  setLoading(true);
  try {
    await [createFunction](formData);
    toast.success("Criado com sucesso!");
    // Reset e fechar
  } catch (error) {
    toast.error("Erro ao criar");
  } finally {
    setLoading(false);
  }
};
```

### 2. Campos de Input

#### □ Input de Texto
```tsx
<div className="space-y-2">
  <Label htmlFor="[field]">[Label] *</Label>
  <Input
    id="[field]"
    value={formData.[field]}
    onChange={(e) => handleFieldChange('[field]', e.target.value)}
    placeholder="Ex: [exemplo]"
    className={cn(validationErrors.[field] && "border-destructive")}
    required
  />
  {validationErrors.[field] && (
    <p className="text-sm text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {validationErrors.[field]}
    </p>
  )}
  <p className="text-xs text-muted-foreground">
    [Dica de formato ou requisito]
  </p>
</div>
```

#### □ Select Dropdown
```tsx
<div className="space-y-2">
  <Label htmlFor="[field]">[Label] *</Label>
  <Select 
    value={formData.[field]} 
    onValueChange={(value) => handleFieldChange('[field]', value)}
  >
    <SelectTrigger className={cn(validationErrors.[field] && "border-destructive")}>
      <SelectValue placeholder="Selecione..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="[value1]">[Label1]</SelectItem>
      <SelectItem value="[value2]">[Label2]</SelectItem>
    </SelectContent>
  </Select>
  {validationErrors.[field] && (
    <p className="text-sm text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {validationErrors.[field]}
    </p>
  )}
</div>
```

#### □ Textarea
```tsx
<div className="space-y-2">
  <Label htmlFor="[field]">[Label]</Label>
  <Textarea
    id="[field]"
    value={formData.[field]}
    onChange={(e) => handleFieldChange('[field]', e.target.value)}
    placeholder="[Descrição...]"
    className={cn(validationErrors.[field] && "border-destructive")}
    rows={3}
  />
  {validationErrors.[field] && (
    <p className="text-sm text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {validationErrors.[field]}
    </p>
  )}
  <p className="text-xs text-muted-foreground">
    [Dica de formato]
  </p>
</div>
```

#### □ Date Picker
```tsx
<div className="space-y-2">
  <Label htmlFor="[field]">[Label]</Label>
  <Input
    id="[field]"
    type="date"
    value={formData.[field]}
    onChange={(e) => handleFieldChange('[field]', e.target.value)}
    className={cn(validationErrors.[field] && "border-destructive")}
  />
  {validationErrors.[field] && (
    <p className="text-sm text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {validationErrors.[field]}
    </p>
  )}
</div>
```

### 3. Alerta de Validação Global

#### □ Alerta de Erros
```tsx
{Object.keys(validationErrors).length > 0 && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Corrija os erros acima antes de [ação]
    </AlertDescription>
  </Alert>
)}
```

### 4. Botões de Ação

#### □ Botões do Formulário
```tsx
<div className="flex gap-3 justify-end">
  <Button type="button" variant="outline" onClick={handleCancel}>
    Cancelar
  </Button>
  <Button 
    type="submit" 
    disabled={loading || Object.keys(validationErrors).length > 0}
  >
    {loading ? "[Ação]ando..." : "[Ação]"}
  </Button>
</div>
```

---

## 🎨 Estilos Visuais de Erro

### Borda Vermelha em Campo Inválido
```tsx
className={cn(validationErrors.[field] && "border-destructive")}
```

### Mensagem de Erro com Ícone
```tsx
{validationErrors.[field] && (
  <p className="text-sm text-destructive flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    {validationErrors.[field]}
  </p>
)}
```

### Dica de Formato
```tsx
<p className="text-xs text-muted-foreground">
  [Exemplo de formato válido]
</p>
```

---

## 📝 Documentação Obrigatória

### JSDoc no Componente
```typescript
/**
 * [Nome do Modal/Formulário]
 * 
 * @component
 * @description
 * [Descrição breve do que o formulário faz]
 * 
 * Validações implementadas:
 * - [Validação 1]
 * - [Validação 2]
 * 
 * Edge cases tratados:
 * - [Edge case 1]
 * - [Edge case 2]
 * 
 * @example
 * ```tsx
 * <[Component] onSuccess={() => refetch()} />
 * ```
 */
```

### JSDoc nas Funções
```typescript
/**
 * [Descrição da função]
 * 
 * @param {type} param - [Descrição do parâmetro]
 * @returns {type} - [Descrição do retorno]
 * 
 * @description
 * [Descrição detalhada do que a função faz]
 * 
 * Edge cases:
 * - [Edge case 1]
 * - [Edge case 2]
 */
```

---

## 🧪 Testes Sugeridos

### Testes Unitários (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { [schema]Schema } from '@/lib/form-schemas';

describe('[Schema] Validation', () => {
  it('deve aceitar dados válidos', () => {
    const validData = {
      // Dados válidos
    };
    const result = [schema]Schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar [campo] inválido', () => {
    const invalidData = {
      // Dados com campo inválido
    };
    const result = [schema]Schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('[mensagem esperada]');
  });
});
```

### Testes de Componente (React Testing Library)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { [Component] } from './[Component]';

describe('[Component]', () => {
  it('deve exibir erro para campo vazio obrigatório', async () => {
    render(<[Component] />);
    
    const submitButton = screen.getByRole('button', { name: /[ação]/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/[mensagem de erro]/i)).toBeInTheDocument();
    });
  });

  it('deve bloquear submissão com erros de validação', () => {
    render(<[Component] />);
    
    const input = screen.getByLabelText(/[campo]/i);
    fireEvent.change(input, { target: { value: '[valor inválido]' } });
    
    const submitButton = screen.getByRole('button', { name: /[ação]/i });
    expect(submitButton).toBeDisabled();
  });
});
```

---

## 🔍 Verificação de Conformidade

### Checklist de Revisão de Código

- [ ] Todos os campos obrigatórios têm validação
- [ ] Campos opcionais permitem valor vazio
- [ ] Mensagens de erro são claras e específicas
- [ ] Exemplos de formato são fornecidos
- [ ] Validação em tempo real está funcionando
- [ ] Botão de envio é bloqueado com erros
- [ ] Feedback visual (bordas vermelhas) está presente
- [ ] Ícones de erro são exibidos
- [ ] Alerta global de erro é mostrado quando há erros
- [ ] Documentação JSDoc está completa
- [ ] Edge cases estão documentados
- [ ] Testes unitários cobrem casos principais

---

## 📊 Formulários Implementados

### Status de Implementação

| Formulário | Status | Schema | Validação Real-Time | Documentação |
|-----------|--------|--------|---------------------|--------------|
| CreatePolicyModal | ✅ Completo | `policySchema` | ✅ Sim | ✅ Sim |
| EditPolicyModal | 🔄 Parcial | - | ❌ Não | ❌ Não |
| ChangePasswordModal | ✅ Completo | `changePasswordSchema` | ✅ Sim | ✅ Sim |
| CreateControlModal | ❌ Pendente | `controlSchema` | ❌ Não | ❌ Não |
| CreateAuditModal | ❌ Pendente | `auditSchema` | ❌ Não | ❌ Não |
| ReportIncidentModal | ❌ Pendente | `incidentSchema` | ❌ Não | ❌ Não |
| CreateTrainingModal | ❌ Pendente | `trainingSchema` | ❌ Não | ❌ Não |
| CreateRiskModal | ❌ Pendente | `riskSchema` | ❌ Não | ❌ Não |

### Legenda
- ✅ Completo
- 🔄 Parcial
- ❌ Pendente

---

## 🚀 Próximos Passos

### Prioridade Alta
1. ✅ Criar schemas centralizados (Completo)
2. ✅ Implementar `CreatePolicyModal` (Completo)
3. ✅ Implementar `ChangePasswordModal` (Completo)
4. ⏳ Implementar `CreateControlModal`
5. ⏳ Implementar `CreateAuditModal`

### Prioridade Média
6. ⏳ Implementar `ReportIncidentModal`
7. ⏳ Implementar `CreateTrainingModal`
8. ⏳ Atualizar `EditPolicyModal` com validação

### Prioridade Baixa
9. ⏳ Implementar `CreateRiskModal`
10. ⏳ Revisar formulários menores (filtros, pesquisa)

---

## 📚 Recursos Adicionais

### Documentação
- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Shadcn/UI Forms](https://ui.shadcn.com/docs/components/form)

### Exemplos de Código
- `src/lib/form-schemas.ts` - Todos os schemas
- `src/lib/auth-schemas.ts` - Schemas de autenticação
- `src/components/policies/CreatePolicyModal.tsx` - Exemplo completo
- `src/components/settings/ChangePasswordModal.tsx` - Exemplo de senha

---

## 💡 Dicas e Boas Práticas

### 1. Mensagens de Erro Claras
❌ Ruim: "Campo inválido"  
✅ Bom: "Nome deve ter no mínimo 3 caracteres"

### 2. Exemplos de Formato
Sempre forneça exemplos de formatos válidos:
```tsx
<p className="text-xs text-muted-foreground">
  Exemplo: usuario@exemplo.com
</p>
```

### 3. Validação Progressiva
- Valide campos individuais ao digitar
- Valide relacionamentos (ex: datas) no submit
- Não valide demais (evite validação a cada tecla)

### 4. Feedback Visual Imediato
- Bordas vermelhas para campos inválidos
- Ícones de erro ao lado da mensagem
- Alerta global no topo do formulário

### 5. Acessibilidade
- Use `required` em campos obrigatórios
- Associe labels com IDs (`htmlFor`)
- Forneça `aria-invalid` para leitores de tela

---

## 🐛 Edge Cases Comuns

### 1. Datas Relacionadas
```typescript
// reviewDate deve ser após effectiveDate
.refine(
  (data) => {
    if (data.effectiveDate && data.reviewDate) {
      return data.reviewDate > data.effectiveDate;
    }
    return true;
  },
  {
    message: "Data de revisão deve ser posterior à data de vigência",
    path: ["reviewDate"]
  }
)
```

### 2. Senhas Coincidentes
```typescript
// confirmPassword deve ser igual a newPassword
.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "As senhas não coincidem",
    path: ["confirmPassword"]
  }
)
```

### 3. Campos Opcionais vs Vazios
```typescript
// Permitir string vazia ou valor válido
.optional().or(z.literal(''))
```

### 4. Arrays com Mínimo de Elementos
```typescript
// Pelo menos 1 sistema afetado
z.array(z.string()).min(1, { message: "Selecione pelo menos um sistema" })
```

---

**Última Atualização:** 2024-11-14  
**Versão:** 1.0  
**Autor:** ComplianceSync Dev Team
