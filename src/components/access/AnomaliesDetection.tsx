import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  User, 
  Shield,
  Clock,
  Eye,
  MoreVertical,
  UserCheck
} from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

const AnomaliesDetection = () => {
  const { anomalies, loading, resolveAnomaly } = useAccess();

  const handleResolveAnomaly = async (id: string, status: 'resolved' | 'false_positive') => {
    try {
      await resolveAnomaly(id, { status });
    } catch (error) {
      console.error('Error resolving anomaly:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': 
        return <Badge variant="destructive" className="text-xs">Crítica</Badge>;
      case 'high': 
        return <Badge variant="destructive" className="text-xs bg-warning text-warning-foreground">Alta</Badge>;
      case 'medium': 
        return <Badge variant="secondary" className="text-xs">Média</Badge>;
      case 'low': 
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
      default: 
        return <Badge variant="secondary" className="text-xs">Média</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'excessive_privileges': return <Shield className="h-4 w-4" />;
      case 'unused_access': return <Clock className="h-4 w-4" />;
      case 'suspicious_activity': return <Eye className="h-4 w-4" />;
      case 'policy_violation': return <AlertTriangle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'excessive_privileges': return 'Privilégios Excessivos';
      case 'unused_access': return 'Acesso Não Utilizado';
      case 'suspicious_activity': return 'Atividade Suspeita';
      case 'policy_violation': return 'Violação de Política';
      default: return 'Anomalia';
    }
  };

  if (loading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Anomalias Detectadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {anomalies.filter(a => a.status !== 'resolved').map((anomaly) => (
            <div key={anomaly.id} className="p-4 border border-card-border rounded-lg bg-surface">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    anomaly.severity === 'critical' ? 'bg-destructive/10' :
                    anomaly.severity === 'high' ? 'bg-warning/10' :
                    anomaly.severity === 'medium' ? 'bg-info/10' :
                    'bg-muted'
                  }`}>
                    {getTypeIcon(anomaly.anomaly_type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-foreground">{anomaly.user_name}</h4>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{anomaly.system_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(anomaly.severity)}
                      <Badge variant="outline" className="text-xs">{getTypeLabel(anomaly.anomaly_type)}</Badge>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {anomaly.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Detectado em: {new Date(anomaly.detected_at).toLocaleString()}
                </span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleResolveAnomaly(anomaly.id, 'false_positive')}
                  >
                    Falso Positivo
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleResolveAnomaly(anomaly.id, 'resolved')}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Resolver
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {anomalies.filter(a => a.status !== 'resolved').length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma anomalia ativa encontrada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnomaliesDetection;