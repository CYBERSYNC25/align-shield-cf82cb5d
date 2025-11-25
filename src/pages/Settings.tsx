import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { Setup2FAModal } from '@/components/settings/Setup2FAModal';
import { ManageSessionsModal } from '@/components/settings/ManageSessionsModal';
import { BackupDataModal } from '@/components/settings/BackupDataModal';
import { ViewLogsModal } from '@/components/settings/ViewLogsModal';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import UserRolesManagement from '@/components/settings/UserRolesManagement';
import AuditLogsViewer from '@/components/settings/AuditLogsViewer';
import {
  User,
  Shield,
  Bell,
  Smartphone,
  Database,
  Activity,
  Trash2,
  Key,
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSetup2FAModal, setShowSetup2FAModal] = useState(false);
  const [showManageSessionsModal, setShowManageSessionsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Grid Layout Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Page Header - Full Width */}
            <div className="col-span-full">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Configurações
                </h1>
                <p className="text-muted-foreground">
                  Gerencie suas preferências e configurações de conta
                </p>
              </div>
            </div>

            {/* Tabs Content - Full Width */}
            <div className="col-span-full">
              <Tabs defaultValue="account" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="account">Conta</TabsTrigger>
                  <TabsTrigger value="security">Segurança</TabsTrigger>
                  <TabsTrigger value="notifications">Notificações</TabsTrigger>
                  <TabsTrigger value="permissions">Permissões</TabsTrigger>
                  <TabsTrigger value="audit">Auditoria</TabsTrigger>
                </TabsList>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <User className="w-5 h-5" />
                        Informações da Conta
                      </CardTitle>
                      <CardDescription>
                        Gerencie as informações do seu perfil
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <p className="text-sm text-muted-foreground">{user?.email || 'Não informado'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Status da Conta</label>
                        <div>
                          <Badge variant="default">Ativa</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Shield className="w-5 h-5" />
                        Segurança
                      </CardTitle>
                      <CardDescription>
                        Configure opções de segurança da sua conta
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Alterar Senha</p>
                          <p className="text-sm text-muted-foreground">
                            Atualize sua senha de acesso
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowChangePasswordModal(true)}>
                          <Key className="w-4 h-4 mr-2" />
                          Alterar
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Autenticação de Dois Fatores</p>
                          <p className="text-sm text-muted-foreground">
                            Adicione uma camada extra de segurança
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowSetup2FAModal(true)}>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Configurar
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Sessões Ativas</p>
                          <p className="text-sm text-muted-foreground">
                            Gerencie seus dispositivos conectados
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowManageSessionsModal(true)}>
                          <Activity className="w-4 h-4 mr-2" />
                          Gerenciar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Data Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Database className="w-5 h-5" />
                        Gerenciamento de Dados
                      </CardTitle>
                      <CardDescription>
                        Backup e gerenciamento dos seus dados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Backup de Dados</p>
                          <p className="text-sm text-muted-foreground">
                            Faça backup de todos os seus dados
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowBackupModal(true)}>
                          <Database className="w-4 h-4 mr-2" />
                          Backup
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Logs de Atividade</p>
                          <p className="text-sm text-muted-foreground">
                            Visualize o histórico de ações
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowLogsModal(true)}>
                          <Activity className="w-4 h-4 mr-2" />
                          Ver Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" />
                        Zona de Perigo
                      </CardTitle>
                      <CardDescription>
                        Ações irreversíveis de conta
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Excluir Conta</p>
                          <p className="text-sm text-muted-foreground">
                            Remova permanentemente sua conta e todos os dados
                          </p>
                        </div>
                        <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Conta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Bell className="w-5 h-5" />
                        Preferências de Notificação
                      </CardTitle>
                      <CardDescription>
                        Configure como você deseja ser notificado
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Notificações por Email</p>
                          <p className="text-sm text-muted-foreground">
                            Receba notificações importantes por email
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Alertas de Risco</p>
                          <p className="text-sm text-muted-foreground">
                            Notificações sobre novos riscos identificados
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Lembretes de Auditoria</p>
                          <p className="text-sm text-muted-foreground">
                            Lembretes sobre auditorias pendentes
                          </p>
                        </div>
                        <Switch />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Relatórios Semanais</p>
                          <p className="text-sm text-muted-foreground">
                            Resumo semanal de compliance
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions">
                  <UserRolesManagement />
                </TabsContent>

                {/* Audit Tab */}
                <TabsContent value="audit">
                  <AuditLogsViewer />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {/* Modals */}
      <ChangePasswordModal 
        open={showChangePasswordModal} 
        onOpenChange={setShowChangePasswordModal} 
      />
      <Setup2FAModal 
        open={showSetup2FAModal} 
        onOpenChange={setShowSetup2FAModal} 
      />
      <ManageSessionsModal 
        open={showManageSessionsModal} 
        onOpenChange={setShowManageSessionsModal} 
      />
      <BackupDataModal 
        open={showBackupModal} 
        onOpenChange={setShowBackupModal} 
      />
      <ViewLogsModal 
        open={showLogsModal} 
        onOpenChange={setShowLogsModal} 
      />
      <DeleteAccountModal 
        open={showDeleteModal} 
        onOpenChange={setShowDeleteModal} 
      />
    </div>
  );
};

export default Settings;