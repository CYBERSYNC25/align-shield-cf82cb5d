import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield,
  FileText,
  Download,
  Eye,
  User,
  Loader2
} from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useAuth } from '@/hooks/useAuth';
import AuditReportModal from './AuditReportModal';

const FrameworkChecklists = () => {
  const { frameworks, controls, loading, updateControlStatus, getFrameworkStats } = useFrameworks();
  const { user } = useAuth();
  const [selectedFramework, setSelectedFramework] = useState('');

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Checklists por Framework
        </h2>
        <AuditReportModal />
      </div>

      <Tabs value={selectedFramework || frameworks[0]?.id} onValueChange={setSelectedFramework} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {frameworks.slice(0, 3).map((framework) => (
            <TabsTrigger key={framework.id} value={framework.id} className="text-xs">
              {framework.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {frameworks.map((framework) => {
          const stats = getFrameworkStats(framework.id);
          const frameworkControls = controls.filter(c => c.framework_id === framework.id);
          
          return (
            <TabsContent key={framework.id} value={framework.id} className="mt-6">
              {/* Framework Overview */}
              <Card className="bg-surface-elevated border-card-border mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{framework.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      Versão {framework.version}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-success">{stats.passed}</div>
                      <div className="text-xs text-muted-foreground">Aprovados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-destructive">{stats.failed}</div>
                      <div className="text-xs text-muted-foreground">Falharam</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-warning">{stats.pending}</div>
                      <div className="text-xs text-muted-foreground">Pendentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso de Conformidade</span>
                      <span className="font-medium">{stats.progress}%</span>
                    </div>
                    <Progress value={stats.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Controls List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {frameworkControls.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum controle configurado para este framework</p>
                  </div>
                ) : (
                  frameworkControls.map((control) => (
                    <Card key={control.id} className="bg-surface-elevated border-card-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {control.code}
                              </Badge>
                              {getStatusBadge(control.status)}
                            </div>
                            <h4 className="font-semibold text-foreground mb-1">
                              {control.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {control.description}
                            </p>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Evidências
                          </Button>
                        </div>

                        {/* Owner & Evidence Count */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{control.owner}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{control.evidence_count} evidências</span>
                          </div>
                        </div>

                        {/* Findings (for failed controls) */}
                        {control.status === 'failed' && control.findings && (
                          <div className="space-y-2 mb-3">
                            <p className="text-xs text-destructive font-medium">ACHADOS</p>
                            <div className="space-y-1">
                              {control.findings.map((finding, idx) => (
                                <div key={idx} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                  • {finding}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Verificado: {control.last_verified}</span>
                            <span className="ml-4">Próxima revisão: {control.next_review}</span>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => updateControlStatus(control.id, 'passed')}
                              disabled={control.status === 'passed'}
                            >
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => updateControlStatus(control.id, 'failed')}
                              disabled={control.status === 'failed'}
                            >
                              Reprovar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default FrameworkChecklists;