import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Search,
  Filter,
  ChevronRight,
  Shield,
  FileText,
  Loader2,
  ArrowLeft,
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

const priorityConfig = {
  critical: { color: 'danger', label: 'Crítica' },
  high: { color: 'danger', label: 'Alta' },
  medium: { color: 'warning', label: 'Média' },
  low: { color: 'info', label: 'Baixa' }
};

const statusConfig = {
  pending: { color: 'warning', label: 'Pendente' },
  in_progress: { color: 'info', label: 'Em Progresso' },
  completed: { color: 'success', label: 'Concluída' },
  overdue: { color: 'danger', label: 'Atrasada' }
};

const TaskItem: React.FC<{ task: Task; onStatusUpdate: (id: string, status: Task['status']) => void }> = ({ task, onStatusUpdate }) => {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  
  const getIcon = () => {
    if (task.category?.toLowerCase().includes('soc')) return Shield;
    if (task.category?.toLowerCase().includes('iso')) return Shield;
    if (task.category?.toLowerCase().includes('lgpd')) return FileText;
    return AlertTriangle;
  };
  
  const CategoryIcon = getIcon();

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={cn(
              'p-2 rounded-lg flex-shrink-0',
              `bg-${priority.color}/10`
            )}>
              <CategoryIcon className={cn('h-5 w-5', `text-${priority.color}`)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {task.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs flex-shrink-0',
                    `border-${priority.color} text-${priority.color}`
                  )}
                >
                  {priority.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs flex-shrink-0',
                    `border-${status.color} text-${status.color}`
                  )}
                >
                  {status.label}
                </Badge>
              </div>
              
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {task.description}
              </p>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{task.assigned_to}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                {task.category && (
                  <Badge variant="secondary" className="truncate">
                    {task.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const nextStatus: Task['status'] = 
                  task.status === 'pending' ? 'in_progress' :
                  task.status === 'in_progress' ? 'completed' : 'pending';
                onStatusUpdate(task.id, nextStatus);
              }}
            >
              {task.status === 'pending' ? 'Iniciar' : 
               task.status === 'in_progress' ? 'Concluir' : 'Reabrir'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                alert(`Detalhes da Tarefa:\n\nTítulo: ${task.title}\nDescrição: ${task.description}\nResponsável: ${task.assigned_to}\nPrazo: ${format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}\nStatus: ${statusConfig[task.status].label}\nPrioridade: ${priorityConfig[task.priority].label}`);
              }}
              title="Ver detalhes da tarefa"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Tasks = () => {
  const { tasks, loading, updateTask } = useTasks();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const handleStatusUpdate = async (id: string, status: Task['status']) => {
    await updateTask(id, { status });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Breadcrumb - Full Width */}
              <div className="col-span-full">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="gap-2 hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                  <ChevronRight className="h-4 w-4" />
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckSquare className="h-4 w-4" />
                    Tarefas
                  </div>
                </div>
              </div>

              {/* Header - Full Width */}
              <div className="col-span-full">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground truncate">
                      Gerenciamento de Tarefas
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground line-clamp-2">
                      Visualize e gerencie todas as tarefas de compliance
                    </p>
                  </div>
                  <CreateTaskModal />
                </div>
              </div>

              {/* Stats Cards - Responsive grid */}
              <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{taskStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-warning">{taskStats.pending}</div>
                    <div className="text-sm text-muted-foreground">Pendentes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-info">{taskStats.inProgress}</div>
                    <div className="text-sm text-muted-foreground">Em Progresso</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-success">{taskStats.completed}</div>
                    <div className="text-sm text-muted-foreground">Concluídas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-danger">{taskStats.overdue}</div>
                    <div className="text-sm text-muted-foreground">Atrasadas</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters - Full Width */}
              <div className="col-span-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Filter className="h-5 w-5" />
                      Filtros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar tarefas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Status</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                          <SelectItem value="overdue">Atrasada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Prioridades</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tasks List - Full Width */}
              <div className="col-span-full space-y-4">
                {loading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-3 text-muted-foreground">Carregando tarefas...</span>
                    </CardContent>
                  </Card>
                ) : !user ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground">Faça login para ver suas tarefas</p>
                    </CardContent>
                  </Card>
                ) : filteredTasks.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground mb-2">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                          ? 'Nenhuma tarefa encontrada com os filtros aplicados' 
                          : 'Nenhuma tarefa encontrada'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                          ? 'Tente ajustar os filtros ou criar uma nova tarefa'
                          : 'Crie sua primeira tarefa para começar'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTasks.map(task => (
                    <TaskItem key={task.id} task={task} onStatusUpdate={handleStatusUpdate} />
                  ))
                )}
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Tasks;
