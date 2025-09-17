import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Shield, 
  Clock, 
  Users, 
  Key,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Settings,
  Download
} from 'lucide-react';
import { useAudits } from '@/hooks/useAudits';
import ConfigureAuditorModal from './ConfigureAuditorModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const AuditorAccess = () => {
  const { audits, evidence, loading } = useAudits();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Acesso dos Auditores</h2>
          <div className="h-8 w-32 bg-muted/20 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/20 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Mock data baseado nas auditorias reais
  const getAuditorSessionsFromAudits = () => {
    return audits.map(audit => ({
      auditor: audit.auditor || 'Auditor não definido',
      company: 'Auditoria Externa',
      email: `${(audit.auditor || 'auditor').toLowerCase().replace(' ', '.')}@auditoria.com`,
      role: `${audit.framework} Auditor`,
      accessLevel: 'read_only' as const,
      status: audit.status === 'completed' ? 'expired' : 'active' as const,
      grantedDate: format(new Date(audit.start_date || Date.now()), 'dd/MM/yyyy', { locale: ptBR }),
      expiresDate: format(new Date(audit.end_date || Date.now()), 'dd/MM/yyyy', { locale: ptBR }),
      auditId: audit.id,
      progress: audit.progress || 0,
      evidenceAccessed: evidence.filter(ev => ev.audit_id === audit.id).length || 0
    }));
  };

  const auditorSessions = getAuditorSessionsFromAudits();

  const getStatusBadge = (status: 'active' | 'expired' | 'pending') => {
    const config = {
      active: { color: 'bg-success/10 text-success border-success/20', label: 'Ativa', icon: CheckCircle },
      expired: { color: 'bg-danger/10 text-danger border-danger/20', label: 'Expirada', icon: AlertTriangle },
      pending: { color: 'bg-warning/10 text-warning border-warning/20', label: 'Pendente', icon: Clock }
    };
    
    const { color, label, icon: Icon } = config[status];
    return (
      <Badge variant="outline" className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getAccessLevelBadge = (level: 'read_only' | 'read_write' | 'admin') => {
    const config = {
      read_only: { color: 'bg-info/10 text-info border-info/20', label: 'Somente Leitura' },
      read_write: { color: 'bg-warning/10 text-warning border-warning/20', label: 'Leitura/Escrita' },
      admin: { color: 'bg-danger/10 text-danger border-danger/20', label: 'Administrador' }
    };
    
    const { color, label } = config[level];
    return (
      <Badge variant="outline" className={color}>
        <Key className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Acesso dos Auditores
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {auditorSessions.filter(s => s.status === 'active').length} Sessões Ativas
          </Badge>
          <ConfigureAuditorModal variant="configure" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {auditorSessions.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum auditor configurado</h3>
            <p className="text-muted-foreground mb-4">Configure o acesso para auditores externos</p>
            <ConfigureAuditorModal variant="first-auditor" />
          </div>
        ) : (
          auditorSessions.map((session) => (
            <Card key={session.auditId} className="bg-surface-elevated border-card-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {session.auditor.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{session.auditor}</CardTitle>
                      <p className="text-sm text-muted-foreground">{session.company}</p>
                      <p className="text-xs text-muted-foreground">{session.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(session.status as 'active' | 'expired' | 'pending')}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Role and Access Level */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Função</span>
                    <Badge variant="secondary">{session.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Nível de Acesso</span>
                    {getAccessLevelBadge(session.accessLevel)}
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{session.progress}%</div>
                    <div className="text-xs text-muted-foreground">Progresso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{session.evidenceAccessed}</div>
                    <div className="text-xs text-muted-foreground">Evidências</div>
                  </div>
                </div>

                {/* Access Period */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Concedido em</span>
                    <span className="text-foreground font-medium">{session.grantedDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expira em</span>
                    <span className="text-foreground font-medium">{session.expiresDate}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      toast({
                        title: "Portal do Auditor",
                        description: "Redirecionando para o portal externo do auditor...",
                      });
                      // Simulate redirect to external auditor portal
                      setTimeout(() => {
                        window.open(`/auditor-portal/${session.auditId}`, '_blank');
                      }, 1000);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Portal do Auditor
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      toast({
                        title: "Download iniciado",
                        description: "O log de atividades está sendo baixado...",
                      });
                      // Simulate file download
                      setTimeout(() => {
                        const blob = new Blob([`Log de atividades - ${session.auditor}\n\nData: ${new Date().toLocaleString()}\nAções realizadas: ${Math.floor(Math.random() * 50) + 10}`], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `log-atividades-${session.auditor.replace(' ', '-').toLowerCase()}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }, 1000);
                    }}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Log de Atividades
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditorAccess;