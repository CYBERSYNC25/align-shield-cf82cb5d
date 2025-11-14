# 🧪 Guia Completo de Testes Automatizados

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Executando os Testes](#executando-os-testes)
4. [Estrutura dos Testes](#estrutura-dos-testes)
5. [Tipos de Testes](#tipos-de-testes)
6. [Interpretando Resultados](#interpretando-resultados)
7. [Boas Práticas](#boas-práticas)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este projeto implementa uma suíte completa de testes automatizados cobrindo:

- ✅ **Autenticação**: Cadastro, login, recuperação de senha
- ✅ **CRUD Operations**: Frameworks, controles, auditorias, riscos, evidências
- ✅ **Notificações**: Triggers automáticos e sistema de notificações
- ✅ **Workflows**: Fluxo completo de revisão de acesso

### Tecnologias Utilizadas

- **Vitest**: Framework de testes rápido e moderno
- **Testing Library**: Testes focados no comportamento do usuário
- **Supabase**: Mock do backend para testes de integração

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

```bash
# Node.js 18+ instalado
node --version

# Dependências instaladas
npm install
```

### Estrutura de Arquivos de Teste

```
tests/
├── unit/                          # Testes unitários
│   ├── auth-schemas.test.ts       # Validação de schemas
│   └── password-security.test.ts  # Segurança de senhas
├── integration/                   # Testes de integração
│   ├── auth-flow.test.tsx         # Fluxo de autenticação
│   ├── crud-operations.test.tsx   # Operações CRUD
│   └── notifications-workflow.test.tsx # Notificações e workflows
└── setup.ts                       # Configuração global dos testes
```

---

## 🚀 Executando os Testes

### Comandos Principais

```bash
# Executar todos os testes
npm test

# Executar em modo watch (reexecuta ao salvar)
npm run test:watch

# Executar com interface gráfica
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage

# Executar apenas testes de autenticação
npm test -- auth-flow

# Executar apenas testes CRUD
npm test -- crud-operations

# Executar apenas testes de notificações
npm test -- notifications-workflow
```

### Executando Testes Específicos

```bash
# Executar um arquivo específico
npm test tests/integration/auth-flow.test.tsx

# Executar apenas um teste específico (usando descrição)
npm test -- -t "deve cadastrar usuário com dados válidos"

# Executar testes que contenham "login" no nome
npm test -- -t login
```

---

## 📁 Estrutura dos Testes

### Anatomia de um Teste

```typescript
describe('Nome do Módulo', () => {
  // Setup: Executado antes de cada teste
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar mocks e estado inicial
  });

  describe('Funcionalidade Específica', () => {
    /**
     * Documentação do Teste
     * 
     * Cenário: O que está sendo testado
     * Expectativa: O que deveria acontecer
     */
    it('deve fazer algo específico', async () => {
      // Arrange: Preparar dados e mocks
      const mockData = { /* ... */ };
      
      // Act: Executar a ação
      const result = await someFunction(mockData);
      
      // Assert: Verificar resultados
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Padrão AAA (Arrange-Act-Assert)

Todos os testes seguem o padrão AAA:

1. **Arrange** (Preparar): Configure dados, mocks e estado inicial
2. **Act** (Agir): Execute a funcionalidade sendo testada
3. **Assert** (Verificar): Valide os resultados

---

## 📊 Tipos de Testes

### 1. Testes de Autenticação (`auth-flow.test.tsx`)

#### Cobre:
- ✅ Cadastro com dados válidos
- ❌ Erros de validação (email inválido, senha fraca)
- ✅ Login com credenciais corretas
- ❌ Login com credenciais incorretas
- ✅ Recuperação de senha
- 🔍 Edge cases (CAPTCHA, timeouts, campos vazios)

#### Exemplo de Execução:

```bash
npm test -- auth-flow

# Saída esperada:
# ✓ Auth Flow - Fluxo de Autenticação (13)
#   ✓ Cadastro de Usuário (Sign Up) (5)
#     ✓ deve cadastrar usuário com dados válidos
#     ✓ deve mostrar erro com email inválido
#     ✓ deve rejeitar senha fraca
#     ✓ deve validar que senhas conferem
#     ✓ deve tratar erro de email já cadastrado
#   ✓ Login de Usuário (Sign In) (3)
#   ✓ Recuperação de Senha (2)
#   ✓ Edge Cases Gerais (3)
```

### 2. Testes CRUD (`crud-operations.test.tsx`)

#### Cobre:
- 📋 Frameworks: Create, Read, Update, Delete
- 🛡️ Controles: CRUD + validações
- 📊 Auditorias: CRUD + cálculos de progresso
- ⚠️ Riscos: CRUD + cálculo de score automático
- 📎 Evidências: Upload, armazenamento, validações

#### Exemplo de Execução:

```bash
npm test -- crud-operations

# Saída esperada:
# ✓ CRUD Operations (18)
#   ✓ Frameworks - CRUD (5)
#     ✓ deve criar framework com dados válidos
#     ✓ deve listar frameworks do usuário
#     ✓ deve atualizar framework existente
#     ✓ deve deletar framework
#     ✓ deve rejeitar framework com nome duplicado
#   ✓ Controles - CRUD (3)
#   ✓ Auditorias - CRUD (3)
#   ✓ Riscos - CRUD (3)
#   ✓ Upload de Evidências (4)
```

### 3. Testes de Notificações (`notifications-workflow.test.tsx`)

#### Cobre:
- 🔔 Criação de notificações via RPC
- 📥 Busca de notificações não lidas
- ✅ Marcar como lida
- ⏰ Notificações com expiração
- 🚨 Triggers automáticos (riscos, tarefas, prazos)
- 🔍 Fluxo completo de revisão de acesso

#### Exemplo de Execução:

```bash
npm test -- notifications-workflow

# Saída esperada:
# ✓ Notifications & Access Review Workflow (13)
#   ✓ Sistema de Notificações (5)
#   ✓ Triggers de Notificações Automáticas (3)
#   ✓ Fluxo Completo de Revisão de Acesso (5)
```

---

## 📈 Interpretando Resultados

### Saída de Sucesso

```bash
 ✓ tests/integration/auth-flow.test.tsx (13) 2456ms
 ✓ tests/integration/crud-operations.test.tsx (18) 1823ms
 ✓ tests/integration/notifications-workflow.test.tsx (13) 1654ms

Test Files  3 passed (3)
     Tests  44 passed (44)
  Start at  10:30:00
  Duration  5.93s
```

**Interpretação:**
- ✅ Todos os 44 testes passaram
- ⏱️ Tempo total: 5.93 segundos
- 📁 3 arquivos de teste executados

### Saída com Falhas

```bash
 ❯ tests/integration/auth-flow.test.tsx (13)
   ❯ Auth Flow - Fluxo de Autenticação (13)
     ❯ Cadastro de Usuário (Sign Up) (5)
       × deve cadastrar usuário com dados válidos

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected 'test@example.com' to be 'wrong@example.com'
  ❯ tests/integration/auth-flow.test.tsx:123:45
```

**Como Interpretar:**
1. ❌ Teste falhou: "deve cadastrar usuário com dados válidos"
2. 📍 Linha 123, coluna 45 do arquivo auth-flow.test.tsx
3. 🔍 Erro: Email esperado não corresponde ao recebido

### Relatório de Cobertura

```bash
npm run test:coverage

# Saída:
# File                  | % Stmts | % Branch | % Funcs | % Lines
# ----------------------|---------|----------|---------|--------
# All files             |   85.23 |    78.45 |   82.11 |   85.67
#  hooks/               |   92.50 |    85.00 |   90.00 |   92.50
#   useAuth.tsx         |   95.00 |    87.50 |   92.00 |   95.00
#  components/          |   78.45 |    72.30 |   75.50 |   78.90
#   CreatePolicyModal.tsx |   80.00 |    75.00 |   78.00 |   80.50
```

**Interpretação:**
- **% Stmts**: Percentual de declarações executadas
- **% Branch**: Percentual de branches (if/else) testados
- **% Funcs**: Percentual de funções testadas
- **% Lines**: Percentual de linhas executadas

**Meta:** Manter cobertura acima de 80% em todos os indicadores.

---

## 🎯 Boas Práticas

### 1. Nomenclatura de Testes

```typescript
// ✅ BOM: Descrição clara do comportamento esperado
it('deve cadastrar usuário com dados válidos', async () => {});

// ❌ RUIM: Descrição vaga
it('teste de cadastro', async () => {});
```

### 2. Testes Independentes

```typescript
// ✅ BOM: Cada teste é independente
describe('Frameworks', () => {
  beforeEach(() => {
    // Reset mocks em cada teste
    vi.clearAllMocks();
  });

  it('deve criar framework', async () => {
    // Setup próprio
    const mockData = createMockFramework();
    // ...
  });
});

// ❌ RUIM: Testes dependem uns dos outros
let sharedFramework;
it('cria framework', () => {
  sharedFramework = createFramework();
});
it('atualiza framework', () => {
  updateFramework(sharedFramework); // Depende do teste anterior
});
```

### 3. Mocks Apropriados

```typescript
// ✅ BOM: Mock específico para o teste
it('deve tratar erro de rede', async () => {
  vi.mocked(supabase.auth.signIn).mockRejectedValue(
    new Error('Network timeout')
  );
  // ...
});

// ❌ RUIM: Mock genérico que não representa o cenário real
vi.mocked(supabase.auth.signIn).mockResolvedValue(null);
```

### 4. Asserts Significativos

```typescript
// ✅ BOM: Verifica exatamente o que importa
expect(response.data).toHaveProperty('id');
expect(response.data.email).toBe('test@example.com');
expect(response.error).toBeNull();

// ❌ RUIM: Assert genérico
expect(response).toBeTruthy();
```

### 5. Documentação nos Testes

```typescript
/**
 * TESTE X: Descrição Clara
 * 
 * Cenário:
 * - Detalhe o contexto
 * - O que está sendo testado
 * 
 * Expectativa:
 * - O que deveria acontecer
 * - Qual o resultado esperado
 */
it('descrição do teste', async () => {
  // ...
});
```

---

## 🔧 Troubleshooting

### Problema: Testes falhando com "timeout"

**Sintoma:**
```
Error: Timeout of 5000ms exceeded
```

**Solução:**
```typescript
// Aumentar timeout do teste específico
it('teste lento', async () => {
  // código
}, 10000); // 10 segundos

// Ou globalmente em vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000
  }
});
```

### Problema: Mocks não funcionando

**Sintoma:**
```
Error: Cannot read property 'mockResolvedValue' of undefined
```

**Solução:**
```typescript
// Verificar se mock está no topo do arquivo
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signIn: vi.fn() // ✅ Função mockada
    }
  }
}));

// Usar vi.mocked() para TypeScript
vi.mocked(supabase.auth.signIn).mockResolvedValue({...});
```

### Problema: "ReferenceError: window is not defined"

**Sintoma:**
```
ReferenceError: window is not defined
```

**Solução:**
```typescript
// Adicionar no tests/setup.ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Problema: Testes passam localmente mas falham no CI/CD

**Causas Comuns:**
1. Diferenças de timezone
2. Dependências de ambiente
3. Arquivos não comitados

**Solução:**
```typescript
// Usar datas relativas em vez de absolutas
const tomorrow = new Date(Date.now() + 86400000);

// Verificar variáveis de ambiente
const isCI = process.env.CI === 'true';

// Mock de timezone
vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

### Comandos Úteis

```bash
# Executar apenas testes modificados
npm test -- --changed

# Executar com verbose (mais detalhes)
npm test -- --verbose

# Ver cobertura no navegador
npm run test:coverage && open coverage/index.html

# Limpar cache de testes
npm test -- --clearCache
```

### Estrutura de Relatórios

```bash
# Gerar relatório em HTML
npm run test:coverage

# Abrir relatório
# Mac/Linux: open coverage/index.html
# Windows: start coverage/index.html
```

---

## 🎓 Próximos Passos

### Para Adicionar Novos Testes

1. Identifique a funcionalidade a ser testada
2. Escolha o tipo de teste apropriado (unit/integration)
3. Crie arquivo de teste na estrutura correta
4. Siga o padrão AAA (Arrange-Act-Assert)
5. Adicione documentação clara
6. Execute e verifique cobertura

### Para Manter a Qualidade

- ✅ Execute testes antes de cada commit
- ✅ Mantenha cobertura acima de 80%
- ✅ Revise testes junto com código em PRs
- ✅ Atualize testes ao modificar funcionalidades
- ✅ Documente edge cases encontrados

---

## 📞 Suporte

Para dúvidas sobre testes:
1. Consulte este guia primeiro
2. Veja exemplos nos arquivos de teste existentes
3. Consulte documentação oficial das ferramentas
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** Janeiro 2024  
**Versão:** 1.0.0
