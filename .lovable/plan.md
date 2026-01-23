
## Plano: Adicionar Redirect de /compliance-readiness para /readiness

### Problema
A rota atual é `/readiness`, mas o sistema está tentando acessar `/compliance-readiness`, resultando em erro 404.

### Solução
Adicionar uma rota de redirect usando o componente `Navigate` do React Router para redirecionar automaticamente de `/compliance-readiness` para `/readiness`.

---

### Alteração em src/App.tsx

**Adicionar import:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
```

**Adicionar rota de redirect (antes do catch-all):**
```typescript
{/* Redirect para manter compatibilidade com URLs antigas */}
<Route path="/compliance-readiness" element={<Navigate to="/readiness" replace />} />
```

---

### Resumo

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/App.tsx` | Modificar | Adicionar import de `Navigate` e rota de redirect |

Esta é uma alteração mínima de 2 linhas que resolve o problema de forma permanente e mantém compatibilidade com qualquer link externo ou bookmark que aponte para a URL antiga.
