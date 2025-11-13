import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigate } from 'react-router-dom';
import { Shield, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Turnstile } from '@marsidev/react-turnstile';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { signUpSchema, loginSchema, type SignUpInput, type LoginInput } from '@/lib/auth-schemas';
import { checkPasswordPwned, checkPasswordStrength } from '@/lib/password-security';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

/**
 * Página de Autenticação
 * 
 * @component
 * @description
 * Gerencia login e cadastro com validação Zod, verificação de senha vazada e CAPTCHA.
 * 
 * Features:
 * - Validação em tempo real com Zod
 * - Verificação de senhas vazadas (Have I Been Pwned API)
 * - Indicador de força de senha
 * - CAPTCHA (Cloudflare Turnstile) no login
 * - Feedback visual de erros
 * - Redirecionamento automático após autenticação
 * 
 * @example
 * // Em App.tsx:
 * <Route path="/auth" element={<Auth />} />
 */
const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  
  // Estados de loading e validação
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<any>(null);
  
  // Estados de validação
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  
  // Estados de senha
  const [signupPassword, setSignupPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [isPwned, setIsPwned] = useState(false);
  const [pwnedCount, setPwnedCount] = useState(0);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  /**
   * Handler de login com validação Zod e CAPTCHA
   * 
   * @param {React.FormEvent} e - Evento do formulário
   * 
   * Fluxo:
   * 1. Valida campos com Zod (loginSchema)
   * 2. Verifica token CAPTCHA
   * 3. Chama Supabase signIn
   * 4. Trata erros e exibe feedback
   * 
   * Erros possíveis:
   * - Email inválido (formato)
   * - Senha vazia
   * - CAPTCHA não completado
   * - Credenciais incorretas (Supabase)
   * - Email não confirmado
   * - Rate limit excedido
   * 
   * @example
   * <form onSubmit={handleSignIn}>
   *   <input name="email" />
   *   <input name="password" />
   *   <Turnstile onSuccess={setCaptchaToken} />
   *   <button type="submit">Entrar</button>
   * </form>
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };
    
    // Validação Zod
    const validation = loginSchema.safeParse(data);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setLoginErrors(errors);
      return;
    }
    
    // Verifica CAPTCHA
    if (!captchaToken) {
      toast({
        title: "Verificação necessária",
        description: "Por favor, complete a verificação de segurança",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Tenta login
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      // Mapeia erros do Supabase para mensagens amigáveis
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.";
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Reset CAPTCHA
      turnstileRef.current?.reset();
      setCaptchaToken('');
    }
    
    setIsLoading(false);
  };

  /**
   * Handler de cadastro com validação Zod e verificação de senha vazada
   * 
   * @param {React.FormEvent} e - Evento do formulário
   * 
   * Fluxo:
   * 1. Valida todos os campos com Zod (signUpSchema)
   * 2. Verifica se senha foi vazada (HIBP API)
   * 3. Alerta usuário se senha comprometida (mas permite continuar)
   * 4. Chama Supabase signUp
   * 5. Trigger handle_new_user() cria perfil automaticamente
   * 6. Email de confirmação enviado
   * 
   * Validações:
   * - Email válido e único
   * - Senha forte (8+ chars, maiúscula, minúscula, número, especial)
   * - Confirmação de senha
   * - Nome de exibição (3-100 chars)
   * - Organização (3-200 chars)
   * 
   * @example
   * <form onSubmit={handleSignUp}>
   *   <input name="email" />
   *   <input name="password" onChange={(e) => handlePasswordChange(e.target.value)} />
   *   <input name="confirmPassword" />
   *   <input name="displayName" />
   *   <input name="organization" />
   *   <button type="submit">Cadastrar</button>
   * </form>
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    const formData = new FormData(e.target as HTMLFormElement);
    const data: SignUpInput = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      displayName: formData.get('displayName') as string,
      organization: formData.get('organization') as string
    };
    
    // Validação Zod
    const validation = signUpSchema.safeParse(data);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setSignupErrors(errors);
      toast({
        title: "Erros de validação",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Verifica senha vazada (não bloqueia, apenas alerta)
    const pwnedResult = await checkPasswordPwned(data.password);
    if (pwnedResult.isPwned) {
      toast({
        title: "⚠️ Senha comprometida",
        description: `Esta senha foi encontrada em ${pwnedResult.count.toLocaleString()} vazamentos de dados. Recomendamos usar uma senha diferente.`,
        variant: "destructive"
      });
      setIsLoading(false);
      return; // Bloqueia cadastro com senha vazada
    }
    
    // Cadastra usuário
    const { error } = await signUp(data.email, data.password, { 
      display_name: data.displayName,
      organization: data.organization
    });
    
    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('User already registered')) {
        errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email.";
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };
  
  /**
   * Handler de mudança de senha (signup) - calcula força em tempo real
   * 
   * @param {string} password - Nova senha digitada
   * 
   * Atualiza:
   * - Estado de força da senha (score, label, feedback)
   * - Indicador visual (barra de progresso)
   * 
   * @example
   * <input
   *   type="password"
   *   onChange={(e) => handlePasswordChange(e.target.value)}
   * />
   * {passwordStrength && (
   *   <Progress value={passwordStrength.score * 25} />
   * )}
   */
  const handlePasswordChange = (password: string) => {
    setSignupPassword(password);
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary">ComplianceSync</h1>
          </div>
          <CardTitle className="text-2xl">Bem-vindo</CardTitle>
          <CardDescription>
            Faça login ou crie sua conta para acessar a plataforma de compliance
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email"
                    name="email"
                    type="email" 
                    placeholder="seu@email.com"
                    className={loginErrors.email ? 'border-destructive' : ''}
                    required 
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Senha</Label>
                    <ForgotPasswordModal />
                  </div>
                  <Input 
                    id="login-password"
                    name="password"
                    type="password" 
                    placeholder="••••••••"
                    className={loginErrors.password ? 'border-destructive' : ''}
                    required 
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.password}
                    </p>
                  )}
                </div>
                <div className="flex justify-center">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onError={() => setCaptchaToken('')}
                    onExpire={() => setCaptchaToken('')}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input 
                    id="signup-name"
                    name="displayName"
                    type="text" 
                    placeholder="João Silva"
                    className={signupErrors.displayName ? 'border-destructive' : ''}
                    required 
                  />
                  {signupErrors.displayName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {signupErrors.displayName}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-organization">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Organização
                  </Label>
                  <Input 
                    id="signup-organization"
                    name="organization"
                    type="text" 
                    placeholder="Nome da sua empresa"
                    className={signupErrors.organization ? 'border-destructive' : ''}
                    required 
                  />
                  {signupErrors.organization && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {signupErrors.organization}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email"
                    name="email"
                    type="email" 
                    placeholder="seu@email.com"
                    className={signupErrors.email ? 'border-destructive' : ''}
                    required 
                  />
                  {signupErrors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {signupErrors.email}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input 
                    id="signup-password"
                    name="password"
                    type="password" 
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={signupErrors.password ? 'border-destructive' : ''}
                    required 
                  />
                  {signupErrors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {signupErrors.password}
                    </p>
                  )}
                  
                  {/* Indicador de força de senha */}
                  {passwordStrength && signupPassword && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Força da senha:</span>
                        <span className={`font-medium ${
                          passwordStrength.score >= 3 ? 'text-green-600 dark:text-green-500' : 
                          passwordStrength.score >= 2 ? 'text-amber-600 dark:text-amber-500' : 
                          'text-red-600 dark:text-red-500'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <Progress 
                        value={passwordStrength.score * 25} 
                        className="h-2"
                      />
                      {passwordStrength.feedback.length > 0 && (
                        <div className="space-y-1">
                          {passwordStrength.feedback.map((fb: string, i: number) => (
                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              {passwordStrength.passesRequirements ? (
                                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 mt-0.5" />
                              )}
                              {fb}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <Input 
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password" 
                    placeholder="••••••••"
                    className={signupErrors.confirmPassword ? 'border-destructive' : ''}
                    required 
                  />
                  {signupErrors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {signupErrors.confirmPassword}
                    </p>
                  )}
                </div>
                
                {/* Alerta de senha vazada */}
                {isPwned && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta senha foi encontrada em <strong>{pwnedCount.toLocaleString()}</strong> vazamentos de dados. 
                      Por favor, escolha uma senha diferente.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading || !passwordStrength?.passesRequirements}>
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;