import { useMemo } from 'react';
import { useIntegrationData, CollectedResource } from '@/hooks/useIntegrationData';
import { 
  EVIDENCE_CONTROL_MAP, 
  getRulesForControl, 
  getResourceName,
  EvidenceControlRule 
} from '@/lib/evidence-control-map';
import { integrationsCatalog } from '@/lib/integrations-catalog';

export interface AutoEvidence {
  id: string;
  controlCode: string;
  ruleId: string;
  integrationId: string;
  integrationName: string;
  integrationLogo: string;
  resourceType: string;
  resourceName: string;
  resourceId: string;
  evidenceLabel: string;
  status: 'pass' | 'fail';
  lastVerified: Date;
  resourceData: Record<string, any>;
}

export interface AutoEvidenceStats {
  total: number;
  passing: number;
  failing: number;
  percentage: number;
  lastVerified: Date | null;
}

export interface AutoEvidenceResult {
  evidences: AutoEvidence[];
  isLoading: boolean;
  getEvidencesForControl: (controlCode: string) => AutoEvidence[];
  getEvidenceStats: (controlCode: string) => AutoEvidenceStats;
  hasAutoEvidence: (controlCode: string) => boolean;
  getPassingEvidences: (controlCode: string) => AutoEvidence[];
  getFailingEvidences: (controlCode: string) => AutoEvidence[];
  getSummaryMessage: (controlCode: string) => string;
}

/**
 * Hook para processar evidências automáticas a partir dos dados de integração
 * Vincula recursos coletados aos controles de compliance usando o mapeamento definido
 */
export function useAutoEvidence(): AutoEvidenceResult {
  const { data: collectedData, isLoading } = useIntegrationData();

  // Processa todos os recursos coletados e gera evidências automáticas
  const evidences = useMemo(() => {
    if (!collectedData || collectedData.length === 0) return [];

    const results: AutoEvidence[] = [];

    // Para cada recurso coletado
    collectedData.forEach((resource: CollectedResource) => {
      // Encontra regras aplicáveis para este tipo de recurso e integração
      const applicableRules = EVIDENCE_CONTROL_MAP.filter(
        rule => 
          rule.integrationId === resource.integration_name &&
          rule.resourceType === resource.resource_type
      );

      // Para cada regra aplicável
      applicableRules.forEach(rule => {
        // Encontra info da integração para o logo
        const integration = integrationsCatalog.find(i => i.id === rule.integrationId);
        
        // Executa a verificação de compliance
        const passes = rule.complianceCheck(resource.resource_data);
        
        // Para cada código de controle vinculado à regra
        rule.controlCodes.forEach(controlCode => {
          results.push({
            id: `${resource.id}-${rule.id}-${controlCode}`,
            controlCode,
            ruleId: rule.id,
            integrationId: rule.integrationId,
            integrationName: integration?.name || rule.integrationId,
            integrationLogo: integration?.logo || '',
            resourceType: resource.resource_type,
            resourceName: getResourceName(rule, resource.resource_data),
            resourceId: resource.resource_id || resource.id,
            evidenceLabel: rule.evidenceLabel,
            status: passes ? 'pass' : 'fail',
            lastVerified: new Date(resource.collected_at),
            resourceData: resource.resource_data,
          });
        });
      });
    });

    return results;
  }, [collectedData]);

  // Filtra evidências por código de controle (match parcial)
  const getEvidencesForControl = (controlCode: string): AutoEvidence[] => {
    return evidences.filter(ev => 
      ev.controlCode.toLowerCase().includes(controlCode.toLowerCase()) ||
      controlCode.toLowerCase().includes(ev.controlCode.toLowerCase())
    );
  };

  // Obtém estatísticas para um controle específico
  const getEvidenceStats = (controlCode: string): AutoEvidenceStats => {
    const controlEvidences = getEvidencesForControl(controlCode);
    const passing = controlEvidences.filter(e => e.status === 'pass').length;
    const failing = controlEvidences.filter(e => e.status === 'fail').length;
    const total = controlEvidences.length;
    
    // Encontra a verificação mais recente
    const lastVerified = controlEvidences.length > 0
      ? new Date(Math.max(...controlEvidences.map(e => e.lastVerified.getTime())))
      : null;

    return {
      total,
      passing,
      failing,
      percentage: total > 0 ? Math.round((passing / total) * 100) : 0,
      lastVerified,
    };
  };

  // Verifica se um controle tem evidências automáticas
  const hasAutoEvidence = (controlCode: string): boolean => {
    return getEvidencesForControl(controlCode).length > 0;
  };

  // Filtra apenas evidências que passam
  const getPassingEvidences = (controlCode: string): AutoEvidence[] => {
    return getEvidencesForControl(controlCode).filter(e => e.status === 'pass');
  };

  // Filtra apenas evidências que falham
  const getFailingEvidences = (controlCode: string): AutoEvidence[] => {
    return getEvidencesForControl(controlCode).filter(e => e.status === 'fail');
  };

  // Gera mensagem de resumo para o auditor
  const getSummaryMessage = (controlCode: string): string => {
    const stats = getEvidenceStats(controlCode);
    const controlEvidences = getEvidencesForControl(controlCode);
    
    if (stats.total === 0) {
      return 'Nenhuma evidência automática disponível para este controle.';
    }

    // Agrupa por integração para mensagem mais rica
    const byIntegration: Record<string, { total: number; passing: number }> = {};
    controlEvidences.forEach(ev => {
      if (!byIntegration[ev.integrationName]) {
        byIntegration[ev.integrationName] = { total: 0, passing: 0 };
      }
      byIntegration[ev.integrationName].total++;
      if (ev.status === 'pass') {
        byIntegration[ev.integrationName].passing++;
      }
    });

    const integrationSummaries = Object.entries(byIntegration).map(
      ([name, data]) => `${data.total} recursos no ${name} (${data.passing} em conformidade)`
    );

    if (stats.percentage === 100) {
      return `✅ Este controle está em conformidade. O APOC verificou ${stats.total} recursos e 100% estão em conformidade: ${integrationSummaries.join(', ')}.`;
    } else if (stats.failing > 0) {
      return `⚠️ Atenção: O APOC identificou ${stats.failing} de ${stats.total} recursos não conformes (${stats.percentage}% em conformidade): ${integrationSummaries.join(', ')}.`;
    } else {
      return `O APOC verificou ${stats.total} recursos: ${integrationSummaries.join(', ')}.`;
    }
  };

  return {
    evidences,
    isLoading,
    getEvidencesForControl,
    getEvidenceStats,
    hasAutoEvidence,
    getPassingEvidences,
    getFailingEvidences,
    getSummaryMessage,
  };
}
