

## Correção: Dashboard acessível para Viewers (Opção A)

### Problema
O item "Dashboard" no menu lateral aponta para `/`, e o `ProtectedRoute` redireciona viewers de `/` para `/readiness`. Isso impede que viewers acessem o Dashboard.

### Solução
Alterar o `href` do item Dashboard no Sidebar de `/` para `/dashboard`.

---

### Mudança Necessária

**Arquivo:** `src/components/layout/Sidebar.tsx`

```typescript
// Antes (linha ~70)
{ 
  icon: LayoutDashboard, 
  label: 'Dashboard', 
  href: '/', 
  permission: 'canViewAll' as const 
},

// Depois
{ 
  icon: LayoutDashboard, 
  label: 'Dashboard', 
  href: '/dashboard',  // Mudança aqui
  permission: 'canViewAll' as const 
},
```

---

### Por que funciona

| Rota | Comportamento do ProtectedRoute |
|------|--------------------------------|
| `/` | Se viewer → redireciona para `/readiness` |
| `/dashboard` | Renderiza normalmente (sem redirect) |

O `ProtectedRoute` só força redirecionamento quando `pathname === '/'`. Em `/dashboard`, ele simplesmente renderiza o conteúdo.

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/Sidebar.tsx` | Mudar `href: '/'` para `href: '/dashboard'` no item Dashboard |

---

### Resultado Esperado

- Ao clicar em "Dashboard" no menu, você irá para `/dashboard`
- O Dashboard abrirá normalmente, mesmo com role `viewer`
- O comportamento de `/` (rota raiz) permanece inalterado

