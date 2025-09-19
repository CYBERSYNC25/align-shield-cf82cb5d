import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Settings, 
  Key, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface ConfigureIntegrationModalProps {
  system: any;
  isOpen: boolean;
  onClose: () => void;
}

const ConfigureIntegrationModal = ({ system, isOpen, onClose }: ConfigureIntegrationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    apiUrl: system?.api_url || '',
    apiKey: '',
    secretKey: '',
    syncInterval: '60',
    enableRealTime: true,
    enableAuditLogs: true,
    enableUserSync: true,
    enableRoleSync: false,
    timeout: '30',
    retryAttempts: '3'
  });

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Configuração de integração salva com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Conexão testada com sucesso!');
    } catch (error) {
      toast.error('Falha no teste de conexão');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copiado para a área de transferência');
  };

  if (!system) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Integração - {system.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">Conexão</TabsTrigger>
            <TabsTrigger value="sync">Sincronização</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="test">Teste</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações de Conexão</CardTitle>
                <CardDescription>Configure os parâmetros de conexão com o sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiUrl">URL da API</Label>
                  <Input
                    id="apiUrl"
                    value={config.apiUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                    placeholder="https://api.sistema.com/v1"
                  />
                </div>

                <div>
                  <Label htmlFor="apiKey">Chave da API</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Digite a chave da API"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(config.apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="secretKey">Chave Secreta</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    value={config.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="Digite a chave secreta"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeout">Timeout (segundos)</Label>
                    <Select value={config.timeout} onValueChange={(value) => setConfig(prev => ({ ...prev, timeout: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 segundos</SelectItem>
                        <SelectItem value="30">30 segundos</SelectItem>
                        <SelectItem value="60">60 segundos</SelectItem>
                        <SelectItem value="120">120 segundos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="retryAttempts">Tentativas de Reconexão</Label>
                    <Select value={config.retryAttempts} onValueChange={(value) => setConfig(prev => ({ ...prev, retryAttempts: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 tentativa</SelectItem>
                        <SelectItem value="3">3 tentativas</SelectItem>
                        <SelectItem value="5">5 tentativas</SelectItem>
                        <SelectItem value="10">10 tentativas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações de Sincronização</CardTitle>
                <CardDescription>Configure como os dados serão sincronizados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="syncInterval">Intervalo de Sincronização</Label>
                  <Select value={config.syncInterval} onValueChange={(value) => setConfig(prev => ({ ...prev, syncInterval: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="1440">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Sincronização em Tempo Real</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber atualizações imediatas quando há mudanças
                      </p>
                    </div>
                    <Switch
                      checked={config.enableRealTime}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableRealTime: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Sincronização de Usuários</Label>
                      <p className="text-sm text-muted-foreground">
                        Sincronizar dados de usuários automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={config.enableUserSync}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableUserSync: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Sincronização de Funções</Label>
                      <p className="text-sm text-muted-foreground">
                        Sincronizar funções e permissões de usuários
                      </p>
                    </div>
                    <Switch
                      checked={config.enableRoleSync}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableRoleSync: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Logs de Auditoria</Label>
                      <p className="text-sm text-muted-foreground">
                        Manter logs detalhados de sincronização
                      </p>
                    </div>
                    <Switch
                      checked={config.enableAuditLogs}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableAuditLogs: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações de Segurança</CardTitle>
                <CardDescription>Configure as opções de segurança da integração</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-success" />
                      <span className="font-medium text-sm">Criptografia TLS 1.3</span>
                    </div>
                    <Badge variant="default" className="text-xs">Habilitado</Badge>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-info" />
                      <span className="font-medium text-sm">Autenticação Mútua</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Certificados de Segurança</h4>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Certificado Cliente</p>
                        <p className="text-xs text-muted-foreground">Para autenticação mútua</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm text-warning">Aviso de Segurança</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mantenha suas chaves de API seguras e nunca as compartilhe. 
                        Revogue imediatamente qualquer chave comprometida.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Teste de Conectividade</CardTitle>
                <CardDescription>Teste a conexão com o sistema antes de salvar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <Wifi className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium text-sm">Conectividade</p>
                    <p className="text-xs text-muted-foreground">Teste de rede</p>
                  </Card>

                  <Card className="p-4 text-center">
                    <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium text-sm">Autenticação</p>
                    <p className="text-xs text-muted-foreground">Validar credenciais</p>
                  </Card>

                  <Card className="p-4 text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium text-sm">Permissões</p>
                    <p className="text-xs text-muted-foreground">Verificar acessos</p>
                  </Card>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={loading}
                    className="w-full max-w-md"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Testando Conexão...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Testar Conexão
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-info flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm text-info">Dica</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recomendamos testar a conexão antes de salvar as configurações 
                        para garantir que a integração funcionará corretamente.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureIntegrationModal;