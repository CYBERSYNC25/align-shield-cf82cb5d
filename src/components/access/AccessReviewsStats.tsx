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
  Building,
  ShieldCheck
} from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

const AccessReviewsStats = () => {
  const { campaigns, systems, anomalies, loading } = useAccess();

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedThisMonth = campaigns.filter(c => 
    c.status === 'completed' && 
    new Date(c.updated_at).getMonth() === new Date().getMonth()
  );
  
  const totalUsers = campaigns.reduce((acc, c) => acc + c.total_users, 0);
  const certifiedUsers = campaigns.reduce((acc, c) => acc + c.certified_users, 0);
  const certificationRate = totalUsers > 0 ? ((certifiedUsers / totalUsers) * 100).toFixed(1) : '0';
  
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' && a.status !== 'resolved');
  const highAnomalies = anomalies.filter(a => a.severity === 'high' && a.status !== 'resolved');
  const mediumAnomalies = anomalies.filter(a => a.severity === 'medium' && a.status !== 'resolved');
  const totalActiveAnomalies = anomalies.filter(a => a.status !== 'resolved').length;
  
  const connectedSystems = systems.filter(s => s.integration_status === 'connected');
  const totalSystemUsers = systems.reduce((acc, s) => acc + s.users_count, 0);

  // Calculate compliance rate: users without anomalies / total users
  const usersWithAnomalies = new Set(anomalies.filter(a => a.status !== 'resolved').map(a => a.user_name)).size;
  const monitoredUsers = totalSystemUsers > 0 ? totalSystemUsers : totalUsers;
  const complianceRate = monitoredUsers > 0 
    ? Math.max(0, ((monitoredUsers - usersWithAnomalies) / monitoredUsers) * 100).toFixed(1)
    : '100';

  const stats = [
    {
      title: 'Campanhas Ativas',
      value: activeCampaigns.length.toString(),
      total: campaigns.length.toString(),
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      progress: campaigns.length > 0 ? Math.round((activeCampaigns.length / campaigns.length) * 100) : 0,
      subtitle: `${completedThisMonth.length} concluídas este mês`
    },
    {
      title: '% Conformidade',
      value: `${complianceRate}%`,
      status: parseFloat(complianceRate) >= 90 ? 'good' : parseFloat(complianceRate) >= 70 ? 'warning' : 'critical',
      icon: ShieldCheck,
      color: parseFloat(complianceRate) >= 90 ? 'text-success' : parseFloat(complianceRate) >= 70 ? 'text-warning' : 'text-destructive',
      bgColor: parseFloat(complianceRate) >= 90 ? 'bg-success/10' : parseFloat(complianceRate) >= 70 ? 'bg-warning/10' : 'bg-destructive/10',
      subtitle: `${monitoredUsers - usersWithAnomalies}/${monitoredUsers} usuários em conformidade`,
      progress: parseFloat(complianceRate)
    },
    {
      title: 'Anomalias Detectadas',
      value: totalActiveAnomalies.toString(),
      status: criticalAnomalies.length > 0 ? 'critical' : highAnomalies.length > 0 ? 'warning' : 'normal',
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      subtitle: `${criticalAnomalies.length} críticas, ${highAnomalies.length} altas, ${mediumAnomalies.length} médias`
    },
    {
      title: 'Sistemas Integrados',
      value: connectedSystems.length.toString(),
      change: connectedSystems.length > 0 ? `+${connectedSystems.length}` : undefined,
      icon: Building,
      color: 'text-info',
      bgColor: 'bg-info/10',
      subtitle: `${totalSystemUsers.toLocaleString()} usuários únicos`
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-16"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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