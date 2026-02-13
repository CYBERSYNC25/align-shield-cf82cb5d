import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Zap, Link as LinkIcon, Plus, ShieldCheck } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useFrameworks } from '@/hooks/useFrameworks';

interface Framework {
  id: string;
  name: string;
  description: string;
  version: string;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  missingControls: number;
  compliance: number;
  status: string;
  automatedControls?: number;
  lastVerification: string;
  categories: string[];
}

interface FrameworkDetailsSheetProps {
  framework: Framework | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusToSheet = (status: string): 'implemented' | 'partial' | 'missing' => {
  if (status === 'passed') return 'implemented';
  if (status === 'failed') return 'partial';
  return 'missing';
};

const FrameworkDetailsSheet = ({ framework, open, onOpenChange }: FrameworkDetailsSheetProps) => {
  const { canEditResources } = useUserRoles();
  const { controls: allControls } = useFrameworks();
  
  if (!framework) return null;

  const controls = allControls
    .filter((c) => c.framework_id === framework.id)
    .map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      category: c.category,
      status: statusToSheet(c.status),
      automated: false,
      evidence: c.evidence_count ? `${c.evidence_count} evidência(s)` : undefined
    }));
  const implementedCount = controls.filter(c => c.status === 'implemented').length;
  const partialCount = controls.filter(c => c.status === 'partial').length;
  const missingCount = controls.filter(c => c.status === 'missing').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-2xl">{framework.name}</SheetTitle>
          <SheetDescription>{framework.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Framework Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Conformidade Global</div>
                <div className="text-3xl font-bold text-primary">{framework.compliance}%</div>
              </div>
              <Badge variant="outline" className="text-sm">{framework.version}</Badge>
            </div>

            <Progress value={framework.compliance} className="h-2" />

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center space-y-1">
                <div className="text-xl font-semibold text-success">{implementedCount}</div>
                <div className="text-muted-foreground">Implementados</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-semibold text-warning">{partialCount}</div>
                <div className="text-muted-foreground">Parciais</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-semibold text-danger">{missingCount}</div>
                <div className="text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </div>

          {/* Controls List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Controles Detalhados</h3>
              {canEditResources() && (
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Controle
                </Button>
              )}
            </div>
            
            {controls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/20">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Nenhum controle associado
                </h4>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Nenhum controle associado ao framework {framework.name}.
                  {canEditResources() && (
                    <>
                      <br />
                      Clique em "+ Adicionar Controle" para começar.
                    </>
                  )}
                </p>
                {canEditResources() && (
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Primeiro Controle
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3 pr-4">
                  {controls.map((control) => (
                    <div
                      key={control.id}
                      className="border border-border rounded-lg p-4 space-y-2 bg-surface-elevated hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {control.code}
                            </Badge>
                            {control.automated && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Auto
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium text-foreground">{control.title}</div>
                          <div className="text-xs text-muted-foreground">{control.category}</div>
                        </div>
                        
                        <div>
                          {control.status === 'implemented' && (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          )}
                          {control.status === 'partial' && (
                            <Clock className="h-5 w-5 text-warning" />
                          )}
                          {control.status === 'missing' && (
                            <XCircle className="h-5 w-5 text-danger" />
                          )}
                        </div>
                      </div>

                      {control.evidence && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                          <LinkIcon className="h-3 w-3" />
                          <span>Evidência: <span className="text-foreground font-medium">{control.evidence}</span></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FrameworkDetailsSheet;
