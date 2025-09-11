import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Building
} from 'lucide-react';

const AccessReviewsStats = () => {
  const stats = [
    {
      title: 'Campanhas Ativas',
      value: '8',
      total: '12',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      progress: 67,
      subtitle: '4 concluídas este mês'
    },
    {
      title: 'Taxa de Certificação',
      value: '91.4%',
      change: '+4.2%',
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: '1,247/1,364 acessos certificados'
    },
    {
      title: 'Anomalias Detectadas',
      value: '23',
      status: 'critical',
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      subtitle: '12 críticas, 11 médias'
    },
    {
      title: 'Sistemas Integrados',
      value: '15',
      change: '+2',
      icon: Building,
      color: 'text-info',
      bgColor: 'bg-info/10',
      subtitle: '3,847 usuários únicos'
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
                {stat.status === 'critical' && (
                  <Badge variant="destructive" className="text-xs">
                    Ação Requerida
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {stat.subtitle}
              </p>

              {stat.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{stat.progress}%</span>
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

export default AccessReviewsStats;