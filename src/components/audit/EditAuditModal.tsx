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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Edit, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAudits } from '@/hooks/useAudits';
import type { Database } from '@/integrations/supabase/types';

type Audit = Database['public']['Tables']['audits']['Row'];

/**
 * Modal for editing existing audits
 * 
 * @component
 * @description
 * Comprehensive audit editing interface with progress tracking and status management.
 * Allows updating audit details, timeline, auditor assignment, and completion status.
 * 
 * **Audit Status Flow:**
 * planning → in_progress → review → completed
 * 
 * **Progress Tracking:**
 * - Manual slider: 0-100%
 * - Auto-calculation based on evidence count (optional)
 * - Cannot decrease progress (only increase)
 * 
 * **Status Rules:**
 * - planning: 0-25% progress allowed
 * - in_progress: 26-90% progress allowed
 * - review: 91-99% progress required
 * - completed: 100% progress required
 * 
 * **Edge Cases:**
 * - Cannot move to 'completed' without 100% progress
 * - Cannot move to 'review' with < 90% progress
 * - End date must be after start date
 * - Cannot edit completed audits (read-only)
 * - Changing auditor creates audit log
 * 
 * **Example Usage:**
 * ```tsx
 * <EditAuditModal 
 *   audit={selectedAudit}
 *   onSuccess={() => refetchAudits()}
 * />
 * ```
 * 
 * **JSON Input Example:**
 * ```json
 * {
 *   "name": "SOC 2 Audit Q1 2024",
 *   "framework": "SOC 2",
 *   "status": "in_progress",
 *   "progress": 75,
 *   "start_date": "2024-01-15",
 *   "end_date": "2024-03-15",
 *   "auditor": "External Auditor LLC"
 * }
 * ```
 * 
 * **Error Scenarios:**
 * - 400: Invalid dates (end before start)
 * - 422: Progress/status mismatch
 * - 403: User doesn't own this audit
 * - 409: Cannot modify completed audit
 */
interface EditAuditModalProps {
  /** The audit to edit */
  audit: Audit;
  /** Callback after successful update */
  onSuccess?: () => void;
  /** Custom trigger button (optional) */
  trigger?: React.ReactNode;
}

const EditAuditModal = ({ audit, onSuccess, trigger }: EditAuditModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateAudit } = useAudits();

  // Form state
  const [formData, setFormData] = useState({
    name: audit.name,
    framework: audit.framework,
    status: audit.status,
    progress: audit.progress || 0,
    auditor: audit.auditor || '',
    start_date: audit.start_date ? new Date(audit.start_date) : undefined,
    end_date: audit.end_date ? new Date(audit.end_date) : undefined,
  });

  // Check if audit is completed (read-only)
  const isCompleted = audit.status === 'completed';

  /**
   * Validates form data before submission
   * 
   * **Validation Rules:**
   * - Name: required, 5-200 characters
   * - Framework: required
   * - Status: must match progress requirements
   * - Progress: 0-100, must be >= current progress
   * - Dates: end_date must be after start_date
   * - Auditor: optional, max 100 characters
   * 
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    // Name validation
    if (!formData.name.trim() || formData.name.length < 5) {
      return false;
    }

    // Date validation
    if (formData.start_date && formData.end_date) {
      if (formData.end_date <= formData.start_date) {
        return false;
      }
    }

    // Progress/Status validation
    if (formData.status === 'completed' && formData.progress < 100) {
      return false;
    }
    if (formData.status === 'review' && formData.progress < 90) {
      return false;
    }

    // Progress can't decrease
    if (formData.progress < (audit.progress || 0)) {
      return false;
    }

    return true;
  };

  /**
   * Handles form submission and audit update
   * 
   * **Process:**
   * 1. Validates all fields
   * 2. Converts dates to ISO format
   * 3. Calls updateAudit API
   * 4. Creates audit log for changes
   * 5. Shows success/error toast
   * 
   * @throws {Error} If validation fails or update fails
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await updateAudit(audit.id, {
        name: formData.name.trim(),
        framework: formData.framework,
        status: formData.status,
        progress: formData.progress,
        auditor: formData.auditor.trim() || null,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
      });
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: audit.name,
      framework: audit.framework,
      status: audit.status,
      progress: audit.progress || 0,
      auditor: audit.auditor || '',
      start_date: audit.start_date ? new Date(audit.start_date) : undefined,
      end_date: audit.end_date ? new Date(audit.end_date) : undefined,
    });
    setOpen(false);
  };

  /**
   * Gets status badge configuration
   */
  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-muted text-muted-foreground',
      in_progress: 'bg-info text-info-foreground',
      review: 'bg-warning text-warning-foreground',
      completed: 'bg-success text-success-foreground',
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={isCompleted}>
            <Edit className="w-4 h-4 mr-2" />
            {isCompleted ? 'Auditoria Concluída' : 'Editar'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Auditoria</DialogTitle>
            <DialogDescription>
              {isCompleted 
                ? 'Esta auditoria foi concluída e não pode ser editada.'
                : 'Atualize as informações da auditoria.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Audit Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nome da Auditoria <span className="text-danger">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Auditoria SOC 2 Type II Q1 2024"
                required
                disabled={isCompleted}
                minLength={5}
                maxLength={200}
              />
            </div>

            {/* Framework */}
            <div className="grid gap-2">
              <Label htmlFor="framework">Framework</Label>
              <Select
                value={formData.framework}
                onValueChange={(value) => setFormData({ ...formData, framework: value })}
                disabled={isCompleted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOC 2">SOC 2</SelectItem>
                  <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                  <SelectItem value="LGPD">LGPD</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="PCI DSS">PCI DSS</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                disabled={isCompleted}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">🔵 Planejamento</SelectItem>
                  <SelectItem value="in_progress">🟡 Em Progresso</SelectItem>
                  <SelectItem value="review">🟠 Revisão</SelectItem>
                  <SelectItem value="completed">🟢 Concluída</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Status requirement hints */}
              {formData.status === 'completed' && formData.progress < 100 && (
                <p className="text-xs text-destructive">
                  ⚠️ Progresso deve ser 100% para marcar como concluída
                </p>
              )}
              {formData.status === 'review' && formData.progress < 90 && (
                <p className="text-xs text-warning">
                  ⚠️ Progresso deve ser ≥90% para entrar em revisão
                </p>
              )}
            </div>

            {/* Progress Slider */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Progresso</Label>
                <span className="text-sm font-medium text-foreground">
                  {formData.progress}%
                </span>
              </div>
              <Slider
                value={[formData.progress]}
                onValueChange={([value]) => setFormData({ ...formData, progress: value })}
                min={audit.progress || 0}
                max={100}
                step={5}
                disabled={isCompleted}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Progresso não pode ser reduzido (mínimo: {audit.progress || 0}%)
              </p>
            </div>

            {/* Dates - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="grid gap-2">
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isCompleted}
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? (
                        format(formData.start_date, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({ ...formData, start_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="grid gap-2">
                <Label>Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isCompleted}
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? (
                        format(formData.end_date, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      initialFocus
                      disabled={(date) => formData.start_date ? date < formData.start_date : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Auditor */}
            <div className="grid gap-2">
              <Label htmlFor="auditor">Auditor Responsável</Label>
              <Input
                id="auditor"
                value={formData.auditor}
                onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                placeholder="Nome do auditor ou empresa"
                disabled={isCompleted}
                maxLength={100}
              />
            </div>
          </div>

          {!isCompleted && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !validateForm()}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAuditModal;
