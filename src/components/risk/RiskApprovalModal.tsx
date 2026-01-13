import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RiskAcceptance } from '@/hooks/useRiskAcceptances';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface RiskApprovalModalProps {
  acceptance: RiskAcceptance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DURATION_LABELS: Record<string, string> = {
  '3_months': '3 meses',
  '6_months': '6 meses',
  '1_year': '1 ano',
  'permanent': 'Permanente',
};

export function RiskApprovalModal({ acceptance, open, onOpenChange }: RiskApprovalModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!acceptance) return null;

  const handleApprove = async () => {
    if (!user?.id) return;
    
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('risk_acceptances')
        .update({
          approval_status: 'approved',
          approver_id: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', acceptance.id);

      if (error) throw error;

      // Log to audit
      await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action_type: 'risk_acceptance_approved',
        action_category: 'compliance',
        resource_type: 'risk_acceptance',
        resource_id: acceptance.id,
        description: `Exceção de risco aprovada: ${acceptance.ruleId}`,
        metadata: {
          rule_id: acceptance.ruleId,
          accepted_by: acceptance.acceptedBy,
          duration: acceptance.duration,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['risk-acceptances'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      
      toast({
        title: 'Exceção aprovada',
        description: 'A exceção de risco foi aprovada e está ativa.',
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id || !rejectionReason.trim()) return;
    
    setIsRejecting(true);
    try {
      const { error } = await supabase
        .from('risk_acceptances')
        .update({
          approval_status: 'rejected',
          approver_id: user.id,
          rejection_reason: rejectionReason.trim(),
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', acceptance.id);

      if (error) throw error;

      // Log to audit
      await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action_type: 'risk_acceptance_rejected',
        action_category: 'compliance',
        resource_type: 'risk_acceptance',
        resource_id: acceptance.id,
        description: `Exceção de risco rejeitada: ${acceptance.ruleId}`,
        metadata: {
          rule_id: acceptance.ruleId,
          accepted_by: acceptance.acceptedBy,
          rejection_reason: rejectionReason.trim(),
        },
      });

      queryClient.invalidateQueries({ queryKey: ['risk-acceptances'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      
      toast({
        title: 'Exceção rejeitada',
        description: 'A solicitação foi rejeitada e o item voltará a aparecer como falha.',
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    setShowRejectForm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>Solicitação de Exceção de Risco</DialogTitle>
          </div>
          <DialogDescription>
            Revise os detalhes e decida sobre esta solicitação.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4 pr-4">
            {/* Rule Info */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-semibold text-sm mb-2">Regra Afetada</h4>
              <p className="text-sm text-foreground">{acceptance.ruleId}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{acceptance.integrationName}</Badge>
                <Badge variant="secondary">{acceptance.resourceType}</Badge>
              </div>
            </div>

            <Separator />

            {/* Request Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Solicitado por:</span>
                <span className="font-medium">{acceptance.acceptedBy}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duração:</span>
                <Badge>{DURATION_LABELS[acceptance.duration] || acceptance.duration}</Badge>
              </div>

              {acceptance.expiresAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expira em:</span>
                  <span className="font-medium">
                    {new Date(acceptance.expiresAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Justification */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Justificativa</h4>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                {acceptance.justification}
              </div>
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">
                    Motivo da Rejeição <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Explique por que esta exceção não pode ser aprovada..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          {showRejectForm ? (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowRejectForm(false)}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowRejectForm(true)}
                className="border-red-500/30 text-red-600 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isApproving ? 'Aprovando...' : 'Aprovar Exceção'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
