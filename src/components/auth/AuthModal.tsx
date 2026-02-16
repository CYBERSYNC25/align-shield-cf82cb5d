import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginSchema, signUpSchema, type LoginInput, type SignUpInput } from '@/lib/auth-schemas';
import { checkPasswordStrength } from '@/lib/password-security';
import { Progress } from '@/components/ui/progress';
import { Turnstile } from '@marsidev/react-turnstile';

interface AuthModalProps {
  trigger?: React.ReactNode;
}

const AuthModal = ({ trigger }: AuthModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    displayName: '',
    organization: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Estados de validação
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<any>(null);

  // Turnstile CAPTCHA states
  const [loginCaptchaToken, setLoginCaptchaToken] = useState('');
  const [signupCaptchaToken, setSignupCaptchaToken] = useState('');
  const loginTurnstileRef = useRef<any>(null);
  const signupTurnstileRef = useRef<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setLoginErrors(errors);
      return;
    }
    
    if (!loginCaptchaToken) {
      toast({ title: "Verificação necessária", description: "Complete a verificação de segurança", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(loginData.email, loginData.password, loginCaptchaToken);
      if (!error) {
        toast({ title: "Login realizado", description: "Bem-vindo ao APOC!" });
        setOpen(false);
      } else {
        loginTurnstileRef.current?.reset();
        setLoginCaptchaToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    if (!termsAccepted) {
      setSignupErrors({ terms: 'Você deve aceitar os termos para continuar' });
      return;
    }
    
    const validation = signUpSchema.safeParse(signupData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setSignupErrors(errors);
      return;
    }
    
    if (!signupCaptchaToken) {
      toast({ title: "Verificação necessária", description: "Complete a verificação de segurança", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(signupData.email, signupData.password, {
        display_name: signupData.displayName,
        organization: signupData.organization
      }, signupCaptchaToken);
      if (!error) {
        toast({ title: "Conta criada", description: "Verifique seu email." });
        setOpen(false);
      } else {
        signupTurnstileRef.current?.reset();
        setSignupCaptchaToken('');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = (password: string) => {
    setSignupData(prev => ({ ...prev, password }));
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <LogIn className="h-4 w-4" />
            Entrar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center">
            <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle>APOC</CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => { setLoginData(prev => ({ ...prev, email: e.target.value })); setLoginErrors({}); }}
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
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => { setLoginData(prev => ({ ...prev, password: e.target.value })); setLoginErrors({}); }}
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
                      ref={loginTurnstileRef}
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                      onSuccess={(token) => setLoginCaptchaToken(token)}
                      onError={() => setLoginCaptchaToken('')}
                      onExpire={() => setLoginCaptchaToken('')}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !loginCaptchaToken}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      type="text"
                      value={signupData.displayName}
                      onChange={(e) => { setSignupData(prev => ({ ...prev, displayName: e.target.value })); setSignupErrors({}); }}
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
                    <Label>Organização</Label>
                    <Input
                      type="text"
                      value={signupData.organization}
                      onChange={(e) => { setSignupData(prev => ({ ...prev, organization: e.target.value })); setSignupErrors({}); }}
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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => { setSignupData(prev => ({ ...prev, email: e.target.value })); setSignupErrors({}); }}
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
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={signupData.password}
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
                    {passwordStrength && signupData.password && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Força:</span>
                          <span className={`font-medium ${
                            passwordStrength.score >= 3 ? 'text-green-600' : 
                            passwordStrength.score >= 2 ? 'text-amber-600' : 
                            'text-red-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <Progress value={passwordStrength.score * 25} className="h-1" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Senha</Label>
                    <Input
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => { setSignupData(prev => ({ ...prev, confirmPassword: e.target.value })); setSignupErrors({}); }}
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
                  
                  {/* Checkbox de aceite dos termos */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox 
                        id="terms-accept" 
                        checked={termsAccepted}
                        onCheckedChange={(checked) => {
                          setTermsAccepted(checked === true);
                          if (signupErrors.terms) {
                            setSignupErrors(prev => {
                              const { terms, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className="mt-0.5"
                      />
                      <Label 
                        htmlFor="terms-accept" 
                        className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                      >
                        Li e aceito os{" "}
                        <Link 
                          to="/legal/terms" 
                          target="_blank" 
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Termos de Serviço
                        </Link>{" "}
                        e a{" "}
                        <Link 
                          to="/legal/privacy" 
                          target="_blank" 
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Política de Privacidade
                        </Link>
                      </Label>
                    </div>
                    {signupErrors.terms && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {signupErrors.terms}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <Turnstile
                      ref={signupTurnstileRef}
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                      onSuccess={(token) => setSignupCaptchaToken(token)}
                      onError={() => setSignupCaptchaToken('')}
                      onExpire={() => setSignupCaptchaToken('')}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !termsAccepted || !signupCaptchaToken}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;