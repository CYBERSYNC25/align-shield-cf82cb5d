import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Sanitize filename to prevent path traversal and invalid characters
 */
function sanitizeFilename(filename: string): string {
  let safe = filename.replace(/[\/\\]/g, '_');
  safe = safe.replace(/\.\./g, '_');
  safe = safe.replace(/\0/g, '');
  safe = safe.replace(/[:\*\?"<>\|]/g, '_');
  safe = safe.replace(/^[\.\s]+/, '');
  safe = safe.slice(0, 200);
  if (!safe) safe = 'unnamed_file';
  return safe;
}

export interface FileUpload {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Record<string, FileUpload>>({});

  const uploadFile = async (
    file: File,
    bucket: 'evidence' | 'documents',
    folder?: string
  ): Promise<{ url: string | null; error: string | null }> => {
    if (!user) {
      console.error('User not authenticated for file upload');
      return { url: null, error: 'Usuário não autenticado' };
    }

    console.log('Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket,
      folder,
      userId: user.id
    });

    const sanitizedName = sanitizeFilename(file.name);
    const fileId = `${Date.now()}-${sanitizedName}`;
    const filePath = folder 
      ? `${user.id}/${folder}/${fileId}`
      : `${user.id}/${fileId}`;

    console.log('File path (sanitized):', filePath);

    // Initialize upload state
    setUploads(prev => ({
      ...prev,
      [fileId]: { file, progress: 0 }
    }));

    try {
      console.log('Uploading to Supabase storage...');
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      console.log('Supabase upload response:', { data, error });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);

      // Update upload state with success
      setUploads(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], progress: 100, url: publicUrl }
      }));

      toast({
        title: "Upload concluído",
        description: `Arquivo ${file.name} enviado com sucesso`
      });

      return { url: publicUrl, error: null };

    } catch (error: any) {
      const errorMessage = error.message || 'Erro no upload';
      console.error('Upload failed:', error);
      
      // Update upload state with error
      setUploads(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], error: errorMessage }
      }));

      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive"
      });

      return { url: null, error: errorMessage };
    }
  };

  const deleteFile = async (
    filePath: string,
    bucket: 'evidence' | 'documents'
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      toast({
        title: "Arquivo excluído",
        description: "Arquivo removido com sucesso"
      });

      return { success: true, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao excluir arquivo';
      toast({
        title: "Erro ao excluir",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    }
  };

  const getFileUrl = (bucket: 'evidence' | 'documents', filePath: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const clearUploads = () => {
    setUploads({});
  };

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    uploads,
    clearUploads
  };
};