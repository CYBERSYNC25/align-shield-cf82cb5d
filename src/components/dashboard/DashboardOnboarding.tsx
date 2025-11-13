/**
 * Componente Dashboard Onboarding
 * 
 * @component
 * @description
 * Tour guiado interativo que explica cada seção do dashboard para novos usuários.
 * Usa um modal passo-a-passo com highlight das áreas relevantes.
 * 
 * Features:
 * - Tour multi-etapas com navegação
 * - Explicação de cada KPI e gráfico
 * - Pode ser pulado ou reativado
 * - Salva progresso no localStorage
 * - Responsivo e acessível
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   return (
 *     <div>
 *       <DashboardOnboarding />
 *       <MetricsGrid />
 *       <ComplianceChart />
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Target,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Definição das etapas do onboarding
 * 
 * Cada step contém:
 * - title: Título da etapa
 * - description: Explicação detalhada
 * - icon: Ícone representativo
 * - color: Cor temática
 * - tips: Dicas de interpretação e uso
 * - examples: Exemplos práticos
 */
const ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Bem-vindo ao Dashboard de Compliance! 👋",
    description: "Este é o centro de controle da sua plataforma de conformidade. Aqui você tem visibilidade completa sobre todos os aspectos do seu programa de GRC.",
    icon: Shield,
    color: "text-primary",
    tips: [
      "Visualize métricas em tempo real",
      "Acompanhe tendências ao longo do tempo",
      "Identifique rapidamente áreas de risco"
    ]
  },
  {
    step: 2,
    title: "Controles Ativos",
    description: "Total de controles de segurança implementados nos seus frameworks de compliance (SOC 2, ISO 27001, LGPD, GDPR).",
    icon: Shield,
    color: "text-success",
    tips: [
      "📈 Maior número = melhor postura de segurança",
      "✅ Meta: Implementar 80% dos controles prioritários",
      "⚡ Ação: Se baixo, revisar gaps nos frameworks"
    ],
    examples: [
      "142 controles = Boa cobertura (85%)",
      "64 controles = Cobertura básica (40%)",
      "0 controles = Nenhum framework configurado"
    ]
  },
  {
    step: 3,
    title: "Riscos Identificados",
    description: "Quantidade de riscos mapeados no registro de riscos, categorizados por severidade (Alto, Médio, Baixo).",
    icon: AlertTriangle,
    color: "text-warning",
    tips: [
      "🔴 Riscos Altos = Atenção imediata necessária",
      "🟡 Riscos Médios = Monitorar e planejar mitigação",
      "🟢 Riscos Baixos = Aceitar ou mitigar quando possível"
    ],
    examples: [
      "Alto: Vazamento de dados pessoais (Impacto: Crítico)",
      "Médio: Falta de 2FA em sistema interno (Impacto: Moderado)",
      "Baixo: Documentação incompleta (Impacto: Mínimo)"
    ]
  },
  {
    step: 4,
    title: "Auditorias Concluídas",
    description: "Número de auditorias finalizadas com sucesso. Inclui auditorias internas, externas e revisões de certificação.",
    icon: CheckCircle,
    color: "text-success",
    tips: [
      "📊 Progresso: % de auditorias planejadas vs concluídas",
      "🎯 Meta: 100% de auditorias anuais concluídas no prazo",
      "🔍 Foco: Revisar evidências e findings de cada auditoria"
    ],
    examples: [
      "8/10 auditorias = 80% completas (No prazo)",
      "3/10 auditorias = 30% completas (Atrasado - ação urgente)",
      "0 auditorias = Nenhuma auditoria agendada"
    ]
  },
  {
    step: 5,
    title: "Tarefas Pendentes",
    description: "Tarefas em aberto que requerem ação imediata. Inclui implementação de controles, coleta de evidências e remediações.",
    icon: Clock,
    color: "text-danger",
    tips: [
      "⏰ Priorizar por prazo e impacto",
      "👥 Delegar tarefas para responsáveis",
      "📅 Configurar lembretes automáticos"
    ],
    examples: [
      "5 tarefas = Carga normal (Gerenciável)",
      "25 tarefas = Sobrecarga (Priorizar urgentes)",
      "0 tarefas = Todas concluídas (Excelente!)"
    ]
  },
  {
    step: 6,
    title: "Políticas Ativas",
    description: "Número de políticas de segurança publicadas e em vigor. Exemplos: Política de Senha, BYOD, Backup, etc.",
    icon: FileText,
    color: "text-primary",
    tips: [
      "📄 Revisar anualmente ou após incidentes",
      "✍️ Coletar atestações de leitura dos colaboradores",
      "🔄 Versionar mudanças importantes"
    ],
    examples: [
      "15 políticas ativas = Cobertura adequada",
      "5 políticas ativas = Cobertura básica",
      "0 políticas = Risco de compliance alto"
    ]
  },
  {
    step: 7,
    title: "Taxa de Compliance",
    description: "Percentual médio de compliance across todos os frameworks implementados. Calculado pela média ponderada dos scores.",
    icon: Target,
    color: "text-success",
    tips: [
      "🎯 Meta: >85% para certificação",
      "📈 Melhorar: Implementar controles faltantes",
      "⚠️ <70% = Risco de reprovação em auditoria"
    ],
    examples: [
      "92% = Excelente (Pronto para auditoria)",
      "78% = Bom (Melhorias necessárias)",
      "55% = Crítico (Ação imediata)"
    ]
  },
  {
    step: 8,
    title: "Evolução do Compliance",
    description: "Gráfico de linha mostrando a tendência do seu score de compliance nos últimos 6 meses. Identifique padrões e impactos de ações.",
    icon: TrendingUp,
    color: "text-primary",
    tips: [
      "📊 Tendência ascendente = Melhorias funcionando",
      "📉 Tendência descendente = Investigar causas",
      "➡️ Estagnado = Revisar estratégia"
    ]
  },
  {
    step: 9,
    title: "Distribuição de Riscos",
    description: "Gráfico de pizza exibindo a proporção de riscos por severidade. Use para priorizar esforços de mitigação.",
    icon: BarChart3,
    color: "text-warning",
    tips: [
      "🔴 >30% Alto = Situação crítica",
      "🟡 Maioria Médio = Normal",
      "🟢 Maioria Baixo = Postura saudável"
    ]
  },
  {
    step: 10,
    title: "Pronto para começar! 🚀",
    description: "Você agora conhece todos os KPIs do dashboard. Use essas métricas para tomar decisões informadas sobre seu programa de compliance.",
    icon: CheckCircle,
    color: "text-success",
    tips: [
      "💡 Revisar o dashboard diariamente",
      "🔔 Configurar alertas para mudanças críticas",
      "📱 Acessar via mobile para acompanhar em qualquer lugar",
      "❓ Reativar este tour em Configurações > Ajuda"
    ]
  }
] as const;

const STORAGE_KEY = 'dashboard-onboarding-completed';

/**
 * Componente principal de Onboarding
 */
export const DashboardOnboarding = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Verifica se o usuário já completou o onboarding
   * Se não, exibe automaticamente após 1 segundo
   */
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * Marca o onboarding como completo e fecha o modal
   */
  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    setCurrentStep(0);
  };

  /**
   * Pula o onboarding (pode reativar depois)
   */
  const handleSkip = () => {
    setOpen(false);
    setCurrentStep(0);
  };

  /**
   * Navega para a próxima etapa
   */
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  /**
   * Volta para a etapa anterior
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const StepIcon = step.icon;

  return (
    <>
      {/* Botão flutuante para reabrir o tour */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Abrir tour do dashboard"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="mb-2">
                Passo {step.step} de {ONBOARDING_STEPS.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                aria-label="Fechar tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className={cn("p-3 rounded-lg bg-primary/10", step.color)}>
                <StepIcon className={cn("h-6 w-6", step.color)} />
              </div>
              {step.title}
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="space-y-4 text-base">
            <p>{step.description}</p>

            {step.tips && (
              <div className="space-y-2">
                <p className="font-medium text-foreground">💡 Dicas de interpretação:</p>
                <ul className="space-y-1 ml-4">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground list-disc">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {'examples' in step && step.examples && (
              <div className="space-y-2">
                <p className="font-medium text-foreground">📊 Exemplos:</p>
                <ul className="space-y-1 ml-4">
                  {step.examples.map((example, index) => (
                    <li key={index} className="text-sm text-muted-foreground list-disc">
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DialogDescription>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% completo
            </p>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep < ONBOARDING_STEPS.length - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Pular
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  'Concluir'
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Hook para resetar o onboarding (útil para testes ou configurações)
 * 
 * @example
 * ```tsx
 * function Settings() {
 *   const resetOnboarding = useResetOnboarding();
 *   
 *   return (
 *     <Button onClick={resetOnboarding}>
 *       Reativar Tour do Dashboard
 *     </Button>
 *   );
 * }
 * ```
 */
export const useResetOnboarding = () => {
  return () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };
};

export default DashboardOnboarding;
