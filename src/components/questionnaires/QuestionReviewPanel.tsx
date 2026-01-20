import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Sparkles, 
  Shield, 
  FileText, 
  Check, 
  Ban,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { QuestionnaireQuestion } from '@/hooks/useQuestionnaireQuestions';
import { useComplianceStatus } from '@/hooks/useComplianceStatus';

interface QuestionReviewPanelProps {
  question: QuestionnaireQuestion;
  questionnaireId: string;
  onClose: () => void;
  onUpdate: (updates: Partial<QuestionnaireQuestion>) => Promise<void>;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  ai_generated: { label: 'IA', variant: 'secondary' },
  reviewed: { label: 'Revisado', variant: 'default' },
  approved: { label: 'Aprovado', variant: 'default' },
  not_applicable: { label: 'N/A', variant: 'outline' },
};

export default function QuestionReviewPanel({ 
  question, 
  questionnaireId,
  onClose, 
  onUpdate 
}: QuestionReviewPanelProps) {
  const { user } = useAuth();
  const { tests } = useComplianceStatus();
  const [answer, setAnswer] = useState(question.answer_text || '');
  const [reviewerNotes, setReviewerNotes] = useState(question.reviewer_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Find related controls based on keywords
  const relatedControls = useMemo(() => {
    const questionLower = question.question_text.toLowerCase();
    const keywords = questionLower
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 10);

    return tests.filter(test => {
      const titleLower = test.title.toLowerCase();
      const descLower = (test.description || '').toLowerCase();
      return keywords.some(kw => 
        titleLower.includes(kw) || descLower.includes(kw)
      );
    }).slice(0, 5);
  }, [question.question_text, tests]);

  // Parse AI reasoning if available
  const aiReasoning = useMemo(() => {
    if (!question.ai_reasoning) return null;
    try {
      return JSON.parse(question.ai_reasoning);
    } catch {
      return null;
    }
  }, [question.ai_reasoning]);

  const handleSave = async (status: string) => {
    setIsUpdating(true);
    try {
      await onUpdate({
        answer_text: answer,
        answer_status: status,
        reviewer_notes: reviewerNotes,
        reviewed_by: user?.email || null,
        reviewed_at: new Date().toISOString(),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const status = statusConfig[question.answer_status || 'pending'];

  return (
    <div className="w-[500px] flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {question.question_number}
          </Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Question */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Pergunta</Label>
            <p className="mt-1 text-foreground">{question.question_text}</p>
            {question.category && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {question.category}
                </Badge>
                {question.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {question.subcategory}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Related Controls */}
          {relatedControls.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Controles Relacionados
              </Label>
              <div className="mt-2 space-y-2">
                {relatedControls.map((control) => (
                  <Card key={control.id} className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm">{control.ruleId}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {control.title}
                          </p>
                        </div>
                        <Badge 
                          variant={control.status === 'pass' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {control.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {aiReasoning && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Raciocínio da IA
              </Label>
              <Card className="mt-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 text-sm space-y-2">
                  {aiReasoning.matched_controls?.length > 0 && (
                    <p>
                      <strong>{aiReasoning.matched_controls.length}</strong> controles relacionados encontrados
                    </p>
                  )}
                  {aiReasoning.matched_policies?.length > 0 && (
                    <p>
                      <strong>{aiReasoning.matched_policies.length}</strong> políticas relacionadas
                    </p>
                  )}
                  {aiReasoning.evidence_count > 0 && (
                    <p>
                      <strong>{aiReasoning.evidence_count}</strong> evidências vinculadas
                    </p>
                  )}
                  {aiReasoning.library_match && (
                    <p className="text-green-600 dark:text-green-400">
                      ✓ Resposta baseada na biblioteca de respostas
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Evidence Links */}
          {question.evidence_links && question.evidence_links.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evidências Vinculadas
              </Label>
              <div className="mt-2 space-y-2">
                {question.evidence_links.map((link, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => window.open(link, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{link.split('/').pop()}</span>
                    <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Answer Editor */}
          <div>
            <Label className="text-sm font-medium">Resposta</Label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Digite ou edite a resposta..."
              className="mt-2 min-h-[200px]"
            />
          </div>

          {/* Reviewer Notes */}
          <div>
            <Label className="text-sm font-medium">Notas do Revisor</Label>
            <Textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Adicione notas sobre a revisão..."
              className="mt-2 min-h-[80px]"
            />
          </div>

          {/* Confidence Score */}
          {question.confidence_score !== null && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Confiança da IA</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        question.confidence_score >= 80 
                          ? 'bg-green-500' 
                          : question.confidence_score >= 60 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${question.confidence_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono">{question.confidence_score}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-4 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSave('not_applicable')}
            disabled={isUpdating}
          >
            <Ban className="h-4 w-4 mr-2" />
            N/A
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSave('reviewed')}
            disabled={isUpdating}
          >
            Salvar Revisado
          </Button>
        </div>
        <Button
          className="w-full"
          onClick={() => handleSave('approved')}
          disabled={isUpdating}
        >
          <Check className="h-4 w-4 mr-2" />
          Aprovar
        </Button>
      </div>
    </div>
  );
}
