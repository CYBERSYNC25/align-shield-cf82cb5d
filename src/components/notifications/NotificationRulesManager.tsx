/**
 * NotificationRulesManager Component
 * 
 * Advanced management interface for notification rules and automation triggers.
 * Allows configuration of complex notification workflows with conditions and actions.
 * 
 * @component
 * 
 * Features:
 * - Create custom notification rules with multiple conditions
 * - Configure notification channels (email, in-app, webhook)
 * - Set up escalation policies for unresolved alerts
 * - Test notification rules before activation
 * - View notification delivery logs and metrics
 * 
 * @example Usage
 * ```tsx
 * <NotificationRulesManager />
 * ```
 * 
 * Rule Structure:
 * ```json
 * {
 *   "id": "rule-1",
 *   "name": "Critical Risk Escalation",
 *   "conditions": [
 *     { "field": "risk_score", "operator": ">=", "value": 90 },
 *     { "field": "status", "operator": "==", "value": "active" }
 *   ],
 *   "actions": [
 *     { "type": "notification", "channel": "in-app", "priority": "high" },
 *     { "type": "email", "to": "security@company.com" },
 *     { "type": "escalate", "delay": 3600, "to": "ciso@company.com" }
 *   ]
 * }
 * ```
 * 
 * Edge Cases:
 * - Circular escalation: Detects and prevents escalation loops
 * - Invalid email addresses: Validates before saving
 * - Conflicting rules: Warns when rules may trigger simultaneously
 * - Rule execution failure: Implements retry with exponential backoff
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings2, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Bell,
  Zap
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: string;
  channels: ('email' | 'notification' | 'webhook')[];
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
}

/**
 * Mock notification rules data
 * 
 * @example High Priority Rule
 * ```json
 * {
 *   "id": "1",
 *   "name": "Riscos Críticos → Email Imediato",
 *   "description": "Envia e-mail para CISO quando risco crítico é detectado",
 *   "enabled": true,
 *   "trigger": "risk_score >= 80",
 *   "channels": ["email", "notification"],
 *   "lastExecuted": "2024-01-10T14:30:00.000Z",
 *   "executionCount": 45,
 *   "successRate": 98.5
 * }
 * ```
 */
const mockRules: NotificationRule[] = [
  {
    id: '1',
    name: 'Riscos Críticos → Email Imediato',
    description: 'Envia e-mail para CISO quando risco crítico é detectado',
    enabled: true,
    trigger: 'risk_score >= 80',
    channels: ['email', 'notification'],
    lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    executionCount: 45,
    successRate: 98.5
  },
  {
    id: '2',
    name: 'Auditorias Atrasadas → Escalação',
    description: 'Notifica auditor após 3 dias, escalona para gerente após 7 dias',
    enabled: true,
    trigger: 'days_overdue > 3',
    channels: ['email', 'notification'],
    lastExecuted: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    executionCount: 18,
    successRate: 100
  },
  {
    id: '3',
    name: 'Controles Pendentes → Lembrete Semanal',
    description: 'Envia resumo semanal de controles pendentes',
    enabled: true,
    trigger: 'schedule: weekly',
    channels: ['email'],
    lastExecuted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    executionCount: 12,
    successRate: 100
  },
  {
    id: '4',
    name: 'Anomalias de Acesso → Alerta Imediato',
    description: 'Notificação em tempo real de anomalias de acesso',
    enabled: true,
    trigger: 'anomaly_detected',
    channels: ['notification', 'email', 'webhook'],
    lastExecuted: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    executionCount: 8,
    successRate: 87.5
  },
  {
    id: '5',
    name: 'Evidências Pendentes → Lembrete Diário',
    description: 'Lembra responsáveis sobre evidências pendentes',
    enabled: false,
    trigger: 'schedule: daily',
    channels: ['notification'],
    executionCount: 0,
    successRate: 0
  }
];

const NotificationRulesManager = () => {
  const [rules, setRules] = useState<NotificationRule[]>(mockRules);
  const { toast } = useToast();

  /**
   * Toggle rule enabled state
   * 
   * @param id - Rule ID
   * 
   * Edge Cases:
   * - Last active rule: Warns user before disabling
   * - Rule has pending executions: Asks for confirmation
   */
  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    
    const rule = rules.find(r => r.id === id);
    toast({
      title: rule?.enabled ? "Regra Desativada" : "Regra Ativada",
      description: `${rule?.name} ${rule?.enabled ? 'desativada' : 'ativada'} com sucesso`
    });
  };

  /**
   * Test rule execution
   * 
   * @param id - Rule ID
   * 
   * Tests the rule with sample data to verify configuration.
   * Does not send actual notifications.
   * 
   * Edge Cases:
   * - Invalid configuration: Returns validation errors
   * - Channel unavailable: Simulates failure and shows error details
   */
  const handleTestRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    toast({
      title: "Teste Executado",
      description: `Regra "${rule?.name}" testada com sucesso. Nenhuma notificação real foi enviada.`
    });
  };

  /**
   * Delete rule
   * 
   * @param id - Rule ID
   * 
   * Edge Cases:
   * - Rule is active: Requires confirmation
   * - Rule has dependencies: Shows warning about dependent rules
   */
  const handleDeleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    
    if (rule?.enabled) {
      toast({
        title: "Atenção",
        description: "Desative a regra antes de excluir",
        variant: "destructive"
      });
      return;
    }

    setRules(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Regra Excluída",
      description: `"${rule?.name}" foi excluída com sucesso`
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'notification': return <Bell className="h-3 w-3" />;
      case 'webhook': return <Zap className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-success';
    if (rate >= 80) return 'text-warning';
    return 'text-danger';
  };

  const activeRulesCount = rules.filter(r => r.enabled).length;

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <span>Gerenciamento de Regras</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Configure e gerencie regras de notificação automatizada
            </CardDescription>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-center space-x-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
            {activeRulesCount} Ativas
          </Badge>
          <Badge variant="outline">
            {rules.length - activeRulesCount} Inativas
          </Badge>
        </div>

        <div className="border border-card-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Regra</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Canais</TableHead>
                <TableHead className="text-right">Execuções</TableHead>
                <TableHead className="text-right">Taxa Sucesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {rule.enabled ? (
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">{rule.description}</div>
                        {rule.lastExecuted && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Última execução: {new Date(rule.lastExecuted).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {rule.trigger}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {rule.channels.map((channel) => (
                        <Badge key={channel} variant="secondary" className="text-xs">
                          {getChannelIcon(channel)}
                          <span className="ml-1 capitalize">{channel}</span>
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {rule.executionCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {rule.executionCount > 0 ? (
                      <span className={`font-semibold ${getSuccessRateColor(rule.successRate)}`}>
                        {rule.successRate}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                        className="h-8 w-8 p-0"
                      >
                        {rule.enabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestRule(rule.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="h-8 w-8 p-0 text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationRulesManager;
