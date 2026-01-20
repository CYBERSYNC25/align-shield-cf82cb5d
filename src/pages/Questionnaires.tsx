import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  ClipboardList, 
  Plus, 
  MoreVertical, 
  Play, 
  Eye, 
  Download, 
  Share2,
  FileSpreadsheet,
  Calendar,
  User,
  Trash2
} from 'lucide-react';
import { useQuestionnaires } from '@/hooks/useQuestionnaires';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateQuestionnaireModal from '@/components/questionnaires/CreateQuestionnaireModal';
import QuestionnaireEditor from '@/components/questionnaires/QuestionnaireEditor';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  pending_review: { label: 'Pendente Revisão', variant: 'default' },
  completed: { label: 'Concluído', variant: 'default' }
};

const sourceConfig: Record<string, { label: string; color: string }> = {
  CAIQ: { label: 'CAIQ', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  VSA: { label: 'VSA', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  SIG: { label: 'SIG', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  HECVAT: { label: 'HECVAT', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  Custom: { label: 'Personalizado', color: 'bg-muted text-muted-foreground' }
};

export default function Questionnaires() {
  const { questionnaires, stats, isLoading, delete: deleteQuestionnaire } = useQuestionnaires();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionnaireToDelete, setQuestionnaireToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (questionnaireToDelete) {
      await deleteQuestionnaire(questionnaireToDelete);
      setDeleteDialogOpen(false);
      setQuestionnaireToDelete(null);
    }
  };

  // If editing a questionnaire, show the editor full screen
  if (selectedQuestionnaireId) {
    return (
      <QuestionnaireEditor 
        questionnaireId={selectedQuestionnaireId}
        onBack={() => setSelectedQuestionnaireId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-72 pt-16">
        <PageContainer>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Questionários de Segurança
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie e responda questionários de segurança com auxílio de IA
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Questionário
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.pendingReview}</div>
                <p className="text-sm text-muted-foreground">Pendentes Revisão</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </CardContent>
            </Card>
          </div>

          {/* Questionnaires List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : questionnaires.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum questionário</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando seu primeiro questionário de segurança
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Questionário
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {questionnaires.map((questionnaire) => {
                const source = sourceConfig[questionnaire.source] || sourceConfig.Custom;
                const status = statusConfig[questionnaire.status] || statusConfig.draft;
                const progressPercent = questionnaire.questions_count 
                  ? Math.round((questionnaire.questions_count * 0.3) * 100) / questionnaire.questions_count
                  : 0;

                return (
                  <Card key={questionnaire.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <Badge className={source.color}>{source.label}</Badge>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <CardTitle className="text-lg mt-2 line-clamp-2">
                        {questionnaire.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{questionnaire.questions_count || 0} perguntas</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>

                      {/* Metadata */}
                      <div className="space-y-2 text-sm">
                        {questionnaire.due_date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Prazo: {format(new Date(questionnaire.due_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )}
                        {questionnaire.requester_name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{questionnaire.requester_name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedQuestionnaireId(questionnaire.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Continuar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedQuestionnaireId(questionnaire.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exportar Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setQuestionnaireToDelete(questionnaire.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create Modal */}
          <CreateQuestionnaireModal 
            open={isCreateModalOpen} 
            onOpenChange={setIsCreateModalOpen}
            onCreated={(id) => {
              setIsCreateModalOpen(false);
              setSelectedQuestionnaireId(id);
            }}
          />

          {/* Delete Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir questionário?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O questionário e todas as suas perguntas serão permanentemente excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PageContainer>
      </main>
    </div>
  );
}
