# Design System - Tokens e Hierarquia Visual

## Resumo Executivo

Sistema de design padronizado com tokens para espaçamento, tipografia, cores e elevação, garantindo consistência visual e hierarquia clara em toda a aplicação.

---

## 🎨 Tokens de Cores

### Cores Primárias
```css
--primary: 214 84% 56%           /* Azul corporativo principal */
--primary-foreground: 0 0% 100%  /* Texto em superfícies primárias */
--primary-light: 214 78% 65%     /* Variante clara */
--primary-dark: 214 90% 45%      /* Variante escura */
```

### Cores de Status
```css
/* Sucesso */
--success: 142 76% 36%
--success-foreground: 0 0% 100%
--success-bg: 142 76% 96%

/* Aviso */
--warning: 38 92% 50%
--warning-foreground: 0 0% 100%
--warning-bg: 38 92% 95%

/* Perigo */
--danger: 0 84% 60%
--danger-foreground: 0 0% 100%
--danger-bg: 0 84% 96%

/* Informação */
--info: 210 100% 60%
--info-foreground: 0 0% 100%
--info-bg: 210 100% 96%
```

### Cores de Compliance
```css
--compliance-excellent: 142 76% 36%  /* Verde - Excelente */
--compliance-good: 142 69% 50%       /* Verde claro - Bom */
--compliance-fair: 38 92% 50%        /* Amarelo - Regular */
--compliance-poor: 0 84% 60%         /* Vermelho - Ruim */
--compliance-critical: 0 90% 45%     /* Vermelho escuro - Crítico */
```

---

## 📏 Sistema de Espaçamento

Base: **8px** (0.5rem)

```css
--space-1: 0.25rem   /* 4px  - Micro spacing */
--space-2: 0.5rem    /* 8px  - Base unit */
--space-3: 0.75rem   /* 12px - Small */
--space-4: 1rem      /* 16px - Medium */
--space-5: 1.25rem   /* 20px - Large */
--space-6: 1.5rem    /* 24px - XL */
--space-8: 2rem      /* 32px - 2XL */
--space-10: 2.5rem   /* 40px - 3XL */
--space-12: 3rem     /* 48px - 4XL */
--space-16: 4rem     /* 64px - 5XL */
```

### Uso Recomendado
- **4px:** Espaçamento interno em badges e chips
- **8px:** Espaçamento entre elementos relacionados
- **12-16px:** Padding padrão de botões e inputs
- **24px:** Espaçamento entre seções
- **32-48px:** Margens entre componentes principais
- **64px:** Espaçamento de página e headers

---

## 🔤 Sistema Tipográfico

### Escala de Tamanhos
```css
--text-xs: 0.75rem    /* 12px - Labels, captions */
--text-sm: 0.875rem   /* 14px - Secondary text */
--text-base: 1rem     /* 16px - Body text */
--text-lg: 1.125rem   /* 18px - Emphasized text */
--text-xl: 1.25rem    /* 20px - H5, Small headings */
--text-2xl: 1.5rem    /* 24px - H4 */
--text-3xl: 1.875rem  /* 30px - H3 */
--text-4xl: 2.25rem   /* 36px - H2, H1 */
```

### Pesos de Fonte
```css
--font-normal: 400    /* Texto regular */
--font-medium: 500    /* Ênfase leve */
--font-semibold: 600  /* Subtítulos */
--font-bold: 700      /* Títulos principais */
```

### Hierarquia de Títulos

#### H1 - Título Principal da Página
```css
.h1 {
  font-size: var(--text-4xl);    /* 36px */
  font-weight: var(--font-bold);  /* 700 */
  line-height: 1.2;
  letter-spacing: -0.025em;
}
```
**Uso:** Título principal de cada página (1 por página)

#### H2 - Título de Seção
```css
.h2 {
  font-size: var(--text-3xl);    /* 30px */
  font-weight: var(--font-bold);  /* 700 */
  line-height: 1.3;
}
```
**Uso:** Dividir conteúdo em seções principais

#### H3 - Subtítulo de Seção
```css
.h3 {
  font-size: var(--text-2xl);       /* 24px */
  font-weight: var(--font-semibold); /* 600 */
  line-height: 1.4;
}
```
**Uso:** Subseções dentro de seções principais

#### H4 - Título de Card/Componente
```css
.h4 {
  font-size: var(--text-xl);        /* 20px */
  font-weight: var(--font-semibold); /* 600 */
  line-height: 1.5;
}
```
**Uso:** Títulos de cards, modais, componentes

#### H5 - Rótulo Destacado
```css
.h5 {
  font-size: var(--text-lg);      /* 18px */
  font-weight: var(--font-medium); /* 500 */
  line-height: 1.5;
}
```
**Uso:** Labels importantes, subtítulos de formulário

#### Body Text - Texto Corpo
```css
.text-body {
  font-size: var(--text-base);  /* 16px */
  font-weight: var(--font-normal); /* 400 */
  line-height: 1.6;
}

.text-body-lg {
  font-size: var(--text-lg);    /* 18px */
  line-height: 1.6;
}

.text-body-sm {
  font-size: var(--text-sm);    /* 14px */
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

.text-caption {
  font-size: var(--text-xs);    /* 12px */
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
}
```

---

## 🎭 Sistema de Elevação (Shadows)

```css
--shadow-xs: 0 1px 2px 0 rgba(...)        /* Sutil */
--shadow-sm: 0 1px 3px 0 rgba(...)        /* Leve */
--shadow-md: 0 4px 6px -1px rgba(...)     /* Médio (cards) */
--shadow-lg: 0 10px 15px -3px rgba(...)   /* Elevado */
--shadow-xl: 0 20px 25px -5px rgba(...)   /* Muito elevado */
--shadow-glow: 0 0 0 3px rgba(...)        /* Efeito glow */
```

### Quando Usar
- **xs/sm:** Inputs, pequenos componentes
- **md:** Cards, painéis padrão
- **lg:** Cards interativos (hover), dropdowns
- **xl:** Modais, popups importantes
- **glow:** Focus states, CTAs importantes

---

## 🎬 Sistema de Transições

```css
--transition-fast: 150ms      /* Hover rápido, toggles */
--transition-base: 200ms      /* Transições padrão */
--transition-smooth: 300ms    /* Animações suaves */
--transition-slow: 500ms      /* Transições complexas */
```

**Timing Function:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)

---

## 📐 Border Radius

```css
--radius-xs: 0.25rem   /* 4px  - Chips, badges */
--radius-sm: 0.375rem  /* 6px  - Inputs menores */
--radius-md: 0.5rem    /* 8px  - Botões, inputs */
--radius: 0.75rem      /* 12px - Cards (padrão) */
--radius-lg: 1rem      /* 16px - Modais */
--radius-xl: 1.5rem    /* 24px - Hero sections */
--radius-full: 9999px  /* Círculos, pills */
```

---

## 📊 Z-Index Scale

```css
--z-dropdown: 1000
--z-sticky: 1020
--z-fixed: 1030
--z-modal-backdrop: 1040
--z-modal: 1050
--z-popover: 1060
--z-tooltip: 1070
```

---

## 🔧 Classes Utilitárias

### Cards
```css
.card-elevated {
  /* Card com elevação média */
}

.card-interactive {
  /* Card com hover effect */
}
```

### Badges
```css
.badge-success { /* Verde */ }
.badge-warning { /* Amarelo */ }
.badge-danger  { /* Vermelho */ }
.badge-info    { /* Azul */ }
```

### Focus States
```css
.focus-ring         /* Anel de foco padrão */
.focus-ring-danger  /* Anel de foco vermelho */
```

### Efeitos Hover
```css
.hover-lift   /* Eleva e adiciona sombra */
.hover-scale  /* Aumenta escala */
.hover-glow   /* Adiciona glow */
```

---

## 📋 Guia de Uso Rápido

### ✅ FAZER

```tsx
// Usar tokens semânticos
<h1 className="h1">Título Principal</h1>
<p className="text-body">Conteúdo do parágrafo</p>
<div className="card-elevated p-6 space-y-4">
  <span className="badge-success">Ativo</span>
</div>
```

### ❌ NÃO FAZER

```tsx
// Evitar valores hardcoded
<h1 className="text-[36px] font-[700]">Título</h1>
<p className="text-white">Texto</p>  // Usar text-foreground
<div className="bg-white p-[24px]">  // Usar p-6
```

---

## 🎯 Checklist de Implementação

- [x] Tokens de cor (HSL)
- [x] Escala de espaçamento (8px base)
- [x] Hierarquia tipográfica (H1-H6 + body)
- [x] Sistema de elevação (shadows)
- [x] Transições padronizadas
- [x] Border radius scale
- [x] Z-index scale
- [x] Classes utilitárias
- [x] Documentação completa

---

## 🚀 Próximos Passos

1. **Auditoria de Componentes:** Verificar componentes existentes e aplicar tokens
2. **Storybook/Documentação Visual:** Criar exemplos visuais de cada token
3. **Testes de Acessibilidade:** Validar contraste de cores (WCAG 2.1 AA)
4. **Dark Mode:** Garantir que todos os tokens funcionam em modo escuro
5. **Design Tokens Export:** Exportar tokens para Figma/design tools

---

**Última Atualização:** 2025-11-18  
**Versão:** 1.0  
**Status:** ✅ Implementado e Documentado
