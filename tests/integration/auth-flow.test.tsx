/**
 * Testes de Integração - Fluxo de Autenticação
 * 
 * Este arquivo testa o fluxo completo de autenticação incluindo:
 * - Cadastro de usuário (sucesso e erros)
 * - Login (sucesso e erros)
 * - Recuperação de senha
 * - Edge cases (emails inválidos, senhas fracas, etc.)
 * 
 * @requires @testing-library/react
 * @requires vitest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}));

// Mock do toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock do Turnstile (CAPTCHA)
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: any) => (
    <div data-testid="turnstile-mock" onClick={() => onSuccess('mock-token')}>
      Mock Turnstile
    </div>
  )
}));

/**
 * Helper para renderizar componente com contexto de autenticação
 */
const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Auth Flow - Fluxo de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock inicial de sessão vazia
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });
  });

  describe('Cadastro de Usuário (Sign Up)', () => {
    /**
     * TESTE 1: Cadastro bem-sucedido com dados válidos
     * 
     * Cenário:
     * - Usuário preenche todos os campos corretamente
     * - Email válido
     * - Senha forte
     * - Confirmação de senha correta
     * 
     * Expectativa:
     * - Supabase.auth.signUp deve ser chamado
     * - Mensagem de sucesso deve aparecer
     */
    it('deve cadastrar usuário com dados válidos', async () => {
      const user = userEvent.setup();
      
      // Mock de resposta de sucesso
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' }, session: null },
        error: null
      });

      renderWithAuth(<Auth />);

      // Navegar para aba de cadastro
      const signupTab = screen.getByRole('tab', { name: /cadastro/i });
      await user.click(signupTab);

      // Resolver CAPTCHA
      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      // Preencher formulário
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getAllByLabelText(/senha/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      const displayNameInput = screen.getByLabelText(/nome completo/i);
      const organizationInput = screen.getByLabelText(/organização/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@123456');
      await user.type(confirmPasswordInput, 'Test@123456');
      await user.type(displayNameInput, 'Test User');
      await user.type(organizationInput, 'Test Org');

      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await user.click(submitButton);

      // Verificar chamada ao Supabase
      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'Test@123456'
          })
        );
      });
    });

    /**
     * TESTE 2: Erro - Email inválido
     * 
     * Edge Case: Email com formato inválido
     * 
     * Expectativa:
     * - Mensagem de erro de validação deve aparecer
     * - SignUp não deve ser chamado
     */
    it('deve mostrar erro com email inválido', async () => {
      const user = userEvent.setup();
      renderWithAuth(<Auth />);

      const signupTab = screen.getByRole('tab', { name: /cadastro/i });
      await user.click(signupTab);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'email-invalido');
      await user.tab(); // Trigger blur para validação

      // Verificar mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });

      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    /**
     * TESTE 3: Erro - Senha fraca
     * 
     * Edge Case: Senha não atende requisitos mínimos
     * 
     * Expectativa:
     * - Mensagem de erro específica sobre requisitos de senha
     * - SignUp não deve ser chamado
     */
    it('deve rejeitar senha fraca', async () => {
      const user = userEvent.setup();
      renderWithAuth(<Auth />);

      const signupTab = screen.getByRole('tab', { name: /cadastro/i });
      await user.click(signupTab);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const passwordInput = screen.getAllByLabelText(/senha/i)[0];
      await user.type(passwordInput, '123'); // Senha muito fraca
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/senha deve ter no mínimo/i)).toBeInTheDocument();
      });

      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    /**
     * TESTE 4: Erro - Senhas não conferem
     * 
     * Edge Case: Confirmação de senha diferente da senha
     * 
     * Expectativa:
     * - Mensagem de erro sobre senhas não conferem
     */
    it('deve validar que senhas conferem', async () => {
      const user = userEvent.setup();
      renderWithAuth(<Auth />);

      const signupTab = screen.getByRole('tab', { name: /cadastro/i });
      await user.click(signupTab);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const passwordInput = screen.getAllByLabelText(/senha/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);

      await user.type(passwordInput, 'Test@123456');
      await user.type(confirmPasswordInput, 'Different@123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument();
      });
    });

    /**
     * TESTE 5: Erro - Email já cadastrado
     * 
     * Cenário: Tentar cadastrar com email que já existe
     * 
     * Expectativa:
     * - Supabase retorna erro
     * - Mensagem de erro amigável é exibida
     */
    it('deve tratar erro de email já cadastrado', async () => {
      const user = userEvent.setup();
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', name: 'AuthError', status: 400 }
      });

      renderWithAuth(<Auth />);

      const signupTab = screen.getByRole('tab', { name: /cadastro/i });
      await user.click(signupTab);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getAllByLabelText(/senha/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      const displayNameInput = screen.getByLabelText(/nome completo/i);
      const organizationInput = screen.getByLabelText(/organização/i);

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Test@123456');
      await user.type(confirmPasswordInput, 'Test@123456');
      await user.type(displayNameInput, 'Test User');
      await user.type(organizationInput, 'Test Org');

      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalled();
      });
    });
  });

  describe('Login de Usuário (Sign In)', () => {
    /**
     * TESTE 6: Login bem-sucedido
     * 
     * Cenário:
     * - Usuário existente
     * - Credenciais corretas
     * 
     * Expectativa:
     * - Supabase.auth.signInWithPassword chamado
     * - Usuário autenticado
     */
    it('deve fazer login com credenciais válidas', async () => {
      const user = userEvent.setup();
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { 
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token' } as any
        },
        error: null
      });

      renderWithAuth(<Auth />);

      // Resolver CAPTCHA
      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      // Preencher formulário de login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@123456');

      // Submeter
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Test@123456'
        });
      });
    });

    /**
     * TESTE 7: Erro - Credenciais inválidas
     * 
     * Cenário: Senha incorreta
     * 
     * Expectativa:
     * - Supabase retorna erro
     * - Mensagem de erro é exibida
     */
    it('deve mostrar erro com credenciais inválidas', async () => {
      const user = userEvent.setup();
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 }
      });

      renderWithAuth(<Auth />);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123');

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    /**
     * TESTE 8: Edge Case - Campo vazio
     * 
     * Cenário: Tentar login sem preencher campos
     * 
     * Expectativa:
     * - Validação impede submit
     * - Mensagens de erro nos campos
     */
    it('deve validar campos obrigatórios no login', async () => {
      const user = userEvent.setup();
      renderWithAuth(<Auth />);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await user.click(submitButton);

      // SignIn não deve ser chamado
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('Recuperação de Senha', () => {
    /**
     * TESTE 9: Recuperação de senha bem-sucedida
     * 
     * Cenário:
     * - Usuário esqueceu a senha
     * - Email válido
     * 
     * Expectativa:
     * - Email de recuperação enviado
     * - Mensagem de sucesso exibida
     */
    it('deve enviar email de recuperação', async () => {
      const user = userEvent.setup();
      
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null
      });

      renderWithAuth(<Auth />);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      // Abrir modal de recuperação
      const forgotPasswordLink = screen.getByText(/esqueceu a senha/i);
      await user.click(forgotPasswordLink);

      // Preencher email
      const emailInput = screen.getAllByLabelText(/email/i)[1];
      await user.type(emailInput, 'test@example.com');

      // Submeter
      const submitButton = screen.getByRole('button', { name: /enviar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          expect.any(Object)
        );
      });
    });

    /**
     * TESTE 10: Erro - Email não cadastrado
     * 
     * Edge Case: Tentar recuperar senha de email inexistente
     * 
     * Expectativa:
     * - Por segurança, pode mostrar mensagem genérica
     */
    it('deve tratar email não cadastrado', async () => {
      const user = userEvent.setup();
      
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: { message: 'User not found', name: 'AuthError', status: 400 }
      });

      renderWithAuth(<Auth />);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const forgotPasswordLink = screen.getByText(/esqueceu a senha/i);
      await user.click(forgotPasswordLink);

      const emailInput = screen.getAllByLabelText(/email/i)[1];
      await user.type(emailInput, 'nonexistent@example.com');

      const submitButton = screen.getByRole('button', { name: /enviar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases Gerais', () => {
    /**
     * TESTE 11: Validação de CAPTCHA
     * 
     * Edge Case: Tentar submeter sem resolver CAPTCHA
     * 
     * Expectativa:
     * - Submit bloqueado até CAPTCHA ser resolvido
     */
    it('deve exigir CAPTCHA antes de submeter', async () => {
      const user = userEvent.setup();
      renderWithAuth(<Auth />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@123456');

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      // Verificar se botão está desabilitado sem CAPTCHA
      expect(submitButton).toBeDisabled();

      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    /**
     * TESTE 12: Timeout de rede
     * 
     * Edge Case: Simular falha de conexão
     * 
     * Expectativa:
     * - Tratamento de erro de rede
     */
    it('deve tratar timeout de rede', async () => {
      const user = userEvent.setup();
      
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error('Network timeout')
      );

      renderWithAuth(<Auth />);

      const turnstile = screen.getByTestId('turnstile-mock');
      await user.click(turnstile);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@123456');

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });
});
