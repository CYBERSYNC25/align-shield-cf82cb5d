import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import { useFrameworks } from '@/hooks/useFrameworks';
import { useRisks } from '@/hooks/useRisks';
import { useAudits } from '@/hooks/useAudits';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

const ComplianceScoreCard = () => {
  const { frameworks } = useFrameworks();
  const { risks } = useRisks();
  const { audits } = useAudits();
  const { user } = useAuth();

  // Fetch previous score from compliance_check_history
  const { data: previousCheckScore } = useQuery({
    queryKey: ['previous-compliance-score', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_check_history')
        .select('score')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(2);
      if (error) throw error;
      // Return the second most recent score (previous)
      return data && data.length >= 2 ? data[1].score : null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const complianceScore = useMemo(() => {
    if (frameworks.length === 0) return 0;
    const totalScore = frameworks.reduce((sum, framework) => sum + (framework.compliance_score || 0), 0);
    return Math.round(totalScore / frameworks.length);
  }, [frameworks]);

  const riskScore = useMemo(() => {
    if (risks.length === 0) return 100;
    const highRisks = risks.filter(risk => risk.level === 'high').length;
    const mediumRisks = risks.filter(risk => risk.level === 'medium').length;
    const lowRisks = risks.filter(risk => risk.level === 'low').length;
    const totalRiskWeight = (highRisks * 3) + (mediumRisks * 2) + (lowRisks * 1);
    const maxPossibleWeight = risks.length * 3;
    return Math.max(0, Math.round(100 - ((totalRiskWeight / maxPossibleWeight) * 100)));
  }, [risks]);

  const auditScore = useMemo(() => {
    if (audits.length === 0) return 0;
    const completedAudits = audits.filter(audit => audit.status === 'completed').length;
    return Math.round((completedAudits / audits.length) * 100);
  }, [audits]);

  const overallScore = Math.round((complianceScore + riskScore + auditScore) / 3);
  
  const hasPreviousScore = previousCheckScore !== null && previousCheckScore !== undefined;
  const trend = hasPreviousScore ? overallScore - previousCheckScore : 0;
  const isPositiveTrend = trend >= 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-danger';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Bom';
    if (score >= 70) return 'Satisfatório';
    return 'Requer Atenção';
  };

  return (
    <Card className="h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium">Score de Compliance</CardTitle>
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          {hasPreviousScore && trend !== 0 && (
            <Badge variant={isPositiveTrend ? "default" : "destructive"} className="text-xs">
              {isPositiveTrend ? '+' : ''}{trend}%
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-baseline space-x-2">
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              {hasPreviousScore && trend !== 0 && (
                <div className="flex items-center space-x-1">
                  {isPositiveTrend ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  )}
                  <span className={`text-sm ${isPositiveTrend ? 'text-success' : 'text-danger'}`}>
                    {Math.abs(trend)}%
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {getScoreStatus(overallScore)}
            </p>
            
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div className="text-center">
                <div className="font-medium">{complianceScore}%</div>
                <div className="text-muted-foreground">Frameworks</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{riskScore}%</div>
                <div className="text-muted-foreground">Riscos</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{auditScore}%</div>
                <div className="text-muted-foreground">Auditorias</div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            {overallScore < 70 ? (
              <AlertTriangle className="h-8 w-8 text-danger opacity-80" />
            ) : (
              <Shield className="h-8 w-8 text-success opacity-80" />
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progresso</span>
            <span>Meta: 95%</span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceScoreCard;
