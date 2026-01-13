import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Shield,
  FileText,
  Download,
  Eye,
  User,
  Loader2,
  Zap
} from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoEvidence } from '@/hooks/useAutoEvidence';
import AuditReportModal from './AuditReportModal';
import SearchEvidenceModal from './SearchEvidenceModal';
import ControlEvidenceModal from './ControlEvidenceModal';

const FrameworkChecklists = () => {
  const { frameworks, controls, loading, updateControlStatus, getFrameworkStats } = useFrameworks();
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasAutoEvidence, getEvidenceStats } = useAutoEvidence();
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [controlModalOpen, setControlModalOpen] = useState(false);

  // Remover logs de debug
  const handleViewEvidences = (control: any) => {
    if (!control) {
      console.error('Control is null or undefined');
      return;
    }
    setSelectedControl(control);
    setControlModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Checklists por Framework</h2>
          <div className="h-8 w-32 bg-muted/20 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando frameworks...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Faça login para ver os frameworks</p>
      </div>
    );
  }

  if (frameworks.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum framework configurado</h3>
        <p className="text-muted-foreground">Configure frameworks de conformidade para começar</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = {
      passed: { label: 'Aprovado', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
      failed: { label: 'Falhou', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
      pending: { label: 'Pendente', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
      na: { label: 'N/A', icon: Shield, className: 'bg-muted/10 text-muted-foreground border-muted/20' }
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

  return (
    <Card className="bg-surface-elevated border-card-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Checklists</h3>
            <Badge variant="outline" className="text-xs">
              {frameworks.length} Frameworks
            </Badge>
          </div>
          <AuditReportModal />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs value={selectedFramework || frameworks[0]?.id} onValueChange={setSelectedFramework} className="w-full">
          <TabsList className="w-full mb-4">
            {frameworks.slice(0, 3).map((framework) => (
              <TabsTrigger key={framework.id} value={framework.id} className="text-xs flex-1">
                {framework.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {frameworks.map((framework) => {
            const stats = getFrameworkStats(framework.id);
            const frameworkControls = controls.filter(c => c.framework_id === framework.id);
            
            return (
              <TabsContent key={framework.id} value={framework.id} className="mt-0 space-y-4">
                {/* Framework Overview */}
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{framework.name}</span>
                    <Badge variant="outline" className="text-xs">v{framework.version}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                    <div>
                      <div className="text-sm font-bold text-success">{stats.passed}</div>
                      <div className="text-xs text-muted-foreground">OK</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-destructive">{stats.failed}</div>
                      <div className="text-xs text-muted-foreground">Falhas</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-warning">{stats.pending}</div>
                      <div className="text-xs text-muted-foreground">Pend.</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Conformidade</span>
                      <span className="font-medium">{stats.progress}%</span>
                    </div>
                    <Progress value={stats.progress} className="h-1.5" />
                  </div>
                </div>

                {/* Controls List - Scrollable */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {frameworkControls.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum controle configurado</p>
                    </div>
                  ) : (
                    frameworkControls.slice(0, 5).map((control) => {
                      const hasAuto = hasAutoEvidence(control.code);
                      const autoStats = hasAuto ? getEvidenceStats(control.code) : null;
                      
                      return (
                      <div key={control.id} className="p-3 bg-background border border-border rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                              {control.code}
                            </Badge>
                            {getStatusBadge(control.status)}
                            {hasAuto && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs gap-1 ${
                                        autoStats && autoStats.percentage === 100 
                                          ? 'bg-success/10 text-success border-success/20' 
                                          : 'bg-info/10 text-info border-info/20'
                                      }`}
                                    >
                                      <Zap className="h-3 w-3" />
                                      Auto
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Monitorado automaticamente<br />
                                      {autoStats && `${autoStats.passing}/${autoStats.total} recursos em conformidade`}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => handleViewEvidences(control)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                          {control.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {control.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-20">{control.owner}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-xs"
                              onClick={() => updateControlStatus(control.id, 'passed')}
                              disabled={control.status === 'passed'}
                            >
                              <CheckCircle className="h-3 w-3 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-xs"
                              onClick={() => updateControlStatus(control.id, 'failed')}
                              disabled={control.status === 'failed'}
                            >
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );})
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>

      {/* Control Evidence Modal */}
      <ControlEvidenceModal
        control={selectedControl}
        open={controlModalOpen}
        onOpenChange={setControlModalOpen}
      />
    </Card>
  );
};

export default FrameworkChecklists;