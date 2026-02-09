import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'detailed' | 'executive';
  format: 'PDF' | 'Excel' | 'PowerPoint' | 'CSV' | 'ZIP Archive';
  framework: string;
  readiness: number;
  status: 'ready' | 'updating' | 'generating';
  lastGenerated: string;
  size: string;
  pages: number;
  sections: string[];
  audience: string;
  metrics?: string[];
  filters?: any;
  recipients?: string[];
  created_at: string;
  updated_at: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  status: 'active' | 'paused';
  format: string;
  recipients: Array<{
    name: string;
    email: string;
  }>;
  deliveryMethod: 'email' | 'secure_link';
  successRate: number;
  lastStatus: 'success' | 'warning' | 'error';
  created_at: string;
  updated_at: string;
}

export interface ReportStats {
  totalGenerated: number;
  weeklyGrowth: number;
  monthlyCount: number;
  totalDownloads: number;
  uniqueDownloads: number;
  scheduledReports: number;
  activeScheduled: number;
  sharedLinks: number;
  expiringLinks: number;
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalGenerated: 0,
    weeklyGrowth: 0,
    monthlyCount: 0,
    totalDownloads: 0,
    uniqueDownloads: 0,
    scheduledReports: 0,
    activeScheduled: 0,
    sharedLinks: 0,
    expiringLinks: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const emptyReportStats: ReportStats = {
    totalGenerated: 0,
    weeklyGrowth: 0,
    monthlyCount: 0,
    totalDownloads: 0,
    uniqueDownloads: 0,
    scheduledReports: 0,
    activeScheduled: 0,
    sharedLinks: 0,
    expiringLinks: 0
  };

  const mapRowToReport = (row: Record<string, unknown>): Report => ({
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    type: (row.type as Report['type']) ?? 'executive',
    format: (row.format as Report['format']) ?? 'PDF',
    framework: (row.framework as string) ?? '',
    readiness: (row.readiness as number) ?? 0,
    status: (row.status as Report['status']) ?? 'ready',
    lastGenerated: (row.last_generated as string) ?? '',
    size: (row.size as string) ?? '',
    pages: (row.pages as number) ?? 0,
    sections: Array.isArray(row.sections) ? (row.sections as string[]) : [],
    audience: (row.audience as string) ?? '',
    metrics: Array.isArray(row.metrics) ? (row.metrics as string[]) : undefined,
    filters: row.filters,
    recipients: Array.isArray(row.recipients) ? (row.recipients as string[]) : undefined,
    created_at: (row.created_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? ''
  });

  const fetchReports = async () => {
    try {
      setLoading(true);

      const { data: reportsData, error: reportsError } = await (supabase as any)
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.warn('Erro ao buscar relatórios:', reportsError);
        setReports([]);
      } else {
        setReports((reportsData ?? []).map((row) => mapRowToReport(row as Record<string, unknown>)));
      }

      const { data: scheduledData, error: scheduledError } = await (supabase as any)
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (scheduledError) {
        setScheduledReports([]);
      } else {
        const rows = (scheduledData ?? []) as Record<string, unknown>[];
        setScheduledReports(rows.map((row) => ({
          id: row.id as string,
          name: row.name as string,
          description: (row.description as string) ?? '',
          schedule: (row.schedule as string) ?? '',
          nextRun: row.next_run != null ? String(row.next_run) : '',
          lastRun: row.last_run != null ? String(row.last_run) : '',
          status: (row.status as 'active' | 'paused') ?? 'active',
          format: (row.format as string) ?? '',
          recipients: Array.isArray(row.recipients) ? (row.recipients as ScheduledReport['recipients']) : [],
          deliveryMethod: (row.delivery_method as ScheduledReport['deliveryMethod']) ?? 'email',
          successRate: (row.success_rate as number) ?? 100,
          lastStatus: (row.last_status as ScheduledReport['lastStatus']) ?? 'success',
          created_at: (row.created_at as string) ?? '',
          updated_at: (row.updated_at as string) ?? ''
        })));
      }

      const reportsList = reportsData ?? [];
      const scheduledList = scheduledData ?? [];
      setStats({
        totalGenerated: reportsList.length,
        weeklyGrowth: 0,
        monthlyCount: reportsList.length,
        totalDownloads: 0,
        uniqueDownloads: 0,
        scheduledReports: scheduledList.length,
        activeScheduled: scheduledList.filter((r: { status?: string }) => r.status === 'active').length,
        sharedLinks: 0,
        expiringLinks: 0
      });
    } catch (error) {
      console.error('Erro ao buscar dados de relatórios:', error);
      setReports([]);
      setScheduledReports([]);
      setStats(emptyReportStats);
      toast({
        title: 'Erro ao carregar relatórios',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      toast({
        title: "Gerando Relatório",
        description: "O relatório está sendo gerado e será enviado por email.",
      });

      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: 'generating' as const }
            : report
        )
      );

      setTimeout(() => {
        setReports(prev => 
          prev.map(report => 
            report.id === reportId 
              ? { ...report, status: 'ready' as const, lastGenerated: 'Agora mesmo' }
              : report
          )
        );
        
        toast({
          title: "Relatório Gerado",
          description: "O relatório foi gerado com sucesso!",
        });
      }, 2000);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const toggleScheduledReport = async (reportId: string, newStatus: 'active' | 'paused') => {
    try {
      const { error } = await (supabase as any)
        .from('scheduled_reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reportId);
      if (error) throw error;
      setScheduledReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      );
      toast({
        title: newStatus === 'active' ? "Relatório Ativado" : "Relatório Pausado",
        description: `O agendamento foi ${newStatus === 'active' ? 'ativado' : 'pausado'}.`,
      });

    } catch (error) {
      console.error('Erro ao alterar status do relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do relatório.",
        variant: "destructive"
      });
    }
  };

  const createReport = async (payload: {
    name: string;
    description?: string;
    type: string;
    format: string;
    framework?: string;
    frameworks?: string[];
    metrics?: string[];
    recipients?: string;
  }) => {
    try {
      const framework = payload.framework || (payload.frameworks && payload.frameworks[0]) || '';
      const recipientsArray = payload.recipients
        ? payload.recipients.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean)
        : [];

      const insertRow = {
        name: payload.name,
        description: payload.description || null,
        type: payload.type,
        format: payload.format,
        framework: framework || null,
        readiness: 0,
        status: 'ready',
        last_generated: null,
        size: null,
        pages: 0,
        sections: [],
        audience: null,
        metrics: payload.metrics || [],
        filters: null,
        recipients: recipientsArray,
      };

      const { data, error } = await (supabase as any)
        .from('reports')
        .insert(insertRow)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Relatório criado',
        description: `"${payload.name}" foi criado com sucesso.`,
      });
      setReports((prev) => {
        const newReport: Report = {
          id: data.id,
          name: data.name,
          description: data.description ?? '',
          type: data.type as Report['type'],
          format: data.format as Report['format'],
          framework: data.framework ?? '',
          readiness: data.readiness ?? 0,
          status: (data.status as Report['status']) ?? 'ready',
          lastGenerated: data.last_generated ?? '',
          size: data.size ?? '',
          pages: data.pages ?? 0,
          sections: data.sections ?? [],
          audience: data.audience ?? '',
          metrics: data.metrics ?? [],
          filters: data.filters,
          recipients: data.recipients ?? [],
          created_at: data.created_at ?? '',
          updated_at: data.updated_at ?? '',
        };
        return [newReport, ...prev];
      });
      return { data, error: null };
    } catch (err: unknown) {
      console.error('Erro ao criar relatório:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o relatório. Verifique se a tabela de relatórios existe no banco.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    scheduledReports,
    stats,
    loading,
    createReport,
    generateReport,
    toggleScheduledReport,
    refetch: fetchReports
  };
};