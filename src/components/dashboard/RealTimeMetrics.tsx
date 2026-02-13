import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, Database, Plug } from 'lucide-react';
import { useRisks } from '@/hooks/useRisks';
import { useTasks } from '@/hooks/useTasks';
import { useIntegrationActivity, useIntegratedSystems } from '@/hooks/useIntegratedSystems';
import { useMemo } from 'react';

const RealTimeMetrics = () => {
  const { risks } = useRisks();
  const { tasks } = useTasks();
  const { activityByHour } = useIntegrationActivity();
  const { systems, totalUsers, totalResources, hasRealData } = useIntegratedSystems();

  const activityData = useMemo(() => {
    if (hasRealData && activityByHour.length > 0) {
      return activityByHour.map(item => ({
        ...item,
        risks: 0,
      }));
    }
    return [];
  }, [activityByHour, hasRealData]);

  const criticalAlerts = risks.filter(risk => risk.level === 'high').length;
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date() && task.status !== 'completed';
  }).length;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Atividade em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasRealData && (
              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                <Database className="h-3 w-3 mr-1" />
                Dados Reais
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasRealData ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
                <Plug className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Sem integrações conectadas</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Conecte integrações para monitorar atividades em tempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{totalResources}</div>
                  <div className="text-xs text-muted-foreground">Recursos Coletados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-danger">{criticalAlerts}</div>
                  <div className="text-xs text-muted-foreground">Alertas críticos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-warning">{overdueTasks}</div>
                  <div className="text-xs text-muted-foreground">Tarefas em atraso</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="text-center">
                  <div className="text-sm font-semibold text-primary">{systems.length}</div>
                  <div className="text-xs text-muted-foreground">Sistemas Conectados</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-primary">{totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Usuários Monitorados</div>
                </div>
              </div>

              {activityData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis axisLine={false} tickLine={false} className="text-xs" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium mb-2">{label}</p>
                              {payload.map((item, index) => (
                                <p key={index} style={{ color: item.color }}>
                                  {item.dataKey === 'activities' ? 'Recursos: ' : 'Riscos: '}{item.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="activities" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Resumo de Tarefas
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {tasks.length} total
          </Badge>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-[280px]">
              <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-success/10 rounded-lg text-center border border-success/20">
                  <div className="text-3xl font-bold text-success">{completedTasks}</div>
                  <div className="text-xs text-muted-foreground mt-1">Concluídas</div>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg text-center border border-warning/20">
                  <div className="text-3xl font-bold text-warning">{pendingTasks}</div>
                  <div className="text-xs text-muted-foreground mt-1">Pendentes</div>
                </div>
              </div>
              {tasks.length > 0 && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Taxa de conclusão</div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((completedTasks / tasks.length) * 100)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMetrics;
