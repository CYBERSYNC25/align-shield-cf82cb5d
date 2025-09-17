import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIncidents } from '@/hooks/useIncidents';
import { useToast } from '@/hooks/use-toast';
import ReportIncidentModal from './ReportIncidentModal';
import { 
  Plus, 
  AlertTriangle, 
  Clock, 
  Users,
  MessageSquare,
  ExternalLink,
  Play,
  CheckCircle
} from 'lucide-react';

const ActiveIncidents = () => {
  const { incidents, loading, updateIncidentStatus, escalateIncident } = useIncidents();
  const { toast } = useToast();
  const [showReportModal, setShowReportModal] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
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
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleOpenIncident = (incidentTitle: string) => {
    toast({
      title: "Abrindo Incidente",
      description: `Abrindo detalhes de "${incidentTitle}"...`,
    });
  };

  const handleUpdateIncident = (incidentId: string) => {
    toast({
      title: "Atualizando Incidente",
      description: "Abrindo formulário de atualização...",
    });
  };

  const handleEscalateIncident = async (incidentId: string) => {
    await escalateIncident(incidentId);
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
      high: { label: 'Alto', className: 'bg-warning text-warning-foreground' },
      medium: { label: 'Médio', className: 'bg-info text-info-foreground' },
      low: { label: 'Baixo', className: 'bg-success text-success-foreground' }
    };
    
    const conf = config[severity as keyof typeof config];
    return <Badge variant="secondary" className={conf.className}>{conf.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      investigating: { label: 'Investigando', icon: AlertTriangle, className: 'bg-warning/10 text-warning border-warning/20' },
      identified: { label: 'Identificado', icon: CheckCircle, className: 'bg-info/10 text-info border-info/20' },
      resolving: { label: 'Resolvendo', icon: Play, className: 'bg-primary/10 text-primary border-primary/20' },
      resolved: { label: 'Resolvido', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' }
    };
    
    const conf = config[status as keyof typeof config];
    const Icon = conf.icon;
    
    return (
      <Badge variant="outline" className={`gap-1 ${conf.className}`}>
        <Icon className="h-3 w-3" />
        {conf.label}
      </Badge>
    );
  };

  const getImpactBadge = (impact: string) => {
    const config = {
      high: { label: 'Alto Impacto', className: 'text-destructive' },
      medium: { label: 'Médio Impacto', className: 'text-warning' },
      low: { label: 'Baixo Impacto', className: 'text-success' }
    };
    
    const conf = config[impact as keyof typeof config];
    return <span className={`text-xs font-medium ${conf.className}`}>{conf.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Incidentes Ativos
        </h2>
        <Button 
          className="gap-2"
          onClick={() => setShowReportModal(true)}
        >
          <Plus className="h-4 w-4" />
          Reportar Incidente
        </Button>
      </div>

      <div className="space-y-4">
        {incidents.map((incident, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {incident.id}
                    </Badge>
                    {getSeverityBadge(incident.severity)}
                    {getStatusBadge(incident.status)}
                  </div>
                  <CardTitle className="text-base font-semibold mb-1">
                    {incident.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {incident.description}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => handleOpenIncident(incident.title)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Incident Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/10 rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground">Reportado em:</span>
                  <div className="font-medium text-sm">{incident.reportedAt}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Resolução estimada:</span>
                  <div className="font-medium text-sm">{incident.estimatedResolution}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Impacto:</span>
                  <div>{getImpactBadge(incident.impactLevel)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Playbook:</span>
                  <div className="font-medium text-sm">{incident.playbook}</div>
                </div>
              </div>

              {/* Assigned Person */}
              <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {incident.assignedTo.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{incident.assignedTo}</p>
                  <p className="text-xs text-muted-foreground">{incident.assignedRole}</p>
                </div>
              </div>

              {/* Affected Systems */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">SISTEMAS AFETADOS</p>
                <div className="flex flex-wrap gap-1">
                  {incident.affectedSystems.map((system, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Activity Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {incident.updates} atualizações
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {incident.watchers} observadores
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateIncident(incident.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleEscalateIncident(incident.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Escalar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportIncidentModal 
        open={showReportModal} 
        onOpenChange={setShowReportModal} 
      />
    </div>
  );
};

export default ActiveIncidents;