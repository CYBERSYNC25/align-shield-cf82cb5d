import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users,
  Play,
  Pause,
  Edit,
  Mail,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const ScheduledReports = () => {
  const scheduledReports = [
    {
      name: 'Executive Security Summary',
      description: 'Relatório executivo semanal com KPIs de segurança',
      schedule: 'Toda segunda-feira às 08:00',
      nextRun: '25/11/2024 08:00',
      lastRun: '18/11/2024 08:00',
      status: 'active',
      format: 'PDF',
      recipients: [
        { name: 'CEO', email: 'ceo@empresa.com' },
        { name: 'CISO', email: 'ciso@empresa.com' },
        { name: 'CTO', email: 'cto@empresa.com' }
      ],
      deliveryMethod: 'email',
      successRate: 100,
      lastStatus: 'success'
    },
    {
      name: 'Compliance Dashboard Monthly',
      description: 'Dashboard mensal de conformidade para auditores',
      schedule: '1º dia útil do mês às 09:00',
      nextRun: '01/12/2024 09:00',
      lastRun: '01/11/2024 09:00',
      status: 'active',
      format: 'PowerPoint',
      recipients: [
        { name: 'Compliance Officer', email: 'compliance@empresa.com' },
        { name: 'Risk Manager', email: 'risk@empresa.com' },
        { name: 'External Auditor', email: 'auditor@auditfirm.com' }
      ],
      deliveryMethod: 'email',
      successRate: 95,
      lastStatus: 'success'
    },
    {
      name: 'SOC 2 Evidence Package',
      description: 'Pacote trimestral de evidências SOC 2 para auditoria',
      schedule: 'Último dia do trimestre às 17:00',
      nextRun: '31/12/2024 17:00',
      lastRun: '30/09/2024 17:00',
      status: 'paused',
      format: 'ZIP Archive',
      recipients: [
        { name: 'SOC 2 Auditor', email: 'soc2@auditfirm.com' },
        { name: 'Compliance Team', email: 'compliance-team@empresa.com' }
      ],
      deliveryMethod: 'secure_link',
      successRate: 88,
      lastStatus: 'warning'
    },
    {
      name: 'Weekly Risk Assessment',
      description: 'Avaliação semanal de riscos e incidentes de segurança',
      schedule: 'Toda sexta-feira às 16:00',
      nextRun: '22/11/2024 16:00',
      lastRun: '15/11/2024 16:00',
      status: 'active',
      format: 'Excel',
      recipients: [
        { name: 'Risk Team', email: 'risk-team@empresa.com' },
        { name: 'Security Analysts', email: 'security@empresa.com' }
      ],
      deliveryMethod: 'email',
      successRate: 92,
      lastStatus: 'success'
    }
  ];

  const getStatusBadge = (status: string, lastStatus: string) => {
    if (status === 'paused') {
      return <Badge variant="outline" className="gap-1 bg-muted/20 text-muted-foreground"><Pause className="h-3 w-3" />Pausado</Badge>;
    }
    if (lastStatus === 'success') {
      return <Badge variant="secondary" className="bg-success/10 text-success border-success/20 gap-1"><CheckCircle className="h-3 w-3" />Ativo</Badge>;
    }
    if (lastStatus === 'warning') {
      return <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20"><AlertTriangle className="h-3 w-3" />Atenção</Badge>;
    }
    return <Badge variant="outline" className="gap-1 bg-info/10 text-info border-info/20"><Play className="h-3 w-3" />Ativo</Badge>;
  };

  const getDeliveryBadge = (method: string) => {
    const config = {
      email: { label: 'Email', icon: Mail, className: 'bg-primary/10 text-primary border-primary/20' },
      secure_link: { label: 'Link Seguro', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' }
    };
    
    const conf = config[method as keyof typeof config];
    const Icon = conf.icon;
    
    return (
      <Badge variant="outline" className={`gap-1 ${conf.className}`}>
        <Icon className="h-3 w-3" />
        {conf.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Relatórios Agendados
        </h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {scheduledReports.map((report, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(report.status, report.lastStatus)}
                    <Badge variant="outline" className="text-xs">
                      {report.format}
                    </Badge>
                    {getDeliveryBadge(report.deliveryMethod)}
                  </div>
                  <CardTitle className="text-base font-semibold mb-1">
                    {report.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {report.status === 'paused' ? (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/10 rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground">Agendamento:</span>
                  <div className="font-medium text-sm">{report.schedule}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Taxa de Sucesso:</span>
                  <div className="font-medium text-sm">{report.successRate}%</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Última execução: {report.lastRun}
                </div>
                <div className="flex items-center gap-1 text-foreground font-medium">
                  <Calendar className="h-4 w-4" />
                  Próxima: {report.nextRun}
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">DESTINATÁRIOS</p>
                <div className="flex flex-wrap gap-2">
                  {report.recipients.slice(0, 3).map((recipient, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted/10 rounded-lg">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {recipient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium">{recipient.name}</p>
                        <p className="text-xs text-muted-foreground">{recipient.email}</p>
                      </div>
                    </div>
                  ))}
                  {report.recipients.length > 3 && (
                    <div className="flex items-center justify-center p-2 bg-muted/10 rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        +{report.recipients.length - 3} destinatários
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Executar Agora
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Editar Agenda
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  Destinatários
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScheduledReports;