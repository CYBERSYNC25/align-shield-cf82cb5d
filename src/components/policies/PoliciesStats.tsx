import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CheckCircle, 
  Clock,
  Edit3,
} from 'lucide-react';
import { usePolicies } from '@/hooks/usePolicies';

const PoliciesStats = () => {
  const { stats, loading } = usePolicies();

  const cards = [
    {
      title: 'Políticas Ativas',
      value: String(stats.activePolicies),
      total: String(stats.totalPolicies),
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      progress: stats.totalPolicies > 0 ? (stats.activePolicies / stats.totalPolicies) * 100 : 0,
      subtitle: `${stats.totalPolicies} total cadastradas`
    },
    {
      title: 'Em Revisão',
      value: String(stats.reviewPolicies),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      subtitle: 'Aguardando aprovação'
    },
    {
      title: 'Rascunhos',
      value: String(stats.draftPolicies),
      icon: Edit3,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
      subtitle: 'Em elaboração'
    },
    {
      title: 'Revisão Próxima',
      value: String(stats.policiesDueSoon),
      icon: FileText,
      color: 'text-info',
      bgColor: 'bg-info/10',
      subtitle: 'Nos próximos 30 dias'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((stat, index) => (
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
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {stat.subtitle}
              </p>

              {stat.progress !== undefined && stat.total && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
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

export default PoliciesStats;
