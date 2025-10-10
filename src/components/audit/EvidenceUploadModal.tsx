import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAudits } from '@/hooks/useAudits';
import { Upload, FileText, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import FileUploader from '@/components/common/FileUploader';

interface EvidenceUploadModalProps {
  onSuccess?: () => void;
}

const EvidenceUploadModal = ({ onSuccess }: EvidenceUploadModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { createEvidence, audits } = useAudits();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    audit_id: '',
    status: 'pending' as 'pending' | 'verified' | 'rejected',
    uploaded_by: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (!formData.name || !formData.type) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      const evidenceData = {
        ...formData,
        file_url: uploadedFiles[0], // Primary file
        uploaded_by: formData.uploaded_by || user.user_metadata?.display_name || user.email || 'Usuário Anônimo',
        audit_id: formData.audit_id === 'none' || !formData.audit_id ? null : formData.audit_id
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
        setUploadedFiles([]);
        onSuccess?.();
        
        toast({
          title: "Evidência enviada",
          description: "A evidência foi carregada com sucesso"
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload de evidência:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao enviar evidência",
        variant: "destructive"
      });
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
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload de Nova Evidência
          </DialogTitle>
          <DialogDescription>
            Faça upload de arquivos de evidência para auditoria
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Arquivo da Evidência *</Label>
            <FileUploader
              bucket="evidence"
              folder="audit-evidence"
              onUploadComplete={(urls) => {
                setUploadedFiles(urls);
                // Auto-fill name if not already set
                if (!formData.name && urls.length > 0) {
                  const fileName = urls[0].split('/').pop()?.split('.')[0] || 'Nova Evidência';
                  setFormData(prev => ({ ...prev, name: fileName }));
                }
              }}
              multiple={false}
              maxSize={10 * 1024 * 1024} // 10MB
            />
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
                  <SelectItem value="none">Nenhuma auditoria específica</SelectItem>
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
            <Button type="submit" disabled={loading || uploadedFiles.length === 0}>
              {loading ? 'Enviando...' : 'Enviar Evidência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceUploadModal;