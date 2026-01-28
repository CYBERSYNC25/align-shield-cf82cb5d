/**
 * SecureFileUpload Component
 * 
 * Secure file upload with:
 * - Client-side magic bytes validation
 * - Progress indicator
 * - Clear error messages
 * - Quota warnings
 * - Signed URL handling
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  Download,
  Eye,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  validateFile, 
  getAllowedExtensions, 
  getMaxFileSizeMB,
  formatBytes
} from '@/lib/security/fileValidator';
import { supabase } from '@/integrations/supabase/client';

interface SecureFileUploadProps {
  bucket: 'evidence' | 'documents';
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  signedUrl: string;
  size: number;
  hash: string;
  duplicate?: boolean;
}

interface PendingFile {
  file: File;
  status: 'validating' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: UploadedFile;
  warnings?: string[];
}

const SecureFileUpload = ({
  bucket,
  folder,
  multiple = true,
  maxFiles = 10,
  onUploadComplete,
  onError,
  className,
  disabled = false
}: SecureFileUploadProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || !session?.access_token) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para fazer upload",
        variant: "destructive"
      });
      return;
    }

    setGlobalError(null);

    // Limit number of files
    const filesToProcess = acceptedFiles.slice(0, maxFiles);
    if (acceptedFiles.length > maxFiles) {
      toast({
        title: "Aviso",
        description: `Máximo de ${maxFiles} arquivos. Apenas os primeiros serão processados.`,
        variant: "default"
      });
    }

    // Initialize pending files
    const pending: PendingFile[] = filesToProcess.map(file => ({
      file,
      status: 'validating',
      progress: 0
    }));
    setPendingFiles(pending);

    const results: UploadedFile[] = [];

    // Process each file
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      
      // Update status to validating
      setPendingFiles(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'validating', progress: 10 } : p
      ));

      // 1. Client-side validation
      const validation = await validateFile(file);
      
      if (!validation.valid) {
        setPendingFiles(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error', error: validation.error, progress: 0 } : p
        ));
        onError?.(validation.error || 'Validation failed');
        continue;
      }

      // Store warnings if any
      if (validation.warnings.length > 0) {
        setPendingFiles(prev => prev.map((p, idx) => 
          idx === i ? { ...p, warnings: validation.warnings } : p
        ));
      }

      // 2. Upload to secure endpoint
      setPendingFiles(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'uploading', progress: 30 } : p
      ));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        if (folder) formData.append('folder', folder);

        const response = await fetch(
          `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/secure-upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            body: formData
          }
        );

        // Update progress
        setPendingFiles(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 70 } : p
        ));

        const result = await response.json();

        if (!response.ok) {
          setPendingFiles(prev => prev.map((p, idx) => 
            idx === i ? { 
              ...p, 
              status: 'error', 
              error: result.error || 'Upload failed',
              progress: 0 
            } : p
          ));
          onError?.(result.error || 'Upload failed');
          continue;
        }

        // Success
        const uploadedFile: UploadedFile = {
          id: result.fileId,
          name: file.name,
          signedUrl: result.signedUrl,
          size: result.size,
          hash: result.hash,
          duplicate: result.duplicate
        };

        results.push(uploadedFile);
        
        setPendingFiles(prev => prev.map((p, idx) => 
          idx === i ? { 
            ...p, 
            status: 'success', 
            progress: 100,
            result: uploadedFile 
          } : p
        ));

        // Show duplicate notice
        if (result.duplicate) {
          toast({
            title: "Arquivo duplicado",
            description: `"${file.name}" já existe e foi reutilizado.`,
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
        setPendingFiles(prev => prev.map((p, idx) => 
          idx === i ? { 
            ...p, 
            status: 'error', 
            error: errorMessage,
            progress: 0 
          } : p
        ));
        onError?.(errorMessage);
      }
    }

    // Update uploaded files list
    if (results.length > 0) {
      setUploadedFiles(prev => [...prev, ...results]);
      onUploadComplete?.(results);
      
      toast({
        title: "Upload concluído",
        description: `${results.length} arquivo(s) enviado(s) com sucesso`
      });
    }

  }, [session, bucket, folder, maxFiles, disabled, onUploadComplete, onError, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple,
    disabled,
    maxFiles
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearPendingFiles = () => {
    setPendingFiles([]);
  };

  const clearAll = () => {
    setPendingFiles([]);
    setUploadedFiles([]);
    setGlobalError(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Global Error */}
      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Upload</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          "border-muted-foreground/25",
          isDragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "hover:border-primary hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          {isDragActive ? (
            <p className="text-sm text-primary font-medium">Solte os arquivos aqui</p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                Upload Seguro
              </p>
              <p className="text-xs text-muted-foreground">
                Clique ou arraste arquivos
              </p>
              <p className="text-xs text-muted-foreground">
                {getAllowedExtensions()} (máx. {getMaxFileSizeMB()}MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Processando</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPendingFiles}
              className="text-xs"
            >
              Limpar
            </Button>
          </div>
          
          {pendingFiles.map((pending, index) => (
            <div 
              key={index} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                pending.status === 'error' && "bg-destructive/10 border border-destructive/20",
                pending.status === 'success' && "bg-success/10 border border-success/20",
                (pending.status === 'validating' || pending.status === 'uploading') && "bg-muted/30"
              )}
            >
              {/* Icon */}
              {pending.status === 'validating' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {pending.status === 'uploading' && <Upload className="h-4 w-4 text-primary animate-pulse" />}
              {pending.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {pending.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pending.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(pending.file.size)}
                </p>
                
                {/* Error message */}
                {pending.error && (
                  <p className="text-xs text-destructive mt-1">{pending.error}</p>
                )}
                
                {/* Warnings */}
                {pending.warnings && pending.warnings.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    <p className="text-xs text-yellow-600">{pending.warnings[0]}</p>
                  </div>
                )}
                
                {/* Progress bar */}
                {(pending.status === 'validating' || pending.status === 'uploading') && (
                  <Progress value={pending.progress} className="h-1 mt-2" />
                )}
              </div>
              
              {/* Status badge */}
              {pending.status === 'success' && pending.result?.duplicate && (
                <Badge variant="outline" className="text-xs">
                  Duplicado
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Arquivos Enviados</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              Limpar Tudo
            </Button>
          </div>
          
          {uploadedFiles.map((file, index) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} • SHA-256: {file.hash.slice(0, 8)}...
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {file.duplicate && (
                  <Badge variant="outline" className="text-xs mr-2">
                    Reutilizado
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.signedUrl, '_blank')}
                  className="h-8 w-8 p-0"
                  title="Visualizar"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = file.signedUrl;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="h-8 w-8 p-0"
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadedFile(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Remover"
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

export default SecureFileUpload;
