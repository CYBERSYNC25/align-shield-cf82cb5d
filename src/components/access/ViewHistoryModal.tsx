import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  History, 
  Search, 
  Filter,
  Clock,
  User,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react';

interface ViewHistoryModalProps {
  entity: any;
  isOpen: boolean;
  onClose: () => void;
}

const ViewHistoryModal = ({ entity, isOpen, onClose }: ViewHistoryModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const mockHistory = [
    {
      id: '1',
      timestamp: '2024-11-15 14:30:00',
      action: 'resolved',
      user: 'Ana Silva',
      userRole: 'CISO',
      details: 'Anomalia marcada como resolvida após verificação',
      changes: { status: { from: 'open', to: 'resolved' } },
      ip: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: '2024-11-15 10:15:00',
      action: 'assigned',
      user: 'João Santos',
      userRole: 'Gerente TI',
      details: 'Anomalia atribuída para investigação',
      changes: { assigned_to: { from: null, to: 'Ana Silva' } },
      ip: '192.168.1.105'
    },
    {
      id: '3',
      timestamp: '2024-11-15 09:45:00',
      action: 'comment_added',
      user: 'Maria Costa',
      userRole: 'Analista',
      details: 'Comentário adicionado: "Necessário verificar logs de acesso"',
      changes: {},
      ip: '192.168.1.110'
    },
    {
      id: '4',
      timestamp: '2024-11-14 16:20:00',
      action: 'severity_changed',
      user: 'Pedro Lima',
      userRole: 'Auditor',
      details: 'Severidade alterada de Média para Alta',
      changes: { severity: { from: 'medium', to: 'high' } },
      ip: '192.168.1.115'
    },
    {
      id: '5',
      timestamp: '2024-11-14 14:00:00',
      action: 'created',
      user: 'Sistema',
      userRole: 'Automatizado',
      details: 'Anomalia detectada automaticamente pelo sistema',
      changes: {},
      ip: 'system'
    }
  ];

  const filteredHistory = mockHistory.filter(entry => {
    const matchesSearch = entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const matchesUser = userFilter === 'all' || entry.user === userFilter;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueUsers = [...new Set(mockHistory.map(entry => entry.user))];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Activity className="h-4 w-4 text-info" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'assigned': return <User className="h-4 w-4 text-primary" />;
      case 'comment_added': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'severity_changed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created': return 'Criado';
      case 'resolved': return 'Resolvido';
      case 'assigned': return 'Atribuído';
      case 'comment_added': return 'Comentário';
      case 'severity_changed': return 'Severidade';
      default: return action;
    }
  };

  const getActionBadge = (action: string) => {
    const actionConfig = {
      created: { className: 'bg-info/10 text-info border-info/20' },
      resolved: { className: 'bg-success/10 text-success border-success/20' },
      assigned: { className: 'bg-primary/10 text-primary border-primary/20' },
      comment_added: { className: 'bg-warning/10 text-warning border-warning/20' },
      severity_changed: { className: 'bg-destructive/10 text-destructive border-destructive/20' }
    };
    
    const config = actionConfig[action as keyof typeof actionConfig] || { className: 'bg-muted/20 text-muted-foreground' };
    return (
      <Badge variant="outline" className={config.className}>
        {getActionLabel(action)}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const exportHistory = () => {
    const csvContent = [
      ['Data/Hora', 'Ação', 'Usuário', 'Função', 'Detalhes', 'IP'].join(','),
      ...filteredHistory.map(entry => [
        entry.timestamp,
        getActionLabel(entry.action),
        entry.user,
        entry.userRole,
        `"${entry.details}"`,
        entry.ip
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-${entity?.name || 'item'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Atividades - {entity?.name || entity?.user_name || 'Item'}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={exportHistory}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar no histórico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="created">Criação</SelectItem>
                    <SelectItem value="resolved">Resolução</SelectItem>
                    <SelectItem value="assigned">Atribuição</SelectItem>
                    <SelectItem value="comment_added">Comentários</SelectItem>
                    <SelectItem value="severity_changed">Mudanças</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todos usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos usuários</SelectItem>
                    {uniqueUsers.map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Timeline ({filteredHistory.length} entradas)
            </h3>
            
            <div className="space-y-3">
              {filteredHistory.map((entry, index) => {
                const { date, time } = formatTimestamp(entry.timestamp);
                
                return (
                  <Card key={entry.id} className="relative">
                    {index < filteredHistory.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {getActionIcon(entry.action)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getActionBadge(entry.action)}
                              <span className="text-sm text-muted-foreground">
                                {date} às {time}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {entry.user === 'Sistema' ? 'S' : entry.user.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-right">
                                <p className="text-sm font-medium">{entry.user}</p>
                                <p className="text-xs text-muted-foreground">{entry.userRole}</p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-foreground mb-2">{entry.details}</p>
                          
                          {Object.keys(entry.changes).length > 0 && (
                            <div className="bg-muted/50 rounded p-2 text-xs">
                              <p className="font-medium mb-1">Alterações:</p>
                              {Object.entries(entry.changes).map(([field, change]) => (
                                <div key={field} className="flex items-center gap-2">
                                  <span className="font-medium">{field}:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {String((change as any).from || 'vazio')}
                                  </Badge>
                                  <span>→</span>
                                  <Badge variant="outline" className="text-xs">
                                    {String((change as any).to)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              ID: {entry.id}
                            </span>
                            {entry.ip !== 'system' && (
                              <span className="text-xs text-muted-foreground">
                                IP: {entry.ip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {filteredHistory.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma entrada encontrada no histórico</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewHistoryModal;