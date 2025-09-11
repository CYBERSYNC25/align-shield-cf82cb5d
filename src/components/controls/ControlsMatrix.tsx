import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, CheckCircle2, AlertTriangle, XCircle, Eye } from 'lucide-react';

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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Matriz de Controles
        </h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtros Avançados
        </Button>
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
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="soc2">SOC 2</SelectItem>
                <SelectItem value="iso27001">ISO 27001</SelectItem>
                <SelectItem value="lgpd">LGPD</SelectItem>
                <SelectItem value="gdpr">GDPR</SelectItem>
              </SelectContent>
            </Select>
            <Select>
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
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="access">Controle de Acesso</SelectItem>
                <SelectItem value="assets">Gestão de Ativos</SelectItem>
                <SelectItem value="privacy">Privacidade</SelectItem>
                <SelectItem value="security">Segurança Técnica</SelectItem>
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
          {controlsData.map((control) => (
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
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Detalhes
                  </Button>
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
          ))}
        </TabsContent>

        <TabsContent value="matrix">
          <Card className="bg-surface-elevated border-card-border">
            <CardHeader>
              <CardTitle>Matriz de Mapeamento Framework × Controles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Visualização em matriz será implementada em breve...</p>
                <p className="text-sm mt-2">Esta vista mostrará o mapeamento cruzado entre frameworks e controles.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControlsMatrix;