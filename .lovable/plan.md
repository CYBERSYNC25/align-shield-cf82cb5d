
## Plano: Páginas Legais com Navegação por Âncoras

### Objetivo
Criar três páginas legais públicas (/legal/terms, /legal/privacy, /legal/dpa) com design profissional, navegação por âncoras (table of contents) no lado esquerdo, e integrar links no Footer e no modal de registro (AuthModal).

---

### Arquitetura Visual

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  HEADER: Logo APOC + Título do Documento + Botão "Voltar"                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────┐  ┌────────────────────────────────────────────────┐  │
│  │ ÍNDICE (sticky)  │  │  CONTEÚDO                                      │  │
│  │                  │  │                                                │  │
│  │  1. Definições   │  │  # 1. Definições                               │  │
│  │  2. Uso Permitido│  │  Lorem ipsum dolor sit amet...                 │  │
│  │  3. Respons...   │  │                                                │  │
│  │  4. Limitação... │  │  # 2. Uso Permitido                            │  │
│  │  5. Rescisão     │  │  Lorem ipsum dolor sit amet...                 │  │
│  │  6. Lei Aplicável│  │                                                │  │
│  │                  │  │  ...                                           │  │
│  │  [Outros docs]   │  │                                                │  │
│  │  • Privacidade   │  │                                                │  │
│  │  • DPA           │  │                                                │  │
│  └──────────────────┘  └────────────────────────────────────────────────┘  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  FOOTER: Data de atualização + Links para outros documentos               │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Estrutura de Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/legal/Terms.tsx` | Termos de Serviço |
| `src/pages/legal/Privacy.tsx` | Política de Privacidade |
| `src/pages/legal/DPA.tsx` | Acordo de Processamento de Dados |
| `src/components/legal/LegalPageLayout.tsx` | Layout compartilhado com TOC |
| `src/components/legal/TableOfContents.tsx` | Navegação por âncoras (sticky) |
| `src/components/legal/LegalSection.tsx` | Componente de seção reutilizável |
| `src/components/legal/LegalFooter.tsx` | Footer específico para páginas legais |

---

### Fase 1: Componentes Base

**LegalPageLayout.tsx** - Layout principal com sidebar sticky:
```typescript
interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  sections: Array<{ id: string; title: string }>;
  children: React.ReactNode;
  otherDocs?: Array<{ href: string; label: string }>;
}
```

Características:
- Header com logo APOC, título do documento e botão "Voltar ao Início"
- Sidebar sticky com Table of Contents + links para outros documentos legais
- Área de conteúdo com scroll suave para âncoras
- Footer com data de atualização e navegação entre documentos

**TableOfContents.tsx** - Navegação inteligente:
- Detecta seção ativa via IntersectionObserver
- Destaque visual na seção atual
- Links suaves com `scrollIntoView({ behavior: 'smooth' })`
- Responsivo: drawer no mobile, sidebar no desktop

---

### Fase 2: Página de Termos de Serviço (/legal/terms)

**Seções:**
1. **Definições** - Glossário de termos utilizados
2. **Uso Permitido** - O que usuários podem/não podem fazer
3. **Responsabilidades do Usuário** - Obrigações do contratante
4. **Responsabilidades da APOC** - Nossas obrigações
5. **Limitação de Responsabilidade** - Disclaimers legais
6. **Rescisão** - Condições de término do contrato
7. **Lei Aplicável** - Jurisdição e foro (Brasil)

**Conteúdo exemplo (será placeholder editável):**
```text
# 1. Definições

Nestes Termos de Serviço, os seguintes termos têm os significados:

- **"APOC"**: refere-se à APOC Systems Ltda., empresa responsável...
- **"Plataforma"**: o sistema de gestão de compliance disponível em...
- **"Usuário"**: qualquer pessoa física ou jurídica que utilize...
- **"Dados"**: informações inseridas ou processadas na Plataforma...
```

---

### Fase 3: Página de Política de Privacidade (/legal/privacy)

**Seções (LGPD compliant):**
1. **Dados Coletados** - Categorias de dados pessoais
2. **Como Usamos seus Dados** - Finalidades do tratamento
3. **Compartilhamento de Dados** - Com quem compartilhamos
4. **Segurança dos Dados** - Medidas técnicas de proteção
5. **Retenção de Dados** - Por quanto tempo mantemos
6. **Seus Direitos (LGPD)** - Direitos do titular
7. **Cookies e Tecnologias** - Uso de rastreadores
8. **Contato do DPO** - Dados do Encarregado de Dados

**Direitos LGPD incluídos:**
- Confirmação de tratamento
- Acesso aos dados
- Correção de dados incompletos
- Anonimização ou eliminação
- Portabilidade
- Revogação do consentimento
- Informação sobre compartilhamento

---

### Fase 4: Página de DPA (/legal/dpa)

**Seções (para clientes enterprise):**
1. **Objeto do Acordo** - Escopo do processamento
2. **Definições** - Termos específicos de proteção de dados
3. **Obrigações do Controlador** - Cliente como controlador
4. **Obrigações do Operador** - APOC como processador
5. **Subprocessadores** - Lista e autorização
6. **Transferências Internacionais** - Cláusulas contratuais
7. **Medidas de Segurança** - Controles técnicos (ISO 27001)
8. **Notificação de Incidentes** - Procedimento de breach
9. **Auditorias** - Direito de auditoria do cliente
10. **Término e Devolução** - O que acontece após o contrato

---

### Fase 5: Atualizar Footer

**Arquivo:** `src/components/layout/Footer.tsx`

Substituir links placeholder por rotas reais:
```typescript
<Link to="/legal/privacy">Privacidade</Link>
<Link to="/legal/terms">Termos de Uso</Link>
```

Adicionar link para DPA (opcional, talvez apenas no footer das páginas legais).

---

### Fase 6: Checkbox de Aceite no AuthModal

**Arquivo:** `src/components/auth/AuthModal.tsx`

Adicionar no formulário de signup:
```typescript
<div className="flex items-start gap-2">
  <Checkbox 
    id="terms-accept" 
    checked={termsAccepted}
    onCheckedChange={setTermsAccepted}
    required
  />
  <Label htmlFor="terms-accept" className="text-sm text-muted-foreground">
    Li e aceito os{" "}
    <Link to="/legal/terms" target="_blank" className="text-primary hover:underline">
      Termos de Serviço
    </Link>{" "}
    e a{" "}
    <Link to="/legal/privacy" target="_blank" className="text-primary hover:underline">
      Política de Privacidade
    </Link>
  </Label>
</div>
```

Validação:
- Botão de criar conta desabilitado até checkbox marcado
- Erro visual se tentar submeter sem aceitar

---

### Fase 7: Rotas no App.tsx

```typescript
// Páginas legais - Rotas públicas
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import DPA from "./pages/legal/DPA";

// Dentro do Routes:
<Route path="/legal/terms" element={<Terms />} />
<Route path="/legal/privacy" element={<Privacy />} />
<Route path="/legal/dpa" element={<DPA />} />
```

---

### Design Visual

**Paleta de cores:**
- Background: `bg-background`
- Cards/Sidebar: `bg-card`
- Texto principal: `text-foreground`
- Texto secundário: `text-muted-foreground`
- Destaque: `text-primary`
- Bordas: `border-border/50`

**Tipografia:**
- Título da página: `text-3xl font-bold`
- Títulos de seção: `text-xl font-semibold`
- Subtítulos: `text-lg font-medium`
- Corpo: `text-base leading-relaxed`
- Notas/disclaimers: `text-sm text-muted-foreground`

**Responsividade:**
- Mobile: TOC como drawer/accordion no topo
- Desktop: Sidebar sticky à esquerda (w-64)
- Breakpoint: `lg:` (1024px)

---

### Considerações Técnicas

| Aspecto | Solução |
|---------|---------|
| **SEO** | Meta tags dinâmicas (title, description) |
| **Acessibilidade** | Navegação por teclado, ARIA labels |
| **Performance** | Componentes lazy-loaded |
| **Manutenção** | Conteúdo em constantes (fácil edição) |
| **Internacionalização** | Textos em português brasileiro |
| **Print** | CSS de impressão para documentos |

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/legal/LegalPageLayout.tsx` | Criar | Layout base com TOC |
| `src/components/legal/TableOfContents.tsx` | Criar | Navegação por âncoras |
| `src/components/legal/LegalSection.tsx` | Criar | Componente de seção |
| `src/components/legal/LegalFooter.tsx` | Criar | Footer das páginas legais |
| `src/pages/legal/Terms.tsx` | Criar | Termos de Serviço |
| `src/pages/legal/Privacy.tsx` | Criar | Política de Privacidade |
| `src/pages/legal/DPA.tsx` | Criar | Acordo de Processamento |
| `src/components/layout/Footer.tsx` | Modificar | Adicionar links reais |
| `src/components/auth/AuthModal.tsx` | Modificar | Adicionar checkbox de aceite |
| `src/App.tsx` | Modificar | Adicionar rotas legais |

---

### Fluxo de Usuário

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. DESCOBERTA                                                           │
│    ├── Usuário acessa /welcome ou /auth                                 │
│    ├── Vê links no footer: "Privacidade" | "Termos de Uso"              │
│    └── Clica para ler os documentos                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. LEITURA                                                              │
│    ├── Página legal carrega com TOC à esquerda                          │
│    ├── Usuário navega pelas seções via âncoras                          │
│    ├── Pode alternar entre documentos via sidebar                       │
│    └── Imprime se necessário (CSS print-friendly)                       │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. ACEITE (no registro)                                                 │
│    ├── Usuário abre modal de cadastro (AuthModal)                       │
│    ├── Preenche dados + vê checkbox obrigatório                         │
│    ├── Links abrem documentos em nova aba                               │
│    ├── Marca checkbox e clica "Criar conta"                             │
│    └── Registro salva que usuário aceitou termos                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Ordem de Implementação

1. Criar componentes base: `LegalPageLayout`, `TableOfContents`, `LegalSection`
2. Criar página `/legal/terms` com todas as seções
3. Criar página `/legal/privacy` com seções LGPD
4. Criar página `/legal/dpa` para enterprise
5. Adicionar rotas em `App.tsx`
6. Atualizar `Footer.tsx` com links funcionais
7. Adicionar checkbox de aceite em `AuthModal.tsx`
8. Testar navegação por âncoras e responsividade
