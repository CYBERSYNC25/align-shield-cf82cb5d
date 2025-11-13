/**
 * Componente KPI Card
 * 
 * @component
 * @description
 * Card reutilizável para exibir indicadores-chave de performance (KPIs) no dashboard.
 * Suporta ícones, valores, tendências, progresso e estados de loading/erro.
 * 
 * Features:
 * - Exibição de valor principal e mudança percentual
 * - Barra de progresso visual
 * - Ícone customizável com cores temáticas
 * - Estados de loading, erro e dados vazios
 * - Tooltip explicativo (opcional)
 * - Animação de entrada
 * 
 * @example Uso básico:
 * ```tsx
 * <KPICard
 *   title="Controles Ativos"
 *   value="142"
 *   change="+12%"
 *   icon={Shield}
 *   progress={85}
 *   description="Total de controles de segurança implementados"
 * />
 * ```
 * 
 * @example Com estado de loading:
 * ```tsx
 * <KPICard
 *   title="Tarefas Pendentes"
 *   loading={true}
 * />
 * ```
 * 
 * @example Com erro:
 * ```tsx
 * <KPICard
 *   title="Auditorias"
 *   error="Não foi possível carregar dados"
 * />
 * ```
 * 
 * @example Sem dados (Empty State):
 * ```tsx
 * <KPICard
 *   title="Riscos Críticos"
 *   value="0"
 *   emptyMessage="Nenhum risco crítico identificado"
 * />
 * ```
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIcon, TrendingUp, TrendingDown, Minus, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props do componente KPICard
 * 
 * @interface KPICardProps
 * @property {string} title - Título do KPI (ex: "Controles Ativos")
 * @property {string} [value] - Valor principal do KPI (ex: "142" ou "85%")
 * @property {string} [change] - Mudança percentual (ex: "+12%" ou "-5%")
 * @property {LucideIcon} [icon] - Ícone do Lucide React
 * @property {string} [color] - Cor do texto do ícone/valor (ex: "text-success")
 * @property {string} [bgColor] - Cor de fundo do ícone (ex: "bg-success/10")
 * @property {number} [progress] - Valor da barra de progresso (0-100)
 * @property {string} [description] - Descrição detalhada para tooltip
 * @property {boolean} [loading] - Se está carregando dados
 * @property {string} [error] - Mensagem de erro (se houver)
 * @property {string} [emptyMessage] - Mensagem quando valor é 0 ou vazio
 * @property {() => void} [onClick] - Callback ao clicar no card
 * @property {string} [className] - Classes CSS adicionais
 */
export interface KPICardProps {
  title: string;
  value?: string;
  change?: string;
  icon?: LucideIcon;
  color?: string;
  bgColor?: string;
  progress?: number;
  description?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Componente KPICard
 * 
 * @param {KPICardProps} props - Propriedades do componente
 * @returns {JSX.Element} Card de KPI renderizado
 * 
 * Edge Cases:
 * 1. **Loading**: Exibe skeletons enquanto carrega dados
 * 2. **Erro**: Mostra mensagem de erro com ícone de alerta
 * 3. **Sem dados**: Exibe mensagem personalizada quando value é 0 ou vazio
 * 4. **Sem progresso**: Oculta barra de progresso se progress não for fornecido
 * 5. **Sem descrição**: Oculta ícone de help se description não for fornecido
 * 
 * Exemplos de JSON de resposta:
 * 
 * Sucesso:
 * ```json
 * {
 *   "title": "Controles Ativos",
 *   "value": "142",
 *   "change": "+12%",
 *   "progress": 85
 * }
 * ```
 * 
 * Loading:
 * ```json
 * {
 *   "loading": true
 * }
 * ```
 * 
 * Erro:
 * ```json
 * {
 *   "error": "Falha ao carregar dados do servidor"
 * }
 * ```
 * 
 * Sem dados:
 * ```json
 * {
 *   "value": "0",
 *   "emptyMessage": "Nenhum controle cadastrado"
 * }
 * ```
 */
export const KPICard = ({
  title,
  value,
  change,
  icon: Icon,
  color = "text-primary",
  bgColor = "bg-primary/10",
  progress,
  description,
  loading = false,
  error,
  emptyMessage,
  onClick,
  className
}: KPICardProps) => {
  
  /**
   * Determina o ícone e cor da tendência baseado no change
   * 
   * @returns {Object} Objeto com ícone, cor e direção da tendência
   */
  const getTrendIcon = () => {
    if (!change) return null;
    
    const isPositive = change.startsWith('+');
    const isNegative = change.startsWith('-');
    
    if (isPositive) {
      return {
        icon: TrendingUp,
        color: 'text-success',
        label: 'Tendência positiva'
      };
    } else if (isNegative) {
      return {
        icon: TrendingDown,
        color: 'text-destructive',
        label: 'Tendência negativa'
      };
    } else {
      return {
        icon: Minus,
        color: 'text-muted-foreground',
        label: 'Sem mudanças'
      };
    }
  };

  const trendInfo = getTrendIcon();

  /**
   * Estado de Loading
   * Exibe skeletons animados enquanto os dados estão sendo carregados
   */
  if (loading) {
    return (
      <Card className={cn("animate-in fade-in duration-300", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-32" />
          </CardTitle>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-16 mb-4" />
          {progress !== undefined && <Skeleton className="h-2 w-full" />}
        </CardContent>
      </Card>
    );
  }

  /**
   * Estado de Erro
   * Exibe alerta vermelho com mensagem de erro
   */
  if (error) {
    return (
      <Card className={cn("animate-in fade-in duration-300 border-destructive", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  /**
   * Estado Normal
   * Exibe o card completo com todos os dados
   */
  return (
    <Card 
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        onClick && "cursor-pointer hover:shadow-lg transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        {Icon && (
          <div className={cn("p-2 rounded-lg", bgColor)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Valor principal */}
          <div className="flex items-baseline justify-between">
            <span className={cn("text-2xl font-bold", color)}>
              {value || "—"}
            </span>
            {trendInfo && (
              <Badge 
                variant="secondary" 
                className={cn("gap-1", trendInfo.color)}
                aria-label={trendInfo.label}
              >
                <trendInfo.icon className="h-3 w-3" />
                <span className="text-xs font-medium">{change}</span>
              </Badge>
            )}
          </div>

          {/* Mensagem de empty state */}
          {emptyMessage && (value === "0" || !value) && (
            <p className="text-xs text-muted-foreground italic">
              {emptyMessage}
            </p>
          )}

          {/* Barra de progresso */}
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
