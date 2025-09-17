import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import EditScheduleModal from './EditScheduleModal';
import ManageRecipientsModal from './ManageRecipientsModal';
import CreateReportModal from './CreateReportModal';
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
  const { scheduledReports, loading, toggleScheduledReport } = useReports();
  const { toast } = useToast();
  const [editScheduleOpen, setEditScheduleOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [selectedReportName, setSelectedReportName] = useState('');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="bg-surface-elevated border-card-border animate-pulse">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleToggleReport = async (reportId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await toggleScheduledReport(reportId, newStatus as 'active' | 'paused');
  };

  const handleEditSchedule = (reportName: string) => {
    setSelectedReportName(reportName);
    setEditScheduleOpen(true);
  };

  const handleManageRecipients = (reportName: string) => {
    setSelectedReportName(reportName);
    setRecipientsOpen(true);
  };

  const handleRunNow = (reportName: string) => {
    toast({
      title: "Executando Relatório",
      description: `"${reportName}" está sendo executado agora.`,
    });
  };

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
        <Button className="gap-2" onClick={() => setCreateReportOpen(true)}>
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditSchedule(report.name)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {report.status === 'paused' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleReport(report.id, report.status)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleReport(report.id, report.status)}
                    >
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleRunNow(report.name)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Executar Agora
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditSchedule(report.name)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Editar Agenda
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleManageRecipients(report.name)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Destinatários
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      <EditScheduleModal
        isOpen={editScheduleOpen}
        onClose={() => setEditScheduleOpen(false)}
        reportName={selectedReportName}
      />
      
      <ManageRecipientsModal
        isOpen={recipientsOpen}
        onClose={() => setRecipientsOpen(false)}
        reportName={selectedReportName}
      />

      <CreateReportModal
        isOpen={createReportOpen}
        onClose={() => setCreateReportOpen(false)}
      />
    </div>
  );
};

export default ScheduledReports;