/**
 * Hook para validação completa da configuração OAuth do Google
 * 
 * Executa verificações automáticas e retorna relatório detalhado
 * com status de cada componente da integração.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ValidationStatus = 'ready' | 'needs_attention' | 'critical_issues' | 'needs_configuration';
export type CheckStatus = 'success' | 'error' | 'warning' | 'manual';

export interface ValidationResult {
  check: string;
  status: CheckStatus;
  message: string;
  details?: string;
  recommendation?: string;
  link?: string;
}

export interface ValidationSummary {
  total: number;
  success: number;
  warnings: number;
  errors: number;
  manual: number;
}

export interface ValidationReport {
  timestamp: string;
  overallStatus: ValidationStatus;
  overallMessage: string;
  summary: ValidationSummary;
  nextSteps: string[];
  results: ValidationResult[];
  configuration: {
    projectId: string;
    redirectUri: string;
    configuredScopes: string[];
    requiredApis: string[];
  };
}

interface ValidationResponse {
  success: boolean;
  validation: ValidationReport | null;
  error?: string;
}

export const useGoogleOAuthValidation = () => {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const { toast } = useToast();

  /**
   * Executa validação completa da configuração OAuth
   */
  const validateConfiguration = async (): Promise<ValidationReport | null> => {
    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke<ValidationResponse>(
        'google-oauth-validate',
        {
          body: {}
        }
      );

      if (functionError) {
        console.error('Validation function error:', functionError);
        throw functionError;
      }

      if (!data?.success || !data.validation) {
        throw new Error(data?.error || 'Falha na validação');
      }

      setValidation(data.validation);

      // Mostrar toast baseado no status geral
      const { overallStatus, summary } = data.validation;

      if (overallStatus === 'ready') {
        toast({
          title: '✅ Configuração Validada',
          description: 'Integração pronta para uso!',
        });
      } else if (overallStatus === 'critical_issues') {
        toast({
          title: '❌ Problemas Críticos',
          description: `${summary.errors} erro(s) que impedem a integração`,
          variant: 'destructive',
        });
      } else if (overallStatus === 'needs_attention') {
        toast({
          title: '⚠️ Atenção Necessária',
          description: `${summary.manual} verificação(ões) manual(is) pendente(s)`,
        });
      } else {
        toast({
          title: 'ℹ️ Configuração Parcial',
          description: 'Complete os passos de configuração',
        });
      }

      return data.validation;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar configuração';
      
      toast({
        title: 'Erro na Validação',
        description: errorMessage,
        variant: 'destructive',
      });

      setValidation(null);
      return null;

    } finally {
      setLoading(false);
    }
  };

  /**
   * Retorna cor baseada no status
   */
  const getStatusColor = (status: CheckStatus): string => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'manual': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  /**
   * Retorna ícone baseado no status
   */
  const getStatusIcon = (status: CheckStatus): string => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'manual': return '👉';
      default: return '•';
    }
  };

  /**
   * Retorna cor do badge baseado no status geral
   */
  const getOverallStatusColor = (status: ValidationStatus): string => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical_issues': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'needs_configuration': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return {
    validateConfiguration,
    validation,
    loading,
    getStatusColor,
    getStatusIcon,
    getOverallStatusColor,
  };
};
