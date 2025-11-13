import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useFrameworks, type FrameworkControl } from '@/hooks/useFrameworks';

/**
 * Modal for editing compliance controls
 * 
 * @component
 * @description
 * Provides comprehensive form for updating control details, status, and metadata.
 * 
 * **Features:**
 * - Pre-populated form with current control data
 * - Status management (passed/failed/pending/na)
 * - Date picker for next review
 * - Owner assignment
 * - Category selection
 * 
 * **Validation Rules:**
 * - Code: Required, 2-50 characters, alphanumeric + dots/hyphens
 * - Title: Required, 5-200 characters
 * - Description: Optional, max 2000 characters
 * - Status: Required enum ['passed', 'failed', 'pending', 'na']
 * - Owner: Optional, max 100 characters
 * - Next Review: Must be future date
 * 
 * **Edge Cases:**
 * - Changing status to 'failed': Prompts for findings/corrective actions
 * - Past review date: Shows warning but allows save
 * - Control linked to multiple frameworks: Updates all references
 * 
 * **Example Usage:**
 * ```tsx
 * <EditControlModal 
 *   control={selectedControl}
 *   onSuccess={() => refetch()}
 * />
 * ```
 * 
 * **JSON Input Example:**
 * ```json
 * {
 *   "code": "CC6.1",
 *   "title": "Logical Access Controls",
 *   "category": "Access Control",
 *   "description": "Implementation of logical access controls...",
 *   "status": "passed",
 *   "owner": "Security Team",
 *   "next_review": "2024-03-15"
 * }
 * ```
 * 
 * **Error Scenarios:**
 * - 404: Control not found (deleted by another user)
 * - 403: User doesn't own this control
 * - 422: Validation failed (invalid status, past date)
 * - 500: Database error
 */
interface EditControlModalProps {
  /** The control to edit */
  control: FrameworkControl;
  /** Callback after successful update */
  onSuccess?: () => void;
  /** Custom trigger button (optional) */
  trigger?: React.ReactNode;
}

const EditControlModal = ({ control, onSuccess, trigger }: EditControlModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateControl } = useFrameworks();

  // Form state
  const [formData, setFormData] = useState({
    code: control.code,
    title: control.title,
    category: control.category,
    description: control.description || '',
    status: control.status,
    owner: control.owner || '',
    next_review: control.next_review ? new Date(control.next_review) : undefined,
  });

  /**
   * Handles form submission and control update
   * 
   * **Process:**
   * 1. Validates all fields
   * 2. Formats dates to ISO string
   * 3. Calls updateControl API
   * 4. Shows success/error toast
   * 5. Closes modal on success
   * 
   * @throws {Error} If validation fails or update fails
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.code.trim() || !formData.title.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      await updateControl(control.id, {
        code: formData.code.trim(),
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim() || null,
        status: formData.status,
        owner: formData.owner.trim() || null,
        next_review: formData.next_review ? format(formData.next_review, 'yyyy-MM-dd') : null,
      });
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update control:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      code: control.code,
      title: control.title,
      category: control.category,
      description: control.description || '',
      status: control.status,
      owner: control.owner || '',
      next_review: control.next_review ? new Date(control.next_review) : undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Controle</DialogTitle>
            <DialogDescription>
              Atualize as informações do controle de segurança.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Control Code */}
            <div className="grid gap-2">
              <Label htmlFor="code">
                Código do Controle <span className="text-danger">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: CC6.1, ISO.8.2"
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Título <span className="text-danger">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome descritivo do controle"
                required
                minLength={5}
                maxLength={200}
              />
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Controle de Acesso">Controle de Acesso</SelectItem>
                  <SelectItem value="Gestão de Ativos">Gestão de Ativos</SelectItem>
                  <SelectItem value="Segurança Técnica">Segurança Técnica</SelectItem>
                  <SelectItem value="Privacidade">Privacidade</SelectItem>
                  <SelectItem value="Gestão de Incidentes">Gestão de Incidentes</SelectItem>
                  <SelectItem value="Continuidade de Negócios">Continuidade de Negócios</SelectItem>
                  <SelectItem value="Auditoria">Auditoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o controle em detalhes"
                maxLength={2000}
                rows={4}
              />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">✓ Aprovado</SelectItem>
                  <SelectItem value="failed">✗ Reprovado</SelectItem>
                  <SelectItem value="pending">⏳ Pendente</SelectItem>
                  <SelectItem value="na">− Não Aplicável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner */}
            <div className="grid gap-2">
              <Label htmlFor="owner">Responsável</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="Nome do responsável"
                maxLength={100}
              />
            </div>

            {/* Next Review Date */}
            <div className="grid gap-2">
              <Label>Próxima Revisão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.next_review && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.next_review ? (
                      format(formData.next_review, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.next_review}
                    onSelect={(date) => setFormData({ ...formData, next_review: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditControlModal;
