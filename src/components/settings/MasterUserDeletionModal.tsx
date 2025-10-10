import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { AlertTriangle, CheckCircle2, XCircle, Clock, Shield, UserX } from 'lucide-react';

interface DeletionRequest {
  id: string;
  target_user_id: string;
  target_user_email: string;
  requested_by: string;
  requested_at: string;
  master_admin_approved_by: string | null;
  master_admin_approved_at: string | null;
  master_ti_approved_by: string | null;
  master_ti_approved_at: string | null;
  master_governance_approved_by: string | null;
  master_governance_approved_at: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejection_reason: string | null;
  notes: string | null;
}

interface MasterUserDeletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId?: string;
  targetUserEmail?: string;
  onSuccess?: () => void;
}

export default function MasterUserDeletionModal({
  open,
  onOpenChange,
  targetUserId,
  targetUserEmail,
  onSuccess
}: MasterUserDeletionModalProps) {
  const { toast } = useToast();
  const { isMasterAdmin, isMasterTI, isMasterGovernance } = useUserRoles();
  const { logAction } = useAuditLogs();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (open) {
      loadRequests();
    }
  }, [open]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_deletion_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as DeletionRequest[]);
    } catch (error: any) {
      console.error('Error loading requests:', error);
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const createDeletionRequest = async () => {
    if (!targetUserId || !targetUserEmail) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_deletion_requests')
        .insert([{
          target_user_id: targetUserId,
          target_user_email: targetUserEmail,
          requested_by: user.id,
          notes,
          status: 'pending'
        }]);

      if (error) throw error;

      await logAction(
        'create_deletion_request',
        'user_deletion_requests',
        targetUserId,
        null,
        { target_email: targetUserEmail }
      );

      toast({
        title: 'Solicitação criada',
        description: 'A solicitação de exclusão foi enviada para aprovação tripla'
      });

      setNotes('');
      loadRequests();
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: 'Erro ao criar solicitação',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string, approvalType: 'master_admin' | 'master_ti' | 'master_governance') => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateData: any = {
        [`${approvalType}_approved_by`]: user.id,
        [`${approvalType}_approved_at`]: new Date().toISOString()
      };

      const { data: request, error: fetchError } = await supabase
        .from('user_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Check if all approvals are in place after this one
      const allApprovals = {
        master_admin: request.master_admin_approved_by || (approvalType === 'master_admin' ? user.id : null),
        master_ti: request.master_ti_approved_by || (approvalType === 'master_ti' ? user.id : null),
        master_governance: request.master_governance_approved_by || (approvalType === 'master_governance' ? user.id : null)
      };

      if (allApprovals.master_admin && allApprovals.master_ti && allApprovals.master_governance) {
        updateData.status = 'approved';
        
        // Execute the deletion
        await executeUserDeletion(request.target_user_id, request.target_user_email);
        updateData.completed_at = new Date().toISOString();
        updateData.status = 'completed';
      }

      const { error } = await supabase
        .from('user_deletion_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      await logAction(
        'approve_deletion_request',
        'user_deletion_requests',
        requestId,
        null,
        { approval_type: approvalType }
      );

      toast({
        title: 'Aprovação registrada',
        description: updateData.status === 'completed' 
          ? 'Todas as aprovações foram recebidas. Usuário excluído com sucesso!'
          : 'Sua aprovação foi registrada. Aguardando outras aprovações.'
      });

      loadRequests();
      if (updateData.status === 'completed' && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: 'Erro ao aprovar solicitação',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Motivo necessário',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_deletion_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          rejected_by: user.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      await logAction(
        'reject_deletion_request',
        'user_deletion_requests',
        requestId,
        null,
        { reason: rejectionReason }
      );

      toast({
        title: 'Solicitação rejeitada',
        description: 'A solicitação de exclusão foi rejeitada'
      });

      setRejectionReason('');
      loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Erro ao rejeitar solicitação',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeUserDeletion = async (userId: string, userEmail: string) => {
    // Delete user's data from all tables
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) throw profileError;

    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) throw rolesError;

    await logAction('delete_user_via_triple_auth', 'profiles', userId, { email: userEmail }, null);
  };

  const getApprovalStatus = (request: DeletionRequest) => {
    const approvals = [
      { type: 'Admin Master', approved: !!request.master_admin_approved_by },
      { type: 'TI Master', approved: !!request.master_ti_approved_by },
      { type: 'Governança Master', approved: !!request.master_governance_approved_by }
    ];

    return approvals;
  };

  const canApprove = async (request: DeletionRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    if (isMasterAdmin() && !request.master_admin_approved_by) return true;
    if (isMasterTI() && !request.master_ti_approved_by) return true;
    if (isMasterGovernance() && !request.master_governance_approved_by) return true;

    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            Sistema de Exclusão com Autenticação Tripla
          </DialogTitle>
          <DialogDescription>
            Solicitações de exclusão de usuários requerem aprovação de 3 Master Users: Admin, TI e Governança
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new request */}
          {isMasterAdmin() && targetUserId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nova Solicitação de Exclusão</CardTitle>
                <CardDescription>Usuário: {targetUserEmail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Observações (opcional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre esta solicitação..."
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={createDeletionRequest}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Criar Solicitação de Exclusão
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pending requests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Solicitações de Exclusão</h3>
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma solicitação de exclusão pendente
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => {
                const approvals = getApprovalStatus(request);
                
                return (
                  <Card key={request.id} className="border-l-4 border-l-destructive">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Exclusão: {request.target_user_email}
                          </CardTitle>
                          <CardDescription>
                            Solicitado em: {new Date(request.requested_at).toLocaleString('pt-BR')}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'rejected' ? 'destructive' :
                            request.status === 'approved' ? 'secondary' :
                            'outline'
                          }
                        >
                          {request.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {request.status === 'completed' ? 'Concluído' :
                           request.status === 'rejected' ? 'Rejeitado' :
                           request.status === 'approved' ? 'Aprovado' : 'Pendente'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {request.notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Observações:</p>
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Status das Aprovações:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {approvals.map((approval, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border ${
                                approval.approved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {approval.approved ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-xs font-medium">{approval.type}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          {isMasterAdmin() && !request.master_admin_approved_by && (
                            <Button
                              onClick={() => approveRequest(request.id, 'master_admin')}
                              disabled={loading}
                              size="sm"
                              className="flex-1"
                            >
                              Aprovar (Admin)
                            </Button>
                          )}
                          {isMasterTI() && !request.master_ti_approved_by && (
                            <Button
                              onClick={() => approveRequest(request.id, 'master_ti')}
                              disabled={loading}
                              size="sm"
                              className="flex-1"
                            >
                              Aprovar (TI)
                            </Button>
                          )}
                          {isMasterGovernance() && !request.master_governance_approved_by && (
                            <Button
                              onClick={() => approveRequest(request.id, 'master_governance')}
                              disabled={loading}
                              size="sm"
                              className="flex-1"
                            >
                              Aprovar (Governança)
                            </Button>
                          )}
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="space-y-2">
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Motivo da rejeição..."
                            className="text-sm"
                          />
                          <Button
                            onClick={() => rejectRequest(request.id)}
                            disabled={loading || !rejectionReason.trim()}
                            variant="destructive"
                            size="sm"
                            className="w-full"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar Solicitação
                          </Button>
                        </div>
                      )}

                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm font-medium text-destructive">Motivo da Rejeição:</p>
                          <p className="text-sm">{request.rejection_reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
