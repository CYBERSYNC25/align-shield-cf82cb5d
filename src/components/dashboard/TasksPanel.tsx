import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  ChevronRight,
  Shield,
  FileText,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'security' | 'compliance' | 'policy' | 'integration';
  assignee: string;
  dueDate: string;
  framework?: string;
}

const priorityConfig = {
  high: { color: 'danger', label: 'Alta' },
  medium: { color: 'warning', label: 'Média' },
  low: { color: 'info', label: 'Baixa' }
};

const categoryConfig = {
  security: { icon: Shield, color: 'danger', label: 'Segurança' },
  compliance: { icon: AlertTriangle, color: 'warning', label: 'Conformidade' },
  policy: { icon: FileText, color: 'info', label: 'Política' },
  integration: { icon: Database, color: 'success', label: 'Integração' }
};

const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const priority = priorityConfig[task.priority];
  const category = categoryConfig[task.category];
  const CategoryIcon = category.icon;

  return (
    <div className="group border border-card-border rounded-lg p-4 hover:shadow-card transition-all duration-200 bg-surface-elevated">
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className={cn(
            'p-2 rounded-lg flex-shrink-0',
            `bg-${category.color}/10`
          )}>
            <CategoryIcon className={cn('h-4 w-4', `text-${category.color}`)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-foreground truncate">
                {task.title}
              </h4>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  `border-${priority.color} text-${priority.color}`
                )}
              >
                {priority.label}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{task.assignee}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{task.dueDate}</span>
              </div>
              {task.framework && (
                <Badge variant="secondary" className="text-xs">
                  {task.framework}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const TasksPanel = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Configurar MFA obrigatório no AWS',
      description: 'Controle IAM.8 do SOC 2 detectou 15 usuários sem MFA ativado',
      priority: 'high',
      category: 'security',
      assignee: 'Carlos Santos',
      dueDate: 'Hoje',
      framework: 'SOC 2'
    },
    {
      id: '2',
      title: 'Revisar acessos privilegiados Azure AD',
      description: 'Revisão trimestral de acessos administrativos vence em 3 dias',
      priority: 'high',
      category: 'compliance',
      assignee: 'Ana Silva',
      dueDate: '3 dias',
      framework: 'ISO 27001'
    },
    {
      id: '3',
      title: 'Atualizar política de classificação de dados',
      description: 'Nova versão da política LGPD precisa ser publicada e atestada',
      priority: 'medium',
      category: 'policy',
      assignee: 'Roberto Lima',
      dueDate: '1 semana',
      framework: 'LGPD'
    },
    {
      id: '4',
      title: 'Integrar CrowdStrike EDR',
      description: 'Configurar coleta automática de evidências de endpoint',
      priority: 'medium',
      category: 'integration',
      assignee: 'Marcus Tech',
      dueDate: '2 semanas'
    },
    {
      id: '5',
      title: 'Corrigir backup encryption S3',
      description: 'Buckets de backup detectados sem criptografia em repouso',
      priority: 'high',
      category: 'security',
      assignee: 'DevOps Team',
      dueDate: 'Amanhã',
      framework: 'SOC 2'
    }
  ];

  return (
    <Card className="border-card-border shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span>Tarefas Prioritárias</span>
          </CardTitle>
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
        
        <div className="pt-3 text-center">
          <Button variant="ghost" className="w-full text-primary">
            Carregar mais tarefas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksPanel;