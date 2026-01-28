import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Job, formatJobType, getJobStatusColor } from '@/hooks/useJobQueue';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JobDetailsModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityLabels: Record<number, string> = {
  1: 'Urgente',
  2: 'Alta',
  3: 'Normal',
  4: 'Baixa',
  5: 'Mínima'
};

const JobDetailsModal = ({ job, open, onOpenChange }: JobDetailsModalProps) => {
  if (!job) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Job
            <Badge className={getJobStatusColor(job.status)}>
              {job.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{job.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{formatJobType(job.job_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prioridade</p>
                <p className="font-medium">{priorityLabels[job.priority] || job.priority}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tentativas</p>
                <p className="font-medium">{job.attempts} / {job.max_attempts}</p>
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="text-sm">{formatDate(job.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendado para</p>
                <p className="text-sm">{formatDate(job.scheduled_for)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Iniciado em</p>
                <p className="text-sm">{formatDate(job.started_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluído em</p>
                <p className="text-sm">{formatDate(job.completed_at)}</p>
              </div>
            </div>

            {job.error_message && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Erro</p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive font-mono whitespace-pre-wrap">
                      {job.error_message}
                    </p>
                  </div>
                  {job.last_error_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Último erro: {formatDistanceToNow(new Date(job.last_error_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Payload */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Payload</p>
              <pre className="bg-muted rounded-lg p-3 text-sm font-mono overflow-x-auto">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </div>

            {/* Result */}
            {job.result && Object.keys(job.result).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Resultado</p>
                  <pre className="bg-success/10 border border-success/20 rounded-lg p-3 text-sm font-mono overflow-x-auto">
                    {JSON.stringify(job.result, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {/* Metadata */}
            {job.metadata && Object.keys(job.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                  <pre className="bg-muted rounded-lg p-3 text-sm font-mono overflow-x-auto">
                    {JSON.stringify(job.metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;
