import { useState, useCallback, useRef } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Calendar, LineChart, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

import { useAdvancedAnalytics, DateRange } from '@/hooks/useAdvancedAnalytics';
import { ComplianceScoreTimeSeries } from '@/components/analytics/ComplianceScoreTimeSeries';
import { MTTRStackedBreakdown } from '@/components/analytics/MTTRStackedBreakdown';
import { TopFailingRulesChart } from '@/components/analytics/TopFailingRulesChart';
import { ComplianceHeatmap } from '@/components/analytics/ComplianceHeatmap';
import { IntegrationHealthTimeSeries } from '@/components/analytics/IntegrationHealthTimeSeries';
import { PeriodComparisonChart } from '@/components/analytics/PeriodComparisonChart';
import { AlertsDrillDownModal } from '@/components/analytics/AlertsDrillDownModal';

const PRESETS = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 },
  { label: 'Este mês', type: 'this_month' },
  { label: 'Mês anterior', type: 'last_month' },
];

export default function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const [compareMode, setCompareMode] = useState<string>('previous');
  const [drillDownDate, setDrillDownDate] = useState<Date | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  const { 
    scoreTimeSeries, 
    annotations, 
    mttrBreakdown, 
    topFailingRules,
    heatmapData,
    integrationHealthHistory,
    periodComparison,
    getAlertsForDate,
    isLoading 
  } = useAdvancedAnalytics(dateRange);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const now = new Date();
    if ('days' in preset) {
      setDateRange({ from: subDays(now, preset.days), to: now });
    } else if (preset.type === 'this_month') {
      setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
    } else if (preset.type === 'last_month') {
      const lastMonth = subMonths(now, 1);
      setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    }
  };

  const handleExport = useCallback(async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Chart exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar chart');
    }
  }, []);

  const handleDataPointClick = useCallback((dateStr: string) => {
    setDrillDownDate(new Date(dateStr));
    setIsDrillDownOpen(true);
  }, []);

  const currentPeriodLabel = compareMode === 'previous' ? 'Este Período' : 'Este Mês';
  const previousPeriodLabel = compareMode === 'previous' ? 'Período Anterior' : 'Mês Anterior';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-72 pt-16 p-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LineChart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics Avançado</h1>
              <p className="text-muted-foreground">Análise detalhada de compliance e tendências</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex">
                  <div className="border-r p-2 space-y-1">
                    {PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Compare Mode */}
            <Select value={compareMode} onValueChange={setCompareMode}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Comparar com..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous">Período anterior</SelectItem>
                <SelectItem value="month">Mês anterior</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Full width - Compliance Score Time Series */}
          <ComplianceScoreTimeSeries
            data={scoreTimeSeries}
            annotations={annotations}
            onDataPointClick={handleDataPointClick}
            onExport={handleExport}
          />

          {/* MTTR Breakdown */}
          <MTTRStackedBreakdown data={mttrBreakdown} onExport={handleExport} />

          {/* Top Failing Rules */}
          <TopFailingRulesChart data={topFailingRules} onExport={handleExport} />

          {/* Heatmap */}
          <ComplianceHeatmap data={heatmapData} onExport={handleExport} />

          {/* Integration Health */}
          <IntegrationHealthTimeSeries data={integrationHealthHistory} onExport={handleExport} />

          {/* Period Comparison - Full width */}
          <PeriodComparisonChart
            data={periodComparison}
            currentPeriodLabel={currentPeriodLabel}
            previousPeriodLabel={previousPeriodLabel}
            onExport={handleExport}
          />
        </div>

        {/* Drill-down Modal */}
        <AlertsDrillDownModal
          open={isDrillDownOpen}
          onOpenChange={setIsDrillDownOpen}
          date={drillDownDate}
          fetchAlerts={getAlertsForDate}
        />
      </main>
    </div>
  );
}
