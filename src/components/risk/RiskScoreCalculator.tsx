import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Risk Score Calculator - Visual Component
 * 
 * @component
 * @description
 * Displays risk score calculation matrix with visual feedback.
 * Shows the formula: Score = Probability × Impact
 * 
 * **Visual Indicators:**
 * - Color-coded based on risk level
 * - Matrix representation of probability vs impact
 * - Numerical score with level badge
 * 
 * **Score Ranges:**
 * - 1-2: Low (Green)
 * - 3-4: Medium (Blue)
 * - 6-8: High (Orange)
 * - 9-12: Critical (Red)
 * 
 * **Example Usage:**
 * ```tsx
 * <RiskScoreCalculator 
 *   probability="medium"
 *   impact="high"
 *   score={6}
 *   level="high"
 * />
 * ```
 */
interface RiskScoreCalculatorProps {
  /** Probability level: low (1), medium (2), high (3) */
  probability: 'low' | 'medium' | 'high';
  /** Impact level: low (1), medium (2), high (3), critical (4) */
  impact: 'low' | 'medium' | 'high' | 'critical';
  /** Calculated score */
  score: number;
  /** Risk level based on score */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** Compact mode (hides matrix) */
  compact?: boolean;
}

const RiskScoreCalculator = ({ 
  probability, 
  impact, 
  score, 
  level,
  compact = false 
}: RiskScoreCalculatorProps) => {
  
  /**
   * Maps text values to numeric values
   */
  const probabilityValues = {
    low: 1,
    medium: 2,
    high: 3,
  };

  const impactValues = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  /**
   * Gets color class based on risk level
   */
  const getLevelColor = (level: string) => {
    const colors = {
      low: 'text-success',
      medium: 'text-info',
      high: 'text-warning',
      critical: 'text-destructive',
    };
    return colors[level as keyof typeof colors] || 'text-muted-foreground';
  };

  /**
   * Gets background color class based on risk level
   */
  const getLevelBgColor = (level: string) => {
    const colors = {
      low: 'bg-success/10 border-success/20',
      medium: 'bg-info/10 border-info/20',
      high: 'bg-warning/10 border-warning/20',
      critical: 'bg-destructive/10 border-destructive/20',
    };
    return colors[level as keyof typeof colors] || 'bg-muted/10';
  };

  /**
   * Generates risk matrix cell color
   * @param p - Probability value (1-3)
   * @param i - Impact value (1-4)
   * @returns CSS class for cell background
   */
  const getMatrixCellColor = (p: number, i: number) => {
    const cellScore = p * i;
    if (cellScore <= 2) return 'bg-success/20';
    if (cellScore <= 4) return 'bg-info/20';
    if (cellScore <= 8) return 'bg-warning/20';
    return 'bg-destructive/20';
  };

  /**
   * Checks if current probability and impact match cell
   */
  const isActiveCell = (p: number, i: number) => {
    return probabilityValues[probability] === p && impactValues[impact] === i;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground">
              {probabilityValues[probability]} × {impactValues[impact]} = {score}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">
              Probabilidade ({probabilityValues[probability]}) × Impacto ({impactValues[impact]})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={`p-4 border ${getLevelBgColor(level)}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Cálculo de Score</h4>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">
                  O score de risco é calculado multiplicando a probabilidade pelo impacto.
                  Quanto maior o score, maior a prioridade de tratamento.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Formula */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Fórmula</div>
          <div className="flex items-center justify-center gap-2 text-lg font-mono">
            <span className="text-foreground">{probabilityValues[probability]}</span>
            <span className="text-muted-foreground">×</span>
            <span className="text-foreground">{impactValues[impact]}</span>
            <span className="text-muted-foreground">=</span>
            <span className={`text-2xl font-bold ${getLevelColor(level)}`}>{score}</span>
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground text-center">Matriz de Risco</div>
          <div className="grid grid-cols-5 gap-1">
            {/* Header row */}
            <div className="text-xs text-center text-muted-foreground"></div>
            <div className="text-xs text-center text-muted-foreground">Baixo</div>
            <div className="text-xs text-center text-muted-foreground">Médio</div>
            <div className="text-xs text-center text-muted-foreground">Alto</div>
            <div className="text-xs text-center text-muted-foreground">Crítico</div>

            {/* High Probability Row */}
            <div className="text-xs flex items-center text-muted-foreground">Alta</div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`h-${i}`}
                className={`
                  aspect-square rounded border-2 flex items-center justify-center text-xs font-bold
                  ${getMatrixCellColor(3, i)}
                  ${isActiveCell(3, i) ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'}
                `}
              >
                {3 * i}
              </div>
            ))}

            {/* Medium Probability Row */}
            <div className="text-xs flex items-center text-muted-foreground">Média</div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`m-${i}`}
                className={`
                  aspect-square rounded border-2 flex items-center justify-center text-xs font-bold
                  ${getMatrixCellColor(2, i)}
                  ${isActiveCell(2, i) ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'}
                `}
              >
                {2 * i}
              </div>
            ))}

            {/* Low Probability Row */}
            <div className="text-xs flex items-center text-muted-foreground">Baixa</div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`l-${i}`}
                className={`
                  aspect-square rounded border-2 flex items-center justify-center text-xs font-bold
                  ${getMatrixCellColor(1, i)}
                  ${isActiveCell(1, i) ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'}
                `}
              >
                {1 * i}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success/20 rounded"></div>
            <span className="text-muted-foreground">Baixo (1-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-info/20 rounded"></div>
            <span className="text-muted-foreground">Médio (3-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning/20 rounded"></div>
            <span className="text-muted-foreground">Alto (6-8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive/20 rounded"></div>
            <span className="text-muted-foreground">Crítico (9-12)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RiskScoreCalculator;
