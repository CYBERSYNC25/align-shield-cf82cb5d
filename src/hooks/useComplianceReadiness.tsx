import { useState, useEffect } from 'react';
import { useFrameworks } from './useFrameworks';
import { useIntegrations } from './useIntegrations';
import { usePolicies } from './usePolicies';
import { useRisks } from './useRisks';

export interface FrameworkReadiness {
  framework: string;
  score: number;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  pendingControls: number;
  evidenceCount: number;
  gaps: string[];
  recommendations: string[];
  certificationReady: boolean;
}

export interface ReadinessMetrics {
  overallScore: number;
  frameworks: FrameworkReadiness[];
  integrations: {
    total: number;
    active: number;
    collectingEvidence: number;
  };
  policies: {
    total: number;
    approved: number;
    pending: number;
  };
  risks: {
    total: number;
    high: number;
    mitigated: number;
  };
  readinessLevel: 'not-ready' | 'getting-started' | 'in-progress' | 'almost-ready' | 'ready';
  estimatedDaysToReady: number;
}

export const useComplianceReadiness = () => {
  const { frameworks, controls, loading: frameworksLoading } = useFrameworks();
  const { integrations, loading: integrationsLoading } = useIntegrations();
  const { policies, loading: policiesLoading } = usePolicies();
  const { risks, loading: risksLoading } = useRisks();
  const [metrics, setMetrics] = useState<ReadinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!frameworksLoading && !integrationsLoading && !policiesLoading && !risksLoading) {
      calculateReadiness();
    }
  }, [frameworks, controls, integrations, policies, risks, frameworksLoading, integrationsLoading, policiesLoading, risksLoading]);

  const calculateReadiness = () => {
    // Calcular readiness por framework
    const frameworkReadiness: FrameworkReadiness[] = frameworks.map(framework => {
      const frameworkControls = controls.filter(c => c.framework_id === framework.id);
      const totalControls = frameworkControls.length;
      const implementedControls = frameworkControls.filter(c => c.status === 'passed').length;
      const partialControls = frameworkControls.filter(c => c.status === 'failed').length;
      const pendingControls = frameworkControls.filter(c => c.status === 'pending').length;
      const evidenceCount = frameworkControls.reduce((sum, c) => sum + (c.evidence_count || 0), 0);

      // Calcular score: implementado = 100%, parcial = 50%, pendente = 0%
      const score = totalControls > 0
        ? Math.round(((implementedControls * 100) + (partialControls * 50)) / totalControls)
        : 0;

      // Identificar gaps
      const gaps: string[] = [];
      if (pendingControls > 0) gaps.push(`${pendingControls} controles pendentes`);
      if (evidenceCount < implementedControls) gaps.push('Evidências insuficientes');
      if (partialControls > 0) gaps.push(`${partialControls} controles parcialmente implementados`);

      // Gerar recomendações
      const recommendations: string[] = [];
      if (pendingControls > 0) {
        recommendations.push(`Implemente os ${pendingControls} controles pendentes`);
      }
      if (partialControls > 0) {
        recommendations.push(`Complete os ${partialControls} controles parciais`);
      }
      if (evidenceCount < totalControls) {
        recommendations.push('Colete evidências para todos os controles');
      }
      if (integrations.length < 5) {
        recommendations.push('Conecte mais integrações para coleta automática');
      }

      const certificationReady = score >= 95 && evidenceCount >= implementedControls;

      return {
        framework: framework.name,
        score,
        totalControls,
        implementedControls,
        partialControls,
        pendingControls,
        evidenceCount,
        gaps,
        recommendations,
        certificationReady,
      };
    });

    // Calcular score geral (média ponderada)
    const overallScore = frameworkReadiness.length > 0
      ? Math.round(frameworkReadiness.reduce((sum, f) => sum + f.score, 0) / frameworkReadiness.length)
      : 0;

    // Métricas de integrações
    const integrationsMetrics = {
      total: integrations.length,
      active: integrations.filter(i => i.status === 'active').length,
      collectingEvidence: integrations.filter(i => i.evidences > 0).length,
    };

    // Métricas de políticas
    const policiesMetrics = {
      total: policies.length,
      approved: policies.filter(p => p.status === 'approved').length,
      pending: policies.filter(p => p.status === 'draft').length,
    };

    // Métricas de riscos
    const risksMetrics = {
      total: risks.length,
      high: risks.filter(r => r.level === 'critical' || r.level === 'high').length,
      mitigated: risks.filter(r => r.status === 'mitigated').length,
    };

    // Determinar nível de prontidão
    let readinessLevel: ReadinessMetrics['readinessLevel'];
    if (overallScore >= 95) readinessLevel = 'ready';
    else if (overallScore >= 80) readinessLevel = 'almost-ready';
    else if (overallScore >= 50) readinessLevel = 'in-progress';
    else if (overallScore >= 20) readinessLevel = 'getting-started';
    else readinessLevel = 'not-ready';

    // Estimar dias até estar pronto (baseado em progresso)
    const remainingWork = 100 - overallScore;
    const estimatedDaysToReady = Math.ceil(remainingWork * 2); // 2 dias por % de trabalho restante

    setMetrics({
      overallScore,
      frameworks: frameworkReadiness,
      integrations: integrationsMetrics,
      policies: policiesMetrics,
      risks: risksMetrics,
      readinessLevel,
      estimatedDaysToReady,
    });

    setLoading(false);
  };

  return {
    metrics,
    loading,
    refresh: calculateReadiness,
  };
};
