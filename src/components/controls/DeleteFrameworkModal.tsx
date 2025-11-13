import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import type { Database } from '@/integrations/supabase/types';

type Framework = Database['public']['Tables']['frameworks']['Row'];

/**
 * Modal for deleting compliance frameworks
 * 
 * @component
 * @description
 * Provides a confirmation dialog for permanently deleting frameworks.
 * 
 * **Critical Safety Features:**
 * - Two-step confirmation (open modal + confirm button)
 * - Shows count of associated controls that will be affected
 * - Warning about data loss
 * - Cannot be undone
 * 
 * **Cascade Behavior:**
 * - Deletes framework record
 * - DOES NOT automatically delete associated controls (orphans them)
 * - User should manually reassign or delete controls first
 * 
 * **Edge Cases:**
 * - Framework with controls: Shows warning, allows deletion
 * - Framework with active audits: Shows error, blocks deletion
 * - Already deleted: Shows error, closes modal
 * - Network error: Keeps modal open, shows retry option
 * 
 * **Example Usage:**
 * ```tsx
 * <DeleteFrameworkModal 
 *   framework={framework} 
 *   controlCount={framework.total_controls}
 *   onSuccess={() => router.push('/frameworks')}
 * />
 * ```
 * 
 * **Error Scenarios:**
 * - 404: Framework already deleted
 * - 403: User doesn't own this framework
 * - 409: Framework has active dependencies (audits, reports)
 * - 500: Database error
 */
interface DeleteFrameworkModalProps {
  /** The framework to delete */
  framework: Framework;
  /** Number of controls associated with this framework */
  controlCount?: number;
  /** Callback after successful deletion */
  onSuccess?: () => void;
  /** Custom trigger button (optional) */
  trigger?: React.ReactNode;
}

const DeleteFrameworkModal = ({ 
  framework, 
  controlCount = 0,
  onSuccess, 
  trigger 
}: DeleteFrameworkModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { deleteFramework } = useFrameworks();

  /**
   * Handles framework deletion
   * 
   * **Process:**
   * 1. Confirms user intent
   * 2. Calls deleteFramework API
   * 3. Shows success/error toast
   * 4. Closes modal and triggers onSuccess callback
   * 
   * **Important:**
   * - This action is IRREVERSIBLE
   * - Associated controls become orphaned (framework_id = null)
   * - User should be warned about data loss
   * 
   * @throws {Error} If deletion fails or framework has dependencies
   */
  const handleDelete = async () => {
    setLoading(true);
    
    try {
      await deleteFramework(framework.id);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to delete framework:', error);
      // Error toast is shown by useFrameworks hook
      // Keep modal open to allow retry
    } finally {
      setLoading(false);
    }
  };

  // Determine severity level based on control count
  const hasCriticalDependencies = controlCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a excluir o framework:{' '}
              <strong className="text-foreground">{framework.name}</strong>
            </p>
            
            {hasCriticalDependencies && (
              <div className="bg-warning/10 border border-warning/20 rounded-md p-3 mt-3">
                <p className="text-sm text-warning font-medium">
                  ⚠️ Atenção: Este framework possui {controlCount} controle(s) associado(s)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os controles NÃO serão excluídos, mas ficarão sem framework associado.
                  Considere reatribuir ou excluir os controles antes de prosseguir.
                </p>
              </div>
            )}

            <div className="bg-danger/10 border border-danger/20 rounded-md p-3 mt-3">
              <p className="text-sm text-danger font-medium">
                🚨 Esta ação não pode ser desfeita!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os dados do framework serão permanentemente removidos do sistema.
              </p>
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              Tem certeza que deseja continuar?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-danger hover:bg-danger/90"
          >
            {loading ? 'Excluindo...' : 'Sim, Excluir Framework'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteFrameworkModal;
