import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Users, 
  Clock, 
  BookOpen,
  Trophy,
  Calendar,
  Play,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateTrainingModal from '@/components/policies/CreateTrainingModal';

const TrainingPrograms = () => {
  const trainingPrograms = [
    {
      title: 'Segurança da Informação - Básico',
      description: 'Fundamentos de segurança para todos os colaboradores',
      category: 'Segurança',
      duration: '45 min',
      status: 'active',
      enrolled: 234,
      completed: 198,
      completionRate: 85,
      dueDate: '30/11/2024',
      mandatory: true,
      frameworks: ['ISO 27001', 'SOC 2'],
      modules: [
        'Classificação de Dados',
        'Senhas Seguras',
        'Phishing e Malware',
        'Política de Mesa Limpa'
      ]
    },
    {
      title: 'LGPD para Desenvolvedores',
      description: 'Privacy by Design e tratamento seguro de dados pessoais',
      category: 'Privacidade',
      duration: '90 min',
      status: 'active',
      enrolled: 52,
      completed: 41,
      completionRate: 79,
      dueDate: '15/12/2024',
      mandatory: true,
      frameworks: ['LGPD', 'GDPR'],
      modules: [
        'Fundamentos da LGPD',
        'Privacy by Design',
        'Minimização de Dados',
        'Direitos dos Titulares'
      ]
    },
    {
      title: 'Resposta a Incidentes',
      description: 'Procedimentos para identificação e resposta a incidentes',
      category: 'Segurança',
      duration: '60 min',
      status: 'active',
      enrolled: 78,
      completed: 65,
      completionRate: 83,
      dueDate: '20/12/2024',
      mandatory: false,
      frameworks: ['SOC 2', 'ISO 27035'],
      modules: [
        'Identificação de Incidentes',
        'Comunicação e Escalação',
        'Contenção e Erradicação',
        'Recuperação e Lições'
      ]
    },
    {
      title: 'Código de Conduta Corporativo',
      description: 'Ética, compliance e valores organizacionais',
      category: 'Compliance',
      duration: '30 min',
      status: 'draft',
      enrolled: 0,
      completed: 0,
      completionRate: 0,
      dueDate: '31/01/2025',
      mandatory: true,
      frameworks: ['SOX', 'Compliance'],
      modules: [
        'Valores da Empresa',
        'Conflitos de Interesse',
        'Compliance Regulatório',
        'Canal de Denúncias'
      ]
    }
  ];

  const getStatusBadge = (status: string, mandatory: boolean) => {
    if (status === 'active') {
      return (
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            Ativo
          </Badge>
          {mandatory && (
            <Badge variant="destructive" className="text-xs">
              Obrigatório
            </Badge>
          )}
        </div>
      );
    }
    return <Badge variant="outline">Rascunho</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Programas de Treinamento
        </h2>
        <CreateTrainingModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trainingPrograms.map((program, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold">
                    {program.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {program.description}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />Prévia
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />Gerenciar Inscrições
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BookOpen className="h-4 w-4 mr-2" />Editar Conteúdo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(program.status, program.mandatory)}
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {program.duration}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-medium">{program.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className="font-medium">{program.dueDate}</span>
                </div>
              </div>

              {program.status === 'active' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso:</span>
                    <span className="font-medium">
                      {program.completed}/{program.enrolled} concluídos
                    </span>
                  </div>
                  <Progress value={program.completionRate} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {program.completionRate}% de conclusão
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">MÓDULOS</p>
                <div className="space-y-1">
                  {program.modules.slice(0, 3).map((module, idx) => (
                    <div key={idx} className="text-xs text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {module}
                    </div>
                  ))}
                  {program.modules.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{program.modules.length - 3} módulos adicionais
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">FRAMEWORKS</p>
                <div className="flex flex-wrap gap-1">
                  {program.frameworks.map((framework, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {program.enrolled} inscritos
                </div>
                {program.completionRate > 90 && (
                  <div className="flex items-center text-xs text-success">
                    <Trophy className="h-3 w-3 mr-1" />
                    Alta adesão
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrainingPrograms;