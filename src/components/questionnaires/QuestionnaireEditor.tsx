import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  MoreVertical,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Ban,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuestionnaireById } from '@/hooks/useQuestionnaires';
import { useQuestionnaireQuestions, QuestionnaireQuestion } from '@/hooks/useQuestionnaireQuestions';
import { useGenerateAnswers } from '@/hooks/useGenerateAnswers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import QuestionReviewPanel from './QuestionReviewPanel';
import AddQuestionModal from './AddQuestionModal';

interface QuestionnaireEditorProps {
  questionnaireId: string;
  onBack: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  ai_generated: { label: 'IA', variant: 'secondary' },
  reviewed: { label: 'Revisado', variant: 'default' },
  approved: { label: 'Aprovado', variant: 'default' },
  not_applicable: { label: 'N/A', variant: 'outline' },
};

export default function QuestionnaireEditor({ questionnaireId, onBack }: QuestionnaireEditorProps) {
  const { user } = useAuth();
  const { data: questionnaire, isLoading: isLoadingQuestionnaire } = useQuestionnaireById(questionnaireId);
  const { 
    questions, 
    stats, 
    isLoading: isLoadingQuestions, 
    update: updateQuestion,
    bulkUpdateStatus 
  } = useQuestionnaireQuestions(questionnaireId);
  const { generate, isGenerating, progress } = useGenerateAnswers(questionnaireId);

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionnaireQuestion | null>(null);
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);

  const isLoading = isLoadingQuestionnaire || isLoadingQuestions;

  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleGenerateAI = async () => {
    const idsToGenerate = selectedQuestions.length > 0 
      ? selectedQuestions 
      : questions.filter(q => q.answer_status === 'pending' || !q.answer_status).map(q => q.id);
    
    if (idsToGenerate.length === 0) {
      return;
    }

    await generate(idsToGenerate);
    setSelectedQuestions([]);
  };

  const handleBulkApprove = async () => {
    if (selectedQuestions.length === 0) return;
    await bulkUpdateStatus({ 
      ids: selectedQuestions, 
      status: 'approved',
      reviewedBy: user?.email 
    });
    setSelectedQuestions([]);
  };

  const handleBulkMarkNA = async () => {
    if (selectedQuestions.length === 0) return;
    await bulkUpdateStatus({ 
      ids: selectedQuestions, 
      status: 'not_applicable',
      reviewedBy: user?.email 
    });
    setSelectedQuestions([]);
  };

  const handleAnswerChange = async (questionId: string, answer: string) => {
    await updateQuestion({
      id: questionId,
      answer_text: answer,
      answer_status: 'reviewed'
    });
  };

  const handleStatusChange = async (questionId: string, status: string) => {
    await updateQuestion({
      id: questionId,
      answer_status: status
    });
  };

  const handleQuestionClick = (question: QuestionnaireQuestion) => {
    setSelectedQuestion(question);
    setIsReviewPanelOpen(true);
  };

  const exportAsPDF = () => {
    if (!questionnaire) return;

    const content = `
╔══════════════════════════════════════════════════════════════╗
║              QUESTIONÁRIO DE SEGURANÇA                        ║
║                    ${questionnaire.name.padEnd(40)}║
╚══════════════════════════════════════════════════════════════╝

Tipo: ${questionnaire.source}
Data: ${new Date().toLocaleDateString('pt-BR')}
Total de Perguntas: ${questions.length}
Aprovadas: ${stats.approved}

═══════════════════════════════════════════════════════════════

${questions.map(q => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${q.question_number}: ${q.question_text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPOSTA:
${q.answer_text || 'Não respondida'}

Status: ${statusConfig[q.answer_status || 'pending']?.label || 'Pendente'}
${q.confidence_score ? `Confiança: ${q.confidence_score}%` : ''}
`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${questionnaire.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    if (!questionnaire) return;

    const headers = ['Número', 'Pergunta', 'Resposta', 'Status', 'Confiança'];
    const rows = questions.map(q => [
      q.question_number,
      `"${q.question_text.replace(/"/g, '""')}"`,
      `"${(q.answer_text || '').replace(/"/g, '""')}"`,
      statusConfig[q.answer_status || 'pending']?.label || 'Pendente',
      q.confidence_score?.toString() || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${questionnaire.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Questionário não encontrado</p>
      </div>
    );
  }

  const pendingCount = questions.filter(q => q.answer_status === 'pending' || !q.answer_status).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{questionnaire.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{questionnaire.source}</Badge>
                <span className="text-sm text-muted-foreground">
                  {questions.length} perguntas • {stats.approved} aprovadas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateAI}
              disabled={isGenerating || (selectedQuestions.length === 0 && pendingCount === 0)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Respostas IA
                  {selectedQuestions.length > 0 && ` (${selectedQuestions.length})`}
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleBulkApprove}
                  disabled={selectedQuestions.length === 0}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar Selecionados ({selectedQuestions.length})
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleBulkMarkNA}
                  disabled={selectedQuestions.length === 0}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Marcar como N/A ({selectedQuestions.length})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsAddQuestionOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pergunta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportAsPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress during AI generation */}
        {isGenerating && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Gerando respostas com IA...
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Questions Table */}
        <div className={cn(
          "flex-1 overflow-auto",
          isReviewPanelOpen && "border-r"
        )}>
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma pergunta</h3>
              <p className="text-muted-foreground mb-4">
                Adicione perguntas ao questionário para começar
              </p>
              <Button onClick={() => setIsAddQuestionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedQuestions.length === questions.length && questions.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-20">#</TableHead>
                  <TableHead className="w-1/3">Pergunta</TableHead>
                  <TableHead className="w-1/3">Resposta</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-24">Confiança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => {
                  const status = statusConfig[question.answer_status || 'pending'];

                  return (
                    <TableRow
                      key={question.id}
                      className={cn(
                        "cursor-pointer",
                        selectedQuestion?.id === question.id && "bg-muted/50"
                      )}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={() => toggleSelection(question.id)}
                        />
                      </TableCell>
                      <TableCell 
                        className="font-mono text-sm"
                        onClick={() => handleQuestionClick(question)}
                      >
                        {question.question_number}
                      </TableCell>
                      <TableCell 
                        className="text-sm"
                        onClick={() => handleQuestionClick(question)}
                      >
                        <p className="line-clamp-2">{question.question_text}</p>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Textarea
                          value={question.answer_text || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Digite a resposta..."
                          className="min-h-[60px] text-sm resize-none"
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={question.answer_status || 'pending'}
                          onValueChange={(value) => handleStatusChange(question.id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <Badge variant={config.variant} className="font-normal">
                                  {config.label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={() => handleQuestionClick(question)}>
                        {question.confidence_score !== null && (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  question.confidence_score >= 80 
                                    ? "bg-green-500" 
                                    : question.confidence_score >= 60 
                                      ? "bg-yellow-500" 
                                      : "bg-red-500"
                                )}
                                style={{ width: `${question.confidence_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {question.confidence_score}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Review Panel */}
        {isReviewPanelOpen && selectedQuestion && (
          <QuestionReviewPanel
            question={selectedQuestion}
            questionnaireId={questionnaireId}
            onClose={() => {
              setIsReviewPanelOpen(false);
              setSelectedQuestion(null);
            }}
            onUpdate={async (updates) => {
              await updateQuestion({ id: selectedQuestion.id, ...updates });
            }}
          />
        )}
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal
        open={isAddQuestionOpen}
        onOpenChange={setIsAddQuestionOpen}
        questionnaireId={questionnaireId}
      />
    </div>
  );
}
