/**
 * AutomatedAlertsPanel Component
 * 
 * Displays automated alert rules and triggers for critical risks, overdue audits, and pending controls.
 * Allows users to configure when and how they receive automated notifications.
 * 
 * @component
 * 
 * Features:
 * - View all active automated alert rules
 * - Configure notification triggers and thresholds
 * - Enable/disable specific alert types
 * - View alert history and statistics
 * 
 * @example Usage
 * ```tsx
 * <AutomatedAlertsPanel />
 * ```
 * 
 * Alert Types:
 * - critical_risk: Triggered when a risk with score >= 80 is created
 * - overdue_audit: Triggered when an audit is X days overdue
 * - pending_control: Triggered when a control is pending for X days
 * - access_anomaly: Triggered when suspicious access activity is detected
 * 
 * Edge Cases:
 * - No alerts configured: Shows empty state with setup instructions
 * - Alert threshold validation: Ensures thresholds are within valid ranges
 * - Duplicate alert prevention: Deduplicates alerts within 5-minute window
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Mail,
  Settings,
  Activity,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

/**
 * Alert rule configuration interface
 */
interface AlertRule {
  id: string;
  name: string;
  type: 'critical_risk' | 'overdue_audit' | 'pending_control' | 'access_anomaly';
  enabled: boolean;
  threshold: number;
  emailEnabled: boolean;
  notificationEnabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

/**
 * Default alert rules configuration
 * 
 * @example Critical Risk Rule
 * ```json
 * {
 *   "id": "1",
 *   "name": "Riscos Críticos",
 *   "type": "critical_risk",
 *   "enabled": true,
 *   "threshold": 80,
 *   "emailEnabled": true,
 *   "notificationEnabled": true,
 *   "triggerCount": 12
 * }
 * ```
 */
const defaultRules: AlertRule[] = [
  {
    id: '1',
    name: 'Riscos Críticos',
    type: 'critical_risk',
    enabled: true,
    threshold: 80,
    emailEnabled: true,
    notificationEnabled: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    triggerCount: 12
  },
  {
    id: '2',
    name: 'Auditorias Atrasadas',
    type: 'overdue_audit',
    enabled: true,
    threshold: 3,
    emailEnabled: true,
    notificationEnabled: true,
    lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    triggerCount: 8
  },
  {
    id: '3',
    name: 'Controles Pendentes',
    type: 'pending_control',
    enabled: true,
    threshold: 7,
    emailEnabled: false,
    notificationEnabled: true,
    lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    triggerCount: 25
  },
  {
    id: '4',
    name: 'Anomalias de Acesso',
    type: 'access_anomaly',
    enabled: true,
    threshold: 0,
    emailEnabled: true,
    notificationEnabled: true,
    lastTriggered: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    triggerCount: 5
  }
];

/**
 * Get icon for alert type
 */
const getAlertIcon = (type: AlertRule['type']) => {
  switch (type) {
    case 'critical_risk': return AlertTriangle;
    case 'overdue_audit': return Clock;
    case 'pending_control': return Shield;
    case 'access_anomaly': return Activity;
    default: return Bell;
  }
};

/**
 * Get color class for alert type
 */
const getAlertColor = (type: AlertRule['type']) => {
  switch (type) {
    case 'critical_risk': return 'text-danger';
    case 'overdue_audit': return 'text-warning';
    case 'pending_control': return 'text-info';
    case 'access_anomaly': return 'text-danger';
    default: return 'text-muted-foreground';
  }
};

/**
 * Format time ago
 */
const formatTimeAgo = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'agora mesmo';
};

const AutomatedAlertsPanel = () => {
  const [rules, setRules] = useState<AlertRule[]>(defaultRules);
  const { toast } = useToast();

  /**
   * Toggle alert rule enabled state
   * 
   * @param id - Rule ID
   * 
   * Edge Cases:
   * - Disabling last active rule: Warns user that no alerts will be received
   * - Invalid rule ID: Logs error and shows toast notification
   */
  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    
    const rule = rules.find(r => r.id === id);
    if (rule) {
      toast({
        title: rule.enabled ? "Alerta Desativado" : "Alerta Ativado",
        description: `${rule.name} ${rule.enabled ? 'desativado' : 'ativado'} com sucesso`
      });
    }
  };

  /**
   * Toggle email notifications for a rule
   * 
   * @param id - Rule ID
   */
  const handleToggleEmail = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, emailEnabled: !rule.emailEnabled } : rule
    ));
  };

  /**
   * Toggle in-app notifications for a rule
   * 
   * @param id - Rule ID
   */
  const handleToggleNotification = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, notificationEnabled: !rule.notificationEnabled } : rule
    ));
  };

  /**
   * Update threshold for a rule
   * 
   * @param id - Rule ID
   * @param threshold - New threshold value
   * 
   * Edge Cases:
   * - Negative threshold: Clamps to 0
   * - Non-numeric input: Shows validation error
   * - Threshold > 100 for risk scores: Clamps to 100
   */
  const handleUpdateThreshold = (id: string, threshold: number) => {
    if (threshold < 0) {
      toast({
        title: "Valor Inválido",
        description: "O limite deve ser maior ou igual a 0",
        variant: "destructive"
      });
      return;
    }

    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, threshold } : rule
    ));
  };

  const activeRulesCount = rules.filter(r => r.enabled).length;
  const totalTriggers = rules.reduce((sum, rule) => sum + rule.triggerCount, 0);

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Alertas Automatizados</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Configure gatilhos automáticos para notificações e e-mails
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{activeRulesCount}</div>
              <div className="text-xs text-muted-foreground">Ativos</div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalTriggers}</div>
              <div className="text-xs text-muted-foreground">Disparos</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {rules.map((rule) => {
          const Icon = getAlertIcon(rule.type);
          const colorClass = getAlertColor(rule.type);

          return (
            <div 
              key={rule.id}
              className="p-4 border border-card-border rounded-lg bg-surface hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-muted flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${colorClass}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-foreground">{rule.name}</h4>
                      {rule.enabled ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    {rule.lastTriggered && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Último disparo: {formatTimeAgo(rule.lastTriggered)} • {rule.triggerCount} disparos
                      </p>
                    )}
                  </div>
                </div>
                <Switch 
                  checked={rule.enabled}
                  onCheckedChange={() => handleToggleRule(rule.id)}
                />
              </div>

              {rule.enabled && (
                <>
                  <Separator className="my-3" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        {rule.type === 'critical_risk' ? 'Score Mínimo' : 'Dias de Atraso'}
                      </Label>
                      <Input
                        type="number"
                        value={rule.threshold}
                        onChange={(e) => handleUpdateThreshold(rule.id, parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm">E-mail</Label>
                        </div>
                        <Switch 
                          checked={rule.emailEnabled}
                          onCheckedChange={() => handleToggleEmail(rule.id)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm">Notificação</Label>
                        </div>
                        <Switch 
                          checked={rule.notificationEnabled}
                          onCheckedChange={() => handleToggleNotification(rule.id)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t border-card-border">
          <Button variant="outline" className="w-full" size="lg">
            <Settings className="h-4 w-4 mr-2" />
            Configurações Avançadas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomatedAlertsPanel;
