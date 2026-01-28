import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft } from 'lucide-react';
import { useJobsStats } from '@/hooks/useJobsStats';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JobsStatsCards from '@/components/jobs/JobsStatsCards';
import JobsProcessedChart from '@/components/jobs/JobsProcessedChart';
import JobsTable from '@/components/jobs/JobsTable';

const Jobs = () => {
  const navigate = useNavigate();
  const { isAdmin, isMasterAdmin, loading: rolesLoading } = useUserRoles();
  const { data: stats, isLoading: statsLoading } = useJobsStats();

  // Access control - only admins can view this page
  useEffect(() => {
    if (!rolesLoading && !isAdmin() && !isMasterAdmin()) {
      toast.error('Acesso negado', {
        description: 'Você não tem permissão para acessar esta página.'
      });
      navigate('/');
    }
  }, [rolesLoading, isAdmin, isMasterAdmin, navigate]);

  const handleProcessQueue = async () => {
    try {
      const { error } = await supabase.functions.invoke('process-job-queue');
      if (error) throw error;
      toast.success('Processamento iniciado', {
        description: 'A fila de jobs está sendo processada.'
      });
    } catch (error: any) {
      toast.error('Erro ao processar fila', {
        description: error.message
      });
    }
  };

  if (rolesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Jobs & Background Tasks</h1>
              <p className="text-muted-foreground">
                Gerencie a fila de processamento assíncrono
              </p>
            </div>
          </div>
          <Button onClick={handleProcessQueue}>
            <Play className="h-4 w-4 mr-2" />
            Processar Fila
          </Button>
        </div>

        {/* Stats Cards */}
        <JobsStatsCards stats={stats} isLoading={statsLoading} />

        {/* Chart */}
        <JobsProcessedChart data={stats?.hourlyData} isLoading={statsLoading} />

        {/* Jobs Table */}
        <JobsTable />
      </div>
    </MainLayout>
  );
};

export default Jobs;
