import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Users, 
  Eye, 
  Download, 
  Clock,
  Link,
  Shield,
  Archive,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAudits } from '@/hooks/useAudits';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AuditorAccess = () => {
  const { audits, loading } = useAudits();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Portal do Auditor</h2>
          <div className="h-8 w-24 bg-muted/20 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Faça login para ver o portal do auditor</p>
      </div>
    );
  }

  // Mock data baseado nas auditorias reais
  const getAuditorSessionsFromAudits = () => {
    return audits.map(audit => ({
      auditor: audit.auditor_name,
      company: 'Auditoria Externa',
      email: audit.auditor_email,
      role: `${audit.framework} Auditor`,
      accessLevel: 'read_only' as const,
      status: audit.status === 'completed' ? 'expired' : 'active' as const,
      grantedDate: format(new Date(audit.start_date), 'dd/MM/yyyy', { locale: ptBR }),
      expiresDate: format(new Date(audit.end_date), 'dd/MM/yyyy', { locale: ptBR }),
      lastAccess: '2 horas atrás',
      downloadCount: audit.evidence_count > 0 ? Math.floor(audit.evidence_count / 10) : 0,
      viewedSections: [`${audit.framework} Controls`, 'Evidence Locker', 'Policy Library'],
      shareableLinks: Math.floor(Math.random() * 5) + 1
    }));
  };

  const auditorSessions = getAuditorSessionsFromAudits();

  const recentDownloads = [
    {
      filename: 'SOC2_Evidence_Package_Q4_2024.zip',
      auditor: 'John Mitchell',
      downloadDate: '20/11/2024 14:32',
      size: '127 MB',
      type: 'evidence_package'
    },
    {
      filename: 'ISO27001_Readiness_Report.pdf',
      auditor: 'Sarah Chen',
      downloadDate: '19/11/2024 09:15',
      size: '2.4 MB',
      type: 'report'
    },
    {
      filename: 'LGPD_Compliance_Checklist.xlsx',
      auditor: 'Marcus Silva',
      downloadDate: '18/11/2024 16:47',
      size: '856 KB',
      type: 'checklist'
    }
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
      expired: { label: 'Expirado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' }
    };
    
    const conf = config[status as keyof typeof config];
    return <Badge variant="outline" className={conf.className}>{conf.label}</Badge>;
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'evidence_package': return Archive;
      case 'report': return Eye;
      case 'checklist': return Shield;
      default: return Download;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Portal do Auditor
        </h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Acesso
        </Button>
      </div>

      {/* Active Auditor Sessions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Sessões Ativas</h3>
        
        {auditorSessions.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum auditor com acesso</h3>
            <p className="text-muted-foreground mb-4">Conceda acesso a auditores externos para facilitar o processo</p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Conceder Primeiro Acesso
            </Button>
          </div>
        ) : (
          auditorSessions.map((session, index) => (
            <Card key={index} className="bg-surface-elevated border-card-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">
                        {session.auditor.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-foreground">{session.auditor}</h4>
                      <p className="text-sm text-muted-foreground">{session.role}</p>
                      <p className="text-xs text-muted-foreground">{session.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(session.status)}
                    <Button variant="outline" size="sm" className="gap-1">
                      <Link className="h-3 w-3" />
                      Gerar Link
                    </Button>
                  </div>
                </div>

                {/* Access Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/10 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{session.downloadCount}</div>
                    <div className="text-xs text-muted-foreground">Downloads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{session.shareableLinks}</div>
                    <div className="text-xs text-muted-foreground">Links Ativos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{session.viewedSections.length}</div>
                    <div className="text-xs text-muted-foreground">Seções Acessadas</div>
                  </div>
                </div>

                {/* Viewed Sections */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-muted-foreground font-medium">SEÇÕES ACESSADAS</p>
                  <div className="flex flex-wrap gap-1">
                    {session.viewedSections.map((section, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span>Acesso concedido: {session.grantedDate}</span>
                  </div>
                  <div>
                    <span>Último acesso: {session.lastAccess}</span>
                  </div>
                  <div>
                    <span>Expira em: {session.expiresDate}</span>
                  </div>
                  <div>
                    <span>Email: {session.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Downloads */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Downloads Recentes</h3>
        
        <Card className="bg-surface-elevated border-card-border">
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentDownloads.map((download, index) => {
                const FileIcon = getFileTypeIcon(download.type);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-primary/10">
                        <FileIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{download.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {download.auditor} • {download.size} • {download.downloadDate}
                        </p>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditorAccess;