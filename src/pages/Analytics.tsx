import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
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
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  Filter 
} from 'lucide-react';
import ComplianceChart from '@/components/dashboard/ComplianceChart';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import RealTimeMetrics from '@/components/dashboard/RealTimeMetrics';

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
    <div className="min-h-screen bg-gradient-dashboard">
      <Header />
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Analytics & Relatórios
              </h1>
              <p className="text-muted-foreground mt-2">
                Análise detalhada de dados de compliance e performance
              </p>
            </div>
            
            <div className="flex items-center gap-3">
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
                    <DialogTitle>Filtros de Analytics</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Framework</Label>
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
                      <Label>Status</Label>
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
                      <Label>Categoria</Label>
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

          {/* Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
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
              
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento de Frameworks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Análise detalhada por framework em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risks" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Matriz de Riscos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Matriz impacto vs probabilidade</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução dos Riscos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Histórico de mitigação</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <RealTimeMetrics />
              
              <Card>
                <CardHeader>
                  <CardTitle>KPIs de Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Indicadores de performance em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Analytics;