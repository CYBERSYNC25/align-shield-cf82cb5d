import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  AlertTriangle, 
  UserX, 
  Shield, 
  Clock,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AnomaliesDetection = () => {
  const anomalies = [
    {
      type: 'orphaned_account',
      severity: 'critical',
      title: 'Conta Órfã Detectada',
      description: 'Usuário sem gestor definido com privilégios elevados',
      user: 'carlos.silva@empresa.com',
      system: 'AWS',
      systemLogo: '☁️',
      details: 'Admin IAM sem aprovação',
      detectedDate: '2 dias atrás',
      riskScore: 95,
      actions: ['Remover acesso', 'Atribuir gestor', 'Revisar privilégios']
    },
    {
      type: 'excessive_privileges',
      severity: 'high',
      title: 'Privilégios Excessivos',
      description: 'Usuário com mais permissões que necessário para função',
      user: 'ana.costa@empresa.com',
      system: 'GitHub',
      systemLogo: '🐙',
      details: 'Owner em 12 repositórios',
      detectedDate: '1 dia atrás',
      riskScore: 78,
      actions: ['Reduzir privilégios', 'Revisar necessidade', 'Notificar gestor']
    },
    {
      type: 'inactive_account',
      severity: 'medium',
      title: 'Conta Inativa com Acesso',
      description: 'Usuário inativo há mais de 90 dias mantém acessos',
      user: 'roberto.lima@empresa.com',
      system: 'Okta',
      systemLogo: '🔐',
      details: 'Sem login há 127 dias',
      detectedDate: '3 horas atrás',
      riskScore: 65,
      actions: ['Desativar conta', 'Verificar status', 'Contatar RH']
    },
    {
      type: 'no_mfa',
      severity: 'high',
      title: 'Conta Admin sem MFA',
      description: 'Conta administrativa sem autenticação multifator',
      user: 'maria.santos@empresa.com',
      system: 'Microsoft 365',
      systemLogo: '📧',
      details: 'Global Admin role',
      detectedDate: '6 horas atrás',
      riskScore: 82,
      actions: ['Forçar MFA', 'Suspender conta', 'Notificar usuário']
    },
    {
      type: 'unusual_access',
      severity: 'medium',
      title: 'Padrão de Acesso Incomum',
      description: 'Acesso fora do horário comercial habitual',
      user: 'joao.pereira@empresa.com',
      system: 'AWS',
      systemLogo: '☁️',
      details: 'Login às 03:47 - Domingo',
      detectedDate: '12 horas atrás',
      riskScore: 58,
      actions: ['Investigar atividade', 'Verificar logs', 'Contatar usuário']
    }
  ];

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { 
        label: 'Crítica', 
        className: 'bg-destructive text-destructive-foreground',
        icon: AlertTriangle
      },
      high: { 
        label: 'Alta', 
        className: 'bg-warning text-warning-foreground',
        icon: AlertTriangle
      },
      medium: { 
        label: 'Média', 
        className: 'bg-info text-info-foreground',
        icon: Clock
      },
      low: { 
        label: 'Baixa', 
        className: 'bg-muted text-muted-foreground',
        icon: Eye
      }
    };
    
    const conf = config[severity as keyof typeof config];
    const Icon = conf.icon;
    
    return (
      <Badge variant="secondary" className={`gap-1 ${conf.className}`}>
        <Icon className="h-3 w-3" />
        {conf.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      orphaned_account: UserX,
      excessive_privileges: Shield,
      inactive_account: Clock,
      no_mfa: AlertTriangle,
      unusual_access: Eye
    };
    return icons[type as keyof typeof icons] || AlertTriangle;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Anomalias Detectadas
        </h3>
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {anomalies.filter(a => a.severity === 'critical').length} críticas
        </Badge>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {anomalies.map((anomaly, index) => {
          const TypeIcon = getTypeIcon(anomaly.type);
          
          return (
            <Card key={index} className="bg-surface-elevated border-card-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <TypeIcon className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        {anomaly.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {anomaly.description}
                      </p>
                    </div>
                  </div>
                  
                  {getSeverityBadge(anomaly.severity)}
                </div>

                <div className="flex items-center gap-3 mb-3 p-2 bg-muted/10 rounded">
                  <div className="text-sm">{anomaly.systemLogo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {anomaly.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.system} • {anomaly.details}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{anomaly.riskScore}</div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Detectado {anomaly.detectedDate}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <Eye className="h-3 w-3 mr-1" />
                      Investigar
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolver
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <XCircle className="h-3 w-3 mr-1" />
                      Ignorar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AnomaliesDetection;