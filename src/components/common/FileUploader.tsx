import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  Download,
  Eye 
} from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  bucket: 'evidence' | 'documents';
  folder?: string;
  multiple?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number;
  onUploadComplete?: (urls: string[]) => void;
  className?: string;
  disabled?: boolean;
}

const FileUploader = ({
  bucket,
  folder,
  multiple = true,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/*': ['.txt', '.csv']
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadComplete,
  className,
  disabled = false
}: FileUploaderProps) => {
  const { uploadFile, uploads, clearUploads } = useFileUpload();
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: string }[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;

    const uploadPromises = acceptedFiles.map(async (file) => {
      const result = await uploadFile(file, bucket, folder);
      if (result.url) {
        const fileData = { name: file.name, url: result.url, type: file.type };
        setUploadedFiles(prev => [...prev, fileData]);
        return result.url;
      }
      return null;
    });

    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter(Boolean) as string[];
    
    if (validUrls.length > 0 && onUploadComplete) {
      onUploadComplete(validUrls);
    }
  }, [uploadFile, bucket, folder, onUploadComplete, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,
    maxSize,
    disabled
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          isDragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "hover:border-primary hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        {isDragActive ? (
          <p className="text-sm text-primary font-medium">Solte os arquivos aqui</p>
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground">
              Clique para selecionar ou arraste arquivos
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX, imagens até {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.entries(uploads).map(([id, upload]) => (
        <div key={id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
          {getFileIcon(upload.file.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{upload.file.name}</p>
            {upload.error ? (
              <Badge variant="destructive" className="text-xs">
                {upload.error}
              </Badge>
            ) : (
              <Progress value={upload.progress} className="h-2 mt-1" />
            )}
          </div>
        </div>
      ))}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Arquivos enviados</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUploadedFiles([]);
                clearUploads();
              }}
              className="text-xs"
            >
              Limpar
            </Button>
          </div>
          
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center space-x-2">
                {getFileIcon(file.type)}
                <span className="text-sm font-medium truncate">{file.name}</span>
                <Badge variant="secondary" className="text-xs">
                  Enviado
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = file.url;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;