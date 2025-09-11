import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  Calendar,
  FileCheck,
  Download
} from 'lucide-react';

const AttestationTracking = () => {
  const attestationCampaigns = [
    {
      title: 'Política de Segurança da Informação v2.1',
      type: 'policy',
      status: 'active',
      dueDate: '25/11/2024',
      totalRecipients: 278,
      completed: 267,
      pending: 11,
      completionRate: 96,
      createdDate: '10/11/2024',
      reminders: 2,
      pendingUsers: [
        { name: 'Ana Silva', department: 'Marketing', daysOverdue: 2 },
        { name: 'Carlos Santos', department: 'Vendas', daysOverdue: 1 },
        { name: 'Maria Oliveira', department: 'RH', daysOverdue: 0 }
      ]
    },
    {
      title: 'Treinamento LGPD - Certificação Anual',
      type: 'training',
      status: 'active',
      dueDate: '15/12/2024',
      totalRecipients: 278,
      completed: 189,
      pending: 89,
      completionRate: 68,
      createdDate: '01/11/2024',
      reminders: 1,
      pendingUsers: [
        { name: 'João Pereira', department: 'TI', daysOverdue: 0 },
        { name: 'Laura Costa', department: 'Financeiro', daysOverdue: 0 }
      ]
    },
    {
      title: 'Atesto de Conflito de Interesses Q4',
      type: 'attestation',
      status: 'active',
      dueDate: '30/11/2024',
      totalRecipients: 45,
      completed: 38,
      pending: 7,
      completionRate: 84,
      createdDate: '15/11/2024',
      reminders: 1,
      pendingUsers: [
        { name: 'Roberto Lima', department: 'Executivo', daysOverdue: 1 },
        { name: 'Fernanda Rocha', department: 'Juridico', daysOverdue: 0 }
      ]
    }
  ];

  const getStatusBadge = (status: string, completionRate: number) => {
    if (completionRate >= 95) {
      return <Badge className="bg-success/10 text-success border-success/20">Excelente</Badge>;
    }
    if (completionRate >= 80) {
      return <Badge className="bg-info/10 text-info border-info/20">Bom Progresso</Badge>;
    }
    if (completionRate >= 60) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Atenção</Badge>;
    }
    return <Badge variant="destructive">Crítico</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'policy': return <FileCheck className="h-4 w-4" />;
      case 'training': return <Users className="h-4 w-4" />;
      case 'attestation': return <CheckCircle className="h-4 w-4" />;
      default: return <FileCheck className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const types = {
      policy: { label: 'Política', className: 'bg-primary/10 text-primary border-primary/20' },
      training: { label: 'Treinamento', className: 'bg-info/10 text-info border-info/20' },
      attestation: { label: 'Atesto', className: 'bg-accent/10 text-accent-foreground border-accent/20' }
    };
    
    const config = types[type as keyof typeof types];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Rastreamento de Atestos
        </h2>
        <Button className="gap-2">
          <Mail className="h-4 w-4" />
          Enviar Lembretes
        </Button>
      </div>

      <div className="space-y-4">
        {attestationCampaigns.map((campaign, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/20">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold">
                      {campaign.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getTypeBadge(campaign.type)}
                      {getStatusBadge(campaign.status, campaign.completionRate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Relatório
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress Overview */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/10 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{campaign.completed}</div>
                  <div className="text-xs text-muted-foreground">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{campaign.pending}</div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{campaign.completionRate}%</div>
                  <div className="text-xs text-muted-foreground">Taxa</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">{campaign.reminders}</div>
                  <div className="text-xs text-muted-foreground">Lembretes</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado:</span>
                  <span className="font-medium">{campaign.createdDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className="font-medium">{campaign.dueDate}</span>
                </div>
              </div>

              {/* Pending Users */}
              {campaign.pendingUsers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="font-medium text-sm">Usuários Pendentes</span>
                  </div>
                  
                  <div className="space-y-2">
                    {campaign.pendingUsers.slice(0, 3).map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-warning/5 rounded-lg border border-warning/10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.department}</p>
                          </div>
                        </div>
                        
                        {user.daysOverdue > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {user.daysOverdue}d atraso
                          </Badge>
                        )}
                      </div>
                    ))}
                    
                    {campaign.pendingUsers.length > 3 && (
                      <div className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs">
                          Ver mais {campaign.pendingUsers.length - 3} usuários
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AttestationTracking;