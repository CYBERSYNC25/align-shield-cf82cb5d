/**
 * Testes de Validação - Auth Schemas
 * 
 * @jest-environment jsdom
 * 
 * Para executar:
 * ```bash
 * npm test auth-schemas
 * ```
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  displayNameSchema,
  organizationSchema,
  formatZodErrors
} from '@/lib/auth-schemas';

describe('Email Schema', () => {
  describe('Emails válidos', () => {
    it('deve aceitar email simples', () => {
      expect(() => emailSchema.parse('user@example.com')).not.toThrow();
    });

    it('deve aceitar email com subdomínio', () => {
      expect(() => emailSchema.parse('user@mail.example.com')).not.toThrow();
    });

    it('deve aceitar email com +', () => {
      expect(() => emailSchema.parse('user+tag@example.com')).not.toThrow();
    });

    it('deve aceitar email com pontos', () => {
      expect(() => emailSchema.parse('first.last@example.com')).not.toThrow();
    });

    it('deve normalizar para lowercase', () => {
      const result = emailSchema.parse('USER@EXAMPLE.COM');
      expect(result).toBe('user@example.com');
    });
  });

  describe('Emails inválidos', () => {
    it('deve rejeitar email sem @', () => {
      expect(() => emailSchema.parse('userexample.com')).toThrow('Email inválido');
    });

    it('deve rejeitar email sem domínio', () => {
      expect(() => emailSchema.parse('user@')).toThrow('Email inválido');
    });

    it('deve rejeitar email sem nome local', () => {
      expect(() => emailSchema.parse('@example.com')).toThrow('Email inválido');
    });

    it('deve rejeitar email com espaços', () => {
      expect(() => emailSchema.parse('user example@test.com')).toThrow('Email inválido');
    });

    it('deve rejeitar email vazio', () => {
      expect(() => emailSchema.parse('')).toThrow('Email é obrigatório');
    });

    it('deve rejeitar email muito longo', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => emailSchema.parse(longEmail)).toThrow('máximo 255 caracteres');
    });
  });
});

describe('Password Schema', () => {
  describe('Senhas válidas', () => {
    it('deve aceitar senha forte completa', () => {
      expect(() => passwordSchema.parse('SecurePass123!')).not.toThrow();
    });

    it('deve aceitar senha com múltiplos especiais', () => {
      expect(() => passwordSchema.parse('MyP@ssw0rd!')).not.toThrow();
    });

    it('deve aceitar senha longa', () => {
      expect(() => passwordSchema.parse('VeryLongSecurePassword123!')).not.toThrow();
    });
  });

  describe('Senhas inválidas', () => {
    it('deve rejeitar senha muito curta', () => {
      expect(() => passwordSchema.parse('Short1!')).toThrow('no mínimo 8 caracteres');
    });

    it('deve rejeitar senha sem maiúscula', () => {
      expect(() => passwordSchema.parse('password123!')).toThrow('letra maiúscula');
    });

    it('deve rejeitar senha sem minúscula', () => {
      expect(() => passwordSchema.parse('PASSWORD123!')).toThrow('letra minúscula');
    });

    it('deve rejeitar senha sem número', () => {
      expect(() => passwordSchema.parse('Password!')).toThrow('um número');
    });

    it('deve rejeitar senha sem caractere especial', () => {
      expect(() => passwordSchema.parse('Password123')).toThrow('caractere especial');
    });

    it('deve rejeitar senha muito longa', () => {
      const longPassword = 'A1!' + 'a'.repeat(98);
      expect(() => passwordSchema.parse(longPassword)).toThrow('máximo 100 caracteres');
    });
  });
});

describe('Display Name Schema', () => {
  describe('Nomes válidos', () => {
    it('deve aceitar nome simples', () => {
      expect(() => displayNameSchema.parse('João Silva')).not.toThrow();
    });

    it('deve aceitar nome com acento', () => {
      expect(() => displayNameSchema.parse('José María')).not.toThrow();
    });

    it('deve aceitar nome com hífen', () => {
      expect(() => displayNameSchema.parse('Anne-Marie')).not.toThrow();
    });

    it('deve aceitar nome com apóstrofo', () => {
      expect(() => displayNameSchema.parse("O'Connor")).not.toThrow();
    });
  });

  describe('Nomes inválidos', () => {
    it('deve rejeitar nome muito curto', () => {
      expect(() => displayNameSchema.parse('Ab')).toThrow('no mínimo 3 caracteres');
    });

    it('deve rejeitar nome com números', () => {
      expect(() => displayNameSchema.parse('João123')).toThrow('apenas letras');
    });

    it('deve rejeitar nome muito longo', () => {
      const longName = 'A'.repeat(101);
      expect(() => displayNameSchema.parse(longName)).toThrow('máximo 100 caracteres');
    });

    it('deve rejeitar nome vazio', () => {
      expect(() => displayNameSchema.parse('')).toThrow('no mínimo 3 caracteres');
    });
  });
});

describe('Organization Schema', () => {
  it('deve aceitar organização válida', () => {
    expect(() => organizationSchema.parse('Empresa XYZ Ltda')).not.toThrow();
  });

  it('deve aceitar organização com caracteres especiais', () => {
    expect(() => organizationSchema.parse('Tech & Solutions Inc.')).not.toThrow();
  });

  it('deve rejeitar organização muito curta', () => {
    expect(() => organizationSchema.parse('AB')).toThrow('no mínimo 3 caracteres');
  });

  it('deve rejeitar organização muito longa', () => {
    const longOrg = 'A'.repeat(201);
    expect(() => organizationSchema.parse(longOrg)).toThrow('máximo 200 caracteres');
  });
});

describe('Login Schema', () => {
  const validLogin = {
    email: 'user@example.com',
    password: 'SecurePass123!'
  };

  it('deve aceitar login válido', () => {
    expect(() => loginSchema.parse(validLogin)).not.toThrow();
  });

  it('deve rejeitar email inválido', () => {
    const invalid = { ...validLogin, email: 'invalid@' };
    expect(() => loginSchema.parse(invalid)).toThrow();
  });

  it('deve rejeitar senha vazia', () => {
    const invalid = { ...validLogin, password: '' };
    expect(() => loginSchema.parse(invalid)).toThrow('Senha é obrigatória');
  });

  it('deve retornar dados validados', () => {
    const result = loginSchema.parse(validLogin);
    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe('SecurePass123!');
  });
});

describe('SignUp Schema', () => {
  const validSignup = {
    email: 'newuser@example.com',
    password: 'MySecure123!',
    confirmPassword: 'MySecure123!',
    displayName: 'João Silva',
    organization: 'Empresa ABC Ltda'
  };

  it('deve aceitar signup válido', () => {
    expect(() => signUpSchema.parse(validSignup)).not.toThrow();
  });

  it('deve rejeitar email inválido', () => {
    const invalid = { ...validSignup, email: 'invalid@' };
    expect(() => signUpSchema.parse(invalid)).toThrow();
  });

  it('deve rejeitar senha fraca', () => {
    const invalid = { ...validSignup, password: 'weak', confirmPassword: 'weak' };
    expect(() => signUpSchema.parse(invalid)).toThrow();
  });

  it('deve rejeitar senhas não coincidentes', () => {
    const invalid = { ...validSignup, confirmPassword: 'Different123!' };
    expect(() => signUpSchema.parse(invalid)).toThrow('não coincidem');
  });

  it('deve rejeitar nome muito curto', () => {
    const invalid = { ...validSignup, displayName: 'Ab' };
    expect(() => signUpSchema.parse(invalid)).toThrow();
  });

  it('deve rejeitar organização muito curta', () => {
    const invalid = { ...validSignup, organization: 'AB' };
    expect(() => signUpSchema.parse(invalid)).toThrow();
  });
});

describe('Forgot Password Schema', () => {
  it('deve aceitar email válido', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'user@example.com' })).not.toThrow();
  });

  it('deve rejeitar email inválido', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'invalid@' })).toThrow();
  });
});

describe('formatZodErrors', () => {
  it('deve formatar erros corretamente', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors).toHaveProperty('email');
      expect(errors).toHaveProperty('password');
      expect(errors.email).toContain('obrigatório');
    }
  });

  it('deve retornar objeto vazio para schema válido', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'Password123!'
    });
    expect(result.success).toBe(true);
  });
});
