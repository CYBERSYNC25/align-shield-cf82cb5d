import { useState, useEffect } from 'react';
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
  Upload,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFrameworks } from '@/hooks/useFrameworks';
import EvidenceUploadModal from '@/components/audit/EvidenceUploadModal';

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

interface HistoryEntry {
  id: string;
  action: string;
  user: string;
  date: string;
  details?: string;
}

interface CommentEntry {
  id: string;
  text: string;
  user: string;
  date: string;
}

interface Evidence {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
}

const ControlDetailsModal = ({ control, children }: ControlDetailsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateControlStatus } = useFrameworks();

  const userName = user?.user_metadata?.display_name || user?.email || 'Usuário';

  // Initialize history with control creation
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{
        id: crypto.randomUUID(),
        action: 'Controle criado',
        user: control.owner,
        date: control.lastUpdated
      }]);
    }
  }, []);

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

  const handleUpdateStatus = async (newStatus: string) => {
    // Update control status
    control.status = newStatus;
    await updateControlStatus(control.id, newStatus as any);

    // Add to history
    const statusLabel = newStatus === 'implemented' ? 'Implementado' : 
                        newStatus === 'partial' ? 'Parcial' : 'Pendente';
    
    const newHistoryEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      action: `Status alterado para ${statusLabel}`,
      user: userName,
      date: new Date().toLocaleDateString('pt-BR')
    };

    setHistory(prev => [newHistoryEntry, ...prev]);

    toast({
      title: "Status atualizado",
      description: `Controle ${control.id} marcado como ${statusLabel}`,
    });
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      const newComment: CommentEntry = {
        id: crypto.randomUUID(),
        text: comment,
        user: userName,
        date: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setComments(prev => [newComment, ...prev]);

      // Add to history
      const newHistoryEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        action: 'Comentário adicionado',
        user: userName,
        date: new Date().toLocaleDateString('pt-BR'),
        details: comment.substring(0, 100) + (comment.length > 100 ? '...' : '')
      };

      setHistory(prev => [newHistoryEntry, ...prev]);

      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi registrado com sucesso",
      });
      setComment('');
    }
  };

  const handleEvidenceUploaded = () => {
    // Simulate evidence added
    const newEvidence: Evidence = {
      id: crypto.randomUUID(),
      name: `Evidência ${evidences.length + 1}`,
      type: 'PDF',
      uploadedBy: userName,
      uploadDate: new Date().toLocaleDateString('pt-BR')
    };

    setEvidences(prev => [...prev, newEvidence]);

    // Update control evidence count
    control.evidences = evidences.length + 1;

    // Add to history
    const newHistoryEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      action: 'Evidência carregada',
      user: userName,
      date: new Date().toLocaleDateString('pt-BR'),
      details: newEvidence.name
    };

    setHistory(prev => [newHistoryEntry, ...prev]);

    setShowEvidenceUpload(false);
  };

  const handleDownloadEvidence = (evidence: Evidence) => {
    toast({
      title: "Download iniciado",
      description: `Baixando ${evidence.name}...`,
    });
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
                    <Button size="sm" variant="outline" onClick={() => setShowEvidenceUpload(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Carregar Evidência
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              <Card className="bg-surface-elevated border-card-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Evidências do Controle ({evidences.length})
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowEvidenceUpload(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar Evidência
                  </Button>
                </CardHeader>
                <CardContent>
                  {evidences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma evidência carregada ainda.</p>
                      <Button variant="outline" className="mt-4" size="sm" onClick={() => setShowEvidenceUpload(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Carregar Primeira Evidência
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evidences.map((evidence) => (
                        <div key={evidence.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <div className="text-sm font-medium">{evidence.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {evidence.type} • Enviado por {evidence.uploadedBy} • {evidence.uploadDate}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleDownloadEvidence(evidence)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <CardTitle className="text-sm font-medium">Histórico de Comentários ({comments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum comentário ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((commentEntry) => (
                        <div key={commentEntry.id} className="p-4 bg-background rounded-lg border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{commentEntry.user}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{commentEntry.date}</span>
                          </div>
                          <p className="text-sm text-foreground">{commentEntry.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="bg-surface-elevated border-card-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Histórico de Alterações ({history.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium">{entry.action}</div>
                            <div className="text-xs text-muted-foreground">{entry.date}</div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{entry.user}</span>
                          </div>
                          {entry.details && (
                            <div className="mt-2 text-xs text-muted-foreground italic">
                              {entry.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Evidence Upload Modal */}
        {showEvidenceUpload && (
          <Dialog open={showEvidenceUpload} onOpenChange={setShowEvidenceUpload}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload de Evidência para {control.id}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <EvidenceUploadModal onSuccess={handleEvidenceUploaded} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ControlDetailsModal;