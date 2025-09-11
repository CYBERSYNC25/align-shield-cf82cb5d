import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  User
} from 'lucide-react';

const FrameworkChecklists = () => {
  const frameworks = [
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      progress: 89,
      totalControls: 64,
      passedControls: 57,
      failedControls: 3,
      pendingControls: 4,
      lastUpdate: '2 horas atrás'
    },
    {
      id: 'iso27001',
      name: 'ISO 27001:2022',
      progress: 92,
      totalControls: 114,
      passedControls: 105,
      failedControls: 2,
      pendingControls: 7,
      lastUpdate: '1 hora atrás'
    },
    {
      id: 'lgpd',
      name: 'LGPD',
      progress: 76,
      totalControls: 42,
      passedControls: 32,
      failedControls: 4,
      pendingControls: 6,
      lastUpdate: '30 min atrás'
    }
  ];

  const soc2Controls = [
    {
      id: 'CC6.1',
      title: 'Logical and Physical Access Controls',
      category: 'Common Criteria',
      status: 'passed',
      evidenceCount: 12,
      owner: 'Carlos Silva',
      lastVerified: '15/11/2024',
      nextReview: '15/02/2025',
      description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.'
    },
    {
      id: 'CC6.2',
      title: 'Authentication and Authorization',
      category: 'Common Criteria',
      status: 'passed',
      evidenceCount: 8,
      owner: 'Ana Rodrigues',
      lastVerified: '12/11/2024',
      nextReview: '12/02/2025',
      description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.'
    },
    {
      id: 'CC6.3',
      title: 'System Access Removal',
      category: 'Common Criteria',
      status: 'failed',
      evidenceCount: 3,
      owner: 'Roberto Lima',
      lastVerified: '10/11/2024',
      nextReview: '25/11/2024',
      findings: ['Processo manual de revogação', 'Delay na remoção de ex-funcionários'],
      description: 'The entity removes system access when access is no longer required or appropriate.'
    },
    {
      id: 'CC7.1',
      title: 'System Monitoring',
      category: 'Common Criteria',
      status: 'pending',
      evidenceCount: 5,
      owner: 'Maria Santos',
      lastVerified: '08/11/2024',
      nextReview: '30/11/2024',
      description: 'The entity monitors system components for anomalies that are indicative of malicious acts, natural disasters, and errors.'
    },
    {
      id: 'A1.1',
      title: 'Availability Processing Integrity',
      category: 'Availability',
      status: 'passed',
      evidenceCount: 15,
      owner: 'Fernanda Costa',
      lastVerified: '20/11/2024',
      nextReview: '20/02/2025',
      description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components.'
    }
  ];

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
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      <Tabs defaultValue="soc2" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {frameworks.map((framework) => (
            <TabsTrigger key={framework.id} value={framework.id} className="text-xs">
              {framework.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {frameworks.map((framework) => (
          <TabsContent key={framework.id} value={framework.id} className="mt-6">
            {/* Framework Overview */}
            <Card className="bg-surface-elevated border-card-border mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{framework.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    Atualizado {framework.lastUpdate}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-success">{framework.passedControls}</div>
                    <div className="text-xs text-muted-foreground">Aprovados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-destructive">{framework.failedControls}</div>
                    <div className="text-xs text-muted-foreground">Falharam</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-warning">{framework.pendingControls}</div>
                    <div className="text-xs text-muted-foreground">Pendentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{framework.totalControls}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso de Conformidade</span>
                    <span className="font-medium">{framework.progress}%</span>
                  </div>
                  <Progress value={framework.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Controls List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {soc2Controls.map((control, index) => (
                <Card key={index} className="bg-surface-elevated border-card-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {control.id}
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
                        <span className="text-sm">{control.evidenceCount} evidências</span>
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

                    {/* Timeline */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Verificado: {control.lastVerified}</span>
                      <span>Próxima revisão: {control.nextReview}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FrameworkChecklists;