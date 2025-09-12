import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useRisks } from '@/hooks/useRisks';
import { useAudits } from '@/hooks/useAudits';
import { useTasks } from '@/hooks/useTasks';
import { useMemo } from 'react';

const RealTimeMetrics = () => {
  const { risks } = useRisks();
  const { audits } = useAudits();
  const { tasks } = useTasks();

  // Generate real-time activity data
  const activityData = useMemo(() => {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      
      hours.push({
        time: hour.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        activities: Math.floor(Math.random() * 15) + 1,
        risks: Math.floor(Math.random() * 3),
        tasks: Math.floor(Math.random() * 8) + 1
      });
    }
    return hours.slice(-12); // Show last 12 hours
  }, []);

  // Calculate task completion rate over time
  const taskCompletionData = useMemo(() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return days.map(day => ({
      day,
      completed: Math.floor(Math.random() * 20) + 5,
      pending: Math.floor(Math.random() * 10) + 2
    }));
  }, []);

  const totalActivities = activityData.reduce((sum, item) => sum + item.activities, 0);
  const criticalAlerts = risks.filter(risk => risk.level === 'high').length;
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date() && task.status !== 'completed';
  }).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Real-time Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            Atividade em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <Badge variant="secondary" className="text-xs">
              Ativo
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{totalActivities}</div>
                <div className="text-xs text-muted-foreground">Atividades (12h)</div>
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

            {/* Activity Chart */}
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium mb-2">{label}</p>
                          {payload.map((item, index) => (
                            <p key={index} style={{ color: item.color }}>
                              {item.dataKey === 'activities' && 'Atividades: '}
                              {item.dataKey === 'risks' && 'Novos riscos: '}
                              {item.dataKey === 'tasks' && 'Tarefas: '}
                              {item.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="activities" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="risks" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Task Completion Trends */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Tendências de Conclusão
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Última semana
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={taskCompletionData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const completed = payload.find(p => p.dataKey === 'completed')?.value || 0;
                    const pending = payload.find(p => p.dataKey === 'pending')?.value || 0;
                    const total = (completed as number) + (pending as number);
                    const rate = total > 0 ? Math.round(((completed as number) / total) * 100) : 0;
                    
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        <p className="text-success">Concluídas: {completed}</p>
                        <p className="text-warning">Pendentes: {pending}</p>
                        <p className="text-primary font-medium">Taxa: {rate}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="completed" 
                fill="hsl(var(--success))" 
                radius={[0, 0, 4, 4]}
                name="Concluídas"
              />
              <Bar 
                dataKey="pending" 
                fill="hsl(var(--warning))" 
                radius={[4, 4, 0, 0]}
                name="Pendentes"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMetrics;