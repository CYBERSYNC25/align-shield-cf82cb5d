import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle, Shield, Download } from 'lucide-react';
import FrameworkDetailsSheet from './FrameworkDetailsSheet';
import { useFrameworks } from '@/hooks/useFrameworks';

type FrameworkCard = {
  id: string;
  name: string;
  description: string;
  version: string;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  missingControls: number;
  compliance: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  
  lastVerification: string;
  categories: string[];
};

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
  const { frameworks, controls, getFrameworkStats, loading } = useFrameworks();
  const [selectedFramework, setSelectedFramework] = useState<FrameworkCard | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const frameworksData = useMemo((): FrameworkCard[] => {
    return frameworks.map((f) => {
      const stats = getFrameworkStats(f.id);
      const progress = stats.progress ?? 0;
      const status: FrameworkCard['status'] =
        progress >= 90 ? 'excellent' : progress >= 75 ? 'good' : progress >= 50 ? 'fair' : 'poor';
      const frameworkControls = controls.filter((c) => c.framework_id === f.id);
      const categories = [...new Set(frameworkControls.map((c) => c.category).filter(Boolean))];
      return {
        id: f.id,
        name: f.name,
        description: f.description ?? '',
        version: f.version ?? '1.0',
        totalControls: stats.total,
        implementedControls: stats.passed,
        partialControls: stats.failed,
        missingControls: stats.pending,
        compliance: progress,
        status,
        lastVerification: (() => {
          const dates = frameworkControls
            .map(c => c.last_verified)
            .filter(Boolean)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          return dates.length > 0 ? dates[0] : '';
        })(),
        categories
      };
    });
  }, [frameworks, controls, getFrameworkStats]);

  const handleCardClick = (framework: FrameworkCard) => {
    setSelectedFramework(framework);
    setSheetOpen(true);
  };

  const handleExportReport = (e: React.MouseEvent, framework: FrameworkCard) => {
    e.stopPropagation();
    console.log(`Exporting report for ${framework.name}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Frameworks de Conformidade</h2>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (frameworksData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Frameworks de Conformidade</h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">Nenhum framework cadastrado</p>
            <p className="text-sm mt-1">Crie um framework usando o botão &quot;Novo Framework&quot; no topo da página para começar a mapear controles.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          Frameworks de Conformidade
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {frameworksData.map((framework) => (
            <Card 
              key={framework.id} 
              className="h-full flex flex-col bg-surface-elevated border-card-border cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30"
              onClick={() => handleCardClick(framework)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
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
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getStatusColor(framework.status)}`}>
                        {framework.compliance}%
                      </div>
                      <div className="text-xs text-muted-foreground">Conformidade</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleExportReport(e, framework)}
                      title="Exportar Relatório"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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

                {/* Last Verification Metadata */}
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Última verificação: <span className="text-foreground font-medium">
                      {framework.lastVerification 
                        ? new Date(framework.lastVerification).toLocaleDateString('pt-BR')
                        : 'Nunca verificado'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Framework Details Sheet */}
      <FrameworkDetailsSheet
        framework={selectedFramework}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};

export default FrameworksOverview;
