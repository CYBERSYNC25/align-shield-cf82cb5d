import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ActiveCampaigns = () => {
  const campaigns = [
    {
      title: 'Revisão Trimestral Q4 2024 - AWS',
      system: 'AWS',
      reviewer: 'Sarah Chen',
      reviewerTitle: 'Cloud Architect',
      status: 'active',
      dueDate: '28/11/2024',
      totalUsers: 89,
      reviewedUsers: 67,
      completionRate: 75,
      criticalFindings: 3,
      createdDate: '15/11/2024',
      systemLogo: '☁️',
      priority: 'high'
    },
    {
      title: 'Certificação Semestral - Okta Identity',
      system: 'Okta',
      reviewer: 'Marcus Silva',
      reviewerTitle: 'Identity Admin',
      status: 'active',
      dueDate: '05/12/2024',
      totalUsers: 234,
      reviewedUsers: 198,
      completionRate: 85,
      criticalFindings: 1,
      createdDate: '01/11/2024',
      systemLogo: '🔐',
      priority: 'medium'
    },
    {
      title: 'Revisão de Privilégios Admin - GitHub',
      system: 'GitHub',
      reviewer: 'Ana Rodrigues',
      reviewerTitle: 'DevOps Lead',
      status: 'overdue',
      dueDate: '20/11/2024',
      totalUsers: 52,
      reviewedUsers: 34,
      completionRate: 65,
      criticalFindings: 5,
      createdDate: '10/11/2024',
      systemLogo: '🐙',
      priority: 'critical'
    },
    {
      title: 'Auditoria Anual - Microsoft 365',
      system: 'Microsoft 365',
      reviewer: 'Roberto Lima',
      reviewerTitle: 'IT Manager',
      status: 'scheduled',
      dueDate: '15/12/2024',
      totalUsers: 278,
      reviewedUsers: 0,
      completionRate: 0,
      criticalFindings: 0,
      createdDate: '20/11/2024',
      systemLogo: '📧',
      priority: 'medium'
    }
  ];

  const getStatusBadge = (status: string, priority: string) => {
    if (status === 'overdue') {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Atrasada</Badge>;
    }
    if (status === 'active') {
      const priorityClass = priority === 'critical' 
        ? 'bg-destructive/10 text-destructive border-destructive/20'
        : priority === 'high' 
        ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-success/10 text-success border-success/20';
      return <Badge variant="secondary" className={`gap-1 ${priorityClass}`}><Play className="h-3 w-3" />Ativa</Badge>;
    }
    if (status === 'scheduled') {
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Agendada</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />Concluída</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      critical: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' },
      high: { label: 'Alta', className: 'bg-warning text-warning-foreground' },
      medium: { label: 'Média', className: 'bg-info text-info-foreground' },
      low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' }
    };
    
    const conf = config[priority as keyof typeof config];
    return <Badge variant="secondary" className={conf.className}>{conf.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Campanhas de Revisão
        </h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {campaigns.map((campaign, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{campaign.systemLogo}</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold mb-2">
                      {campaign.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(campaign.status, campaign.priority)}
                      {getPriorityBadge(campaign.priority)}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />Iniciar Revisão
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />Ver Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pause className="h-4 w-4 mr-2" />Pausar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Reviewer Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {campaign.reviewer.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{campaign.reviewer}</p>
                  <p className="text-xs text-muted-foreground">{campaign.reviewerTitle}</p>
                </div>
              </div>

              {/* Progress */}
              {campaign.status === 'active' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso:</span>
                    <span className="font-medium">
                      {campaign.reviewedUsers}/{campaign.totalUsers} usuários
                    </span>
                  </div>
                  <Progress value={campaign.completionRate} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {campaign.completionRate}% concluído
                  </p>
                </div>
              )}

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
                  <span className={`font-medium ${campaign.status === 'overdue' ? 'text-destructive' : ''}`}>
                    {campaign.dueDate}
                  </span>
                </div>
              </div>

              {/* Critical Findings */}
              {campaign.criticalFindings > 0 && (
                <div className="flex items-center justify-between p-2 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Achados Críticos</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {campaign.criticalFindings}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              {campaign.status === 'scheduled' && (
                <Button className="w-full gap-2">
                  <Play className="h-4 w-4" />
                  Iniciar Revisão
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveCampaigns;