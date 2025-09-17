import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIncidents } from '@/hooks/useIncidents';
import { useToast } from '@/hooks/use-toast';
import CreatePlaybookModal from './CreatePlaybookModal';
import ViewPlaybookModal from './ViewPlaybookModal';
import { 
  Plus, 
  BookOpen, 
  Play, 
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  Database
} from 'lucide-react';

const IncidentPlaybooks = () => {
  const { playbooks, loading, executePlaybook } = useIncidents();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<any>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {[...Array(5)].map((_, index) => (
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

  const handleExecutePlaybook = async (playbookId: string) => {
    await executePlaybook(playbookId);
  };

  const handleViewPlaybook = (playbookName: string) => {
    toast({
      title: "Visualizar Playbook",
      description: `Abrindo "${playbookName}"...`,
    });
  };

  const getPlaybookIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      'Security': '🛡️',
      'Infrastructure': '💾',
      'Performance': '⚡',
      'Data Protection': '🔒'
    };
    return iconMap[category] || '📋';
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

  const getCategoryBadge = (category: string) => {
    const config = {
      Security: { className: 'bg-destructive/10 text-destructive border-destructive/20' },
      Infrastructure: { className: 'bg-info/10 text-info border-info/20' },
      Performance: { className: 'bg-warning/10 text-warning border-warning/20' },
      'Data Protection': { className: 'bg-primary/10 text-primary border-primary/20' }
    };
    
    const conf = config[category as keyof typeof config] || { className: 'bg-muted/10 text-muted-foreground border-muted/20' };
    return <Badge variant="outline" className={conf.className}>{category}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Playbooks de Resposta
        </h2>
        <Button 
          className="gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
          Novo Playbook
        </Button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {(playbooks || []).map((playbook, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-xl">{getPlaybookIcon(playbook.category)}</div>
                  <div>
                    <CardTitle className="text-base font-semibold mb-2">
                      {playbook.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryBadge(playbook.category)}
                      {getSeverityBadge(playbook.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {playbook.description}
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => handleExecutePlaybook(playbook.id)}
                >
                  <Play className="h-4 w-4" />
                  Executar
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Playbook Metrics */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-muted/10 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{playbook.steps}</div>
                  <div className="text-xs text-muted-foreground">Passos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{playbook.estimatedTime}</div>
                  <div className="text-xs text-muted-foreground">Tempo Est.</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{playbook.usageCount}</div>
                  <div className="text-xs text-muted-foreground">Execuções</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{(playbook.roles || []).length}</div>
                  <div className="text-xs text-muted-foreground">Roles</div>
                </div>
              </div>

              {/* Roles Required */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">ROLES NECESSÁRIOS</p>
                <div className="flex flex-wrap gap-1">
                  {(playbook.roles || []).map((role, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">TRIGGERS COMUNS</p>
                <div className="space-y-1">
                  {(playbook.triggers || []).map((trigger, idx) => (
                    <div key={idx} className="text-xs text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {trigger}
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Último uso: {playbook.lastUsed}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6"
                    onClick={() => {
                      setSelectedPlaybook(playbook);
                      setShowViewModal(true);
                    }}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6"
                    onClick={() => toast({
                      title: "Editar Playbook",
                      description: `Abrindo editor para: ${playbook.name}`,
                    })}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreatePlaybookModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />

      <ViewPlaybookModal 
        open={showViewModal} 
        onOpenChange={setShowViewModal} 
        playbook={selectedPlaybook}
      />
    </div>
  );
};

export default IncidentPlaybooks;