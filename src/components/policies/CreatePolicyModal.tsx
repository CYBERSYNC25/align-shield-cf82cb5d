/**
 * Modal para criação de novas políticas corporativas
 * 
 * @component CreatePolicyModal
 * @description
 * Formulário completo com validação Zod em tempo real para criação de políticas.
 * Valida todos os campos obrigatórios, formatos de dados e datas.
 * 
 * @example
 * ```tsx
 * <CreatePolicyModal onSuccess={() => refetchPolicies()} />
 * ```
 * 
 * @validation
 * - Nome: 3-200 caracteres
 * - Descrição: 10-2000 caracteres (opcional)
 * - Versão: formato v1.0 ou 1.0.0
 * - Datas: reviewDate > effectiveDate
 * - URL: formato https:// válido
 * - Owner/Approver: apenas letras, espaços e hífens
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePolicies } from '@/hooks/usePolicies';
import { FileText, Plus, AlertCircle } from 'lucide-react';
import FileUploader from '@/components/common/FileUploader';
import { policySchema, formatValidationErrors, type PolicyInput } from '@/lib/form-schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreatePolicyModalProps {
  onSuccess?: () => void;
}

const CreatePolicyModal = ({ onSuccess }: CreatePolicyModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createPolicy } = usePolicies();

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    version: '1.0',
    status: 'draft' as 'draft' | 'active' | 'review' | 'archived',
    owner: '',
    approver: '',
    effective_date: '',
    review_date: '',
    next_review: '',
    tags: [] as string[],
    file_url: ''
  });

  /**
   * Estado de erros de validação
   * Armazena mensagens de erro por campo para feedback visual
   */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Valida um campo individual usando Zod
   * @param field - Nome do campo a validar
   * @param value - Valor do campo
   * @returns true se válido, false se inválido
   * 
   * @example
   * validateField('name', 'Política de Segurança') // true
   * validateField('name', 'Po') // false - muito curto
   */
  const validateField = (field: string, value: any): boolean => {
    try {
      // Cria objeto parcial para validação
      const testData: any = { ...formData, [field]: value };
      
      // Converte datas string para Date se necessário
      if (field === 'effectiveDate' && testData.effectiveDate) {
        testData.effectiveDate = new Date(testData.effectiveDate);
      }
      if (field === 'reviewDate' && testData.reviewDate) {
        testData.reviewDate = new Date(testData.reviewDate);
      }
      
      policySchema.parse(testData);
      
      // Remove erro se validação passou
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      
      return true;
    } catch (error: any) {
      // Extrai mensagem de erro específica do Zod
      if (error.errors) {
        const fieldError = error.errors.find((e: any) => e.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
        }
      }
      return false;
    }
  };

  /**
   * Handler para mudança de campo com validação em tempo real
   * Valida o campo assim que o usuário digita
   * 
   * @example
   * <Input onChange={handleFieldChange('name')} />
   */
  const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Valida apenas se o campo já foi tocado ou tem conteúdo
    if (value || errors[field]) {
      validateField(field, value);
    }
  };

  /**
   * Handler para mudança de Select
   */
  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  /**
   * Submete o formulário após validação completa
   * 
   * @validation
   * - Valida todos os campos obrigatórios
   * - Bloqueia envio se houver erros
   * - Converte datas string para Date
   * 
   * @errors
   * - "Nome deve ter no mínimo 3 caracteres"
   * - "Data de revisão deve ser posterior à data de vigência"
   * - "URL de arquivo inválida"
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepara dados para validação (converte datas)
    const dataToValidate: any = {
      name: formData.name,
      description: formData.description || '',
      category: formData.category,
      version: formData.version,
      status: formData.status,
      owner: formData.owner || '',
      approver: formData.approver || '',
      effectiveDate: formData.effective_date ? new Date(formData.effective_date) : undefined,
      reviewDate: formData.review_date ? new Date(formData.review_date) : undefined,
      fileUrl: formData.file_url || ''
    };

    // Validação completa do formulário
    const result = policySchema.safeParse(dataToValidate);
    
    if (!result.success) {
      // Exibe todos os erros de validação
      const validationErrors = formatValidationErrors(result.error);
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const submitResult = await createPolicy(formData);
      
      if (submitResult) {
        // Reset completo do formulário
        setOpen(false);
        setFormData({
          name: '',
          description: '',
          category: '',
          version: '1.0',
          status: 'draft',
          owner: '',
          approver: '',
          effective_date: '',
          review_date: '',
          next_review: '',
          tags: [],
          file_url: ''
        });
        setErrors({});
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao criar política:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Política
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Criar Nova Política
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">
                  Nome da Política * 
                  <span className="text-xs text-muted-foreground ml-2">
                    (3-200 caracteres)
                  </span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleFieldChange('name')}
                  placeholder="Ex: Política de Segurança da Informação"
                  className={errors.name ? 'border-destructive' : ''}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  ✓ Válido: "Política de Segurança da Informação", "Controle de Acesso"
                </p>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">
                  Descrição
                  <span className="text-xs text-muted-foreground ml-2">
                    (10-2000 caracteres, opcional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleFieldChange('description')}
                  placeholder="Descreva o objetivo e escopo da política"
                  className={errors.description ? 'border-destructive' : ''}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="privacidade">Privacidade</SelectItem>
                    <SelectItem value="rh">Recursos Humanos</SelectItem>
                    <SelectItem value="ti">Tecnologia da Informação</SelectItem>
                    <SelectItem value="qualidade">Qualidade</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'draft' | 'active' | 'review' | 'archived') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="review">Em Revisão</SelectItem>
                    <SelectItem value="archived">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Proprietário</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder="Responsável pela política"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="approver">Aprovador</Label>
                <Input
                  id="approver"
                  value={formData.approver}
                  onChange={(e) => setFormData(prev => ({ ...prev, approver: e.target.value }))}
                  placeholder="Quem aprova a política"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective_date">Data de Vigência</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="review_date">Data de Revisão</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_review">Próxima Revisão</Label>
                <Input
                  id="next_review"
                  type="date"
                  value={formData.next_review}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_review: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Documento da Política</Label>
              <FileUploader
                bucket="documents"
                folder="policies"
                onUploadComplete={(urls) => setFormData(prev => ({ ...prev, file_url: urls[0] }))}
                multiple={false}
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Política'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePolicyModal;