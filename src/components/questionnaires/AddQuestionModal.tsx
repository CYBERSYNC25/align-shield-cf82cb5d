import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { useQuestionnaireQuestions } from '@/hooks/useQuestionnaireQuestions';

interface AddQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaireId: string;
}

const formSchema = z.object({
  question_number: z.string().min(1, 'Número é obrigatório'),
  question_text: z.string().min(10, 'Pergunta deve ter pelo menos 10 caracteres'),
  question_type: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddQuestionModal({ 
  open, 
  onOpenChange,
  questionnaireId 
}: AddQuestionModalProps) {
  const { create, isCreating, questions } = useQuestionnaireQuestions(questionnaireId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_number: '',
      question_text: '',
      question_type: 'text',
      category: '',
      subcategory: '',
    },
  });

  // Suggest next question number
  const suggestNextNumber = () => {
    if (questions.length === 0) return '1';
    const lastNumber = questions[questions.length - 1]?.question_number;
    const match = lastNumber.match(/(\d+)/);
    if (match) {
      return String(parseInt(match[1], 10) + 1);
    }
    return String(questions.length + 1);
  };

  const onSubmit = async (data: FormData) => {
    await create({
      questionnaire_id: questionnaireId,
      question_number: data.question_number,
      question_text: data.question_text,
      question_type: data.question_type,
      category: data.category || undefined,
      subcategory: data.subcategory || undefined,
    });

    form.reset({
      question_number: suggestNextNumber(),
      question_text: '',
      question_type: 'text',
      category: data.category, // Keep category for convenience
      subcategory: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Pergunta</DialogTitle>
          <DialogDescription>
            Adicione uma nova pergunta ao questionário.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="question_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1.1" 
                        {...field}
                        onFocus={() => {
                          if (!field.value) {
                            field.onChange(suggestNextNumber());
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="yes_no">Sim/Não</SelectItem>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                        <SelectItem value="scale">Escala (1-5)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="question_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pergunta *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite a pergunta..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Segurança" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Controle de Acesso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
