# Guia de Testes Automatizados

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Executar Testes](#executar-testes)
3. [Estrutura de Testes](#estrutura-de-testes)
4. [Exemplos de Implementação](#exemplos-de-implementação)
5. [Cobertura de Código](#cobertura-de-código)
6. [Boas Práticas](#boas-práticas)

---

## Setup Inicial

### Instalar Dependências

```bash
# Instalar Vitest e dependências de teste
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom

# Instalar para testes E2E (opcional)
npm install -D @playwright/test
```

### Configurar Vitest

Adicione ao `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx'
      ]
    }
  }
});
```

### Arquivo de Setup

Crie `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock de window.matchMedia
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

// Mock de fetch global
global.fetch = vi.fn();
```

### Scripts no package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:e2e": "playwright test"
  }
}
```

---

## Executar Testes

### Comandos Básicos

```bash
# Executar todos os testes
npm test

# Executar com interface UI
npm run test:ui

# Executar apenas testes unitários
npm run test:unit

# Executar com cobertura
npm run test:coverage

# Executar em modo watch
npm test -- --watch

# Executar arquivo específico
npm test auth-schemas.test.ts
```

### Watch Mode

```bash
# Rodar em watch mode (re-executa ao salvar)
npm test -- --watch

# Rodar apenas testes modificados
npm test -- --watch --changed
```

---

## Estrutura de Testes

```
tests/
├── setup.ts                        # Configuração global
├── unit/                           # Testes unitários
│   ├── auth-schemas.test.ts        # Validação Zod
│   ├── password-security.test.ts   # Segurança de senha
│   └── utils.test.ts               # Utilitários
├── integration/                    # Testes de integração
│   ├── login-flow.test.tsx         # Fluxo de login
│   ├── signup-flow.test.tsx        # Fluxo de cadastro
│   └── password-reset.test.tsx     # Recuperação de senha
├── e2e/                           # Testes end-to-end
│   └── auth-complete.spec.ts      # Fluxo completo
└── README.md                       # Este arquivo
```

---

## Exemplos de Implementação

### Teste Unitário (Zod Schema)

```typescript
import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/lib/auth-schemas';

describe('Login Schema', () => {
  it('deve aceitar login válido', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123!'
    });
    
    expect(result.success).toBe(true);
  });

  it('deve rejeitar email inválido', () => {
    const result = loginSchema.safeParse({
      email: 'invalid@',
      password: 'SecurePass123!'
    });
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Email inválido');
    }
  });
});
```

### Teste com Mock (API Externa)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPasswordPwned } from '@/lib/password-security';

describe('checkPasswordPwned', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('deve detectar senha vazada', async () => {
    // Mock resposta da API
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => 'C6008F9CAB4083784CBD1874F76618D2A97:2384305'
    });

    const result = await checkPasswordPwned('password123');
    
    expect(result.isPwned).toBe(true);
    expect(result.count).toBe(2384305);
  });

  it('deve tratar erro de rede', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await checkPasswordPwned('anypass');
    
    expect(result.isPwned).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Teste de Integração (React Component)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Auth from '@/pages/Auth';
import { AuthProvider } from '@/hooks/useAuth';

describe('Login Flow', () => {
  it('deve exibir erros de validação', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('deve fazer login com credenciais válidas', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'TestPass123!');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await userEvent.click(submitButton);

    // Verificar redirecionamento ou mensagem de sucesso
    await waitFor(() => {
      expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
    });
  });
});
```

### Teste End-to-End (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('Fluxo completo de cadastro e login', async ({ page }) => {
  await page.goto('http://localhost:5173/auth');

  // Cadastro
  await page.click('text=Cadastro');
  await page.fill('input[name="displayName"]', 'Test User');
  await page.fill('input[name="organization"]', 'Test Org');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPass123!');
  await page.fill('input[name="confirmPassword"]', 'TestPass123!');
  await page.click('button:has-text("Criar Conta")');

  // Verificar mensagem de sucesso
  await expect(page.locator('text=/verifique seu email/i')).toBeVisible();

  // Login (após confirmação de email)
  await page.click('text=Login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPass123!');
  await page.click('button:has-text("Entrar")');

  // Verificar redirecionamento para dashboard
  await expect(page).toHaveURL(/.*\//);
  await expect(page.locator('text=/bem-vindo/i')).toBeVisible();
});
```

---

## Cobertura de Código

### Gerar Relatório

```bash
npm run test:coverage
```

### Visualizar Relatório

```bash
# Abre relatório HTML no navegador
open coverage/index.html
```

### Meta de Cobertura

Adicione ao `vite.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  }
}
```

---

## Boas Práticas

### 1. Nomenclatura

```typescript
// ✅ BOM
describe('Login Schema', () => {
  it('deve aceitar email válido', () => {});
  it('deve rejeitar email inválido', () => {});
});

// ❌ RUIM
describe('Tests', () => {
  it('test1', () => {});
  it('test2', () => {});
});
```

### 2. Arrange-Act-Assert

```typescript
it('deve calcular força de senha', () => {
  // Arrange
  const password = 'MySecure123!';
  
  // Act
  const result = checkPasswordStrength(password);
  
  // Assert
  expect(result.score).toBeGreaterThanOrEqual(3);
  expect(result.passesRequirements).toBe(true);
});
```

### 3. Testes Independentes

```typescript
// ✅ BOM - Cada teste é independente
describe('Password Strength', () => {
  it('deve avaliar senha fraca', () => {
    const result = checkPasswordStrength('weak');
    expect(result.score).toBe(0);
  });

  it('deve avaliar senha forte', () => {
    const result = checkPasswordStrength('Strong123!');
    expect(result.score).toBeGreaterThan(2);
  });
});

// ❌ RUIM - Testes dependem de estado compartilhado
let password = 'weak';
it('test 1', () => {
  password = 'Strong123!'; // Modifica estado
});
it('test 2', () => {
  expect(password).toBe('weak'); // Falha!
});
```

### 4. Mock de Dependências Externas

```typescript
// Mock de fetch
beforeEach(() => {
  global.fetch = vi.fn();
});

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;
```

### 5. Cleanup Automático

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup(); // Limpa DOM após cada teste
  vi.clearAllMocks(); // Limpa mocks
});
```

### 6. Testes Assíncronos

```typescript
// ✅ BOM - Await adequado
it('deve verificar senha vazada', async () => {
  const result = await checkPasswordPwned('password');
  expect(result.isPwned).toBe(true);
});

// ❌ RUIM - Sem await
it('test', () => {
  checkPasswordPwned('password'); // Promise não resolvida!
  expect(result.isPwned).toBe(true); // Falha!
});
```

---

## Checklist de Testes

### ✅ Testes Unitários
- [ ] Schemas Zod (email, password, login, signup)
- [ ] Verificação de senha vazada (HIBP API)
- [ ] Cálculo de força de senha
- [ ] Geração de senha forte
- [ ] Utilitários (formatZodErrors, etc.)

### ✅ Testes de Integração
- [ ] Fluxo de login completo
- [ ] Fluxo de cadastro completo
- [ ] Recuperação de senha
- [ ] Confirmação de email
- [ ] Logout
- [ ] Redirecionamentos
- [ ] Proteção de rotas

### ✅ Testes End-to-End
- [ ] Cadastro → Confirmação → Login
- [ ] Login → Navegação → Logout
- [ ] Recuperação de senha
- [ ] Persistência de sessão (reload)
- [ ] Múltiplos navegadores

---

## Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Kent C. Dodds - Testing](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Última atualização:** 2025-01-13  
**Versão:** 1.0.0
