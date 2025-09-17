import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye, 
  Download, 
  FileText, 
  Calendar,
  User,
  Hash,
  Shield,
  X,
  Upload
} from 'lucide-react';
import { useAudits } from '@/hooks/useAudits';
import EvidenceUploadModal from './EvidenceUploadModal';
import EvidenceViewModal from './EvidenceViewModal';

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
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  if (!control) return null;

  // Filtrar evidências relacionadas ao controle com verificação de null/undefined
  const controlEvidences = evidence?.filter(ev => 
    ev && ev.name && ev.type && (
      ev.name.toLowerCase().includes(control.code.toLowerCase()) ||
      ev.type.toLowerCase().includes(control.title.toLowerCase()) ||
      (control.code === 'AC-1' && ev.name.toLowerCase().includes('access')) ||
      (control.code === 'AC-2' && ev.name.toLowerCase().includes('authorization')) ||
      (control.code === 'AC-6' && ev.name.toLowerCase().includes('removal')) ||
      (control.code === 'SI-4' && ev.name.toLowerCase().includes('monitoring'))
    )
  ) || [];

  const getStatusBadge = (status: string) => {
    const config = {
      verified: { label: 'Verificado', className: 'bg-success/10 text-success border-success/20' },
      pending_review: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
      collected: { label: 'Coletado', className: 'bg-info/10 text-info border-info/20' },
      archived: { label: 'Arquivado', className: 'bg-muted/10 text-muted-foreground border-muted/20' }
    };
    
    const conf = config[status as keyof typeof config] || config.pending_review;
    
    return (
      <Badge variant="outline" className={conf.className}>
        {conf.label}
      </Badge>
    );
  };

  const getFileIcon = (type: string) => {
    if (type.includes('PDF')) return '📄';
    if (type.includes('Excel')) return '📊';
    if (type.includes('Word')) return '📝';
    if (type.includes('Image')) return '🖼️';
    if (type.includes('JSON')) return '☁️';
    return '📄';
  };

  const handleViewEvidence = (evidence: any) => {
    setSelectedEvidence(evidence);
    setViewModalOpen(true);
  };

  const handleDownload = async (evidence: any) => {
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {control.code}
                      </Badge>
                      <Badge variant="secondary">
                        {control.evidence_count} evidência(s)
                      </Badge>
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

            {/* Evidence List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  Evidências Relacionadas ({controlEvidences.length})
                </h4>
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
                  {controlEvidences.map((evidence) => (
                    <Card key={evidence.id} className="bg-surface-elevated border-card-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="text-2xl">{getFileIcon(evidence.type)}</div>
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground truncate">
                                  {evidence.name}
                                </h4>
                                {getStatusBadge(evidence.status)}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span>{evidence.type}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{evidence.uploaded_by}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(evidence.created_at).toLocaleDateString('pt-BR')}</span>
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
                  ))}
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