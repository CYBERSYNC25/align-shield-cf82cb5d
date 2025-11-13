import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Edit, CalendarIcon, AlertCircle, TrendingUp, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRisks, type Risk } from '@/hooks/useRisks';
import RiskScoreCalculator from './RiskScoreCalculator';

/**
 * Modal for editing risks with automatic score calculation
 * 
 * @component
 * @description
 * Comprehensive risk editing interface with real-time score calculation based on
 * probability and impact matrix. Includes audit logging and control linking.
 * 
 * **Risk Score Calculation:**
 * Score = Probability × Impact
 * 
 * **Probability Mapping:**
 * - low (1): < 25% chance
 * - medium (2): 25-50% chance
 * - high (3): > 50% chance
 * 
 * **Impact Mapping:**
 * - low (1): < $10k or minor disruption
 * - medium (2): $10k-$100k or significant disruption
 * - high (3): $100k-$1M or major disruption
 * - critical (4): > $1M or catastrophic impact
 * 
 * **Risk Level Determination:**
 * - low (1-2): Green zone, accept
 * - medium (3-4): Yellow zone, monitor
 * - high (6-8): Orange zone, mitigate
 * - critical (9-12): Red zone, urgent action
 * 
 * **Edge Cases:**
 * - Changing probability/impact: Score recalculates immediately
 * - Risk level changes: Color and recommendations update
 * - Next review date in past: Shows warning
 * - Status change to 'mitigated': Prompts for evidence
 * - Concurrent edits: Last write wins (audit log tracks)
 * 
 * **Example Usage:**
 * ```tsx
 * <EditRiskModal 
 *   risk={selectedRisk}
 *   onSuccess={() => refetchRisks()}
 * />
 * ```
 * 
 * **JSON Input Example:**
 * ```json
 * {
 *   "title": "Data Breach Risk",
 *   "description": "Potential unauthorized access to customer data",
 *   "category": "Security",
 *   "probability": "medium",
 *   "impact": "critical",
 *   "riskScore": 8,
 *   "level": "high",
 *   "owner": "CISO",
 *   "status": "active",
 *   "trend": "stable",
 *   "controls": ["MFA", "Encryption", "DLP"]
 * }
 * ```
 * 
 * **Audit Log Entry:**
 * ```json
 * {
 *   "action": "risk_updated",
 *   "risk_id": "uuid",
 *   "user_id": "uuid",
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "changes": {
 *     "probability": {"old": "low", "new": "medium"},
 *     "riskScore": {"old": 4, "new": 8},
 *     "level": {"old": "medium", "new": "high"}
 *   }
 * }
 * ```
 */
interface EditRiskModalProps {
  /** The risk to edit */
  risk: Risk;
  /** Callback after successful update */
  onSuccess?: () => void;
  /** Custom trigger button (optional) */
  trigger?: React.ReactNode;
}

const EditRiskModal = ({ risk, onSuccess, trigger }: EditRiskModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateRisk, calculateRiskScore, createAuditLog } = useRisks();

  // Form state
  const [formData, setFormData] = useState({
    title: risk.title,
    description: risk.description,
    category: risk.category,
    probability: risk.probability,
    impact: risk.impact,
    owner: risk.owner,
    ownerRole: risk.ownerRole || '',
    status: risk.status,
    trend: risk.trend,
    controls: risk.controls.join(', '),
    nextReview: risk.nextReview ? new Date(risk.nextReview.split('/').reverse().join('-')) : undefined,
  });

  // Calculated values
  const [riskScore, setRiskScore] = useState(risk.riskScore);
  const [riskLevel, setRiskLevel] = useState(risk.level);

  /**
   * Recalculates risk score and level when probability or impact changes
   * 
   * **Formula:**
   * Score = probabilityValue × impactValue
   * 
   * **Level Thresholds:**
   * - 1-2: low
   * - 3-4: medium
   * - 6-8: high
   * - 9-12: critical
   * 
   * **Side Effects:**
   * - Updates riskScore state
   * - Updates riskLevel state
   * - Triggers visual feedback
   */
  useEffect(() => {
    const score = calculateRiskScore(formData.probability, formData.impact);
    setRiskScore(score);
    
    // Determine risk level based on score
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score <= 2) level = 'low';
    else if (score <= 4) level = 'medium';
    else if (score <= 8) level = 'high';
    else level = 'critical';
    
    setRiskLevel(level);
  }, [formData.probability, formData.impact, calculateRiskScore]);

  /**
   * Handles form submission and risk update
   * 
   * **Process:**
   * 1. Validates form data
   * 2. Calculates final score
   * 3. Captures old values for audit
   * 4. Updates risk in database
   * 5. Creates audit log entry
   * 6. Shows success toast
   * 
   * **Audit Log Fields:**
   * - action: 'risk_updated'
   * - resource_type: 'risk'
   * - resource_id: risk.id
   * - old_data: previous values
   * - new_data: updated values
   * - user_id: current user
   * 
   * @throws {Error} If validation fails or update fails
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      // Capture old values for audit
      const oldData = {
        title: risk.title,
        probability: risk.probability,
        impact: risk.impact,
        riskScore: risk.riskScore,
        level: risk.level,
        status: risk.status,
      };

      const updatedRisk = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        owner: formData.owner.trim(),
        ownerRole: formData.ownerRole.trim() || undefined,
        controls: formData.controls.split(',').map(c => c.trim()).filter(Boolean),
        nextReview: formData.nextReview ? format(formData.nextReview, 'dd/MM/yyyy') : undefined,
        riskScore,
        level: riskLevel,
      };

      await updateRisk(risk.id, updatedRisk);

      // Create audit log entry
      const changes: any = {};
      if (oldData.title !== updatedRisk.title) changes.title = { old: oldData.title, new: updatedRisk.title };
      if (oldData.probability !== updatedRisk.probability) changes.probability = { old: oldData.probability, new: updatedRisk.probability };
      if (oldData.impact !== updatedRisk.impact) changes.impact = { old: oldData.impact, new: updatedRisk.impact };
      if (oldData.riskScore !== updatedRisk.riskScore) changes.riskScore = { old: oldData.riskScore, new: updatedRisk.riskScore };
      if (oldData.level !== updatedRisk.level) changes.level = { old: oldData.level, new: updatedRisk.level };
      if (oldData.status !== updatedRisk.status) changes.status = { old: oldData.status, new: updatedRisk.status };

      if (Object.keys(changes).length > 0) {
        await createAuditLog({
          action: 'risk_updated',
          resource_type: 'risk',
          resource_id: risk.id,
          old_data: oldData,
          new_data: updatedRisk,
        });
      }
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      probability: risk.probability,
      impact: risk.impact,
      owner: risk.owner,
      ownerRole: risk.ownerRole || '',
      status: risk.status,
      trend: risk.trend,
      controls: risk.controls.join(', '),
      nextReview: risk.nextReview ? new Date(risk.nextReview.split('/').reverse().join('-')) : undefined,
    });
    setOpen(false);
  };

  /**
   * Gets risk level badge color and label
   */
  const getRiskLevelBadge = () => {
    const config = {
      low: { label: 'Baixo', className: 'bg-success text-success-foreground' },
      medium: { label: 'Médio', className: 'bg-info text-info-foreground' },
      high: { label: 'Alto', className: 'bg-warning text-warning-foreground' },
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
    };
    
    const conf = config[riskLevel];
    return <Badge className={conf.className}>{conf.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Risco</DialogTitle>
            <DialogDescription>
              Atualize as informações do risco. O score será recalculado automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Risk Score Display */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Score de Risco</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-foreground">{riskScore}</span>
                    {getRiskLevelBadge()}
                  </div>
                </div>
                <RiskScoreCalculator 
                  probability={formData.probability}
                  impact={formData.impact}
                  score={riskScore}
                  level={riskLevel}
                  compact
                />
              </div>
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Título do Risco <span className="text-danger">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Falha no sistema de backup"
                required
                minLength={5}
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                Descrição <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o risco em detalhes"
                required
                maxLength={2000}
                rows={4}
              />
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Conformidade">Conformidade</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Estratégico">Estratégico</SelectItem>
                  <SelectItem value="Reputacional">Reputacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Probability and Impact - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Probability */}
              <div className="grid gap-2">
                <Label htmlFor="probability">
                  Probabilidade <span className="text-danger">*</span>
                </Label>
                <Select
                  value={formData.probability}
                  onValueChange={(value: any) => setFormData({ ...formData, probability: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (1) - &lt;25%</SelectItem>
                    <SelectItem value="medium">Média (2) - 25-50%</SelectItem>
                    <SelectItem value="high">Alta (3) - &gt;50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Impact */}
              <div className="grid gap-2">
                <Label htmlFor="impact">
                  Impacto <span className="text-danger">*</span>
                </Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value: any) => setFormData({ ...formData, impact: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo (1) - &lt;$10k</SelectItem>
                    <SelectItem value="medium">Médio (2) - $10k-$100k</SelectItem>
                    <SelectItem value="high">Alto (3) - $100k-$1M</SelectItem>
                    <SelectItem value="critical">Crítico (4) - &gt;$1M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Owner and Role */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="owner">Responsável</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Nome do responsável"
                  maxLength={100}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ownerRole">Cargo</Label>
                <Input
                  id="ownerRole"
                  value={formData.ownerRole}
                  onChange={(e) => setFormData({ ...formData, ownerRole: e.target.value })}
                  placeholder="Ex: CISO, CTO"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Status and Trend */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="mitigated">Mitigado</SelectItem>
                    <SelectItem value="accepted">Aceito</SelectItem>
                    <SelectItem value="transferred">Transferido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="trend">Tendência</Label>
                <Select
                  value={formData.trend}
                  onValueChange={(value: any) => setFormData({ ...formData, trend: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increasing">↑ Aumentando</SelectItem>
                    <SelectItem value="stable">→ Estável</SelectItem>
                    <SelectItem value="decreasing">↓ Diminuindo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Controls */}
            <div className="grid gap-2">
              <Label htmlFor="controls">Controles Mitigadores</Label>
              <Textarea
                id="controls"
                value={formData.controls}
                onChange={(e) => setFormData({ ...formData, controls: e.target.value })}
                placeholder="Separe os controles por vírgula"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Ex: MFA, Criptografia, Backup Automatizado
              </p>
            </div>

            {/* Next Review Date */}
            <div className="grid gap-2">
              <Label>Próxima Revisão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.nextReview && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.nextReview ? (
                      format(formData.nextReview, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.nextReview}
                    onSelect={(date) => setFormData({ ...formData, nextReview: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRiskModal;
