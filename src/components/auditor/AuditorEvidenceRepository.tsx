import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  ChevronRight,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useAutoEvidence } from '@/hooks/useAutoEvidence';

interface ControlWithEvidence {
  id: string;
  code: string;
  title: string;
  status: string;
  frameworkName: string;
  hasAuto: boolean;
}

const AuditorEvidenceRepository = () => {
  const { frameworks, controls, loading } = useFrameworks();
  const { hasAutoEvidence, getEvidencesForControl, getSummaryMessage } = useAutoEvidence();
  const [selectedControl, setSelectedControl] = useState<ControlWithEvidence | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
      case 'compliant':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'failed':
      case 'non-compliant':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  // Combine controls with framework info
  const controlsWithFramework: ControlWithEvidence[] = controls.map(control => {
    const framework = frameworks.find(f => f.id === control.framework_id);
    return {
      id: control.id,
      code: control.code,
      title: control.title,
      status: control.status,
      frameworkName: framework?.name || 'N/A',
      hasAuto: hasAutoEvidence(control.code)
    };
  });

  // Group by framework
  const controlsByFramework = frameworks.map(framework => ({
    framework,
    controls: controlsWithFramework.filter(c => c.frameworkName === framework.name)
  })).filter(group => group.controls.length > 0);

  const handleControlClick = (control: ControlWithEvidence) => {
    setSelectedControl(control);
    setIsModalOpen(true);
  };

  const evidences = selectedControl ? getEvidencesForControl(selectedControl.code) : [];
  const summaryMessage = selectedControl ? getSummaryMessage(selectedControl.code) : '';

  return (
    <>
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Repositório de Evidências
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                {frameworks.length} Frameworks
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {controls.length} Controles
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {controlsByFramework.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum controle encontrado</h3>
              <p className="text-muted-foreground">
                Os controles serão exibidos quando frameworks estiverem configurados.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {controlsByFramework.map(({ framework, controls }) => (
                  <div key={framework.id} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Shield className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-foreground">{framework.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {controls.length} controles
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {controls.map((control) => (
                        <button
                          key={control.id}
                          onClick={() => handleControlClick(control)}
                          className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                              {control.code}
                            </Badge>
                            <span className="text-sm text-foreground truncate">
                              {control.title}
                            </span>
                            {control.hasAuto && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs flex-shrink-0">
                                <Zap className="h-3 w-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getStatusBadge(control.status)}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Evidence Details Modal - Read Only */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Evidências do Controle
            </DialogTitle>
          </DialogHeader>
          
          {selectedControl && (
            <div className="space-y-4">
              {/* Control Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedControl.code}
                  </Badge>
                  <Badge variant="secondary">{selectedControl.frameworkName}</Badge>
                  {getStatusBadge(selectedControl.status)}
                </div>
                <p className="text-foreground font-medium">{selectedControl.title}</p>
              </div>

              {/* Auto Evidence Section */}
              {selectedControl.hasAuto && evidences.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-foreground">Evidências Automáticas</h4>
                  </div>
                  
                  {/* Summary */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground">{summaryMessage}</p>
                  </div>

                  {/* Evidence List */}
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {evidences.map((evidence, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                        >
                          <div className="flex items-center gap-3">
                            {evidence.status === 'pass' ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {evidence.resourceName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {evidence.integrationName}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {evidence.status === 'pass' ? 'Conforme' : 'Não Conforme'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma evidência automática disponível para este controle.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuditorEvidenceRepository;
