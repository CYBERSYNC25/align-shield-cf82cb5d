import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  const stats = [
    {
      title: 'Relatórios Gerados',
      value: '247',
      change: '+18 esta semana',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: '89 este mês'
    },
    {
      title: 'Downloads Totais',
      value: '1,423',
      change: '+47',
      icon: Download,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: '156 únicos'
    },
    {
      title: 'Relatórios Agendados',
      value: '12',
      active: 8,
      total: 12,
      icon: Calendar,
      color: 'text-info',
      bgColor: 'bg-info/10',
      progress: 67,
      subtitle: '8 ativos'
    },
    {
      title: 'Links Compartilhados',
      value: '34',
      status: 'active',
      icon: Share2,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      subtitle: 'Expirando: 3'
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