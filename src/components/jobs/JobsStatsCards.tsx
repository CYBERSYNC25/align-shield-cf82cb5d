import { Card, CardContent } from '@/components/ui/card';
import { Clock, Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { JobsStats } from '@/hooks/useJobsStats';
import { Skeleton } from '@/components/ui/skeleton';

interface JobsStatsCardsProps {
  stats?: JobsStats;
  isLoading: boolean;
}

const JobsStatsCards = ({ stats, isLoading }: JobsStatsCardsProps) => {
  const cards = [
    {
      label: 'Pendentes',
      value: stats?.counts.pending || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Processando',
      value: stats?.counts.processing || 0,
      icon: Loader2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Concluídos (24h)',
      value: stats?.counts.completed || 0,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Falhos (24h)',
      value: stats?.counts.failed || 0,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Taxa/hora',
      value: stats?.avgPerHour || 0,
      icon: Zap,
      color: 'text-secondary-foreground',
      bgColor: 'bg-secondary',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobsStatsCards;
