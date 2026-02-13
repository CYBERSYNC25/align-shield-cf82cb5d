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

const NotificationRulesManager = () => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const { toast } = useToast();

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

  const handleTestRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    toast({
      title: "Teste Executado",
      description: `Regra "${rule?.name}" testada com sucesso. Nenhuma notificação real foi enviada.`
    });
  };

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
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Nenhuma regra de notificação configurada
            </h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Crie sua primeira regra para automatizar notificações de compliance, riscos e auditorias.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </div>
        ) : (
          <>
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
                          <Button variant="ghost" size="sm" onClick={() => handleToggleRule(rule.id)} className="h-8 w-8 p-0">
                            {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleTestRule(rule.id)} className="h-8 w-8 p-0">
                            <Zap className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)} className="h-8 w-8 p-0 text-danger hover:text-danger">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationRulesManager;
