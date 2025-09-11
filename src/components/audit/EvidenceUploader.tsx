import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Shield, 
  AlertCircle,
  CheckCircle,
  X,
  File,
  Image,
  FileCode,
  Archive
} from 'lucide-react';

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

interface EvidenceUploaderProps {
  trigger?: React.ReactNode;
}

const EvidenceUploader = ({ trigger }: EvidenceUploaderProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const [evidenceData, setEvidenceData] = useState({
    title: '',
    source: '',
    framework: '',
    controls: '',
    description: ''
  });

  const frameworks = [
    'SOC 2 Type II',
    'ISO 27001:2022',
    'LGPD',
    'GDPR',
    'NIST CSF',
    'CIS Controls',
    'COBIT',
    'PCI DSS'
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      file,
      progress: 0,
      status: 'uploading',
      id: Date.now().toString() + Math.random().toString(),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Simular upload
    newFiles.forEach((uploadFile) => {
      simulateUpload(uploadFile.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 100, status: 'completed' } : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-blue-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FileCode className="h-8 w-8 text-green-600" />;
      case 'zip':
      case 'rar':
        return <Archive className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evidenceData.title || files.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e pelo menos um arquivo são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Simular envio dos dados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Evidência enviada",
        description: "As evidências foram enviadas com sucesso!",
      });

      // Reset form
      setEvidenceData({
        title: '',
        source: '',
        framework: '',
        controls: '',
        description: ''
      });
      setFiles([]);
      setOpen(false);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar evidências. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload de Evidências
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Upload de Evidências de Compliance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Evidência *</Label>
              <Input
                id="title"
                placeholder="Ex: Políticas de segurança atualizadas"
                value={evidenceData.title}
                onChange={(e) => setEvidenceData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Fonte</Label>
              <Input
                id="source"
                placeholder="Ex: Departamento de TI"
                value={evidenceData.source}
                onChange={(e) => setEvidenceData(prev => ({ ...prev, source: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select value={evidenceData.framework} onValueChange={(value) => setEvidenceData(prev => ({ ...prev, framework: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((framework) => (
                    <SelectItem key={framework} value={framework}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {framework}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="controls">Controles Mapeados</Label>
              <Input
                id="controls"
                placeholder="Ex: CC6.1, CC6.2, CC6.3"
                value={evidenceData.controls}
                onChange={(e) => setEvidenceData(prev => ({ ...prev, controls: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o conteúdo e propósito desta evidência..."
              value={evidenceData.description}
              onChange={(e) => setEvidenceData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Upload Area */}
          <div className="space-y-4">
            <Label>Arquivos de Evidência *</Label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporta: PDF, DOC, XLS, imagens, ZIP (máx. 50MB por arquivo)
                </p>
              </div>
              
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
              
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Selecionar Arquivos
              </Button>
            </div>

            {/* Lista de arquivos */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Arquivos Selecionados ({files.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((uploadFile) => (
                    <Card key={uploadFile.id} className="p-4">
                      <div className="flex items-center space-x-3">
                        {uploadFile.preview ? (
                          <img
                            src={uploadFile.preview}
                            alt={uploadFile.file.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          getFileIcon(uploadFile.file.name)
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{uploadFile.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {uploadFile.status === 'uploading' && (
                            <div className="mt-2">
                              <Progress value={uploadFile.progress} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.round(uploadFile.progress)}% enviado
                              </p>
                            </div>
                          )}
                          
                          {uploadFile.status === 'completed' && (
                            <div className="flex items-center text-green-600 mt-1">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Enviado com sucesso</span>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informações importantes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Certifique-se de que os arquivos não contenham 
              informações confidenciais não autorizadas. Todos os uploads são registrados 
              para auditoria e têm hash de integridade calculado automaticamente.
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={uploading || files.some(f => f.status === 'uploading')}
              className="flex-1"
            >
              {uploading ? "Processando..." : `Enviar ${files.length} arquivo(s)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceUploader;