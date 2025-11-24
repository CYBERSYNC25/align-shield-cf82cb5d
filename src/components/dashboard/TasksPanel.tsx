import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, User, ChevronRight, Shield, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import type { Database } from '@/integrations/supabase/types';
type Task = Database['public']['Tables']['tasks']['Row'];
const priorityConfig = {
  critical: {
    color: 'danger',
    label: 'Crítica'
  },
  high: {
    color: 'danger',
    label: 'Alta'
  },
  medium: {
    color: 'warning',
    label: 'Média'
  },
  low: {
    color: 'info',
    label: 'Baixa'
  }
};
const statusConfig = {
  pending: {
    color: 'warning',
    label: 'Pendente'
  },
  in_progress: {
    color: 'info',
    label: 'Em Progresso'
  },
  completed: {
    color: 'success',
    label: 'Concluída'
  },
  overdue: {
    color: 'danger',
    label: 'Atrasada'
  }
};
const TaskItem: React.FC<{
  task: Task;
  onStatusUpdate: (id: string, status: Task['status']) => void;
}> = ({
  task,
  onStatusUpdate
}) => {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const getIcon = () => {
    if (task.category?.toLowerCase().includes('soc')) return Shield;
    if (task.category?.toLowerCase().includes('iso')) return Shield;
    if (task.category?.toLowerCase().includes('lgpd')) return FileText;
    return AlertTriangle;
  };
  const CategoryIcon = getIcon();
  return <div className="group border border-card-border rounded-lg p-4 hover:shadow-card transition-all duration-200 bg-surface-elevated">
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className={cn('p-2 rounded-lg flex-shrink-0', `bg-${priority.color}/10`)}>
            <CategoryIcon className={cn('h-4 w-4', `text-${priority.color}`)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-foreground truncate">
                {task.title}
              </h4>
              <Badge variant="outline" className={cn('text-xs', `border-${priority.color} text-${priority.color}`)}>
                {priority.label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', `border-${status.color} text-${status.color}`)}>
                {status.label}
              </Badge>
            </div>
            
            
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{task.assigned_to}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(task.due_date), "dd/MM/yyyy", {
                  locale: ptBR
                })}</span>
              </div>
              {task.category && <Badge variant="secondary" className="text-xs">
                  {task.category}
                </Badge>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => {
          const nextStatus: Task['status'] = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
          onStatusUpdate(task.id, nextStatus);
        }} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
            {task.status === 'pending' ? 'Iniciar' : task.status === 'in_progress' ? 'Concluir' : 'Reabrir'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/tasks'} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Ver detalhes da tarefa">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
};
const TasksPanel = () => {
  const {
    tasks,
    loading,
    updateTask
  } = useTasks();
  const {
    user
  } = useAuth();
  const handleStatusUpdate = async (id: string, status: Task['status']) => {
    await updateTask(id, {
      status
    });
  };

  // Show recent tasks (limit to 5)
  const recentTasks = tasks.slice(0, 5);
  return <Card className="border-card-border shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span>Tarefas Prioritárias</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <CreateTaskModal />
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/tasks'}>
              Ver todas
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {loading ? <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando tarefas...</span>
          </div> : !user ? <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Faça login para ver suas tarefas</p>
          </div> : recentTasks.length === 0 ? <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Crie uma nova tarefa para começar</p>
          </div> : recentTasks.map(task => {})}
        
        {!loading && user && tasks.length > 5 && <div className="pt-3 text-center">
            <Button variant="ghost" className="w-full text-primary" onClick={() => window.location.href = '/tasks'}>
              Ver todas as {tasks.length} tarefas
            </Button>
          </div>}
      </CardContent>
    </Card>;
};
export default TasksPanel;