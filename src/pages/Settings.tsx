import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Key,
  Palette,
  Trash2
} from 'lucide-react';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { Setup2FAModal } from '@/components/settings/Setup2FAModal';
import { BackupDataModal } from '@/components/settings/BackupDataModal';
import { ManageSessionsModal } from '@/components/settings/ManageSessionsModal';
import { ViewLogsModal } from '@/components/settings/ViewLogsModal';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [setup2FAOpen, setSetup2FAOpen] = useState(false);
  const [backupDataOpen, setBackupDataOpen] = useState(false);
  const [manageSessionsOpen, setManageSessionsOpen] = useState(false);
  const [viewLogsOpen, setViewLogsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const handleSaveProfile = () => {
    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso!"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas preferências, segurança e configurações da conta
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Perfil da Conta</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input id="firstName" placeholder="Seu nome" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input id="lastName" placeholder="Seu sobrenome" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input id="company" placeholder="Nome da empresa" />
                </div>
                <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  <Key className="h-4 w-4" />
                  Alterar Senha
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setSetup2FAOpen(true)}
                >
                  <Shield className="h-4 w-4" />
                  Autenticação 2FA
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setBackupDataOpen(true)}
                >
                  <Database className="h-4 w-4" />
                  Backup de Dados
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notificações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Relatórios por Email</div>
                  <div className="text-sm text-muted-foreground">Receber relatórios semanais de compliance</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Alertas de Risco</div>
                  <div className="text-sm text-muted-foreground">Notificações sobre novos riscos identificados</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Lembretes de Auditoria</div>
                  <div className="text-sm text-muted-foreground">Lembretes sobre auditorias pendentes</div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Segurança</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Sessões Ativas</div>
                  <div className="text-sm text-muted-foreground">3 dispositivos conectados</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setManageSessionsOpen(true)}
                >
                  Gerenciar
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Log de Atividades</div>
                  <div className="text-sm text-muted-foreground">Visualizar histórico de ações</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setViewLogsOpen(true)}
                >
                  Ver Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  <CardTitle>Aparência</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Tema Escuro</div>
                    <div className="text-sm text-muted-foreground">Usar tema escuro na interface</div>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Modo Compacto</div>
                    <div className="text-sm text-muted-foreground">Interface mais compacta</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <CardTitle>Sistema</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option>Português (Brasil)</option>
                    <option>English (US)</option>
                    <option>Español</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option>UTC-3 (São Paulo)</option>
                    <option>UTC-5 (New York)</option>
                    <option>UTC+0 (London)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Excluir Conta</div>
                  <div className="text-sm text-muted-foreground">Permanentemente remove sua conta e todos os dados</div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDeleteAccountOpen(true)}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modals */}
      <ChangePasswordModal 
        open={changePasswordOpen} 
        onOpenChange={setChangePasswordOpen} 
      />
      <Setup2FAModal 
        open={setup2FAOpen} 
        onOpenChange={setSetup2FAOpen} 
      />
      <BackupDataModal 
        open={backupDataOpen} 
        onOpenChange={setBackupDataOpen} 
      />
      <ManageSessionsModal 
        open={manageSessionsOpen} 
        onOpenChange={setManageSessionsOpen} 
      />
      <ViewLogsModal 
        open={viewLogsOpen} 
        onOpenChange={setViewLogsOpen} 
      />
      <DeleteAccountModal 
        open={deleteAccountOpen} 
        onOpenChange={setDeleteAccountOpen} 
      />
    </div>
  );
};

export default Settings;