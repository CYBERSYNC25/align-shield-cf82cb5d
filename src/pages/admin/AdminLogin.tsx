import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MFAChallengeModal } from '@/components/auth/MFAChallengeModal';

const TURNSTILE_SITE_KEY = '0x4AAAAAACdV0TZoJOxiK1FC';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const turnstileRef = useRef<any>(null);

  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      toast({
        title: 'Verificação necessária',
        description: 'Complete a verificação de segurança para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });

      if (authError) throw authError;

      const { data: adminData, error: adminError } = await supabase
        .from('platform_admins' as any)
        .select('id')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        turnstileRef.current?.reset();
        setCaptchaToken('');
        toast({
          title: 'Acesso negado',
          description: 'Você não possui permissão para acessar o painel administrativo.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data: mfaSettings } = await supabase
        .from('user_mfa_settings')
        .select('enabled_at')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (mfaSettings?.enabled_at) {
        setPendingUserId(authData.user.id);
        setShowMfaChallenge(true);
        setLoading(false);
      } else {
        // Log the login action
        await supabase.from('platform_admin_logs' as any).insert({
          admin_id: (adminData as any).id,
          admin_email: email,
          action: 'login',
          resource_type: 'system',
          details: {},
          user_agent: navigator.userAgent,
        } as any);
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      setCaptchaToken('');
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerified = () => {
    setShowMfaChallenge(false);
    setPendingUserId(null);
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Compliance Sync Admin</CardTitle>
          <CardDescription>Acesse o painel de administração multi-tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setCaptchaToken('')}
                onExpire={() => setCaptchaToken('')}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !captchaToken}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <MFAChallengeModal
        open={showMfaChallenge}
        onOpenChange={setShowMfaChallenge}
        onVerified={handleMfaVerified}
        actionDescription="acessar o painel administrativo"
        action="login"
      />
    </div>
  );
};

export default AdminLogin;
