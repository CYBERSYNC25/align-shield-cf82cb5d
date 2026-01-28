import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye, RotateCcw, XCircle } from 'lucide-react';
import { Job, formatJobType, getJobStatusColor, useRetryJob, useCancelJob, JobStatus, JobType } from '@/hooks/useJobQueue';
import { useFilteredJobs } from '@/hooks/useJobsStats';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import JobDetailsModal from './JobDetailsModal';

const priorityLabels: Record<number, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  1: { label: 'Urgente', variant: 'default' },
  2: { label: 'Alta', variant: 'default' },
  3: { label: 'Normal', variant: 'secondary' },
  4: { label: 'Baixa', variant: 'outline' },
  5: { label: 'Mínima', variant: 'outline' }
};

const JobsTable = () => {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Helper to cast job from DB to typed Job
  const castJob = (job: any): Job => ({
    ...job,
    job_type: job.job_type as JobType,
    status: job.status as JobStatus
  });

  const { data: jobs, isLoading, refetch } = useFilteredJobs({
    status: statusFilter,
    jobType: typeFilter,
    period: periodFilter
  });

  const retryJob = useRetryJob();
  const cancelJob = useCancelJob();

  const handleRetry = (jobId: string) => {
    retryJob.mutate(jobId);
  };

  const handleCancel = (jobId: string) => {
    cancelJob.mutate(jobId);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fila de Jobs</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? 'all' : v as JobStatus)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? 'all' : v as JobType)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                <SelectItem value="sync_integration">Sincronização</SelectItem>
                <SelectItem value="run_compliance_check">Compliance Check</SelectItem>
                <SelectItem value="generate_report">Geração de Relatório</SelectItem>
                <SelectItem value="send_notification">Notificação</SelectItem>
                <SelectItem value="cleanup_data">Limpeza de Dados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as '24h' | '7d' | '30d')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !jobs?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum job encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((dbJob) => {
                    const job = castJob(dbJob);
                    return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Badge className={getJobStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatJobType(job.job_type)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityLabels[job.priority]?.variant || 'outline'}>
                          {priorityLabels[job.priority]?.label || job.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.attempts}/{job.max_attempts}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(job.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedJob(job)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {job.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRetry(job.id)}
                              disabled={retryJob.isPending}
                              title="Tentar novamente"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {job.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(job.id)}
                              disabled={cancelJob.isPending}
                              title="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <JobDetailsModal
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      />
    </>
  );
};

export default JobsTable;
