import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useIncidents } from '@/hooks/useIncidents';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Shield,
  TrendingDown,
  Activity,
  Timer
} from 'lucide-react';

const IncidentStats = () => {
  const { stats, loading } = useIncidents();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 w-8 bg-muted rounded-lg"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Incidentes Ativos',
      value: stats.activeIncidents.toString(),
      breakdown: stats.incidentBreakdown,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: '-2 esta semana'
    },
    {
      title: 'MTTR Médio',
      value: stats.mttr,
      target: stats.mttrTarget,
      icon: Timer,
      color: 'text-success',
      bgColor: 'bg-success/10',
      progress: stats.mttrProgress,
      subtitle: `Meta: < ${stats.mttrTarget}`
    },
    {
      title: 'Disponibilidade',
      value: stats.availability,
      change: stats.availabilityChange,
      icon: Activity,
      color: 'text-info',
      bgColor: 'bg-info/10',
      subtitle: 'SLA: 99.9%'
    },
    {
      title: 'Testes BCP',
      value: stats.bcpTests.toString(),
      status: 'completed',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: `${stats.scheduledTests} programados este mês`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
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
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
                {stat.status === 'completed' && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    OK
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
                      <div className="text-muted-foreground">Crítico</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-warning">{stat.breakdown.high}</div>
                      <div className="text-muted-foreground">Alto</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-info">{stat.breakdown.medium}</div>
                      <div className="text-muted-foreground">Médio</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-success">{stat.breakdown.low}</div>
                      <div className="text-muted-foreground">Baixo</div>
                    </div>
                  </div>
                </div>
              )}

              {stat.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Performance</span>
                    <span>{stat.value} / {stat.target}</span>
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

export default IncidentStats;