import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAutoEvidence, AutoEvidence } from '@/hooks/useAutoEvidence';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutoEvidenceSectionProps {
  controlCode: string;
  onSync?: () => void;
}

const AutoEvidenceSection = ({ controlCode, onSync }: AutoEvidenceSectionProps) => {
  const { 
    getEvidencesForControl, 
    getEvidenceStats, 
    getSummaryMessage,
    hasAutoEvidence,
    isLoading 
  } = useAutoEvidence();
  
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const evidences = getEvidencesForControl(controlCode);
  const stats = getEvidenceStats(controlCode);
  const summaryMessage = getSummaryMessage(controlCode);

  // Se não há evidências automáticas, não renderiza
  if (!hasAutoEvidence(controlCode) && !isLoading) {
    return null;
  }

  // Ordena: falhas primeiro, depois passes
  const sortedEvidences = [...evidences].sort((a, b) => {
    if (a.status === 'fail' && b.status === 'pass') return -1;
    if (a.status === 'pass' && b.status === 'fail') return 1;
    return 0;
  });

  const displayedEvidences = showAll ? sortedEvidences : sortedEvidences.slice(0, 5);

  const getStatusIcon = (status: 'pass' | 'fail') => {
    return status === 'pass' 
      ? <CheckCircle className="h-4 w-4 text-success" />
      : <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadgeClass = (percentage: number) => {
    if (percentage === 100) return 'bg-success/10 text-success border-success/20';
    if (percentage >= 80) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <div className="space-y-4">
      {/* Header da Seção */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-info" />
          <h4 className="font-semibold text-foreground">Evidências Automáticas</h4>
          <Badge variant="outline" className="bg-info/10 text-info border-info/20">
            {stats.total} recursos
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <Card className="border-info/20 bg-info/5">
          <CardContent className="p-4 space-y-4">
            {/* Resumo para o Auditor */}
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                stats.percentage === 100 
                  ? 'bg-success/10' 
                  : stats.percentage >= 80 
                    ? 'bg-warning/10' 
                    : 'bg-destructive/10'
              }`}>
                {stats.percentage === 100 
                  ? <CheckCircle className="h-5 w-5 text-success" />
                  : stats.percentage >= 80 
                    ? <Clock className="h-5 w-5 text-warning" />
                    : <XCircle className="h-5 w-5 text-destructive" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{summaryMessage}</p>
                {stats.lastVerified && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Última verificação: {formatDistanceToNow(stats.lastVerified, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conformidade</span>
                <span className="font-medium">{stats.percentage}% ({stats.passing}/{stats.total})</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    stats.percentage === 100 
                      ? 'bg-success' 
                      : stats.percentage >= 80 
                        ? 'bg-warning' 
                        : 'bg-destructive'
                  }`}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>

            {/* Lista de Recursos */}
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recursos Verificados
              </h5>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {displayedEvidences.map((evidence) => (
                  <EvidenceItem key={evidence.id} evidence={evidence} />
                ))}
              </div>
              
              {sortedEvidences.length > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAll(!showAll);
                  }}
                >
                  {showAll 
                    ? `Mostrar menos` 
                    : `Ver todos (${sortedEvidences.length - 5} mais)`
                  }
                </Button>
              )}
            </div>

            {/* Botão de Sincronização */}
            {onSync && (
              <div className="pt-2 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={onSync}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente para cada item de evidência
const EvidenceItem = ({ evidence }: { evidence: AutoEvidence }) => {
  return (
    <div className={`flex items-center justify-between p-2 rounded-md ${
      evidence.status === 'pass' 
        ? 'bg-success/5 border border-success/10' 
        : 'bg-destructive/5 border border-destructive/10'
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {evidence.status === 'pass' 
          ? <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
          : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        }
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {evidence.resourceName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {evidence.integrationName} • {evidence.evidenceLabel}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {evidence.integrationLogo && (
          <img 
            src={evidence.integrationLogo} 
            alt={evidence.integrationName}
            className="h-4 w-4 object-contain"
          />
        )}
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(evidence.lastVerified, { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </span>
      </div>
    </div>
  );
};

export default AutoEvidenceSection;
