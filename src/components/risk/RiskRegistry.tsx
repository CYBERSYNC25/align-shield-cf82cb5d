import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRisks } from '@/hooks/useRisks';
import { useToast } from '@/hooks/use-toast';
import CreateRiskModal from './CreateRiskModal';
import { 
  Plus, 
  AlertTriangle, 
  Shield, 
  Eye,
  Calendar,
  User,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const RiskRegistry = () => {
  const { risks, loading, updateRiskStatus } = useRisks();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
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

  const handleViewDetails = (riskTitle: string) => {
    toast({
      title: "Detalhes do Risco",
      description: `Abrindo detalhes de "${riskTitle}"...`,
    });
  };

  const handleStatusChange = async (riskId: string, currentStatus: string) => {
    // Simular mudança de status
    const newStatus = currentStatus === 'active' ? 'mitigated' : 'active';
    await updateRiskStatus(riskId, newStatus as any);
  };

  const getRiskLevelBadge = (level: string) => {
    const config = {
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
      high: { label: 'Alto', className: 'bg-warning text-warning-foreground' },
      medium: { label: 'Médio', className: 'bg-info text-info-foreground' },
      low: { label: 'Baixo', className: 'bg-success text-success-foreground' }
    };
    
    const conf = config[level as keyof typeof config];
    return <Badge variant="secondary" className={conf.className}>{conf.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Ativo', className: 'bg-warning/10 text-warning border-warning/20' },
      mitigated: { label: 'Mitigado', className: 'bg-success/10 text-success border-success/20' },
      accepted: { label: 'Aceito', className: 'bg-info/10 text-info border-info/20' },
      transferred: { label: 'Transferido', className: 'bg-muted/10 text-muted-foreground border-muted/20' }
    };
    
    const conf = config[status as keyof typeof config];
    return <Badge variant="outline" className={conf.className}>{conf.label}</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-3 w-3 text-destructive" />;
    if (trend === 'decreasing') return <TrendingDown className="h-3 w-3 text-success" />;
    return <div className="h-3 w-3 bg-muted-foreground rounded-full" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Registro de Riscos
        </h2>
        <CreateRiskModal />
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {risks.map((risk, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      RISK-{String(index + 1).padStart(3, '0')}
                    </Badge>
                    {getRiskLevelBadge(risk.level)}
                    {getStatusBadge(risk.status)}
                  </div>
                  <CardTitle className="text-base font-semibold mb-1">
                    {risk.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {risk.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {getTrendIcon(risk.trend)}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(risk.title)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Risk Score & Matrix */}
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <div className="font-medium">{risk.category}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Probabilidade:</span>
                    <div className="font-medium capitalize">{risk.probability}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Impacto:</span>
                    <div className="font-medium capitalize">{risk.impact}</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{risk.riskScore}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {risk.owner.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{risk.owner}</p>
                  <p className="text-xs text-muted-foreground">{risk.ownerRole}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">CONTROLES MITIGADORES</p>
                <div className="flex flex-wrap gap-1">
                  {risk.controls.map((control, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {control}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Última revisão: {risk.lastReview}
                </div>
                <div>
                  Próxima revisão: {risk.nextReview}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RiskRegistry;