import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Database,
  TrendingUp,
  FileText
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status: 'success' | 'warning' | 'danger' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  status 
}) => {
  const statusConfig = {
    success: { bgColor: 'bg-success/10', iconColor: 'text-success', borderColor: 'border-success/20' },
    warning: { bgColor: 'bg-warning/10', iconColor: 'text-warning', borderColor: 'border-warning/20' },
    danger: { bgColor: 'bg-danger/10', iconColor: 'text-danger', borderColor: 'border-danger/20' },
    info: { bgColor: 'bg-info/10', iconColor: 'text-info', borderColor: 'border-info/20' }
  };

  const config = statusConfig[status];

  return (
    <Card className={`border-card-border shadow-card hover:shadow-elevated transition-all duration-300 ${config.borderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold text-foreground">
            {value}
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend.isPositive ? 'text-success' : 'text-danger'
            }`}>
              <TrendingUp className={`h-3 w-3 ${
                !trend.isPositive ? 'rotate-180' : ''
              }`} />
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

const MetricsGrid = () => {
  const metrics = [
    {
      title: 'Score Geral de Conformidade',
      value: '87%',
      description: 'Média ponderada entre todos os frameworks',
      icon: Shield,
      status: 'success' as const,
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Alertas Críticos Abertos',
      value: 3,
      description: 'Requerem ação imediata',
      icon: AlertTriangle,
      status: 'danger' as const,
      trend: { value: 2, isPositive: false }
    },
    {
      title: 'Controles Conformes',
      value: 142,
      description: 'De 163 controles mapeados',
      icon: CheckCircle,
      status: 'success' as const,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Tarefas Pendentes',
      value: 12,
      description: 'SLA médio: 2.3 dias',
      icon: Clock,
      status: 'warning' as const
    },
    {
      title: 'Usuários Ativos',
      value: '1,247',
      description: 'Com acesso aos sistemas monitorados',
      icon: Users,
      status: 'info' as const,
      trend: { value: 3, isPositive: true }
    },
    {
      title: 'Integrações Ativas',
      value: 12,
      description: 'Coletando evidências automaticamente',
      icon: Database,
      status: 'success' as const
    },
    {
      title: 'Políticas Publicadas',
      value: 23,
      description: '96% dos usuários atestaram',
      icon: FileText,
      status: 'success' as const
    },
    {
      title: 'Incidentes Este Mês',
      value: 2,
      description: 'Tempo médio resolução: 4.2h',
      icon: AlertTriangle,
      status: 'warning' as const,
      trend: { value: 1, isPositive: false }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          {...metric}
        />
      ))}
    </div>
  );
};

export default MetricsGrid;