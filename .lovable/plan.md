

# Plano: Corrigir Erro de Build de Produção (Cliente Supabase Duplicado)

## Diagnóstico

**O problema NÃO é com as credenciais do banco** - elas estão corretas.

O problema é que existem **dois clientes Supabase** no projeto:

| Arquivo | Problema |
|---------|----------|
| `src/integrations/supabase/client.ts` | Cliente correto com credenciais hardcoded |
| `src/lib/supabase.ts` | Usa `import.meta.env.VITE_*` e lança erro se não encontrar |

Durante o build de produção, as variáveis `VITE_*` podem não estar disponíveis, causando:

```typescript
// src/lib/supabase.ts - linha 8-10
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables...')  // ← QUEBRA O BUILD
}
```

Três hooks importam do arquivo problemático:
- `src/hooks/useReports.tsx`
- `src/hooks/useAccess.tsx`
- `src/hooks/useRisks.tsx`

---

## Solução

### Opção 1: Corrigir o `src/lib/supabase.ts` (Menos invasiva)

Usar fallback para as credenciais hardcoded, igual ao `client.ts`:

```typescript
// Linha 3-10 de src/lib/supabase.ts
const supabaseUrl = 'https://ofbyxnpprwwuieabwhdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Remover o throw de validação
```

### Opção 2: Unificar para usar apenas `@/integrations/supabase/client` (Recomendada)

Atualizar os 3 hooks para importar do cliente oficial:

```typescript
// Antes
import { supabase } from '@/lib/supabase';

// Depois
import { supabase } from '@/integrations/supabase/client';
```

---

## Implementação Recomendada (Opção 2)

| Arquivo | Ação |
|---------|------|
| `src/hooks/useReports.tsx` | Alterar import para `@/integrations/supabase/client` |
| `src/hooks/useAccess.tsx` | Alterar import para `@/integrations/supabase/client` |
| `src/hooks/useRisks.tsx` | Alterar import para `@/integrations/supabase/client` |
| `src/lib/supabase.ts` | Remover validação que lança erro OU deletar arquivo |

### Mudança Concreta

Para cada um dos 3 hooks, linha 2:

```typescript
// DE:
import { supabase } from '@/lib/supabase';

// PARA:
import { supabase } from '@/integrations/supabase/client';
```

E em `src/lib/supabase.ts`, linhas 4-10:

```typescript
// DE:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables...')
}

// PARA:
const supabaseUrl = 'https://ofbyxnpprwwuieabwhdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYnl4bnBwcnd3dWllYWJ3aGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDY4NTEsImV4cCI6MjA3MzE4Mjg1MX0.aHH2NWUQZnvV6FALdBIP5SB02YbrE8u12lXI1DtIbiw';
```

---

## Resultado Esperado

Após as correções:
1. O build de produção passa sem erros
2. Nenhum `throw` é executado durante a inicialização
3. Todos os hooks usam o mesmo cliente Supabase
4. Aplicação carrega normalmente

