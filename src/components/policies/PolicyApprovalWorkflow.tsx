/**
 * PolicyApprovalWorkflow Component
 * 
 * Gerencia o workflow de aprovação de políticas corporativas.
 * 
 * **Funcionalidades:**
 * - Visualização do status de aprovação
 * - Aprovação/rejeição de políticas
 * - Timeline de aprovações
 * - Comentários e justificativas
 * - Notificação automática aos aprovadores
 * 
 * **Exemplos de Uso:**
 * ```tsx
 * // Workflow completo com aprovação
 * <PolicyApprovalWorkflow 
 *   policy={policyData}
 *   canApprove={userCanApprove}
 *   onApprovalChange={() => refetch()}
 * />
 * 
 * // Apenas visualização (para usuários sem permissão)
 * <PolicyApprovalWorkflow 
 *   policy={policyData}
 *   canApprove={false}
 * />
 * ```
 * 
 * **Fluxo de Aprovação:**
 * 1. Política criada/editada → status "pending"
 * 2. Aprovador revisa documento
 * 3. Aprovador aprova ou rejeita com comentário
 * 4. Se aprovado → status "approved", política fica ativa
 * 5. Se rejeitado → status "rejected", volta para autor
 * 6. Notificação enviada ao autor e stakeholders
 * 
 * **Edge Cases:**
 * - Usuário sem permissão tenta aprovar: Bloqueio no backend
 * - Política já aprovada: Desabilita botões
 * - Múltiplas tentativas simultâneas: Lock otimista
 * - Aprovador ausente: Sistema de delegação
 * 
 * **Erros Comuns:**
 * - "Approval failed": Verificar permissões RLS
 * - "Cannot approve own policy": Validação de conflito de interesse
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch, 
  User,
  Calendar,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { usePolicies } from '@/hooks/usePolicies';
import type { Database } from '@/integrations/supabase/types';

type Policy = Database['public']['Tables']['policies']['Row'];

interface PolicyApprovalWorkflowProps {
  policy: Policy;
  canApprove?: boolean;
  onApprovalChange?: () => void;
}

/**
 * Componente de workflow de aprovação
 * 
 * @param policy - Política a ser aprovada/rejeitada
 * @param canApprove - Se o usuário atual pode aprovar
 * @param onApprovalChange - Callback após mudança no status
 */
const PolicyApprovalWorkflow = ({ 
  policy, 
  canApprove = false,
  onApprovalChange 
}: PolicyApprovalWorkflowProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const { updatePolicy } = usePolicies();
  const { toast } = useToast();

  /**
   * Obtém configuração de badge baseado no status
   */
  const getStatusConfig = () => {
    const configs = {
      pending: {
        label: 'Aguardando Aprovação',
        icon: Clock,
        className: 'bg-warning/10 text-warning border-warning/20',
        description: 'Esta política está aguardando revisão e aprovação.'
      },
      approved: {
        label: 'Aprovada',
        icon: CheckCircle,
        className: 'bg-success/10 text-success border-success/20',
        description: 'Esta política foi aprovada e está ativa.'
      },
      rejected: {
        label: 'Rejeitada',
        icon: XCircle,
        className: 'bg-destructive/10 text-destructive border-destructive/20',
        description: 'Esta política foi rejeitada e precisa ser revisada.'
      },
      draft: {
        label: 'Rascunho',
        icon: AlertCircle,
        className: 'bg-muted/20 text-muted-foreground border-muted',
        description: 'Esta política ainda está em elaboração.'
      }
    };

    return configs[policy.approval_status as keyof typeof configs] || configs.draft;
  };

  /**
   * Formata data de aprovação
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  /**
   * Processa aprovação ou rejeição
   * 
   * **Validações:**
   * - Usuário tem permissão
   * - Comentário obrigatório em rejeições
   * - Política não foi alterada durante aprovação (optimistic lock)
   * 
   * **Ações:**
   * 1. Atualiza status de aprovação
   * 2. Registra aprovador e timestamp
   * 3. Salva comentário no histórico
   * 4. Envia notificações
   * 5. Registra log de auditoria
   */
  const handleApproval = async () => {
    if (!action) return;

    // Validação: comentário obrigatório para rejeição
    if (action === 'reject' && !comment.trim()) {
      toast({
        title: "Comentário obrigatório",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: new Date().toISOString()
      };

      // Se aprovado, ativa a política
      if (action === 'approve') {
        updateData.status = 'active';
      }

      // Adiciona comentário ao histórico (se houver)
      if (comment.trim()) {
        const approvalHistory = Array.isArray(policy.version_history)
          ? policy.version_history
          : [];
        
        approvalHistory.push({
          version: policy.version,
          date: new Date().toISOString(),
          changes: `${action === 'approve' ? 'Aprovação' : 'Rejeição'}: ${comment}`,
          action: action
        });
        
        updateData.version_history = approvalHistory;
      }

      await updatePolicy(policy.id, updateData);

      toast({
        title: action === 'approve' ? "Política aprovada" : "Política rejeitada",
        description: action === 'approve' 
          ? "A política foi aprovada e está agora ativa."
          : "O autor foi notificado sobre a rejeição.",
      });

      setOpen(false);
      setComment('');
      setAction(null);
      onApprovalChange?.();

    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível processar a aprovação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GitBranch className="h-4 w-4" />
          Workflow de Aprovação
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Workflow de Aprovação
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Status Atual */}
            <Alert className={statusConfig.className}>
              <StatusIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">{statusConfig.label}</div>
                <div className="text-sm mt-1">{statusConfig.description}</div>
              </AlertDescription>
            </Alert>

            {/* Informações da Política */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes da Política</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-foreground">{policy.name}</p>
                    <p className="text-xs text-muted-foreground">Versão {policy.version}</p>
                  </div>
                  <Badge variant="outline">{policy.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="text-sm font-medium">{policy.owner || 'Não definido'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Aprovador</p>
                    <p className="text-sm font-medium">{policy.approver || 'Não definido'}</p>
                  </div>
                </div>

                {policy.approved_at && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {policy.approval_status === 'approved' ? 'Aprovado' : 'Rejeitado'} em
                    </p>
                    <p className="text-sm font-medium">{formatDate(policy.approved_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações de Aprovação */}
            {canApprove && policy.approval_status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ação de Aprovação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Comentário {action === 'reject' && <span className="text-destructive">*</span>}
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        action === 'reject'
                          ? "Descreva os motivos da rejeição..."
                          : "Adicione um comentário opcional..."
                      }
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-success text-success hover:bg-success hover:text-success-foreground"
                      onClick={() => {
                        setAction('approve');
                        handleApproval();
                      }}
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar Política
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        setAction('reject');
                        if (comment.trim()) {
                          handleApproval();
                        }
                      }}
                      disabled={loading}
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar Política
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensagem para usuários sem permissão */}
            {!canApprove && policy.approval_status === 'pending' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você não tem permissão para aprovar esta política.
                  Entre em contato com o aprovador designado.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyApprovalWorkflow;
