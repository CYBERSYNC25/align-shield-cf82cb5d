import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIncidents } from '@/hooks/useIncidents';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Play,
  FileText,
  Database
} from 'lucide-react';

const BusinessContinuity = () => {
  const { bcpPlans, loading, runBcpTest } = useIncidents();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="bg-surface-elevated border-card-border animate-pulse">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
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

  const handleRunBcpTest = async (planId: string) => {
    await runBcpTest(planId);
  };

  const handleGenerateReport = () => {
    toast({
      title: "Gerando Relatório BCP",
      description: "Preparando relatório de continuidade de negócios...",
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      tested: { label: 'Testado', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
      updated: { label: 'Atualizado', icon: FileText, className: 'bg-info/10 text-info border-info/20' },
      scheduled: { label: 'Agendado', icon: Calendar, className: 'bg-warning/10 text-warning border-warning/20' },
      expired: { label: 'Expirado', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive border-destructive/20' }
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
          Continuidade de Negócios
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGenerateReport}
        >
          <FileText className="h-4 w-4 mr-2" />
          Relatório BCP
        </Button>
      </div>

      {/* BCP Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Planos de Continuidade</h3>
        
        {bcpPlans.map((plan, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-semibold mb-1">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {plan.type}
                    </Badge>
                    {getStatusBadge(plan.status)}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRunBcpTest(plan.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Executar Teste
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* RTO/RPO Metrics */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/10 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{plan.rto}</div>
                  <div className="text-xs text-muted-foreground">RTO</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{plan.rpo}</div>
                  <div className="text-xs text-muted-foreground">RPO</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{plan.coverage}%</div>
                  <div className="text-xs text-muted-foreground">Cobertura</div>
                </div>
              </div>

              {/* Coverage Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cobertura de Sistemas:</span>
                  <span className="font-medium">{plan.coverage}%</span>
                </div>
                <Progress value={plan.coverage} className="h-2" />
              </div>

              {/* Critical Systems */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">SISTEMAS CRÍTICOS</p>
                <div className="flex flex-wrap gap-1">
                  {plan.criticalSystems.map((system, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Test Results */}
              <div className="p-2 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Último Resultado</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.testResults}</p>
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Último teste: {plan.lastTested}</span>
                <span>Próximo teste: {plan.nextTest}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Tests - Static data for now */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Testes Programados</h3>
        
        <Card className="bg-surface-elevated border-card-border">
          <CardContent className="p-4">
            <div className="space-y-3">
              {[
                {
                  plan: 'DR Plan - Datacenter Failover',
                  scheduledDate: '15/01/2025',
                  duration: '4 horas',
                  participants: ['Infraestrutura', 'DevOps', 'Segurança'],
                  scope: 'Failover completo para datacenter secundário'
                },
                {
                  plan: 'BCP - Simulação de Ransomware',
                  scheduledDate: '08/02/2025',
                  duration: '6 horas',
                  participants: ['Security Team', 'IT Management', 'Communications'],
                  scope: 'Resposta a incidente de ransomware com restore'
                },
                {
                  plan: 'Backup Test - Database Recovery',
                  scheduledDate: '20/12/2024',
                  duration: '2 horas',
                  participants: ['DBA', 'DevOps'],
                  scope: 'Restauração pontual de banco de dados'
                }
              ].map((test, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground mb-1">
                      {test.plan}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {test.scope}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {test.scheduledDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {test.duration}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="text-xs">
                    Detalhes
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessContinuity;