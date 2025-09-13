import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Calendar, 
  User, 
  Shield,
  Settings,
  MessageSquare,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Control {
  id: string;
  title: string;
  category: string;
  description: string;
  frameworks: string[];
  status: string;
  coverage: number;
  evidences: number;
  owner: string;
  lastUpdated: string;
  automationStatus: string;
  riskLevel: string;
}

interface ControlDetailsModalProps {
  control: Control;
  children: React.ReactNode;
}

const ControlDetailsModal = ({ control, children }: ControlDetailsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'text-success bg-success/10';
      case 'partial':
        return 'text-warning bg-warning/10';
      case 'missing':
        return 'text-danger bg-danger/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-danger" />;
      default:
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-danger';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const getAutomationColor = (automation: string) => {
    switch (automation) {
      case 'automated':
        return 'text-success bg-success/10';
      case 'semi-automated':
        return 'text-warning bg-warning/10';
      case 'manual':
        return 'text-info bg-info/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    toast({
      title: "Status atualizado",
      description: `Controle ${control.id} marcado como ${newStatus}`,
    });
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi registrado com sucesso",
      });
      setComment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Detalhes do Controle: {control.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono">
                      {control.id}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(control.status)}`}>
                      {getStatusIcon(control.status)}
                      <span className="ml-1">
                        {control.status === 'implemented' ? 'Implementado' :
                         control.status === 'partial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </Badge>
                    <Badge className={`text-xs ${getAutomationColor(control.automationStatus)}`}>
                      <Settings className="w-3 h-3 mr-1" />
                      {control.automationStatus === 'automated' ? 'Automatizado' :
                       control.automationStatus === 'semi-automated' ? 'Semi-Auto' : 'Manual'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {control.title}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {control.description}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-foreground">{control.coverage}%</div>
                  <div className="text-xs text-muted-foreground">Cobertura</div>
                  <Progress value={control.coverage} className="w-20 h-2" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="evidence">Evidências</TabsTrigger>
              <TabsTrigger value="assessment">Avaliação</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Frameworks */}
                <Card className="bg-surface-elevated border-card-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Frameworks Relacionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {control.frameworks.map((framework) => (
                        <Badge key={framework} variant="secondary" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Details */}
                <Card className="bg-surface-elevated border-card-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Informações do Controle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Categoria:</span>
                      <Badge variant="outline" className="text-xs">
                        {control.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Responsável:</span>
                      <span className="text-sm font-medium">{control.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nível de Risco:</span>
                      <span className={`text-sm font-semibold ${getRiskColor(control.riskLevel)}`}>
                        {control.riskLevel === 'high' ? 'Alto' :
                         control.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Evidências:</span>
                      <span className="text-sm font-medium">{control.evidences}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-surface-elevated border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('implemented')}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar como Implementado
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('partial')}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Marcar como Parcial
                    </Button>
                    <Button size="sm" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Carregar Evidência
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              <Card className="bg-surface-elevated border-card-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Evidências do Controle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma evidência carregada ainda.</p>
                    <Button variant="outline" className="mt-4" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Carregar Primeira Evidência
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessment" className="space-y-4">
              <Card className="bg-surface-elevated border-card-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Adicionar Comentário de Avaliação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Adicione observações sobre este controle..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment} disabled={!comment.trim()}>
                    Adicionar Comentário
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-surface-elevated border-card-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Histórico de Comentários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum comentário ainda.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="bg-surface-elevated border-card-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Histórico de Alterações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Controle criado</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(control.lastUpdated).toLocaleDateString('pt-BR')} - {control.owner}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ControlDetailsModal;