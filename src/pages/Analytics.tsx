import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Filter 
} from 'lucide-react';
import ComplianceChart from '@/components/dashboard/ComplianceChart';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import RealTimeMetrics from '@/components/dashboard/RealTimeMetrics';
import FrameworkDetails from '@/components/analytics/FrameworkDetails';
import RiskMatrix from '@/components/analytics/RiskMatrix';
import RiskEvolution from '@/components/analytics/RiskEvolution';
import PerformanceKPIs from '@/components/analytics/PerformanceKPIs';

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState({
    framework: '',
    status: '',
    category: ''
  });

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Exportando relatório em formato ${format.toUpperCase()}...`);
    // Simulate export process
    setTimeout(() => {
      toast.success('Relatório exportado com sucesso!');
    }, 2000);
  };

  const handleApplyFilters = () => {
    toast.success('Filtros aplicados com sucesso!');
    // Apply filters logic here
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      toast.success('Período atualizado!');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Header Section - Full Width */}
              <div className="col-span-full">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 truncate">
                      <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
                      Analytics & Relatórios
                    </h1>
                    <p className="text-muted-foreground line-clamp-2">
                      Análise detalhada de dados de compliance e performance
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Filters Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Filter className="h-4 w-4" />
                          Filtros
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Filtros de Analytics</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-foreground">Framework</Label>
                            <Select value={filters.framework} onValueChange={(value) => setFilters(prev => ({ ...prev, framework: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar framework" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="iso27001">ISO 27001</SelectItem>
                                <SelectItem value="sox">SOX</SelectItem>
                                <SelectItem value="lgpd">LGPD</SelectItem>
                                <SelectItem value="nist">NIST</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-foreground">Status</Label>
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="compliant">Conforme</SelectItem>
                                <SelectItem value="non-compliant">Não Conforme</SelectItem>
                                <SelectItem value="in-progress">Em Progresso</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-foreground">Categoria</Label>
                            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="security">Segurança</SelectItem>
                                <SelectItem value="privacy">Privacidade</SelectItem>
                                <SelectItem value="governance">Governança</SelectItem>
                                <SelectItem value="risk">Gestão de Riscos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setFilters({ framework: '', status: '', category: '' })} className="flex-1">
                              Limpar
                            </Button>
                            <Button onClick={handleApplyFilters} className="flex-1">
                              Aplicar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Period Selector */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Calendar className="h-4 w-4" />
                          Período
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => range && handleDateRangeChange(range)}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Export Menu */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="gap-2">
                          <Download className="h-4 w-4" />
                          Exportar
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48" align="end">
                        <div className="space-y-2">
                          <Button variant="ghost" onClick={() => handleExport('pdf')} className="w-full justify-start">
                            Exportar PDF
                          </Button>
                          <Button variant="ghost" onClick={() => handleExport('excel')} className="w-full justify-start">
                            Exportar Excel
                          </Button>
                          <Button variant="ghost" onClick={() => handleExport('csv')} className="w-full justify-start">
                            Exportar CSV
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Analytics Tabs - Full Width */}
              <div className="col-span-full">
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="risks">Riscos</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Metrics Grid */}
                    <MetricsGrid />
                    
                    {/* Compliance Charts */}
                    <ComplianceChart />
                    
                    {/* Real-time Metrics */}
                    <RealTimeMetrics />
                  </TabsContent>

                  <TabsContent value="compliance" className="space-y-6">
                    <ComplianceChart />
                    <FrameworkDetails />
                  </TabsContent>

                  <TabsContent value="risks" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <RiskMatrix />
                      <RiskEvolution />
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-6">
                    <RealTimeMetrics />
                    <PerformanceKPIs />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Analytics;
