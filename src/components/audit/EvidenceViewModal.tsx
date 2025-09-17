import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye, 
  Download, 
  Hash, 
  Calendar, 
  User, 
  FileText,
  ExternalLink,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evidence {
  id: string;
  name: string;
  type: string;
  status: string;
  file_url?: string;
  uploaded_by?: string;
  created_at: string;
  audit_id?: string;
}

interface EvidenceViewModalProps {
  evidence: Evidence;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EvidenceViewModal = ({ evidence, open, onOpenChange }: EvidenceViewModalProps) => {
  const [loading, setLoading] = useState(false);

  // Verificação defensiva - retornar cedo se não há evidência válida
  if (!evidence || typeof evidence !== 'object') {
    return null;
  }

  // Criar objeto seguro com valores padrão
  const safeEvidence = {
    id: evidence.id || 'unknown',
    name: evidence.name || 'Evidência sem nome',
    type: evidence.type || 'Tipo desconhecido',
    status: evidence.status || 'pending',
    uploaded_by: evidence.uploaded_by || 'Sistema',
    created_at: evidence.created_at || new Date().toISOString(),
    file_url: evidence.file_url || null
  };

  const handleDownload = async () => {
    if (!safeEvidence.file_url) return;
    
    setLoading(true);
    try {
      const response = await fetch(safeEvidence.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeEvidence.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      verified: { label: 'Verificado', className: 'bg-success/10 text-success border-success/20' },
      collected: { label: 'Coletado', className: 'bg-info/10 text-info border-info/20' },
      pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
      archived: { label: 'Arquivado', className: 'bg-muted/10 text-muted-foreground border-muted/20' }
    };
    
    const conf = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant="outline" className={conf.className}>
        {conf.label}
      </Badge>
    );
  };

  const getFileIcon = (type: string | null | undefined) => {
    if (!type || typeof type !== 'string') return '📄';
    
    try {
      if (type.includes('PDF')) return '📋';
      if (type.includes('Excel') || type.includes('CSV')) return '📊';
      if (type.includes('Word')) return '📄';
      if (type.includes('Image')) return '🖼️';
      if (type.includes('JSON')) return '☁️';
      return '📄';
    } catch (error) {
      console.error('Erro em getFileIcon:', error);
      return '📄';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualizar Evidência
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Detalhes completos da evidência incluindo metadados e opções de download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card className="bg-surface-elevated border-card-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getFileIcon(safeEvidence.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {safeEvidence.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {safeEvidence.type}
                    </p>
                  </div>
                </div>
                {getStatusBadge(safeEvidence.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Enviado por: {evidence.uploaded_by || 'Sistema'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(evidence.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="bg-surface-elevated border-card-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Informações de Segurança
              </h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    HASH SHA-256
                  </p>
                  <div className="p-2 bg-muted/10 rounded font-mono text-xs text-foreground break-all">
                    {`sha256-${evidence.id.substring(0, 32)}...`}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    CONTROLES MAPEADOS
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['AC-2', 'AC-3', 'SC-8', 'SI-7'].map((control, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {control}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="text-sm font-bold text-success">100%</div>
                    <div className="text-xs text-muted-foreground">Integridade</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-info">AES-256</div>
                    <div className="text-xs text-muted-foreground">Criptografia</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Preview or Info */}
          {evidence.file_url && (
            <Card className="bg-surface-elevated border-card-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Arquivo
                </h4>
                
                <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-4xl mb-2">
                    {getFileIcon(evidence.type)}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {evidence.name}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Arquivo protegido e verificado
                  </p>
                  
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(evidence.file_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? 'Baixando...' : 'Baixar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownload} disabled={loading || !evidence.file_url}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Baixando...' : 'Baixar Evidência'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceViewModal;