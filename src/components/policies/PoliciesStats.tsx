import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const PoliciesStats = () => {
  const stats = [
    {
      title: 'Políticas Ativas',
      value: '28',
      total: '32',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      progress: 87.5,
      subtitle: '4 em revisão'
    },
    {
      title: 'Taxa de Assinatura',
      value: '94.2%',
      change: '+2.1%',
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: '267/284 colaboradores'
    },
    {
      title: 'Treinamentos Ativos',
      value: '12',
      change: '+3',
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
      subtitle: '156 participantes'
    },
    {
      title: 'Pendências Críticas',
      value: '7',
      status: 'warning',
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      subtitle: 'Requer atenção'
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
                {stat.status === 'warning' && (
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
                    <span>Implementadas</span>
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

export default PoliciesStats;