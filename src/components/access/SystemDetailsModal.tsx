import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Users, 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Database,
  Wifi
} from 'lucide-react';

interface SystemDetailsModalProps {
  system: any;
  isOpen: boolean;
  onClose: () => void;
}

const SystemDetailsModal = ({ system, isOpen, onClose }: SystemDetailsModalProps) => {
  if (!system) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cloud': return <Server className="h-4 w-4" />;
      case 'saas': return <Database className="h-4 w-4" />;
      case 'on-premise': return <Server className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-info';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const users: Array<{ name: string; role: string; lastAccess: string; status: string }> = [];
  const reviews: Array<{ date: string; reviewer: string; status: string; notes: string }> = [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(system.type)}
            {system.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários ({users.length})</TabsTrigger>
            <TabsTrigger value="compliance">Conformidade</TabsTrigger>
            <TabsTrigger value="reviews">Revisões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <Badge variant="outline">{system.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Usuários:</span>
                      <span className="text-sm font-medium">{system.users_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nível de Risco:</span>
                      <span className={`text-sm font-medium ${getRiskColor(system.risk_level)}`}>
                        {system.risk_level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status Integração:</span>
                      <Badge variant={system.integration_status === 'connected' ? 'default' : 'destructive'}>
                        <Wifi className="h-3 w-3 mr-1" />
                        {system.integration_status === 'connected' ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status de Conformidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conformidade Geral</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">12 controles implementados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm">3 controles pendentes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Última revisão: {new Date(system.last_review || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usuários do Sistema</CardTitle>
                <CardDescription>Lista de usuários com acesso ao sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Último acesso: {user.lastAccess}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    ISO 27001
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conformidade:</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <Progress value={92} className="h-1" />
                    <p className="text-xs text-muted-foreground">23/25 controles</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    SOC 2
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conformidade:</span>
                      <span className="font-medium">88%</span>
                    </div>
                    <Progress value={88} className="h-1" />
                    <p className="text-xs text-muted-foreground">15/17 controles</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    LGPD
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conformidade:</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <Progress value={75} className="h-1" />
                    <p className="text-xs text-muted-foreground">9/12 controles</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Revisões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="border-l-2 border-muted pl-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.reviewer}</span>
                          <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
                            {review.status === 'approved' ? 'Aprovado' : 'Pendente'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.notes}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemDetailsModal;