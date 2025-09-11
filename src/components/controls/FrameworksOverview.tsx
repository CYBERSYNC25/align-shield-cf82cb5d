import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, Shield } from 'lucide-react';

const frameworksData = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'System and Organization Controls para Serviços',
    version: '2017',
    totalControls: 64,
    implementedControls: 57,
    partialControls: 5,
    missingControls: 2,
    compliance: 89,
    status: 'good',
    categories: ['Segurança', 'Disponibilidade', 'Integridade', 'Confidencialidade', 'Privacidade']
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    description: 'Sistema de Gestão de Segurança da Informação',
    version: '2022',
    totalControls: 114,
    implementedControls: 105,
    partialControls: 7,
    missingControls: 2,
    compliance: 92,
    status: 'excellent',
    categories: ['Políticas', 'Organização', 'RH', 'Ativos', 'Controle de Acesso', 'Criptografia']
  },
  {
    id: 'lgpd',
    name: 'LGPD',
    description: 'Lei Geral de Proteção de Dados Pessoais',
    version: 'Lei 13.709/18',
    totalControls: 42,
    implementedControls: 32,
    partialControls: 8,
    missingControls: 2,
    compliance: 76,
    status: 'fair',
    categories: ['Consentimento', 'Tratamento', 'Direitos do Titular', 'Segurança', 'Incidentes']
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    version: 'Regulamento UE 2016/679',
    totalControls: 38,
    implementedControls: 31,
    partialControls: 5,
    missingControls: 2,
    compliance: 82,
    status: 'good',
    categories: ['Princípios', 'Direitos', 'Controlador', 'Operador', 'Autoridades', 'Transferências']
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent':
      return 'text-success';
    case 'good':
      return 'text-info';
    case 'fair':
      return 'text-warning';
    case 'poor':
      return 'text-danger';
    default:
      return 'text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'good':
      return <CheckCircle2 className="w-4 h-4 text-info" />;
    case 'fair':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'poor':
      return <XCircle className="w-4 h-4 text-danger" />;
    default:
      return <Shield className="w-4 h-4 text-muted-foreground" />;
  }
};

const FrameworksOverview = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        Frameworks de Conformidade
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {frameworksData.map((framework) => (
          <Card key={framework.id} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    {getStatusIcon(framework.status)}
                    {framework.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    {framework.description}
                  </CardDescription>
                  <Badge variant="outline" className="text-xs mt-2 w-fit">
                    {framework.version}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getStatusColor(framework.status)}`}>
                    {framework.compliance}%
                  </div>
                  <div className="text-xs text-muted-foreground">Conformidade</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso dos Controles</span>
                  <span className="text-foreground font-medium">
                    {framework.implementedControls + framework.partialControls}/{framework.totalControls}
                  </span>
                </div>
                <Progress value={framework.compliance} className="h-2" />
              </div>

              {/* Controls Breakdown */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-success">{framework.implementedControls}</div>
                  <div className="text-muted-foreground">Implementados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-warning">{framework.partialControls}</div>
                  <div className="text-muted-foreground">Parciais</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-danger">{framework.missingControls}</div>
                  <div className="text-muted-foreground">Pendentes</div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Categorias:</div>
                <div className="flex flex-wrap gap-1">
                  {framework.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FrameworksOverview;