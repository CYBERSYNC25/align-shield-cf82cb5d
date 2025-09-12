import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  FileText, 
  Image, 
  File,
  ExternalLink 
} from 'lucide-react';

interface FileViewerProps {
  files: { name: string; url: string; type?: string }[];
  title?: string;
  className?: string;
}

const FileViewer = ({ files, title = "Arquivos", className }: FileViewerProps) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string; type?: string } | null>(null);

  const getFileIcon = (type: string = '') => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileTypeLabel = (type: string = '') => {
    if (type.startsWith('image/')) return 'Imagem';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word')) return 'Word';
    if (type.includes('excel') || type.includes('sheet')) return 'Excel';
    return 'Documento';
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImage = (type: string = '') => type.startsWith('image/');
  const isPDF = (type: string = '') => type.includes('pdf');

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum arquivo disponível</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {getFileTypeLabel(file.type)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(file)}
                className="h-8 w-8 p-0"
                title="Visualizar"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadFile(file.url, file.name)}
                className="h-8 w-8 p-0"
                title="Download"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
                className="h-8 w-8 p-0"
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* File Preview Modal */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFile && getFileIcon(selectedFile.type)}
              {selectedFile?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="flex-1 overflow-auto">
              {isImage(selectedFile.type) ? (
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.name}
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              ) : isPDF(selectedFile.type) ? (
                <iframe 
                  src={selectedFile.url}
                  className="w-full h-[70vh] border rounded-lg"
                  title={selectedFile.name}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Prévia não disponível</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Este tipo de arquivo não pode ser visualizado no navegador
                  </p>
                  <div className="space-x-2">
                    <Button onClick={() => downloadFile(selectedFile.url, selectedFile.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(selectedFile.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir em nova aba
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileViewer;