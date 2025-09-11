import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  TrendingUp, 
  Building, 
  Shield,
  Users,
  FileText,
  CheckCircle
} from 'lucide-react';

const RiskStats = () => {
  const stats = [
    {
      title: 'Riscos Ativos',
      value: '47',
      breakdown: { critical: 3, high: 12, medium: 18, low: 14 },
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: '+2 este mês'
    },
    {
      title: 'Fornecedores Críticos',
      value: '23',
      total: '89',
      icon: Building,
      color: 'text-info',
      bgColor: 'bg-info/10',
      progress: 26,
      subtitle: '66 fornecedores regulares'
    },
    {
      title: 'Controles Implementados',
      value: '156',
      change: '+8',
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: '89% de efetividade'
    },
    {
      title: 'Avaliações Pendentes',
      value: '12',
      status: 'attention',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: '7 vencendo em 30 dias'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-surface-elevated border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                {stat.change && (
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
                {stat.status === 'attention' && (
                  <Badge variant="outline" className="text-xs border-warning text-warning">
                    Atenção
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {stat.subtitle}
              </p>

              {stat.breakdown && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-destructive">{stat.breakdown.critical}</div>
                      <div className="text-muted-foreground">Críticos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-warning">{stat.breakdown.high}</div>
                      <div className="text-muted-foreground">Altos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-info">{stat.breakdown.medium}</div>
                      <div className="text-muted-foreground">Médios</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-success">{stat.breakdown.low}</div>
                      <div className="text-muted-foreground">Baixos</div>
                    </div>
                  </div>
                </div>
              )}

              {stat.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Críticos</span>
                    <span>{stat.value}/{stat.total}</span>
                  </div>
                  <Progress value={stat.progress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RiskStats;