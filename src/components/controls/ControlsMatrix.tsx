import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, CheckCircle2, AlertTriangle, XCircle, Eye, Download, Grid3x3 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import AdvancedFiltersModal from './AdvancedFiltersModal';
import ControlDetailsModal from './ControlDetailsModal';

const controlsData = [
  {
    id: 'CC6.1',
    title: 'Controle de Acesso Lógico',
    category: 'Controle de Acesso',
    description: 'A entidade implementa controles de acesso lógico para proteger informações e sistemas.',
    frameworks: ['SOC 2', 'ISO 27001'],
    status: 'partial',
    coverage: 75,
    evidences: 3,
    owner: 'DevOps Team',
    lastUpdated: '2024-01-08',
    automationStatus: 'automated',
    riskLevel: 'high'
  },
  {
    id: 'CC6.2',
    title: 'Autenticação Multifator',
    category: 'Controle de Acesso',
    description: 'A entidade implementa autenticação multifator para acesso a sistemas críticos.',
    frameworks: ['SOC 2', 'ISO 27001', 'GDPR'],
    status: 'implemented',
    coverage: 95,
    evidences: 5,
    owner: 'Security Team',
    lastUpdated: '2024-01-10',
    automationStatus: 'automated',
    riskLevel: 'high'
  },
  {
    id: 'A.5.8',
    title: 'Classificação da Informação',
    category: 'Gestão de Ativos',
    description: 'Informações devem ser classificadas em termos de requisitos legais, valor, criticidade e sensibilidade.',
    frameworks: ['ISO 27001', 'LGPD'],
    status: 'missing',
    coverage: 0,
    evidences: 0,
    owner: 'Data Team',
    lastUpdated: '2024-01-05',
    automationStatus: 'manual',
    riskLevel: 'medium'
  },
  {
    id: 'A.8.2',
    title: 'Privilégios de Acesso',
    category: 'Controle de Acesso',
    description: 'A concessão e uso de privilégios de acesso devem ser restringidos e controlados.',
    frameworks: ['ISO 27001', 'SOC 2'],
    status: 'implemented',
    coverage: 88,
    evidences: 4,
    owner: 'DevOps Team',
    lastUpdated: '2024-01-09',
    automationStatus: 'semi-automated',
    riskLevel: 'high'
  },
  {
    id: 'LGPD.Art.46',
    title: 'Relatório de Impacto',
    category: 'Privacidade',
    description: 'O controlador deverá realizar avaliação de impacto à proteção de dados pessoais.',
    frameworks: ['LGPD', 'GDPR'],
    status: 'missing',
    coverage: 0,
    evidences: 0,
    owner: 'Legal Team',
    lastUpdated: '2024-01-03',
    automationStatus: 'manual',
    riskLevel: 'high'
  },
  {
    id: 'GDPR.Art.32',
    title: 'Segurança do Tratamento',
    category: 'Segurança Técnica',
    description: 'Implementar medidas técnicas e organizacionais adequadas para assegurar nível de segurança.',
    frameworks: ['GDPR', 'LGPD', 'ISO 27001'],
    status: 'partial',
    coverage: 65,
    evidences: 2,
    owner: 'Security Team',
    lastUpdated: '2024-01-07',
    automationStatus: 'automated',
    riskLevel: 'high'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'implemented':
      return 'text-success bg-success/10';
    case 'partial':
      return 'text-warning bg-warning/10';
    case 'missing':
      return 'text-danger bg-danger/10';
    default:
      return 'text-muted-foreground bg-muted/10';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'implemented':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'partial':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'missing':
      return <XCircle className="w-4 h-4 text-danger" />;
    default:
      return <XCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'high':
      return 'text-danger';
    case 'medium':
      return 'text-warning';
    case 'low':
      return 'text-success';
    default:
      return 'text-muted-foreground';
  }
};

const getAutomationColor = (automation: string) => {
  switch (automation) {
    case 'automated':
      return 'text-success bg-success/10';
    case 'semi-automated':
      return 'text-warning bg-warning/10';
    case 'manual':
      return 'text-info bg-info/10';
    default:
      return 'text-muted-foreground bg-muted/10';
  }
};

const ControlsMatrix = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedControl, setSelectedControl] = useState<any>(null);

  const frameworks = ['SOC 2', 'ISO 27001', 'LGPD', 'GDPR', 'PCI DSS'];

  // Filter controls based on selections
  const filteredControls = controlsData.filter(control => {
    const matchesSearch = control.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          control.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFramework = selectedFramework === 'all' || control.frameworks.includes(selectedFramework);
    const matchesStatus = selectedStatus === 'all' || control.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || control.category === selectedCategory;
    
    return matchesSearch && matchesFramework && matchesStatus && matchesCategory;
  });

  const handleExportMatrix = () => {
    toast({
      title: "Gerando Matriz",
      description: "Preparando matriz de mapeamento...",
    });

    setTimeout(() => {
      const matrixContent = `MATRIZ DE MAPEAMENTO FRAMEWORK × CONTROLES
====================================================
Data: ${new Date().toLocaleDateString('pt-BR')}
Hora: ${new Date().toLocaleTimeString('pt-BR')}

ESTATÍSTICAS DA MATRIZ
----------------------
Total de Controles: ${controlsData.length}
Total de Frameworks: ${frameworks.length}
Controles Implementados: ${controlsData.filter(c => c.status === 'implemented').length}
Controles Parciais: ${controlsData.filter(c => c.status === 'partial').length}
Controles Pendentes: ${controlsData.filter(c => c.status === 'missing').length}

MAPEAMENTO DETALHADO
--------------------

${frameworks.map(framework => `
=== ${framework} ===
Controles Mapeados: ${controlsData.filter(c => c.frameworks.includes(framework)).length}

${controlsData.filter(c => c.frameworks.includes(framework)).map(control => `
  [${control.id}] ${control.title}
  Status: ${control.status === 'implemented' ? 'Implementado' : control.status === 'partial' ? 'Parcial' : 'Pendente'}
  Cobertura: ${control.coverage}%
  Categoria: ${control.category}
  Responsável: ${control.owner}
  Nível de Risco: ${control.riskLevel === 'high' ? 'Alto' : control.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
  Automação: ${control.automationStatus === 'automated' ? 'Automatizado' : control.automationStatus === 'semi-automated' ? 'Semi-Automatizado' : 'Manual'}
  Evidências: ${control.evidences}
`).join('\n')}
`).join('\n')}

CONTROLES POR STATUS
--------------------
${controlsData.map((control, i) => `
${i + 1}. ${control.id} - ${control.title}
   Frameworks: ${control.frameworks.join(', ')}
   Status: ${control.status === 'implemented' ? '✓ Implementado' : control.status === 'partial' ? '⚠ Parcial' : '✗ Pendente'}
   Cobertura: ${control.coverage}%
`).join('\n')}

Gerado em: ${new Date().toLocaleString('pt-BR')}
`;

      const blob = new Blob([matrixContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `matriz-controles-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Matriz Exportada",
        description: "O arquivo foi baixado com sucesso.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Matriz de Controles
        </h2>
        <AdvancedFiltersModal>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </Button>
        </AdvancedFiltersModal>
      </div>

      {/* Filters */}
      <Card className="bg-surface-elevated border-card-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar controles..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SOC 2">SOC 2</SelectItem>
                <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                <SelectItem value="LGPD">LGPD</SelectItem>
                <SelectItem value="GDPR">GDPR</SelectItem>
                <SelectItem value="PCI DSS">PCI DSS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="implemented">Implementado</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="missing">Pendente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Controle de Acesso">Controle de Acesso</SelectItem>
                <SelectItem value="Gestão de Ativos">Gestão de Ativos</SelectItem>
                <SelectItem value="Privacidade">Privacidade</SelectItem>
                <SelectItem value="Segurança Técnica">Segurança Técnica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Controls List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="matrix">Matriz</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredControls.length === 0 ? (
            <Card className="bg-surface-elevated border-card-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum controle encontrado com os filtros aplicados.
              </CardContent>
            </Card>
          ) : (
            filteredControls.map((control) => (
            <Card key={control.id} className="bg-surface-elevated border-card-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {control.id}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(control.status)}`}>
                        {getStatusIcon(control.status)}
                        <span className="ml-1">
                          {control.status === 'implemented' ? 'Implementado' :
                           control.status === 'partial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </Badge>
                      <Badge className={`text-xs ${getAutomationColor(control.automationStatus)}`}>
                        {control.automationStatus === 'automated' ? 'Automatizado' :
                         control.automationStatus === 'semi-automated' ? 'Semi-Auto' : 'Manual'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {control.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {control.description}
                    </p>
                  </div>
                  <ControlDetailsModal control={control}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </Button>
                  </ControlDetailsModal>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Frameworks and Category */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Frameworks:</span>
                    <div className="flex gap-1">
                      {control.frameworks.map((framework) => (
                        <Badge key={framework} variant="secondary" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Categoria:</span>
                    <Badge variant="outline" className="text-xs">
                      {control.category}
                    </Badge>
                  </div>
                </div>

                {/* Coverage and Evidences */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Cobertura</div>
                    <div className="text-lg font-semibold text-foreground">{control.coverage}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Evidências</div>
                    <div className="text-lg font-semibold text-foreground">{control.evidences}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Responsável</div>
                    <div className="text-sm font-medium text-foreground">{control.owner}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Risco</div>
                    <div className={`text-sm font-semibold ${getRiskColor(control.riskLevel)}`}>
                      {control.riskLevel === 'high' ? 'Alto' :
                       control.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-muted-foreground border-t border-card-border pt-2">
                  Última atualização: {new Date(control.lastUpdated).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          )))}
        </TabsContent>

        <TabsContent value="matrix">
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5" />
                    Matriz de Mapeamento Framework × Controles
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visualização cruzada de controles por framework
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExportMatrix}>
                  <Download className="w-4 h-4" />
                  Exportar Matriz
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Matrix Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card className="bg-muted/20 border-muted">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{filteredControls.length}</div>
                    <div className="text-xs text-muted-foreground">Controles</div>
                  </CardContent>
                </Card>
                <Card className="bg-success/10 border-success/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-success">
                      {filteredControls.filter(c => c.status === 'implemented').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Implementados</div>
                  </CardContent>
                </Card>
                <Card className="bg-warning/10 border-warning/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-warning">
                      {filteredControls.filter(c => c.status === 'partial').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Parciais</div>
                  </CardContent>
                </Card>
                <Card className="bg-danger/10 border-danger/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-danger">
                      {filteredControls.filter(c => c.status === 'missing').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Pendentes</div>
                  </CardContent>
                </Card>
                <Card className="bg-info/10 border-info/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-info">{frameworks.length}</div>
                    <div className="text-xs text-muted-foreground">Frameworks</div>
                  </CardContent>
                </Card>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="text-left p-3 font-semibold text-foreground bg-muted/30 sticky left-0 z-10">
                        Controle
                      </th>
                      {frameworks.map(framework => (
                        <th key={framework} className="text-center p-3 font-semibold text-foreground bg-muted/30 min-w-[100px]">
                          {framework}
                        </th>
                      ))}
                      <th className="text-center p-3 font-semibold text-foreground bg-muted/30">
                        Status
                      </th>
                      <th className="text-center p-3 font-semibold text-foreground bg-muted/30">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredControls.map((control) => (
                      <tr key={control.id} className="border-b border-card-border hover:bg-muted/20 transition-colors">
                        <td className="p-3 sticky left-0 bg-surface-elevated z-10">
                          <div className="space-y-1">
                            <div className="font-mono text-sm font-semibold text-foreground">
                              {control.id}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {control.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {control.category}
                            </div>
                          </div>
                        </td>
                        {frameworks.map(framework => (
                          <td key={framework} className="p-3 text-center">
                            {control.frameworks.includes(framework) ? (
                              <div className="flex items-center justify-center">
                                {getStatusIcon(control.status)}
                              </div>
                            ) : (
                              <div className="text-muted-foreground/30">-</div>
                            )}
                          </td>
                        ))}
                        <td className="p-3 text-center">
                          <Badge className={`text-xs ${getStatusColor(control.status)}`}>
                            {control.status === 'implemented' ? 'Implementado' :
                             control.status === 'partial' ? 'Parcial' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <ControlDetailsModal control={control}>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </ControlDetailsModal>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Coverage by Framework */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {frameworks.map(framework => {
                  const frameworkControls = filteredControls.filter(c => c.frameworks.includes(framework));
                  const implemented = frameworkControls.filter(c => c.status === 'implemented').length;
                  const coverage = frameworkControls.length > 0 
                    ? Math.round((implemented / frameworkControls.length) * 100) 
                    : 0;
                  
                  return (
                    <Card key={framework} className="bg-surface-elevated border-card-border">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-foreground text-sm">
                            {framework}
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {coverage}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {implemented} de {frameworkControls.length} controles
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${coverage}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControlsMatrix;