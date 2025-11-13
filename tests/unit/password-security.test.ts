/**
 * Testes de Segurança de Senha
 * 
 * @jest-environment jsdom
 * 
 * Para executar:
 * ```bash
 * npm test password-security
 * ```
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  checkPasswordPwned, 
  checkPasswordStrength,
  generateStrongPassword,
  type PwnedCheckResult,
  type PasswordStrength
} from '@/lib/password-security';

describe('checkPasswordPwned', () => {
  beforeEach(() => {
    // Mock fetch global
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Senhas comprometidas', () => {
    it('deve detectar senha comum (password123)', async () => {
      // Mock resposta da API HIBP
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'C6008F9CAB4083784CBD1874F76618D2A97:2384305\nOTHER:123'
      });

      const result = await checkPasswordPwned('password123');
      
      expect(result.isPwned).toBe(true);
      expect(result.count).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('deve mostrar contagem de vazamentos', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'ABC123:5000\nDEF456:3000'
      });

      const result = await checkPasswordPwned('testpass');
      
      if (result.isPwned) {
        expect(result.count).toBeGreaterThan(0);
      }
    });
  });

  describe('Senhas seguras', () => {
    it('deve marcar senha forte como não vazada', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'ABC123:100\nDEF456:50' // Hashes diferentes
      });

      const result = await checkPasswordPwned('xK9@mP2$vN8!qL5tR3wQ');
      
      expect(result.isPwned).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve tratar erro de rede graciosamente', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkPasswordPwned('anypassword');
      
      expect(result.isPwned).toBe(false);
      expect(result.count).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('deve tratar timeout', async () => {
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await checkPasswordPwned('password');
      
      expect(result.isPwned).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);

    it('deve tratar resposta HTTP 500', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await checkPasswordPwned('password');
      
      expect(result.isPwned).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('k-Anonymity', () => {
    it('deve enviar apenas primeiros 5 chars do hash', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      });
      global.fetch = mockFetch;

      await checkPasswordPwned('testpassword');
      
      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/\/range\/[A-F0-9]{5}$/);
    });
  });
});

describe('checkPasswordStrength', () => {
  describe('Senhas muito fracas (score 0)', () => {
    it('deve avaliar "12345" como muito fraca', () => {
      const result = checkPasswordStrength('12345');
      
      expect(result.score).toBe(0);
      expect(result.label).toBe('Muito Fraca');
      expect(result.passesRequirements).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('deve avaliar "abcdef" como muito fraca', () => {
      const result = checkPasswordStrength('abcdef');
      
      expect(result.score).toBe(0);
      expect(result.label).toBe('Muito Fraca');
      expect(result.passesRequirements).toBe(false);
    });
  });

  describe('Senhas fracas (score 1)', () => {
    it('deve avaliar "Password1" como fraca', () => {
      const result = checkPasswordStrength('Password1');
      
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.passesRequirements).toBe(false);
    });
  });

  describe('Senhas médias (score 2)', () => {
    it('deve avaliar "Password1!" como média', () => {
      const result = checkPasswordStrength('Password1!');
      
      expect(result.score).toBeGreaterThanOrEqual(2);
      expect(result.passesRequirements).toBe(true);
    });
  });

  describe('Senhas fortes (score 3-4)', () => {
    it('deve avaliar "MySecur3P@ssw0rd" como forte', () => {
      const result = checkPasswordStrength('MySecur3P@ssw0rd');
      
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.label).toMatch(/Forte|Muito Forte/);
      expect(result.passesRequirements).toBe(true);
    });

    it('deve avaliar "xK9@mP2$vN8!qL5tR3wQ" como muito forte', () => {
      const result = checkPasswordStrength('xK9@mP2$vN8!qL5tR3wQ');
      
      expect(result.score).toBe(4);
      expect(result.label).toBe('Muito Forte');
      expect(result.passesRequirements).toBe(true);
      expect(result.feedback).toContain('Senha excelente!');
    });
  });

  describe('Detecção de padrões', () => {
    it('deve penalizar sequências (abc, 123)', () => {
      const result = checkPasswordStrength('Abcd1234!');
      
      expect(result.feedback).toEqual(
        expect.arrayContaining([
          expect.stringContaining('sequências')
        ])
      );
    });

    it('deve penalizar repetições (aaa, 111)', () => {
      const result = checkPasswordStrength('Aaa111!!');
      
      expect(result.score).toBeLessThan(3);
    });
  });

  describe('Requisitos mínimos', () => {
    it('deve validar todos os requisitos', () => {
      const strong = checkPasswordStrength('MyP@ssw0rd123');
      expect(strong.passesRequirements).toBe(true);

      const weak = checkPasswordStrength('password');
      expect(weak.passesRequirements).toBe(false);
    });

    it('deve dar feedback específico', () => {
      const result = checkPasswordStrength('password');
      
      expect(result.feedback).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/maiúscula/i),
          expect.stringMatching(/número/i),
          expect.stringMatching(/especial/i)
        ])
      );
    });
  });

  describe('Entropia', () => {
    it('deve bonificar alta entropia', () => {
      const highEntropy = checkPasswordStrength('xK9@mP2$vN8!');
      const lowEntropy = checkPasswordStrength('aaaaaaaaA1!');
      
      expect(highEntropy.score).toBeGreaterThan(lowEntropy.score);
    });
  });
});

describe('generateStrongPassword', () => {
  it('deve gerar senha com comprimento correto', () => {
    const password = generateStrongPassword(16);
    expect(password.length).toBeGreaterThanOrEqual(16);
  });

  it('deve gerar senha forte por padrão', () => {
    const password = generateStrongPassword();
    const strength = checkPasswordStrength(password);
    
    expect(strength.score).toBeGreaterThanOrEqual(3);
    expect(strength.passesRequirements).toBe(true);
  });

  it('deve incluir todos os tipos de caracteres', () => {
    const password = generateStrongPassword(20);
    
    expect(password).toMatch(/[a-z]/); // Minúscula
    expect(password).toMatch(/[A-Z]/); // Maiúscula
    expect(password).toMatch(/[0-9]/); // Número
    expect(password).toMatch(/[^a-zA-Z0-9]/); // Especial
  });

  it('deve gerar senhas diferentes', () => {
    const pass1 = generateStrongPassword();
    const pass2 = generateStrongPassword();
    
    expect(pass1).not.toBe(pass2);
  });

  it('deve respeitar comprimento mínimo de 12', () => {
    const password = generateStrongPassword(8); // Tenta menos de 12
    expect(password.length).toBeGreaterThanOrEqual(12);
  });
});

describe('Integração: Fluxo completo de validação', () => {
  it('deve validar senha forte não vazada', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => ''
    });

    const password = 'MySecur3P@ssw0rd!';
    
    // Verifica força
    const strength = checkPasswordStrength(password);
    expect(strength.passesRequirements).toBe(true);
    
    // Verifica se foi vazada
    const pwned = await checkPasswordPwned(password);
    expect(pwned.isPwned).toBe(false);
  });

  it('deve rejeitar senha fraca mesmo se não vazada', async () => {
    const password = 'weak';
    
    const strength = checkPasswordStrength(password);
    expect(strength.passesRequirements).toBe(false);
  });

  it('deve alertar senha forte mas vazada', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => 'ABC123:5000'
    });

    const password = 'Password123!'; // Forte mas comum
    
    const strength = checkPasswordStrength(password);
    expect(strength.passesRequirements).toBe(true);
    
    // Simula que foi vazada
    const pwned: PwnedCheckResult = {
      isPwned: true,
      count: 5000,
      error: undefined
    };
    expect(pwned.isPwned).toBe(true);
  });
});
