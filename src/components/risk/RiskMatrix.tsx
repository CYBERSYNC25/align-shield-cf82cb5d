import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRisks } from '@/hooks/useRisks';
import { Grid3x3, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Interactive Risk Matrix Heatmap
 * 
 * @component
 * @description
 * Visual risk matrix displaying all risks plotted on a probability vs impact grid.
 * Provides interactive heatmap with hover details and color-coded cells.
 * 
 * **Matrix Dimensions:**
 * - X-axis: Impact (Low → Critical)
 * - Y-axis: Probability (Low → High)
 * - Cell Color: Based on risk score
 * - Cell Content: Number of risks in that cell
 * 
 * **Interaction:**
 * - Hover over cell: Shows list of risks
 * - Click cell: Filters risks list
 * - Color intensity: Indicates severity
 * 
 * **Color Coding:**
 * - Green (Low): 1-2 score
 * - Blue (Medium): 3-4 score
 * - Orange (High): 6-8 score
 * - Red (Critical): 9-12 score
 * 
 * **Edge Cases:**
 * - No risks: Shows empty matrix
 * - All risks in one cell: Shows count
 * - Large number of risks: Scrollable detail
 * 
 * **Example Usage:**
 * ```tsx
 * <RiskMatrix />
 * ```
 * 
 * **Data Structure:**
 * ```json
 * {
 *   "matrix": {
 *     "high_critical": {
 *       "score": 12,
 *       "level": "critical",
 *       "count": 3,
 *       "risks": ["Risk 1", "Risk 2", "Risk 3"]
 *     }
 *   }
 * }
 * ```
 */

interface MatrixCell {
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  risks: { id: string; title: string }[];
}

const RiskMatrix = () => {
  const { risks, loading } = useRisks();

  /**
   * Maps text values to numeric values for calculation
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
   * Builds matrix data structure from risks
   * Groups risks by their probability and impact combination
   * 
   * @returns Matrix cells with risk counts and details
   */
  const buildMatrix = (): MatrixCell[][] => {
    const probabilities: Array<'low' | 'medium' | 'high'> = ['high', 'medium', 'low'];
    const impacts: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];

    return probabilities.map((prob) =>
      impacts.map((imp) => {
        const score = probabilityValues[prob] * impactValues[imp];
        let level: 'low' | 'medium' | 'high' | 'critical';
        if (score <= 2) level = 'low';
        else if (score <= 4) level = 'medium';
        else if (score <= 8) level = 'high';
        else level = 'critical';

        const cellRisks = risks.filter(
          (r) => r.probability === prob && r.impact === imp
        );

        return {
          probability: prob,
          impact: imp,
          score,
          level,
          count: cellRisks.length,
          risks: cellRisks.map((r) => ({ id: r.id, title: r.title })),
        };
      })
    );
  };

  /**
   * Gets cell background color based on risk level
   * Higher opacity for cells with more risks
   */
  const getCellColor = (level: string, count: number) => {
    const opacity = count === 0 ? '5' : count === 1 ? '20' : count <= 3 ? '40' : '60';
    
    const colors = {
      low: `bg-success/${opacity}`,
      medium: `bg-info/${opacity}`,
      high: `bg-warning/${opacity}`,
      critical: `bg-destructive/${opacity}`,
    };
    
    return colors[level as keyof typeof colors] || 'bg-muted/10';
  };

  /**
   * Gets cell border color
   */
  const getCellBorderColor = (level: string) => {
    const colors = {
      low: 'border-success/30',
      medium: 'border-info/30',
      high: 'border-warning/30',
      critical: 'border-destructive/30',
    };
    
    return colors[level as keyof typeof colors] || 'border-border';
  };

  /**
   * Gets text color for score display
   */
  const getScoreColor = (level: string) => {
    const colors = {
      low: 'text-success',
      medium: 'text-info',
      high: 'text-warning',
      critical: 'text-destructive',
    };
    
    return colors[level as keyof typeof colors] || 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Matriz de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const matrix = buildMatrix();

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Matriz de Risco Interativa
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">
                  A matriz mostra a distribuição dos riscos por probabilidade e impacto.
                  Passe o mouse sobre as células para ver detalhes dos riscos.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/40 border border-success/30 rounded"></div>
              <span className="text-muted-foreground">Baixo (1-2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-info/40 border border-info/30 rounded"></div>
              <span className="text-muted-foreground">Médio (3-4)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warning/40 border border-warning/30 rounded"></div>
              <span className="text-muted-foreground">Alto (6-8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive/40 border border-destructive/30 rounded"></div>
              <span className="text-muted-foreground">Crítico (9-12)</span>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-5 gap-2">
                {/* Header Row */}
                <div className="text-sm font-medium text-muted-foreground flex items-end justify-center pb-2">
                  Probabilidade →<br />Impacto ↓
                </div>
                <div className="text-center text-sm font-medium text-muted-foreground pb-2">
                  Baixo<br />(1)
                </div>
                <div className="text-center text-sm font-medium text-muted-foreground pb-2">
                  Médio<br />(2)
                </div>
                <div className="text-center text-sm font-medium text-muted-foreground pb-2">
                  Alto<br />(3)
                </div>
                <div className="text-center text-sm font-medium text-muted-foreground pb-2">
                  Crítico<br />(4)
                </div>

                {/* Matrix Rows */}
                {matrix.map((row, rowIndex) => (
                  <>
                    {/* Row Label */}
                    <div className="flex items-center justify-end pr-2 text-sm font-medium text-muted-foreground">
                      {rowIndex === 0 && 'Alta (3)'}
                      {rowIndex === 1 && 'Média (2)'}
                      {rowIndex === 2 && 'Baixa (1)'}
                    </div>

                    {/* Row Cells */}
                    {row.map((cell, colIndex) => (
                      <TooltipProvider key={`${rowIndex}-${colIndex}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                aspect-square rounded-lg border-2 p-2
                                flex flex-col items-center justify-center
                                cursor-pointer transition-all hover:scale-105
                                ${getCellColor(cell.level, cell.count)}
                                ${getCellBorderColor(cell.level)}
                                ${cell.count > 0 ? 'hover:ring-2 hover:ring-foreground/20' : ''}
                              `}
                            >
                              {/* Score */}
                              <div className={`text-xs font-bold ${getScoreColor(cell.level)}`}>
                                {cell.score}
                              </div>

                              {/* Risk Count */}
                              {cell.count > 0 && (
                                <div className="mt-1">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs px-1.5 py-0.5"
                                  >
                                    {cell.count}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>

                          {/* Tooltip with Risk Details */}
                          {cell.count > 0 && (
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-2">
                                <div className="font-medium text-xs">
                                  {cell.count} risco{cell.count > 1 ? 's' : ''} nesta célula
                                </div>
                                <div className="space-y-1">
                                  {cell.risks.map((risk) => (
                                    <div 
                                      key={risk.id}
                                      className="text-xs flex items-start gap-1"
                                    >
                                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      <span>{risk.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {risks.filter(r => r.level === 'critical').length}
              </div>
              <div className="text-xs text-muted-foreground">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {risks.filter(r => r.level === 'high').length}
              </div>
              <div className="text-xs text-muted-foreground">Altos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {risks.filter(r => r.level === 'medium').length}
              </div>
              <div className="text-xs text-muted-foreground">Médios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {risks.filter(r => r.level === 'low').length}
              </div>
              <div className="text-xs text-muted-foreground">Baixos</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMatrix;
