import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReports } from '@/hooks/useReports';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Share2
} from 'lucide-react';

const ReportsStats = () => {
  const { stats, loading } = useReports();

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
      title: 'Relatórios Gerados',
      value: stats.totalGenerated.toString(),
      change: `+${stats.weeklyGrowth} esta semana`,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: `${stats.monthlyCount} este mês`
    },
    {
      title: 'Downloads Totais',
      value: stats.totalDownloads.toLocaleString(),
      change: '+47',
      icon: Download,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: `${stats.uniqueDownloads} únicos`
    },
    {
      title: 'Relatórios Agendados',
      value: stats.scheduledReports.toString(),
      active: stats.activeScheduled,
      total: stats.scheduledReports,
      icon: Calendar,
      color: 'text-info',
      bgColor: 'bg-info/10',
      progress: Math.round((stats.activeScheduled / stats.scheduledReports) * 100),
      subtitle: `${stats.activeScheduled} ativos`
    },
    {
      title: 'Links Compartilhados',
      value: stats.sharedLinks.toString(),
      status: 'active',
      icon: Share2,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      subtitle: `Expirando: ${stats.expiringLinks}`
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
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
                {stat.status === 'active' && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {stat.subtitle}
              </p>

              {stat.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ativos</span>
                    <span>{stat.active}/{stat.total}</span>
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

export default ReportsStats;