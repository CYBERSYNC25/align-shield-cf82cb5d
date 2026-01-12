import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  User, 
  Shield,
  Clock,
  Eye,
  MoreVertical,
  UserCheck,
  History,
  MessageSquare,
  UserCog,
  Github,
  Cloud,
  Database,
  Server,
  Globe
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAccess } from '@/hooks/useAccess';
import { toast } from 'sonner';
import ViewHistoryModal from './ViewHistoryModal';
import AssignResponsibleModal from './AssignResponsibleModal';
import AddCommentModal from './AddCommentModal';

// Provider icon mapping
const getProviderIcon = (systemName: string) => {
  const name = systemName.toLowerCase();
  if (name.includes('github')) return <Github className="h-4 w-4" />;
  if (name.includes('slack')) return <MessageSquare className="h-4 w-4" />;
  if (name.includes('aws') || name.includes('amazon')) return <Cloud className="h-4 w-4" />;
  if (name.includes('azure')) return <Cloud className="h-4 w-4" />;
  if (name.includes('google')) return <Globe className="h-4 w-4" />;
  if (name.includes('jira') || name.includes('atlassian')) return <Database className="h-4 w-4" />;
  if (name.includes('okta') || name.includes('auth0')) return <Shield className="h-4 w-4" />;
  return <Server className="h-4 w-4" />;
};

// Severity tooltip descriptions
const getSeverityDescription = (severity: string) => {
  switch (severity) {
    case 'critical': return 'Requer ação imediata - Risco de segurança crítico';
    case 'high': return 'Prioridade alta - Resolver em até 24 horas';
    case 'medium': return 'Prioridade média - Resolver em até 7 dias';
    case 'low': return 'Prioridade baixa - Monitorar e resolver quando possível';
    default: return 'Avaliar e classificar adequadamente';
  }
};

const AnomaliesDetection = () => {
  const { anomalies, loading, resolveAnomaly } = useAccess();
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const handleResolveAnomaly = async (id: string, status: 'resolved' | 'false_positive') => {
    try {
      await resolveAnomaly(id, { status });
      
      if (status === 'resolved') {
        toast.success('Anomalia resolvida com sucesso');
        // Simular criação de ticket no Jira
        const ticketId = `APOC-${Math.floor(1000 + Math.random() * 9000)}`;
        toast.info(`Ticket ${ticketId} criado no Jira automaticamente`, {
          description: `Acompanhe o progresso em jira.company.com/browse/${ticketId}`,
          duration: 5000
        });
      } else {
        toast.success('Marcada como falso positivo');
      }
    } catch (error) {
      console.error('Error resolving anomaly:', error);
      toast.error('Erro ao processar anomalia. Verifique a conectividade com o banco de dados.');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badge = (() => {
      switch (severity) {
        case 'critical': 
          return <Badge variant="destructive" className="text-xs">Crítica</Badge>;
        case 'high': 
          return <Badge variant="destructive" className="text-xs bg-warning text-warning-foreground">Alta</Badge>;
        case 'medium': 
          return <Badge variant="secondary" className="text-xs">Média</Badge>;
        case 'low': 
          return <Badge variant="outline" className="text-xs">Baixa</Badge>;
        default: 
          return <Badge variant="secondary" className="text-xs">Média</Badge>;
      }
    })();

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{getSeverityDescription(severity)}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'excessive_privileges': return <Shield className="h-4 w-4" />;
      case 'unused_access': return <Clock className="h-4 w-4" />;
      case 'suspicious_activity': return <Eye className="h-4 w-4" />;
      case 'policy_violation': return <AlertTriangle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'excessive_privileges': return 'Privilégios Excessivos';
      case 'unused_access': return 'Acesso Não Utilizado';
      case 'suspicious_activity': return 'Atividade Suspeita';
      case 'policy_violation': return 'Violação de Política';
      default: return 'Anomalia';
    }
  };

  if (loading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Anomalias Detectadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {anomalies.filter(a => a.status !== 'resolved').map((anomaly) => (
              <div key={anomaly.id} className="p-4 border border-card-border rounded-lg bg-surface">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      anomaly.severity === 'critical' ? 'bg-destructive/10' :
                      anomaly.severity === 'high' ? 'bg-warning/10' :
                      anomaly.severity === 'medium' ? 'bg-info/10' :
                      'bg-muted'
                    }`}>
                      {getTypeIcon(anomaly.anomaly_type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">{anomaly.user_name}</h4>
                        <span className="text-muted-foreground">•</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5 cursor-help">
                              {getProviderIcon(anomaly.system_name)}
                              {anomaly.system_name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Sistema integrado: {anomaly.system_name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(anomaly.severity)}
                        <Badge variant="outline" className="text-xs">{getTypeLabel(anomaly.anomaly_type)}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        setSelectedAnomaly(anomaly);
                        setShowHistoryModal(true);
                      }}>
                        <History className="h-4 w-4 mr-2" />
                        Ver Histórico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedAnomaly(anomaly);
                        setShowAssignModal(true);
                      }}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Atribuir Responsável
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedAnomaly(anomaly);
                        setShowCommentModal(true);
                      }}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Adicionar Comentário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {anomaly.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Detectado em: {new Date(anomaly.detected_at).toLocaleString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleResolveAnomaly(anomaly.id, 'false_positive')}
                    >
                      Falso Positivo
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleResolveAnomaly(anomaly.id, 'resolved')}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Resolver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {anomalies.filter(a => a.status !== 'resolved').length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma anomalia ativa encontrada</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Modals */}
        <ViewHistoryModal
          entity={selectedAnomaly}
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedAnomaly(null);
          }}
        />

        <AssignResponsibleModal
          entity={selectedAnomaly}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedAnomaly(null);
          }}
        />

        <AddCommentModal
          entity={selectedAnomaly}
          isOpen={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedAnomaly(null);
          }}
        />
      </Card>
    </TooltipProvider>
  );
};

export default AnomaliesDetection;
