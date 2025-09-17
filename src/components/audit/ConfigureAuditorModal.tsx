import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Key,
  AlertTriangle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudits } from '@/hooks/useAudits';

interface ConfigureAuditorModalProps {
  variant?: 'configure' | 'first-auditor';
  children?: React.ReactNode;
}

const ConfigureAuditorModal = ({ variant = 'configure', children }: ConfigureAuditorModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { audits } = useAudits();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    auditId: '',
    accessLevel: 'read_only' as 'read_only' | 'read_write' | 'admin',
    startDate: '',
    endDate: '',
    allowDownload: true,
    allowExport: false,
    notifyActivities: true,
    maxSessions: '1',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Auditor configurado",
        description: `Acesso concedido para ${formData.name}. Um email de convite foi enviado.`,
      });

      setOpen(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        role: '',
        phone: '',
        auditId: '',
        accessLevel: 'read_only',
        startDate: '',
        endDate: '',
        allowDownload: true,
        allowExport: false,
        notifyActivities: true,
        maxSessions: '1',
        description: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao configurar",
        description: "Falha ao configurar acesso do auditor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelInfo = (level: string) => {
    const config = {
      read_only: { 
        label: 'Somente Leitura', 
        color: 'bg-info/10 text-info border-info/20',
        description: 'Pode visualizar evidências e relatórios, mas não modificar'
      },
      read_write: { 
        label: 'Leitura e Escrita', 
        color: 'bg-warning/10 text-warning border-warning/20',
        description: 'Pode visualizar e adicionar comentários/observações'
      },
      admin: { 
        label: 'Administrador', 
        color: 'bg-danger/10 text-danger border-danger/20',
        description: 'Acesso completo incluindo configurações de auditoria'
      }
    };
    
    return config[level as keyof typeof config] || config.read_only;
  };

  const TriggerButton = children || (
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-2" />
      {variant === 'first-auditor' ? 'Configurar Primeiro Auditor' : 'Configurar Acesso'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {variant === 'first-auditor' ? 'Configurar Primeiro Auditor' : 'Configurar Acesso do Auditor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do auditor"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome da empresa de auditoria"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="ex: Auditor Sênior, Lead Auditor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auditId">Auditoria Relacionada</Label>
                  <Select 
                    value={formData.auditId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, auditId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a auditoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Acesso Geral</SelectItem>
                      {audits.map(audit => (
                        <SelectItem key={audit.id} value={audit.id}>
                          {audit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Configuration */}
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                Configuração de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessLevel">Nível de Acesso</Label>
                <Select 
                  value={formData.accessLevel} 
                  onValueChange={(value: 'read_only' | 'read_write' | 'admin') => 
                    setFormData(prev => ({ ...prev, accessLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read_only">Somente Leitura</SelectItem>
                    <SelectItem value="read_write">Leitura e Escrita</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="mt-2">
                  <Badge variant="outline" className={getAccessLevelInfo(formData.accessLevel).color}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getAccessLevelInfo(formData.accessLevel).label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getAccessLevelInfo(formData.accessLevel).description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Expiração</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Download</Label>
                    <p className="text-xs text-muted-foreground">
                      Auditor pode baixar evidências e relatórios
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowDownload}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, allowDownload: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Exportação</Label>
                    <p className="text-xs text-muted-foreground">
                      Auditor pode exportar dados em diferentes formatos
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowExport}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, allowExport: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificar Atividades</Label>
                    <p className="text-xs text-muted-foreground">
                      Receber notificações sobre atividades do auditor
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifyActivities}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, notifyActivities: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSessions">Máximo de Sessões Simultâneas</Label>
                <Select 
                  value={formData.maxSessions} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, maxSessions: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 sessão</SelectItem>
                    <SelectItem value="2">2 sessões</SelectItem>
                    <SelectItem value="3">3 sessões</SelectItem>
                    <SelectItem value="unlimited">Ilimitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <CardTitle className="text-base">Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Notas sobre o acesso</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Informações adicionais sobre o escopo ou restrições do acesso..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Warning */}
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-semibold text-warning mb-1">Importante</h4>
                  <p className="text-sm text-foreground">
                    O auditor receberá um email de convite com instruções de acesso. 
                    Certifique-se de que todas as informações estão corretas antes de prosseguir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.email}>
              {loading ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Conceder Acesso
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureAuditorModal;