import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useAdminLog } from '@/hooks/useAdminLog';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, LogOut, User, KeyRound } from 'lucide-react';

const AdminUserDropdown = () => {
  const { adminData } = usePlatformAdmin();
  const { logAction } = useAdminLog();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileName, setProfileName] = useState(adminData?.name || '');
  const [profileEmail, setProfileEmail] = useState(adminData?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logAction('logout', 'system');
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_admins' as any)
        .update({ name: profileName, email: profileEmail } as any)
        .eq('id', adminData?.id);
      if (error) throw error;
      await logAction('profile_update', 'profile', adminData?.id);
      toast({ title: 'Perfil atualizado com sucesso' });
      setShowProfile(false);
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar perfil', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'A senha deve ter pelo menos 8 caracteres', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminData?.email || '',
        password: currentPassword,
      });
      if (signInError) {
        toast({ title: 'Senha atual incorreta', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await logAction('password_change', 'profile', adminData?.id);
      toast({ title: 'Senha alterada com sucesso' });
      setShowPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast({ title: 'Erro ao alterar senha', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (adminData?.name || adminData?.email || '?').substring(0, 2).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:inline">{adminData?.name || adminData?.email}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => { setProfileName(adminData?.name || ''); setProfileEmail(adminData?.email || ''); setShowProfile(true); }}>
            <User className="h-4 w-4 mr-2" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPassword(true)}>
            <KeyRound className="h-4 w-4 mr-2" />
            Trocar Senha
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfile(false)}>Cancelar</Button>
            <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPassword(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={saving}>{saving ? 'Alterando...' : 'Alterar Senha'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUserDropdown;
