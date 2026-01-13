import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useComplianceStatus } from '@/hooks/useComplianceStatus';
import { CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const PassingTestsSummary = () => {
  const { passingTests, isLoading } = useComplianceStatus();

  // Group passing tests by integration
  const testsByIntegration = passingTests.reduce((acc, test) => {
    if (!acc[test.integrationId]) {
      acc[test.integrationId] = {
        name: test.integration,
        logo: test.integrationLogo,
        count: 0,
        lastChecked: test.lastChecked,
      };
    }
    acc[test.integrationId].count++;
    return acc;
  }, {} as Record<string, { name: string; logo: string; count: number; lastChecked: Date }>);

  const integrations = Object.entries(testsByIntegration);

  if (isLoading) {
    return (
      <Card className="bg-surface-elevated border-card-border h-full">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (integrations.length === 0) {
    return (
      <Card className="bg-surface-elevated border-card-border h-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              Conecte integrações para ver testes aprovados
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastCheck = passingTests.length > 0 ? passingTests[0].lastChecked : new Date();

  return (
    <Card className="bg-surface-elevated border-card-border h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">
              Testes Aprovados ({passingTests.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(lastCheck, { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {integrations.map(([id, integration]) => (
            <Badge
              key={id}
              variant="outline"
              className="bg-success/5 border-success/20 text-success gap-1.5 px-2.5 py-1"
            >
              {integration.logo && (
                <img
                  src={integration.logo}
                  alt={integration.name}
                  className="h-3.5 w-3.5 object-contain"
                />
              )}
              <span className="text-xs">{integration.name}</span>
              <span className="text-xs opacity-70">({integration.count})</span>
              <CheckCircle2 className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PassingTestsSummary;
