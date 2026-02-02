import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Files, 
  Upload, 
  FileText, 
  Image, 
  FolderOpen,
  HardDrive 
} from 'lucide-react';
import FileUploader from '@/components/common/FileUploader';
import FileViewer from '@/components/common/FileViewer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const FileManagement = () => {
  const { user } = useAuth();
  const [evidenceFiles, setEvidenceFiles] = useState<{ name: string; url: string; type?: string }[]>([]);
  const [documentFiles, setDocumentFiles] = useState<{ name: string; url: string; type?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Load files from storage (simulated for demo)
  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      // Load evidence files
      const { data: evidenceData } = await supabase.storage
        .from('evidence')
        .list(`${user?.id}/audit-evidence`, { limit: 100 });

      if (evidenceData) {
        const evidenceFiles = evidenceData.map(file => ({
          name: file.name,
          url: supabase.storage.from('evidence').getPublicUrl(`${user?.id}/audit-evidence/${file.name}`).data.publicUrl,
          type: getFileType(file.name)
        }));
        setEvidenceFiles(evidenceFiles);
      }

      // Load document files
      const { data: documentData } = await supabase.storage
        .from('documents')
        .list(`${user?.id}/policies`, { limit: 100 });

      if (documentData) {
        const documentFiles = documentData.map(file => ({
          name: file.name,
          url: supabase.storage.from('documents').getPublicUrl(`${user?.id}/policies/${file.name}`).data.publicUrl,
          type: getFileType(file.name)
        }));
        setDocumentFiles(documentFiles);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'doc':
      case 'docx': return 'application/msword';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image/' + extension;
      default: return 'application/octet-stream';
    }
  };

  const handleEvidenceUpload = (urls: string[]) => {
    const newFiles = urls.map(url => ({
      name: url.split('/').pop() || 'Arquivo',
      url,
      type: getFileType(url)
    }));
    setEvidenceFiles(prev => [...prev, ...newFiles]);
  };

  const handleDocumentUpload = (urls: string[]) => {
    const newFiles = urls.map(url => ({
      name: url.split('/').pop() || 'Documento',
      url,
      type: getFileType(url)
    }));
    setDocumentFiles(prev => [...prev, ...newFiles]);
  };

  const totalFiles = evidenceFiles.length + documentFiles.length;
  const totalSize = "~45.2 MB"; // Simulated

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Files className="h-8 w-8 text-primary" />
            Gerenciamento de Arquivos
          </h1>
          <p className="text-muted-foreground mt-2">
            Centralize e gerencie todos os documentos e evidências de compliance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Arquivos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              Evidências e documentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Utilizado</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSize}</div>
            <p className="text-xs text-muted-foreground">
              De 1GB disponível
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimos Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Nos últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* File Management Tabs */}
      <Tabs defaultValue="evidence" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Evidências
            <Badge variant="secondary">{evidenceFiles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Documentos
            <Badge variant="secondary">{documentFiles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evidências de Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileViewer 
                files={evidenceFiles} 
                title="Arquivos de Evidência"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Documentos e Políticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileViewer 
                files={documentFiles} 
                title="Documentos"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload de Evidências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader
                  bucket="evidence"
                  folder="audit-evidence"
                  onUploadComplete={handleEvidenceUpload}
                  multiple={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Upload de Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader
                  bucket="documents"
                  folder="policies"
                  onUploadComplete={handleDocumentUpload}
                  multiple={true}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileManagement;