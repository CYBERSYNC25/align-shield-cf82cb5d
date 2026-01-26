import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useDataExport } from '@/hooks/useDataExport';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { Setup2FAModal } from '@/components/settings/Setup2FAModal';
import { ManageSessionsModal } from '@/components/settings/ManageSessionsModal';
import { BackupDataModal } from '@/components/settings/BackupDataModal';
import { ViewLogsModal } from '@/components/settings/ViewLogsModal';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { ExportDataModal } from '@/components/settings/ExportDataModal';
import UserRolesManagement from '@/components/settings/UserRolesManagement';
import { SeedDatabaseCard } from '@/components/settings/SeedDatabaseCard';
import AuditLogsViewer from '@/components/settings/AuditLogsViewer';
import TrustCenterSettings from '@/components/settings/TrustCenterSettings';
import SystemLogsViewer from '@/components/settings/SystemLogsViewer';
import ApiKeysManagement from '@/components/settings/ApiKeysManagement';
import {
  User,
  Shield,
  Bell,
  Smartphone,
  Database,
  Activity,
  Trash2,
  Key,
  Globe,
  Terminal,
  Download,
  Scale,
  FileJson,
  AlertTriangle,
  Rocket,
  Play,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOnboardingWizard } from '@/hooks/useOnboardingWizard';

const Settings = () => {
  const { user } = useAuth();
  const { lastCompletedExport, deletionStatus } = useDataExport();
  const { state: onboardingState, resetOnboarding, isUpdating: onboardingUpdating } = useOnboardingWizard();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSetup2FAModal, setShowSetup2FAModal] = useState(false);
  const [showManageSessionsModal, setShowManageSessionsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Page Header - Full Width */}
              <div className="col-span-full">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground truncate">
                    Configurações
                  </h1>
                  <p className="text-muted-foreground line-clamp-2">
                    Gerencie suas preferências e configurações de conta
                  </p>
                </div>
              </div>

              {/* Tabs Content - Full Width */}
              <div className="col-span-full">
                <Tabs defaultValue="account" className="space-y-6">
                  <TabsList className="flex-wrap">
                    <TabsTrigger value="account">Conta</TabsTrigger>
                    <TabsTrigger value="security">Segurança</TabsTrigger>
                    <TabsTrigger value="notifications">Notificações</TabsTrigger>
                    <TabsTrigger value="permissions">Permissões</TabsTrigger>
                    <TabsTrigger value="audit">Auditoria</TabsTrigger>
                    <TabsTrigger value="system">Sistema</TabsTrigger>
                    <TabsTrigger value="system-logs" className="gap-1">
                      <Terminal className="w-4 h-4" />
                      Logs
                    </TabsTrigger>
                    <TabsTrigger value="trustcenter" className="gap-1">
                      <Globe className="w-4 h-4" />
                      Trust Center
                    </TabsTrigger>
                    <TabsTrigger value="api-keys" className="gap-1">
                      <Key className="w-4 h-4" />
                      API Keys
                    </TabsTrigger>
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
                          <p className="text-sm text-muted-foreground truncate">{user?.email || 'Não informado'}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Status da Conta</label>
                          <div>
                            <Badge variant="default">Ativa</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Onboarding Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <Rocket className="w-5 h-5 text-primary" />
                          Tutorial e Onboarding
                        </CardTitle>
                        <CardDescription>
                          Reveja o tutorial inicial ou refaça o onboarding
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">
                              {onboardingState.hasCompleted 
                                ? 'Onboarding Concluído' 
                                : onboardingState.wasSkipped 
                                  ? 'Onboarding Pulado' 
                                  : 'Onboarding Pendente'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {onboardingState.hasCompleted 
                                ? 'Você completou o wizard de configuração inicial.' 
                                : onboardingState.wasSkipped 
                                  ? 'Você pulou o wizard. Pode refazê-lo a qualquer momento.' 
                                  : 'Complete o wizard para configurar a plataforma.'}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={resetOnboarding}
                            disabled={onboardingUpdating}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {onboardingState.hasCompleted || onboardingState.wasSkipped 
                              ? 'Refazer Onboarding' 
                              : 'Iniciar Onboarding'}
                          </Button>
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
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
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
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
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
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
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
                    
                    {/* LGPD Data Rights */}
                    <Card className="border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <Scale className="w-5 h-5 text-primary" />
                          Seus Direitos (LGPD)
                        </CardTitle>
                        <CardDescription>
                          Gerencie seus dados conforme a Lei Geral de Proteção de Dados
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">Exportar Meus Dados</p>
                            <p className="text-sm text-muted-foreground">
                              Baixe todos os seus dados em formato JSON (portabilidade)
                            </p>
                          </div>
                          <Button variant="outline" onClick={() => setShowExportModal(true)}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                          </Button>
                        </div>
                        
                        {lastCompletedExport && (
                          <>
                            <Separator />
                            <div className="bg-muted p-3 rounded-lg text-sm flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <FileJson className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Última exportação: {formatDistanceToNow(new Date(lastCompletedExport.completed_at!), { addSuffix: true, locale: ptBR })}
                                </span>
                              </div>
                              {lastCompletedExport.file_url && lastCompletedExport.expires_at && new Date(lastCompletedExport.expires_at) > new Date() && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0"
                                  onClick={() => window.open(lastCompletedExport.file_url!, '_blank')}
                                >
                                  Baixar novamente
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                        
                        {deletionStatus.isScheduled && deletionStatus.scheduledFor && (
                          <>
                            <Separator />
                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-sm flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>
                                  Exclusão agendada para {format(deletionStatus.scheduledFor, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteModal(true)}
                              >
                                Gerenciar
                              </Button>
                            </div>
                          </>
                        )}
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
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
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
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
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
                          Ações que podem resultar em exclusão de dados
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">Excluir Conta</p>
                            <p className="text-sm text-muted-foreground">
                              Agende a exclusão da sua conta (30 dias de retenção)
                            </p>
                          </div>
                          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deletionStatus.isScheduled ? 'Gerenciar Exclusão' : 'Excluir Conta'}
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
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">Notificações por Email</p>
                            <p className="text-sm text-muted-foreground">
                              Receba notificações importantes por email
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">Alertas de Risco</p>
                            <p className="text-sm text-muted-foreground">
                              Notificações sobre novos riscos identificados
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">Lembretes de Auditoria</p>
                            <p className="text-sm text-muted-foreground">
                              Lembretes sobre auditorias pendentes
                            </p>
                          </div>
                          <Switch />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="min-w-0 flex-1">
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

                  {/* System Tab */}
                  <TabsContent value="system" className="space-y-6">
                    <SeedDatabaseCard />
                  </TabsContent>

                  {/* System Logs Tab */}
                  <TabsContent value="system-logs">
                    <SystemLogsViewer />
                  </TabsContent>

                  {/* Trust Center Tab */}
                  <TabsContent value="trustcenter">
                    <TrustCenterSettings />
                  </TabsContent>

                  {/* API Keys Tab */}
                  <TabsContent value="api-keys">
                    <ApiKeysManagement />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>

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
      <ExportDataModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
      />
    </div>
  );
};

export default Settings;
