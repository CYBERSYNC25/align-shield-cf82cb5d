import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Download, 
  FileText, 
  Calendar,
  User,
  Hash,
  Shield,
  X,
  Upload,
  Zap
} from 'lucide-react';
import { useAudits } from '@/hooks/useAudits';
import { useAutoEvidence } from '@/hooks/useAutoEvidence';
import EvidenceUploadModal from './EvidenceUploadModal';
import EvidenceViewModal from './EvidenceViewModal';
import AutoEvidenceSection from './AutoEvidenceSection';

interface Control {
  id: string;
  code: string;
  title: string;
  description?: string;
  evidence_count: number;
  owner: string;
  status: string;
}

interface ControlEvidenceModalProps {
  control: Control | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ControlEvidenceModal = ({ control, open, onOpenChange }: ControlEvidenceModalProps) => {
  const { evidence } = useAudits();
  const { hasAutoEvidence } = useAutoEvidence();
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  // Return early se não temos os dados necessários
  if (!control || !open) return null;
  
  // Garantir que evidence é um array válido
  const safeEvidence = Array.isArray(evidence) ? evidence : [];
  
  // Filtrar evidências com verificação ultra-defensiva
  const controlEvidences = safeEvidence.filter(ev => {
    // Verificação básica de existência
    if (!ev || typeof ev !== 'object') return false;
    
    // Verificação das propriedades necessárias
    const hasName = ev.name && typeof ev.name === 'string';
    const hasType = ev.type && typeof ev.type === 'string';
    const hasControlCode = control && control.code && typeof control.code === 'string';
    const hasControlTitle = control && control.title && typeof control.title === 'string';
    
    if (!hasName || !hasType || !hasControlCode || !hasControlTitle) {
      return false;
    }
    
    // Filtragem segura
    try {
      const name = ev.name.toLowerCase();
      const type = ev.type.toLowerCase();
      const code = control.code.toLowerCase();
      const title = control.title.toLowerCase();
      
      return (
        name.includes(code) ||
        type.includes(title) ||
        (control.code === 'AC-1' && name.includes('access')) ||
        (control.code === 'AC-2' && name.includes('authorization')) ||
        (control.code === 'AC-6' && name.includes('removal')) ||
        (control.code === 'SI-4' && name.includes('monitoring'))
      );
    } catch (error) {
      console.error('Erro na filtragem:', error);
      return false;
    }
  });

  const getStatusBadge = (status: string | null | undefined) => {
    const config = {
      verified: { label: 'Verificado', className: 'bg-success/10 text-success border-success/20' },
      pending_review: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
      collected: { label: 'Coletado', className: 'bg-info/10 text-info border-info/20' },
      archived: { label: 'Arquivado', className: 'bg-muted/10 text-muted-foreground border-muted/20' }
    };
    
    const statusKey = (status && typeof status === 'string') ? status : 'pending_review';
    const conf = config[statusKey as keyof typeof config] || config.pending_review;
    
    return (
      <Badge variant="outline" className={conf.className}>
        {conf.label}
      </Badge>
    );
  };

  const getFileIcon = (type: string | null | undefined) => {
    if (!type || typeof type !== 'string') return '📄';
    
    try {
      if (type.includes('PDF')) return '📄';
      if (type.includes('Excel')) return '📊';
      if (type.includes('Word')) return '📝';
      if (type.includes('Image')) return '🖼️';
      if (type.includes('JSON')) return '☁️';
      return '📄';
    } catch (error) {
      console.error('Erro em getFileIcon:', error);
      return '📄';
    }
  };

  const handleViewEvidence = (evidence: any) => {
    // Verificar se a evidência é válida antes de continuar
    if (!evidence || !evidence.id) {
      console.error('Evidência inválida:', evidence);
      return;
    }
    setSelectedEvidence(evidence);
    setViewModalOpen(true);
  };

  const handleDownload = async (evidence: any) => {
    // Verificar se a evidência é válida antes de continuar
    if (!evidence || !evidence.name) {
      console.error('Evidência inválida para download:', evidence);
      return;
    }
    
    try {
      // Simular download
      const blob = new Blob(['Conteúdo da evidência...'], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidence.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Evidências do Controle {control.code}
            </DialogTitle>
            <DialogDescription>
              {control.title} - Visualize e gerencie todas as evidências relacionadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Control Info */}
            <Card className="bg-surface-elevated border-card-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">
                        {control.code}
                      </Badge>
                      <Badge variant="secondary">
                        {control.evidence_count} evidência(s)
                      </Badge>
                      {hasAutoEvidence(control.code) && (
                        <Badge className="bg-info/10 text-info border-info/20">
                          <Zap className="h-3 w-3 mr-1" />
                          Monitorado Automaticamente
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground">{control.title}</h3>
                    {control.description && (
                      <p className="text-sm text-muted-foreground">{control.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Proprietário: {control.owner}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <EvidenceUploadModal onSuccess={() => {}} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto Evidence Section */}
            <AutoEvidenceSection controlCode={control.code} />

            <Separator />

            {/* Manual Evidence List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">
                    Evidências Manuais ({controlEvidences.length})
                  </h4>
                </div>
              </div>

              {controlEvidences.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Nenhuma evidência encontrada</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Não há evidências específicas para este controle ainda.
                    </p>
                    <EvidenceUploadModal onSuccess={() => {}} />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {controlEvidences.map((evidence) => {
                    // Verificação ultra-defensiva antes de renderizar
                    if (!evidence || typeof evidence !== 'object' || !evidence.id) {
                      return null;
                    }
                    
                    // Preparar dados seguros para renderização
                    const safeEvidence = {
                      id: evidence.id || 'unknown',
                      name: evidence.name || 'Evidência sem nome',
                      type: evidence.type || 'Tipo desconhecido',
                      status: evidence.status || 'pending_review',
                      uploaded_by: evidence.uploaded_by || 'Usuário desconhecido',
                      created_at: evidence.created_at || new Date().toISOString()
                    };
                    
                    return (
                      <Card key={safeEvidence.id} className="bg-surface-elevated border-card-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="text-2xl">{getFileIcon(safeEvidence.type)}</div>
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground truncate">
                                    {safeEvidence.name}
                                  </h4>
                                  {getStatusBadge(safeEvidence.status)}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    <span>{safeEvidence.type}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{safeEvidence.uploaded_by}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {(() => {
                                        try {
                                          return new Date(safeEvidence.created_at).toLocaleDateString('pt-BR');
                                        } catch {
                                          return 'Data inválida';
                                        }
                                      })()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                                  <Hash className="h-3 w-3" />
                                  <span>SHA-256: abc123...def456</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewEvidence(evidence)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(evidence)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evidence View Modal */}
      <EvidenceViewModal
        evidence={selectedEvidence}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
      />
    </>
  );
};

export default ControlEvidenceModal;