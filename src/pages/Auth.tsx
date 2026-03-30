import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { MFAChallengeModal } from '@/components/auth/MFAChallengeModal';
import { loginSchema } from '@/lib/auth-schemas';
import { useLoginRateLimiter } from '@/hooks/useLoginRateLimiter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { status: rateLimitStatus, checkCanAttempt, recordAttempt, getTimeRemaining } = useLoginRateLimiter();
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [showLockoutAlert, setShowLockoutAlert] = useState(false);

  // MFA challenge state
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    setShowLockoutAlert(false);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const loginData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };
    
    const canAttempt = await checkCanAttempt(loginData.email);
    if (!canAttempt) {
      setShowLockoutAlert(true);
      toast({
        title: "Conta temporariamente bloqueada",
        description: `Muitas tentativas de login. Tente novamente em ${getTimeRemaining()}.`,
        variant: "destructive"
      });
      return;
    }
    
    const validation = loginSchema.safeParse(loginData);
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
    
    setIsLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      await recordAttempt(loginData.email, false, error.message);
      
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.";
      }
      
      const remaining = rateLimitStatus.attemptsRemaining;
      if (remaining > 0 && remaining <= 3) {
        errorMessage += ` (${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''})`;
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Reset CAPTCHA after failed attempt
      turnstileRef.current?.reset();
      setCaptchaToken('');
      setIsLoading(false);
    } else {
      await recordAttempt(loginData.email, true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: mfaSettings } = await supabase
          .from('user_mfa_settings')
          .select('enabled_at')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (mfaSettings?.enabled_at) {
          setPendingUserId(session.user.id);
          setShowMfaChallenge(true);
          setIsLoading(false);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  };

  const handleMfaVerified = () => {
    setShowMfaChallenge(false);
    setPendingUserId(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
      
      <Card className="relative w-full max-w-md bg-card border-border shadow-xl">
        <CardHeader className="space-y-3 text-center px-8 pt-8 pb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="p-2 bg-primary rounded-lg shadow-md">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Compliance Sync</h1>
          </div>
          <CardTitle className="text-2xl text-card-foreground">Bem-vindo</CardTitle>
          <CardDescription className="text-muted-foreground">
            Faça login para acessar a plataforma de compliance
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <div className="w-full">
              {showLockoutAlert && rateLimitStatus.lockedUntil && (
                <Alert variant="destructive" className="mb-4">
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Conta temporariamente bloqueada por segurança. 
                    Tente novamente em <strong>{getTimeRemaining()}</strong>.
                  </AlertDescription>
                </Alert>
              )}
              
              {!showLockoutAlert && rateLimitStatus.attemptsRemaining > 0 && rateLimitStatus.attemptsRemaining <= 2 && (
                <Alert variant="default" className="mb-4 border-warning bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning">
                    Atenção: {rateLimitStatus.attemptsRemaining} tentativa{rateLimitStatus.attemptsRemaining !== 1 ? 's' : ''} restante{rateLimitStatus.attemptsRemaining !== 1 ? 's' : ''} antes do bloqueio temporário.
                  </AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-foreground">Email</Label>
                  <Input 
                    id="login-email"
                    name="email"
                    type="email" 
                    placeholder="seu@email.com"
                    className={`bg-background border-input text-foreground placeholder:text-muted-foreground ${loginErrors.email ? 'border-destructive' : ''}`}
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
                    <Label htmlFor="login-password" className="text-foreground">Senha</Label>
                    <ForgotPasswordModal />
                  </div>
                  <Input 
                    id="login-password"
                    name="password"
                    type="password" 
                    placeholder="••••••••"
                    className={`bg-background border-input text-foreground placeholder:text-muted-foreground ${loginErrors.password ? 'border-destructive' : ''}`}
                    required 
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.password}
                    </p>
                  )}
                </div>
                {!isDev && (
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onError={() => setCaptchaToken('')}
                      onExpire={() => setCaptchaToken('')}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || (!isDev && !captchaToken)}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
              
              <p className="text-xs text-center text-muted-foreground mt-6 pt-4 border-t border-border">
                Acesso restrito. Entre em contato com o administrador para solicitar acesso.
              </p>
          </div>
        </CardContent>
      </Card>

      <MFAChallengeModal
        open={showMfaChallenge}
        onOpenChange={setShowMfaChallenge}
        onVerified={handleMfaVerified}
        actionDescription="fazer login"
        action="login"
      />
    </div>
  );
};

export default Auth;
