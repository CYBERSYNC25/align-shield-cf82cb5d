import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Send,
  User,
  Clock,
  Eye,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface AddCommentModalProps {
  entity: any;
  isOpen: boolean;
  onClose: () => void;
}

const AddCommentModal = ({ entity, isOpen, onClose }: AddCommentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [commentType, setCommentType] = useState('note');
  const [isInternal, setIsInternal] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState(true);

  const mockRecentComments = [
    {
      id: '1',
      author: 'Ana Silva',
      authorRole: 'CISO',
      content: 'Necessário verificar logs de acesso antes de resolver',
      timestamp: '2024-11-15 10:30',
      type: 'note',
      isInternal: false
    },
    {
      id: '2',
      author: 'João Santos',
      authorRole: 'Auditor',
      content: 'Investigação preliminar concluída. Sem evidências de comprometimento.',
      timestamp: '2024-11-14 16:45',
      type: 'update',
      isInternal: true
    },
    {
      id: '3',
      author: 'Maria Costa',
      authorRole: 'Analista',
      content: 'Escalado para revisão adicional devido à criticidade',
      timestamp: '2024-11-14 14:20',
      type: 'escalation',
      isInternal: false
    }
  ];

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Por favor, digite um comentário');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Comentário adicionado com sucesso!');
      setComment('');
      onClose();
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setLoading(false);
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return <MessageSquare className="h-4 w-4 text-info" />;
      case 'update': return <Info className="h-4 w-4 text-primary" />;
      case 'escalation': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'resolution': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCommentTypeBadge = (type: string) => {
    const typeConfig = {
      note: { label: 'Nota', className: 'bg-info/10 text-info border-info/20' },
      update: { label: 'Atualização', className: 'bg-primary/10 text-primary border-primary/20' },
      escalation: { label: 'Escalonamento', className: 'bg-warning/10 text-warning border-warning/20' },
      resolution: { label: 'Resolução', className: 'bg-success/10 text-success border-success/20' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.note;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Adicionar Comentário - {entity?.name || entity?.user_name || 'Item'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comment Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="commentType">Tipo de Comentário</Label>
              <Select value={commentType} onValueChange={setCommentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Nota Geral</SelectItem>
                  <SelectItem value="update">Atualização de Status</SelectItem>
                  <SelectItem value="escalation">Escalonamento</SelectItem>
                  <SelectItem value="resolution">Resolução</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-1">
                {getCommentTypeBadge(commentType)}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Comentário</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Digite seu comentário aqui..."
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{comment.length}/1000 caracteres</span>
                <span>Use @ para mencionar usuários</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Configurações</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Comentário Interno</p>
                    <p className="text-xs text-muted-foreground">Visível apenas para equipe interna</p>
                  </div>
                </div>
                <Switch
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Notificar Usuários</p>
                    <p className="text-xs text-muted-foreground">Enviar notificação para usuários relevantes</p>
                  </div>
                </div>
                <Switch
                  checked={notifyUsers}
                  onCheckedChange={setNotifyUsers}
                />
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2">Prévia do Comentário</h4>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">EU</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Você</span>
                      {getCommentTypeBadge(commentType)}
                      {isInternal && (
                        <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                          <Eye className="h-3 w-3 mr-1" />
                          Interno
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {comment || 'Seu comentário aparecerá aqui...'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Comments */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Comentários Recentes</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mockRecentComments.map((recentComment) => (
                <Card key={recentComment.id} className="bg-surface">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {recentComment.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{recentComment.author}</span>
                          <span className="text-xs text-muted-foreground">{recentComment.authorRole}</span>
                          {getCommentTypeBadge(recentComment.type)}
                          {recentComment.isInternal && (
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                              <Eye className="h-3 w-3 mr-1" />
                              Interno
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-2">{recentComment.content}</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{recentComment.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" size="sm">
                Ver todos os comentários
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !comment.trim()}>
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Adicionar Comentário
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCommentModal;