import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAudits } from '@/hooks/useAudits';
import { Upload, FileText, Plus } from 'lucide-react';

interface EvidenceUploadModalProps {
  onSuccess?: () => void;
}

const EvidenceUploadModal = ({ onSuccess }: EvidenceUploadModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { createEvidence, audits } = useAudits();

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    audit_id: '',
    status: 'pending' as 'pending' | 'verified' | 'rejected',
    uploaded_by: ''
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 
              file.type.includes('excel') || file.type.includes('sheet') ? 'Excel' :
              file.type.includes('word') ? 'Word' :
              file.type.includes('image') ? 'Image' : 'Document'
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Em um sistema real, você faria upload do arquivo aqui
      const file_url = selectedFile ? `/evidence/${selectedFile.name}` : null;
      
      const evidenceData = {
        ...formData,
        file_url
      };

      const result = await createEvidence(evidenceData);
      
      if (result) {
        setOpen(false);
        setFormData({
          name: '',
          type: '',
          audit_id: '',
          status: 'pending',
          uploaded_by: ''
        });
        setSelectedFile(null);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao fazer upload de evidência:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload de Evidência
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload de Nova Evidência
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo *</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.json,.csv"
              required
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Evidência</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome descritivo da evidência"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Documento</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Excel">Planilha Excel</SelectItem>
                  <SelectItem value="Word">Documento Word</SelectItem>
                  <SelectItem value="Image">Imagem</SelectItem>
                  <SelectItem value="JSON">Arquivo JSON</SelectItem>
                  <SelectItem value="CSV">Arquivo CSV</SelectItem>
                  <SelectItem value="Log">Arquivo de Log</SelectItem>
                  <SelectItem value="Policy">Política</SelectItem>
                  <SelectItem value="Certificate">Certificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audit_id">Auditoria Relacionada</Label>
              <Select 
                value={formData.audit_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, audit_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a auditoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma auditoria específica</SelectItem>
                  {audits.map(audit => (
                    <SelectItem key={audit.id} value={audit.id}>
                      {audit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploaded_by">Enviado por</Label>
              <Input
                id="uploaded_by"
                value={formData.uploaded_by}
                onChange={(e) => setFormData(prev => ({ ...prev, uploaded_by: e.target.value }))}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'pending' | 'verified' | 'rejected') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente de Revisão</SelectItem>
                <SelectItem value="verified">Verificado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedFile}>
              {loading ? 'Enviando...' : 'Enviar Evidência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceUploadModal;