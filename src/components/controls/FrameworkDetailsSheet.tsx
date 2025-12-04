import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Zap, Link as LinkIcon, Plus, ShieldCheck } from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  description: string;
  version: string;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  missingControls: number;
  compliance: number;
  status: string;
  automatedControls: number;
  lastVerification: string;
  categories: string[];
}

interface FrameworkDetailsSheetProps {
  framework: Framework | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock control data for each framework
const getFrameworkControls = (frameworkId: string) => {
  const controlsByFramework: Record<string, Array<{
    id: string;
    code: string;
    title: string;
    category: string;
    status: 'implemented' | 'partial' | 'missing';
    automated: boolean;
    evidence?: string;
  }>> = {
    soc2: [
      { id: '1', code: 'CC1.1', title: 'Demonstra compromisso com integridade e valores éticos', category: 'Common Criteria', status: 'implemented', automated: false, evidence: 'Política de Ética - v2.0' },
      { id: '2', code: 'CC1.2', title: 'Exercício de supervisão da governança', category: 'Common Criteria', status: 'implemented', automated: false, evidence: 'Atas de Reuniões do Comitê' },
      { id: '3', code: 'CC2.1', title: 'Comunicação das responsabilidades de segurança', category: 'Common Criteria', status: 'implemented', automated: false, evidence: 'Programa de Treinamento' },
      { id: '4', code: 'CC6.1', title: 'Implementação de controles lógicos e físicos', category: 'Common Criteria', status: 'implemented', automated: true, evidence: 'Logs de Acesso - Azure AD' },
      { id: '5', code: 'CC6.6', title: 'Implementação de detecção e prevenção de vulnerabilidades', category: 'Common Criteria', status: 'implemented', automated: true, evidence: 'Monitoramento de CPU - Agente MikroTik' },
      { id: '6', code: 'CC7.2', title: 'Detecção de incidentes de segurança', category: 'Common Criteria', status: 'partial', automated: true, evidence: 'Sistema de Alertas' },
      { id: '7', code: 'CC8.1', title: 'Autorização de mudanças', category: 'Common Criteria', status: 'implemented', automated: false, evidence: 'Workflow de Aprovações' },
      { id: '8', code: 'A1.1', title: 'Monitoramento de disponibilidade do sistema', category: 'Availability', status: 'implemented', automated: true, evidence: 'Monitoramento de Rede - MikroTik' },
      { id: '9', code: 'A1.2', title: 'Backup e recuperação de dados', category: 'Availability', status: 'partial', automated: true, evidence: 'Logs de Backup Automático' },
      { id: '10', code: 'PI1.1', title: 'Obtenção de consentimento para coleta de dados', category: 'Privacy', status: 'missing', automated: false },
    ],
    iso27001: [
      { id: '1', code: 'A.5.1', title: 'Políticas para segurança da informação', category: 'Organizational', status: 'implemented', automated: false, evidence: 'Política de Segurança - v3.1' },
      { id: '2', code: 'A.6.1', title: 'Organização interna', category: 'Organizational', status: 'implemented', automated: false, evidence: 'Organograma e Responsabilidades' },
      { id: '3', code: 'A.8.1', title: 'Inventário de ativos', category: 'Asset Management', status: 'implemented', automated: true, evidence: 'Inventário de Ativos - Agente MikroTik' },
      { id: '4', code: 'A.8.2', title: 'Propriedade de ativos', category: 'Asset Management', status: 'implemented', automated: false, evidence: 'Registro de Proprietários' },
      { id: '5', code: 'A.9.1', title: 'Controle de acesso baseado em requisitos de negócio', category: 'Access Control', status: 'implemented', automated: true, evidence: 'Azure AD - Políticas de Acesso' },
      { id: '6', code: 'A.9.2', title: 'Gerenciamento de acesso do usuário', category: 'Access Control', status: 'implemented', automated: true, evidence: 'Azure AD - Provisionamento' },
      { id: '7', code: 'A.9.4', title: 'Controle de acesso a código-fonte', category: 'Access Control', status: 'partial', automated: true, evidence: 'GitHub - Logs de Acesso' },
      { id: '8', code: 'A.12.1', title: 'Procedimentos operacionais e responsabilidades', category: 'Operations', status: 'implemented', automated: false, evidence: 'Procedimentos Operacionais' },
      { id: '9', code: 'A.12.4', title: 'Logging e monitoramento', category: 'Operations', status: 'implemented', automated: true, evidence: 'Monitoramento - MikroTik + Azure' },
      { id: '10', code: 'A.16.1', title: 'Gestão de incidentes de segurança', category: 'Incident Management', status: 'partial', automated: false, evidence: 'Playbooks de Incidentes' },
    ],
    lgpd: [
      { id: '1', code: 'Art. 6', title: 'Princípios do tratamento de dados', category: 'Principles', status: 'implemented', automated: false, evidence: 'Política de Privacidade' },
      { id: '2', code: 'Art. 7', title: 'Bases legais para tratamento', category: 'Legal Basis', status: 'implemented', automated: false, evidence: 'Mapeamento de Bases Legais' },
      { id: '3', code: 'Art. 8', title: 'Consentimento do titular', category: 'Consent', status: 'partial', automated: true, evidence: 'Sistema de Consentimento' },
      { id: '4', code: 'Art. 9', title: 'Direitos do titular', category: 'Rights', status: 'implemented', automated: true, evidence: 'Portal do Titular' },
      { id: '5', code: 'Art. 37', title: 'Registro de operações de tratamento', category: 'Accountability', status: 'implemented', automated: true, evidence: 'Logs de Tratamento - Supabase' },
      { id: '6', code: 'Art. 46', title: 'Medidas de segurança técnicas e administrativas', category: 'Security', status: 'implemented', automated: true, evidence: 'Controles de Segurança - Azure' },
      { id: '7', code: 'Art. 48', title: 'Comunicação de incidentes', category: 'Incidents', status: 'implemented', automated: false, evidence: 'Procedimento de Notificação' },
      { id: '8', code: 'Art. 49', title: 'Avaliação de impacto', category: 'DPIA', status: 'partial', automated: false, evidence: 'Modelo de RIPD' },
      { id: '9', code: 'Art. 50', title: 'Encarregado de dados (DPO)', category: 'DPO', status: 'implemented', automated: false, evidence: 'Designação de DPO' },
      { id: '10', code: 'Art. 52', title: 'Transferência internacional de dados', category: 'Transfers', status: 'missing', automated: false },
    ],
    gdpr: [
      { id: '1', code: 'Art. 5', title: 'Princípios do tratamento de dados', category: 'Principles', status: 'implemented', automated: false, evidence: 'Política de Privacidade GDPR' },
      { id: '2', code: 'Art. 6', title: 'Bases legais para processamento', category: 'Legal Basis', status: 'implemented', automated: false, evidence: 'Mapeamento de Bases Legais' },
      { id: '3', code: 'Art. 7', title: 'Condições para consentimento', category: 'Consent', status: 'partial', automated: true, evidence: 'Sistema de Consentimento' },
      { id: '4', code: 'Art. 15', title: 'Direito de acesso do titular', category: 'Rights', status: 'implemented', automated: true, evidence: 'Portal GDPR' },
      { id: '5', code: 'Art. 25', title: 'Data protection by design', category: 'Design', status: 'implemented', automated: false, evidence: 'Processo de Desenvolvimento' },
      { id: '6', code: 'Art. 30', title: 'Registros de atividades de processamento', category: 'Accountability', status: 'implemented', automated: true, evidence: 'Logs de Tratamento - Supabase' },
      { id: '7', code: 'Art. 32', title: 'Segurança do processamento', category: 'Security', status: 'implemented', automated: true, evidence: 'Controles de Segurança - Azure' },
      { id: '8', code: 'Art. 33', title: 'Notificação de violação de dados', category: 'Breach', status: 'implemented', automated: false, evidence: 'Procedimento de Notificação' },
      { id: '9', code: 'Art. 35', title: 'Avaliação de impacto à proteção de dados', category: 'DPIA', status: 'partial', automated: false, evidence: 'Modelo de DPIA' },
      { id: '10', code: 'Art. 44', title: 'Transferências internacionais', category: 'Transfers', status: 'missing', automated: false },
    ],
  };

  return controlsByFramework[frameworkId] || [];
};

const FrameworkDetailsSheet = ({ framework, open, onOpenChange }: FrameworkDetailsSheetProps) => {
  if (!framework) return null;

  const controls = getFrameworkControls(framework.id);
  const implementedCount = controls.filter(c => c.status === 'implemented').length;
  const partialCount = controls.filter(c => c.status === 'partial').length;
  const missingCount = controls.filter(c => c.status === 'missing').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-2xl">{framework.name}</SheetTitle>
          <SheetDescription>{framework.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Framework Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Conformidade Global</div>
                <div className="text-3xl font-bold text-primary">{framework.compliance}%</div>
              </div>
              <Badge variant="outline" className="text-sm">{framework.version}</Badge>
            </div>

            <Progress value={framework.compliance} className="h-2" />

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center space-y-1">
                <div className="text-xl font-semibold text-success">{implementedCount}</div>
                <div className="text-muted-foreground">Implementados</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-semibold text-warning">{partialCount}</div>
                <div className="text-muted-foreground">Parciais</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-semibold text-danger">{missingCount}</div>
                <div className="text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </div>

          {/* Controls List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Controles Detalhados</h3>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Controle
              </Button>
            </div>
            
            {controls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/20">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Nenhum controle associado
                </h4>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Nenhum controle associado ao framework {framework.name}.
                  <br />
                  Clique em "+ Adicionar Controle" para começar.
                </p>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Controle
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3 pr-4">
                  {controls.map((control) => (
                    <div
                      key={control.id}
                      className="border border-border rounded-lg p-4 space-y-2 bg-surface-elevated hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {control.code}
                            </Badge>
                            {control.automated && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Auto
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium text-foreground">{control.title}</div>
                          <div className="text-xs text-muted-foreground">{control.category}</div>
                        </div>
                        
                        <div>
                          {control.status === 'implemented' && (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          )}
                          {control.status === 'partial' && (
                            <Clock className="h-5 w-5 text-warning" />
                          )}
                          {control.status === 'missing' && (
                            <XCircle className="h-5 w-5 text-danger" />
                          )}
                        </div>
                      </div>

                      {control.evidence && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                          <LinkIcon className="h-3 w-3" />
                          <span>Evidência: <span className="text-foreground font-medium">{control.evidence}</span></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FrameworkDetailsSheet;
