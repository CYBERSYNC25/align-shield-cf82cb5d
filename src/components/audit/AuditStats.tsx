import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  FileCheck, 
  Users, 
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  Database
} from 'lucide-react';

const AuditStats = () => {
  const stats = [
    {
      title: 'Evidências Coletadas',
      value: '2,847',
      change: '+127 hoje',
      icon: Database,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: '1.2GB de dados seguros'
    },
    {
      title: 'Readiness SOC 2',
      value: '89%',
      progress: 89,
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: '57/64 controles OK'
    },
    {
      title: 'Sessões de Auditores',
      value: '12',
      change: '+3 este mês',
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
      subtitle: '4 auditores ativos'
    },
    {
      title: 'Relatórios Gerados',
      value: '47',
      change: '+5',
      icon: FileCheck,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      subtitle: 'Últimas 24h: 3 downloads'
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
              </div>
              
              <p className="text-xs text-muted-foreground">
                {stat.subtitle}
              </p>

              {stat.progress && (
                <div className="space-y-1">
                  <Progress value={stat.progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {stat.progress}% ready for audit
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AuditStats;