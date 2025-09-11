import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Database
} from 'lucide-react';

const SystemsInventory = () => {
  const systems = [
    {
      name: 'AWS Production',
      type: 'Cloud Infrastructure',
      logo: '☁️',
      totalUsers: 89,
      activeUsers: 67,
      inactiveUsers: 22,
      adminUsers: 12,
      lastSync: '2 min atrás',
      riskScore: 'medium',
      nextReview: '28/11/2024',
      policies: 156,
      roles: 23,
      permissions: 445
    },
    {
      name: 'Okta Identity',
      type: 'Identity Provider',
      logo: '🔐',
      totalUsers: 234,
      activeUsers: 198,
      inactiveUsers: 36,
      adminUsers: 8,
      lastSync: '5 min atrás',
      riskScore: 'low',
      nextReview: '05/12/2024',
      policies: 89,
      roles: 15,
      permissions: 234
    },
    {
      name: 'GitHub Enterprise',
      type: 'Development Platform',
      logo: '🐙',
      totalUsers: 52,
      activeUsers: 48,
      inactiveUsers: 4,
      adminUsers: 6,
      lastSync: '1 min atrás',
      riskScore: 'high',
      nextReview: '20/11/2024',
      policies: 67,
      roles: 8,
      permissions: 156
    },
    {
      name: 'Microsoft 365',
      type: 'Productivity Suite',
      logo: '📧',
      totalUsers: 278,
      activeUsers: 245,
      inactiveUsers: 33,
      adminUsers: 15,
      lastSync: '10 min atrás',
      riskScore: 'medium',
      nextReview: '15/12/2024',
      policies: 123,
      roles: 28,
      permissions: 567
    }
  ];

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: 'Baixo', className: 'bg-success/10 text-success border-success/20' },
      medium: { label: 'Médio', className: 'bg-warning/10 text-warning border-warning/20' },
      high: { label: 'Alto', className: 'bg-destructive/10 text-destructive border-destructive/20' }
    };
    
    const conf = config[risk as keyof typeof config];
    return <Badge variant="outline" className={conf.className}>{conf.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Inventário de Sistemas
        </h3>
        <Badge variant="outline" className="gap-1">
          <Database className="h-3 w-3" />
          {systems.length} sistemas
        </Badge>
      </div>

      <div className="space-y-3">
        {systems.map((system, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-lg">{system.logo}</div>
                  <div>
                    <h4 className="font-semibold text-foreground">{system.name}</h4>
                    <p className="text-xs text-muted-foreground">{system.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getRiskBadge(system.riskScore)}
                  <Button variant="outline" size="sm" className="gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Revisar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{system.totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-success">{system.activeUsers}</div>
                  <div className="text-xs text-muted-foreground">Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-warning">{system.inactiveUsers}</div>
                  <div className="text-xs text-muted-foreground">Inativos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-info">{system.adminUsers}</div>
                  <div className="text-xs text-muted-foreground">Admins</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>📋 {system.policies} políticas</span>
                  <span>👥 {system.roles} roles</span>
                  <span>🔑 {system.permissions} permissões</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {system.lastSync}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Próxima revisão:</span>
                  <span className="font-medium">{system.nextReview}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SystemsInventory;