import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useComplianceStatus, 
  ComplianceTest, 
  SeverityLevel 
} from '@/hooks/useComplianceStatus';
import { useComplianceAlerts } from '@/hooks/useComplianceAlerts';
import { useRealtimeComplianceAlerts } from '@/hooks/useRealtimeComplianceAlerts';
import { useCachedIssuesBySeverity } from '@/hooks/useCachedIssuesBySeverity';
import { useUpdateComplianceScoreCache, type CachedComplianceScore } from '@/hooks/useCachedComplianceScore';
import { 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  ArrowRight,
  AlertOctagon,
  Info,
  ShieldCheck,
  Radio,
  WifiOff,
  Clock,
  Database
} from 'lucide-react';
import { IssueDetailsSheet } from './IssueDetailsSheet';
import { SLACountdown } from './SLACountdown';
import { cn } from '@/lib/utils';

// Animation variants for cards
const cardVariants = {
  hidden: { 
    opacity: 0, 
    x: -20, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    x: 20, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const ActionCenter = () => {
  const navigate = useNavigate();
  const { 
    failingTests, 
    passingTests,
    riskAcceptedTests,
    score, 
    totalTests, 
    isLoading 
  } = useComplianceStatus();

  const { alerts, overdueCount } = useComplianceAlerts();
  
  // Cached issues for quick stats (TTL: 2 min)
  const { data: cachedIssues } = useCachedIssuesBySeverity();
  
  // Cache update hook
  const { updateCache: updateScoreCache } = useUpdateComplianceScoreCache();
  
  // Realtime subscription hook
  const { 
    isConnected, 
    relativeTime, 
    newAlertIds 
  } = useRealtimeComplianceAlerts();

  const [selectedTest, setSelectedTest] = useState<ComplianceTest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Update cache when compliance data changes
  useEffect(() => {
    if (!isLoading && score !== undefined) {
      const cacheData: CachedComplianceScore = {
        score,
        passingTests: passingTests.length,
        failingTests: failingTests.length,
        riskAcceptedTests: riskAcceptedTests.length,
        totalTests,
        lastCalculated: new Date().toISOString()
      };
      updateScoreCache(cacheData);
    }
  }, [score, passingTests.length, failingTests.length, riskAcceptedTests.length, totalTests, isLoading]);

  // Find corresponding alert for a test
  const getAlertForTest = (testId: string) => {
    return alerts.find(a => a.rule_id === testId && !a.resolved);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Bom';
    if (score >= 50) return 'Atenção';
    return 'Crítico';
  };

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertOctagon className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
            Crítico
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">
            Alto
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
            Médio
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Baixo
          </Badge>
        );
    }
  };

  const handleCardClick = (test: ComplianceTest) => {
    setSelectedTest(test);
    setSheetOpen(true);
  };

  // Group failing tests by severity
  const criticalTests = failingTests.filter((t) => t.severity === 'critical');
  const highTests = failingTests.filter((t) => t.severity === 'high');

  if (isLoading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-16 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader className="pb-4">
          {/* Connection Status Banner */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4"
            >
              <WifiOff className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">
                Conexão em tempo real interrompida. Tentando reconectar...
              </span>
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Score Section */}
            <div className="flex items-center gap-6">
              <div className="relative pb-5">
                <div
                  className={`flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                    score >= 80
                      ? 'border-green-500'
                      : score >= 50
                        ? 'border-yellow-500'
                        : 'border-red-500'
                  }`}
                >
                  <span className="text-2xl font-bold text-foreground">
                    {score}
                  </span>
                </div>
                <div
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap ${getScoreBgColor(
                    score
                  )}`}
                >
                  {getScoreLabel(score)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-bold text-foreground">
                    Score de Conformidade
                  </CardTitle>
                  
                  {/* LIVE Badge */}
                  {isConnected && (
                    <Badge 
                      className={cn(
                        "bg-success/10 text-success border-success/20 flex items-center gap-1.5",
                        "animate-pulse"
                      )}
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                      </span>
                      LIVE
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {passingTests.length} de {totalTests} testes aprovados
                  </p>
                  
                  {/* Relative timestamp */}
                  {relativeTime && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Atualizado há {relativeTime}
                    </span>
                  )}
                </div>
                
                <Progress
                  value={score}
                  className={`h-2 w-48 mt-3 ${getScoreBgColor(score)}`}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="text-center px-3 sm:px-4 py-2 rounded-lg bg-destructive/5 border border-destructive/20 min-w-[70px]">
                <div className="text-2xl font-bold text-destructive">
                  {criticalTests.length}
                </div>
                <div className="text-xs text-muted-foreground">Críticos</div>
              </div>
              <div className="text-center px-3 sm:px-4 py-2 rounded-lg bg-orange-500/5 border border-orange-500/20 min-w-[70px]">
                <div className="text-2xl font-bold text-orange-500">
                  {highTests.length}
                </div>
                <div className="text-xs text-muted-foreground">Altos</div>
              </div>
              <div className="text-center px-3 sm:px-4 py-2 rounded-lg bg-success/5 border border-success/20 min-w-[70px]">
                <div className="text-2xl font-bold text-success">
                  {passingTests.length}
                </div>
                <div className="text-xs text-muted-foreground">Aprovados</div>
              </div>
              {riskAcceptedTests.length > 0 && (
                <div className="text-center px-3 sm:px-4 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 min-w-[70px]">
                  <div className="text-2xl font-bold text-amber-500">
                    {riskAcceptedTests.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Aceitos</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {failingTests.length === 0 ? (
            /* All Tests Passing */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Todos os Testes Aprovados
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Sua organização está em conformidade com todas as políticas monitoradas.
                Continue monitorando para manter esse status.
              </p>
            </motion.div>
          ) : (
            /* Failing Tests List */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Testes Falhando ({failingTests.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/compliance-readiness')}
                  className="text-primary hover:text-primary/80"
                >
                  Ver Todos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {failingTests.slice(0, 5).map((test, index) => {
                    const alert = getAlertForTest(test.id);
                    const isNew = newAlertIds.includes(test.id);
                    
                    return (
                      <motion.div
                        key={test.id}
                        variants={cardVariants}
                        initial={isNew ? "hidden" : false}
                        animate="visible"
                        exit="exit"
                        layout
                        transition={{ delay: isNew ? index * 0.1 : 0 }}
                        onClick={() => handleCardClick(test)}
                        className={cn(
                          `flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer`,
                          test.severity === 'critical'
                            ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
                            : test.severity === 'high'
                            ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10'
                            : 'bg-warning/5 border-warning/20 hover:bg-warning/10',
                          isNew && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Severity Icon */}
                          <div className="flex-shrink-0">
                            {getSeverityIcon(test.severity)}
                          </div>

                          {/* Test Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground truncate">
                                {test.title}
                              </span>
                              {getSeverityBadge(test.severity)}
                              
                              {/* New Badge for recently added */}
                              {isNew && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs animate-pulse">
                                  NOVO
                                </Badge>
                              )}
                              
                              {/* SLA Countdown */}
                              {alert && (
                                <SLACountdown
                                  deadline={alert.remediation_deadline}
                                  severity={test.severity as any}
                                  triggeredAt={alert.triggered_at}
                                  slaHours={alert.sla_hours}
                                  compact
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {test.integrationLogo && (
                                <img
                                  src={test.integrationLogo}
                                  alt={test.integration}
                                  className="h-4 w-4 object-contain"
                                />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {test.integration}
                              </span>
                              {test.affectedResources > 0 && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {test.affectedResources} recurso
                                    {test.affectedResources > 1 ? 's' : ''} afetado
                                    {test.affectedResources > 1 ? 's' : ''}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* View Details Arrow */}
                        <div className="flex-shrink-0 ml-4">
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>

              {failingTests.length > 5 && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/compliance-readiness')}
                    className="w-full"
                  >
                    Ver mais {failingTests.length - 5} teste
                    {failingTests.length - 5 > 1 ? 's' : ''} falhando
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Risk Accepted Section */}
          {riskAcceptedTests.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Riscos Aceitos ({riskAcceptedTests.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {riskAcceptedTests.map((test) => (
                  <Badge 
                    key={test.id}
                    variant="outline"
                    className="bg-amber-500/5 border-amber-500/20 text-amber-600 cursor-pointer hover:bg-amber-500/10"
                    onClick={() => handleCardClick(test)}
                  >
                    {test.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Details Sheet */}
      <IssueDetailsSheet
        test={selectedTest}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};

export default ActionCenter;
