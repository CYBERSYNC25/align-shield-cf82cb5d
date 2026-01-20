import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import FileUploader from '@/components/common/FileUploader';
import { Upload, FileText, Layout, Loader2, CheckCircle2 } from 'lucide-react';
import { useQuestionnaires, useQuestionnaireTemplates } from '@/hooks/useQuestionnaires';
import { useQuestionnaireQuestions } from '@/hooks/useQuestionnaireQuestions';
import { useToast } from '@/hooks/use-toast';

interface CreateQuestionnaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

const manualFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  source: z.string().min(1, 'Selecione o tipo'),
  due_date: z.string().optional(),
  requester_name: z.string().optional(),
  requester_email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type ManualFormData = z.infer<typeof manualFormSchema>;

export default function CreateQuestionnaireModal({ 
  open, 
  onOpenChange,
  onCreated 
}: CreateQuestionnaireModalProps) {
  const { create, isCreating } = useQuestionnaires();
  const { data: templates = [] } = useQuestionnaireTemplates();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<ManualFormData>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: {
      name: '',
      source: '',
      due_date: '',
      requester_name: '',
      requester_email: '',
      notes: '',
    },
  });

  const handleManualSubmit = async (data: ManualFormData) => {
    try {
      const questionnaire = await create({
        name: data.name,
        source: data.source,
        due_date: data.due_date || undefined,
        requester_name: data.requester_name || undefined,
        requester_email: data.requester_email || undefined,
        notes: data.notes || undefined,
      });
      
      form.reset();
      onCreated?.(questionnaire.id);
    } catch (error) {
      console.error('Error creating questionnaire:', error);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsProcessing(true);

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template não encontrado');

      const questionnaire = await create({
        name: template.name,
        source: template.template_type,
        notes: template.description || undefined,
      });

      // TODO: Parse template.questions_data and create questions
      // For now, just create the questionnaire
      
      onCreated?.(questionnaire.id);
    } catch (error) {
      toast({
        title: 'Erro ao criar questionário',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setSelectedTemplate(null);
    }
  };

  const handleFileUpload = async (fileUrl: string) => {
    setIsProcessing(true);

    try {
      // Extract filename for questionnaire name
      const fileName = fileUrl.split('/').pop()?.split('.')[0] || 'Questionário Importado';
      
      const questionnaire = await create({
        name: fileName,
        source: 'Custom',
        notes: `Importado de: ${fileUrl}`,
      });

      // TODO: Parse file and create questions via edge function
      toast({
        title: 'Arquivo processado',
        description: 'O questionário foi criado. O processamento das perguntas será implementado em breve.',
      });
      
      onCreated?.(questionnaire.id);
    } catch (error) {
      toast({
        title: 'Erro ao processar arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const predefinedTemplates = [
    {
      id: 'caiq-v4',
      name: 'CAIQ v4',
      description: 'Consensus Assessments Initiative Questionnaire',
      questions: 261,
      source: 'CAIQ'
    },
    {
      id: 'vsa',
      name: 'VSA Questionnaire',
      description: 'Vendor Security Alliance Questionnaire',
      questions: 180,
      source: 'VSA'
    },
    {
      id: 'sig-lite',
      name: 'SIG Lite',
      description: 'Standardized Information Gathering Lite',
      questions: 85,
      source: 'SIG'
    },
    {
      id: 'hecvat',
      name: 'HECVAT',
      description: 'Higher Education Cloud Vendor Assessment',
      questions: 156,
      source: 'HECVAT'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Questionário</DialogTitle>
          <DialogDescription>
            Crie um novo questionário de segurança a partir de um template, arquivo ou do zero.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="template" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Selecione um template padrão da indústria para começar rapidamente.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {predefinedTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedTemplate === template.id ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => !isProcessing && handleTemplateSelect(template.id)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {selectedTemplate === template.id && isProcessing && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <span className="text-xs text-muted-foreground">
                      {template.questions} perguntas
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Also show custom templates from database */}
            {templates.length > 0 && (
              <>
                <h4 className="text-sm font-medium mt-6">Seus Templates</h4>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <Card 
                      key={template.id}
                      className="cursor-pointer transition-all hover:border-primary"
                      onClick={() => !isProcessing && handleTemplateSelect(template.id)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <span className="text-xs text-muted-foreground">
                          {template.total_questions || 0} perguntas
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de um arquivo Excel, CSV ou PDF com as perguntas do questionário.
            </p>
            <FileUploader
              bucket="documents"
              accept={{
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-excel': ['.xls'],
                'text/csv': ['.csv'],
                'application/pdf': ['.pdf']
              }}
              maxSize={10 * 1024 * 1024}
              onUploadComplete={handleFileUpload}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Formatos suportados: XLSX, XLS, CSV, PDF</p>
              <p>• Para Excel/CSV: coluna "Question" ou "Pergunta" será usada</p>
              <p>• Para PDF: OCR será aplicado para extrair perguntas</p>
            </div>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Questionário *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Avaliação de Segurança - Cliente XYZ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CAIQ">CAIQ</SelectItem>
                          <SelectItem value="VSA">VSA</SelectItem>
                          <SelectItem value="SIG">SIG</SelectItem>
                          <SelectItem value="HECVAT">HECVAT</SelectItem>
                          <SelectItem value="Custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requester_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solicitante</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do solicitante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requester_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Solicitante</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre o questionário..." 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Criar Questionário
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
