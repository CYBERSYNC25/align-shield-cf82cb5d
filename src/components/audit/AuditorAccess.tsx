import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Users, 
  Eye, 
  Download, 
  Clock,
  Calendar,
  Link,
  Shield,
  Archive,
  ExternalLink
} from 'lucide-react';

const AuditorAccess = () => {
  const auditorSessions = [
    {
      auditor: 'John Mitchell',
      company: 'CyberSec Auditors',
      email: 'j.mitchell@cybersecauditors.com',
      role: 'Lead SOC 2 Auditor',
      accessLevel: 'read_only',
      status: 'active',
      grantedDate: '15/11/2024',
      expiresDate: '15/02/2025',
      lastAccess: '2 horas atrás',
      downloadCount: 23,
      viewedSections: ['Evidence Locker', 'SOC 2 Controls', 'Policy Library'],
      shareableLinks: 3
    },
    {
      auditor: 'Sarah Chen',
      company: 'ISO Compliance Partners',
      email: 's.chen@isopartners.com',
      role: 'ISO 27001 Specialist',
      accessLevel: 'read_only',
      status: 'active',
      grantedDate: '08/11/2024',
      expiresDate: '08/05/2025',
      lastAccess: '1 dia atrás',
      downloadCount: 18,
      viewedSections: ['ISO 27001 Checklist', 'Risk Registry', 'Evidence Locker'],
      shareableLinks: 2
    },
    {
      auditor: 'Marcus Silva',
      company: 'LGPD Consultoria',
      email: 'm.silva@lgpdconsult.com.br',
      role: 'Data Protection Officer',
      accessLevel: 'read_only',
      status: 'expired',
      grantedDate: '20/10/2024',
      expiresDate: '20/11/2024',
      lastAccess: '3 dias atrás',
      downloadCount: 12,
      viewedSections: ['LGPD Controls', 'Privacy Policies', 'Data Inventory'],
      shareableLinks: 1
    }
  ];

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
        
        {auditorSessions.map((session, index) => (
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
        ))}
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