import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Database
} from 'lucide-react';

const IntegrationsStats = () => {
  const stats = [
    {
      title: 'Integrações Conectadas',
      value: '12',
      total: '15',
      icon: Zap,
      color: 'text-success',
      bgColor: 'bg-success/10',
      progress: 80
    },
    {
      title: 'Coletas de Evidências Hoje',
      value: '1.247',
      change: '+15%',
      icon: Database,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      title: 'Taxa de Sucesso',
      value: '99,2%',
      change: '+0,3%',
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Último Incidente',
      value: 'Há 3 dias',
      status: 'Resolvido',
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/20'
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
                  <Badge variant="secondary" className="badge-success text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
                {stat.status && (
                  <Badge variant="outline" className="text-xs">
                    {stat.status}
                  </Badge>
                )}
              </div>
              
              {stat.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-caption">
                    <span>Ativas</span>
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

export default IntegrationsStats;