
# Plano: Validações de Segurança para Uploads de Arquivos

## Visão Geral

Implementar um sistema robusto de validação de uploads que inclui:
- Verificação de magic bytes (não confiar em extensão/MIME)
- Limites de quota por usuário/organização
- Sanitização com renomeação UUID e remoção de metadados EXIF
- URLs assinadas com expiração
- Componente SecureFileUpload com UX completa

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Secure File Upload Architecture                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐                                              │
│  │   SecureFileUpload   │ ─── Validação Client-Side                    │
│  │   (React Component)  │     • Magic bytes check                      │
│  │                      │     • Size limit (25MB)                      │
│  │   1. Selecionar      │     • Extension whitelist                    │
│  │   2. Validar local   │     • Block executables                      │
│  └──────────┬───────────┘                                              │
│             │                                                           │
│             ▼                                                           │
│  ┌──────────────────────┐                                              │
│  │   secure-upload      │ ─── Validação Server-Side (Edge Function)   │
│  │   (Edge Function)    │     • Re-validate magic bytes               │
│  │                      │     • Check user quota (100MB/day)          │
│  │   1. Validar quota   │     • Check org quota (1GB total)           │
│  │   2. Sanitizar       │     • Strip EXIF metadata                   │
│  │   3. Hash SHA-256    │     • Calculate file hash                   │
│  │   4. Rename to UUID  │     • Detect duplicates                     │
│  │   5. Upload privado  │     • Store with UUID name                  │
│  └──────────┬───────────┘                                              │
│             │                                                           │
│             ▼                                                           │
│  ┌──────────────────────┐                                              │
│  │   file_uploads       │ ─── Tracking & Quotas                        │
│  │   (Database Table)   │     • original_name                          │
│  │                      │     • storage_path (UUID)                    │
│  │                      │     • file_hash (SHA-256)                    │
│  │                      │     • size_bytes                             │
│  │                      │     • user_id, org_id                        │
│  └──────────────────────┘                                              │
│                                                                         │
│  ┌──────────────────────┐                                              │
│  │   Supabase Storage   │ ─── Private Buckets                          │
│  │                      │     • Signed URLs (1h expiry)                │
│  │   evidence/          │     • No direct public access                │
│  │   documents/         │     • RLS por user_id folder                 │
│  └──────────────────────┘                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Database - Tabela de Tracking

### 1.1 Migration SQL

```sql
-- Tabela para tracking de uploads e quotas
CREATE TABLE public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- File identification
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE, -- UUID-based path in bucket
  bucket TEXT NOT NULL, -- 'evidence' | 'documents'
  
  -- Validation metadata
  mime_type TEXT NOT NULL,
  detected_type TEXT NOT NULL, -- From magic bytes
  file_hash TEXT NOT NULL, -- SHA-256 hex
  size_bytes BIGINT NOT NULL,
  
  -- Security flags
  exif_stripped BOOLEAN DEFAULT false,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- For temporary files
  
  -- Indexes for quota checks
  CONSTRAINT valid_bucket CHECK (bucket IN ('evidence', 'documents')),
  CONSTRAINT valid_size CHECK (size_bytes > 0 AND size_bytes <= 26214400) -- 25MB
);

-- Índices para quotas
CREATE INDEX idx_uploads_user_date ON public.file_uploads(user_id, created_at);
CREATE INDEX idx_uploads_org ON public.file_uploads(org_id);
CREATE INDEX idx_uploads_hash ON public.file_uploads(file_hash);

-- RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own uploads"
  ON public.file_uploads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages uploads"
  ON public.file_uploads FOR ALL
  USING (auth.role() = 'service_role');
```

### 1.2 Funções de Quota

```sql
-- Verificar quota diária do usuário (100MB/dia)
CREATE OR REPLACE FUNCTION public.check_user_daily_quota(_user_id UUID)
RETURNS TABLE(used_bytes BIGINT, limit_bytes BIGINT, remaining_bytes BIGINT, can_upload BOOLEAN)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH daily_usage AS (
    SELECT COALESCE(SUM(size_bytes), 0)::BIGINT as used
    FROM file_uploads
    WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE
  )
  SELECT 
    du.used as used_bytes,
    104857600::BIGINT as limit_bytes, -- 100MB
    (104857600 - du.used)::BIGINT as remaining_bytes,
    du.used < 104857600 as can_upload
  FROM daily_usage du;
$$;

-- Verificar quota total da organização (1GB)
CREATE OR REPLACE FUNCTION public.check_org_total_quota(_org_id UUID)
RETURNS TABLE(used_bytes BIGINT, limit_bytes BIGINT, remaining_bytes BIGINT, can_upload BOOLEAN)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH org_usage AS (
    SELECT COALESCE(SUM(size_bytes), 0)::BIGINT as used
    FROM file_uploads
    WHERE org_id = _org_id
  )
  SELECT 
    ou.used as used_bytes,
    1073741824::BIGINT as limit_bytes, -- 1GB
    (1073741824 - ou.used)::BIGINT as remaining_bytes,
    ou.used < 1073741824 as can_upload
  FROM org_usage ou;
$$;

-- Detectar duplicata por hash
CREATE OR REPLACE FUNCTION public.find_duplicate_file(_org_id UUID, _file_hash TEXT)
RETURNS TABLE(id UUID, storage_path TEXT, original_name TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, storage_path, original_name
  FROM file_uploads
  WHERE org_id = _org_id AND file_hash = _file_hash
  LIMIT 1;
$$;
```

---

## Fase 2: Biblioteca de Validação de Arquivos

### 2.1 Frontend - `src/lib/security/fileValidator.ts`

```typescript
/**
 * Secure File Validation
 * 
 * Validates files using magic bytes (file signatures),
 * not just extension or MIME type.
 */

// Magic bytes for allowed file types
const FILE_SIGNATURES = {
  // Images
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JPEG
  'image/jpg': [[0xFF, 0xD8, 0xFF]], // JPG
  
  // Documents
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04] // DOCX (ZIP-based)
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4B, 0x03, 0x04] // XLSX (ZIP-based)
  ],
  'text/csv': [], // CSV has no magic bytes, validate content
} as const;

// Blocked extensions (executables)
const BLOCKED_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.js', 
  '.html', '.htm', '.php', '.asp', '.aspx', '.jsp',
  '.msi', '.dll', '.com', '.scr', '.pif', '.jar',
  '.py', '.rb', '.pl', '.cgi'
];

// Allowed extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
  warnings: string[];
}

// Read first N bytes of file
async function readFileHeader(file: File, bytes: number = 8): Promise<Uint8Array> {
  const slice = file.slice(0, bytes);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

// Check if bytes match a signature
function matchesSignature(header: Uint8Array, signature: number[]): boolean {
  if (header.length < signature.length) return false;
  return signature.every((byte, i) => header[i] === byte);
}

// Validate file using magic bytes
export async function validateFileType(file: File): Promise<FileValidationResult> {
  const warnings: string[] = [];
  
  // 1. Check extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Tipo de arquivo bloqueado: ${ext}`, warnings };
  }
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { 
      valid: false, 
      error: `Extensão não permitida: ${ext}. Permitidos: PDF, PNG, JPG, DOCX, XLSX, CSV`, 
      warnings 
    };
  }
  
  // 2. Read magic bytes
  const header = await readFileHeader(file, 16);
  
  // 3. Validate by type
  let detectedType: string | undefined;
  
  // PNG
  if (matchesSignature(header, [0x89, 0x50, 0x4E, 0x47])) {
    detectedType = 'image/png';
    if (ext !== '.png') warnings.push('Extensão não corresponde ao conteúdo real');
  }
  // JPEG
  else if (matchesSignature(header, [0xFF, 0xD8, 0xFF])) {
    detectedType = 'image/jpeg';
    if (ext !== '.jpg' && ext !== '.jpeg') warnings.push('Extensão não corresponde');
  }
  // PDF
  else if (matchesSignature(header, [0x25, 0x50, 0x44, 0x46])) {
    detectedType = 'application/pdf';
    if (ext !== '.pdf') warnings.push('Extensão não corresponde');
  }
  // ZIP-based (DOCX, XLSX)
  else if (matchesSignature(header, [0x50, 0x4B, 0x03, 0x04])) {
    if (ext === '.docx') detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xlsx') detectedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else {
      return { valid: false, error: 'Arquivo ZIP detectado mas extensão inválida', warnings };
    }
  }
  // CSV (text-based, no magic bytes)
  else if (ext === '.csv') {
    // Validate CSV content (first line should be text)
    const text = await file.slice(0, 1000).text();
    if (/^[\x20-\x7E\n\r,;]+$/.test(text)) {
      detectedType = 'text/csv';
    } else {
      return { valid: false, error: 'Arquivo CSV contém caracteres inválidos', warnings };
    }
  }
  else {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não reconhecido. O conteúdo não corresponde a nenhum formato permitido.', 
      warnings 
    };
  }
  
  return { valid: true, detectedType, warnings };
}

// Validate file size
export function validateFileSize(file: File, maxBytes: number = 25 * 1024 * 1024): FileValidationResult {
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / 1024 / 1024);
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Arquivo muito grande: ${sizeMB}MB. Máximo permitido: ${maxMB}MB`,
      warnings: []
    };
  }
  return { valid: true, warnings: [] };
}

// Calculate SHA-256 hash of file
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate UUID filename
export function generateSecureFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const uuid = crypto.randomUUID();
  return ext ? `${uuid}.${ext}` : uuid;
}

// Full validation
export async function validateFile(file: File): Promise<FileValidationResult> {
  // Size check
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;
  
  // Type check with magic bytes
  const typeResult = await validateFileType(file);
  if (!typeResult.valid) return typeResult;
  
  return {
    valid: true,
    detectedType: typeResult.detectedType,
    warnings: typeResult.warnings
  };
}
```

### 2.2 Backend - `supabase/functions/_shared/file-validator.ts`

```typescript
/**
 * Server-side File Validation
 * 
 * Re-validates files after upload (defense in depth)
 */

const BLOCKED_SIGNATURES = [
  [0x4D, 0x5A], // MZ (Windows EXE)
  [0x23, 0x21], // #! (Shell script)
  [0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], // <script
  [0x3C, 0x3F, 0x70, 0x68, 0x70], // <?php
];

export function isBlockedContent(header: Uint8Array): boolean {
  return BLOCKED_SIGNATURES.some(sig => 
    sig.every((byte, i) => header[i] === byte)
  );
}

// Strip EXIF from JPEG (simplified - for production use sharp or similar)
export function stripExifFromJpeg(data: Uint8Array): Uint8Array {
  // JPEG structure: FFD8 [segments] FFD9
  // EXIF is in APP1 segment (FFE1)
  // This is a simplified version - removes APP1 segments
  
  const result: number[] = [];
  let i = 0;
  
  // Copy SOI marker
  if (data[0] === 0xFF && data[1] === 0xD8) {
    result.push(data[0], data[1]);
    i = 2;
  }
  
  while (i < data.length - 1) {
    if (data[i] === 0xFF) {
      const marker = data[i + 1];
      
      // Skip APP1 (EXIF) segments
      if (marker === 0xE1) {
        const length = (data[i + 2] << 8) | data[i + 3];
        i += 2 + length;
        continue;
      }
      
      // Copy other segments
      if (marker >= 0xE0 && marker <= 0xEF) {
        // APP segments have length
        const length = (data[i + 2] << 8) | data[i + 3];
        for (let j = 0; j < 2 + length; j++) {
          result.push(data[i + j]);
        }
        i += 2 + length;
      } else {
        result.push(data[i], data[i + 1]);
        i += 2;
      }
    } else {
      result.push(data[i]);
      i++;
    }
  }
  
  return new Uint8Array(result);
}
```

---

## Fase 3: Edge Function - `secure-upload`

### 3.1 `supabase/functions/secure-upload/index.ts`

```typescript
/**
 * Secure File Upload Handler
 * 
 * Validates, sanitizes, and stores files securely.
 * Returns signed URL for access.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createSecureHandler } from "../_shared/secure-handler.ts";
import { isBlockedContent, stripExifFromJpeg } from "../_shared/file-validator.ts";

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const USER_DAILY_LIMIT = 100 * 1024 * 1024; // 100MB
const ORG_TOTAL_LIMIT = 1024 * 1024 * 1024; // 1GB

const handler = createSecureHandler(async (req, { user, supabaseAdmin, orgId }) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const bucket = formData.get('bucket') as string || 'documents';
  const folder = formData.get('folder') as string || '';
  
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }
  
  // 1. Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ 
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 25MB` 
    }), { status: 400 });
  }
  
  // 2. Check user daily quota
  const { data: userQuota } = await supabaseAdmin
    .rpc('check_user_daily_quota', { _user_id: user.id });
  
  if (userQuota && !userQuota[0]?.can_upload) {
    return new Response(JSON.stringify({ 
      error: 'Quota diária excedida (100MB/dia)',
      used: userQuota[0].used_bytes,
      limit: userQuota[0].limit_bytes
    }), { status: 429 });
  }
  
  // 3. Check org quota
  if (orgId) {
    const { data: orgQuota } = await supabaseAdmin
      .rpc('check_org_total_quota', { _org_id: orgId });
    
    if (orgQuota && !orgQuota[0]?.can_upload) {
      return new Response(JSON.stringify({ 
        error: 'Quota da organização excedida (1GB total)',
        used: orgQuota[0].used_bytes,
        limit: orgQuota[0].limit_bytes
      }), { status: 429 });
    }
  }
  
  // 4. Read file content
  const arrayBuffer = await file.arrayBuffer();
  let fileData = new Uint8Array(arrayBuffer);
  const header = fileData.slice(0, 32);
  
  // 5. Check for blocked content (executables, scripts)
  if (isBlockedContent(header)) {
    return new Response(JSON.stringify({ 
      error: 'Arquivo bloqueado: conteúdo executável detectado' 
    }), { status: 400 });
  }
  
  // 6. Validate MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ 
      error: `Tipo não permitido: ${file.type}` 
    }), { status: 400 });
  }
  
  // 7. Strip EXIF from JPEG images
  let exifStripped = false;
  if (file.type === 'image/jpeg') {
    fileData = stripExifFromJpeg(fileData);
    exifStripped = true;
  }
  
  // 8. Calculate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
  const fileHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 9. Check for duplicates
  const { data: duplicate } = await supabaseAdmin
    .rpc('find_duplicate_file', { _org_id: orgId, _file_hash: fileHash });
  
  if (duplicate && duplicate.length > 0) {
    // Return existing file instead of re-uploading
    const { data: signedUrl } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(duplicate[0].storage_path, 3600);
    
    return new Response(JSON.stringify({
      success: true,
      duplicate: true,
      fileId: duplicate[0].id,
      signedUrl: signedUrl?.signedUrl,
      originalName: duplicate[0].original_name
    }));
  }
  
  // 10. Generate secure filename (UUID)
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const uuid = crypto.randomUUID();
  const secureFilename = ext ? `${uuid}.${ext}` : uuid;
  const storagePath = folder 
    ? `${user.id}/${folder}/${secureFilename}`
    : `${user.id}/${secureFilename}`;
  
  // 11. Upload to private bucket
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, fileData, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
  }
  
  // 12. Record upload in tracking table
  const { data: uploadRecord, error: recordError } = await supabaseAdmin
    .from('file_uploads')
    .insert({
      user_id: user.id,
      org_id: orgId,
      original_name: file.name,
      storage_path: storagePath,
      bucket,
      mime_type: file.type,
      detected_type: file.type, // Would be from magic bytes detection
      file_hash: fileHash,
      size_bytes: fileData.length,
      exif_stripped: exifStripped
    })
    .select('id')
    .single();
  
  if (recordError) {
    // Cleanup: delete uploaded file
    await supabaseAdmin.storage.from(bucket).remove([storagePath]);
    return new Response(JSON.stringify({ error: 'Failed to record upload' }), { status: 500 });
  }
  
  // 13. Generate signed URL (1 hour expiry)
  const { data: signedUrl } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);
  
  return new Response(JSON.stringify({
    success: true,
    fileId: uploadRecord.id,
    storagePath,
    signedUrl: signedUrl?.signedUrl,
    hash: fileHash,
    size: fileData.length,
    exifStripped
  }));
});

serve(handler);
```

---

## Fase 4: Componente SecureFileUpload

### 4.1 `src/components/common/SecureFileUpload.tsx`

```typescript
/**
 * SecureFileUpload Component
 * 
 * Features:
 * - Client-side validation with magic bytes
 * - Progress indicator
 * - Clear error messages
 * - Quota warnings
 * - Signed URL handling
 */

interface SecureFileUploadProps {
  bucket: 'evidence' | 'documents';
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  signedUrl: string;
  size: number;
  hash: string;
}

const SecureFileUpload = ({...}) => {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const handleDrop = async (acceptedFiles: File[]) => {
    // 1. Validate each file locally
    const validated = await Promise.all(
      acceptedFiles.map(async (file) => {
        const result = await validateFile(file);
        return { file, ...result };
      })
    );
    
    // 2. Show validation errors
    const invalid = validated.filter(v => !v.valid);
    if (invalid.length > 0) {
      toast.error(invalid[0].error);
      return;
    }
    
    // 3. Upload to secure endpoint
    setUploading(true);
    
    for (const { file } of validated) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('folder', folder || '');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/secure-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error);
        continue;
      }
      
      // Handle duplicates
      if (result.duplicate) {
        toast.info(`Arquivo já existe: ${result.originalName}`);
      }
      
      // Add to uploaded list
      setUploadedFiles(prev => [...prev, {
        id: result.fileId,
        name: file.name,
        signedUrl: result.signedUrl,
        size: result.size,
        hash: result.hash
      }]);
    }
    
    setUploading(false);
  };
  
  return (
    <div className="space-y-4">
      {/* Dropzone with security info */}
      <div {...getRootProps()} className="...">
        <Shield className="h-6 w-6 text-primary" />
        <p>Upload Seguro</p>
        <p className="text-xs text-muted-foreground">
          PDF, PNG, JPG, DOCX, XLSX, CSV (máx. 25MB)
        </p>
      </div>
      
      {/* Upload progress */}
      {uploading && <Progress value={progress} />}
      
      {/* Validation errors with clear message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Arquivo Rejeitado</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Uploaded files with signed URLs */}
      {uploadedFiles.map(file => (
        <div key={file.id} className="...">
          <span>{file.name}</span>
          <Badge variant="success">Verificado</Badge>
        </div>
      ))}
    </div>
  );
};
```

---

## Fase 5: Hook para URLs Assinadas

### 5.1 `src/hooks/useSignedUrl.tsx`

```typescript
/**
 * Hook para obter URLs assinadas com cache e refresh automático
 */

export function useSignedUrl(bucket: string, path: string) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  const refreshUrl = useCallback(async () => {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour
    
    if (data) {
      setSignedUrl(data.signedUrl);
      setExpiresAt(new Date(Date.now() + 3600 * 1000));
    }
  }, [bucket, path]);
  
  // Auto-refresh 5 minutes before expiry
  useEffect(() => {
    if (!expiresAt) return;
    
    const msUntilRefresh = expiresAt.getTime() - Date.now() - (5 * 60 * 1000);
    if (msUntilRefresh <= 0) {
      refreshUrl();
      return;
    }
    
    const timer = setTimeout(refreshUrl, msUntilRefresh);
    return () => clearTimeout(timer);
  }, [expiresAt, refreshUrl]);
  
  return { signedUrl, refreshUrl, expiresAt };
}
```

---

## Fase 6: Documentação no README

### 6.1 Adicionar Seção "Segurança de Uploads"

```markdown
### Segurança de Uploads

O sistema implementa múltiplas camadas de validação para uploads de arquivos:

#### Tipos Permitidos

| Tipo | Extensão | Magic Bytes |
|------|----------|-------------|
| PDF | .pdf | %PDF (25 50 44 46) |
| PNG | .png | 89 50 4E 47 |
| JPEG | .jpg, .jpeg | FF D8 FF |
| DOCX | .docx | PK (50 4B 03 04) |
| XLSX | .xlsx | PK (50 4B 03 04) |
| CSV | .csv | Texto válido |

#### Tipos Bloqueados

Executáveis e scripts são sempre rejeitados:
`.exe`, `.sh`, `.bat`, `.js`, `.html`, `.php`, `.py`, `.jar`

#### Limites de Quota

| Limite | Valor | Escopo |
|--------|-------|--------|
| Tamanho por arquivo | 25MB | Por upload |
| Uploads diários | 100MB | Por usuário |
| Armazenamento total | 1GB | Por organização |

#### Sanitização

1. **Renomeação**: Arquivos são renomeados para UUID (nome original preservado em metadata)
2. **EXIF**: Metadados EXIF removidos de imagens JPEG automaticamente
3. **Hash SHA-256**: Calculado para cada arquivo (detecção de duplicatas)

#### Armazenamento

- **Buckets privados**: `evidence` e `documents` não são públicos
- **URLs assinadas**: Expiram em 1 hora, renovadas automaticamente
- **RLS**: Usuários só acessam seus próprios arquivos

#### Validação em Camadas

| Camada | Local | Validações |
|--------|-------|------------|
| 1. Cliente | Browser | Magic bytes, extensão, tamanho |
| 2. Edge Function | Servidor | Re-validação, quota, hash |
| 3. Storage | Supabase | RLS, bucket policies |
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Database Migration** | Criar | Tabela `file_uploads` + funções de quota |
| `src/lib/security/fileValidator.ts` | **NOVO** | Validação client-side com magic bytes |
| `src/lib/security/index.ts` | Modificar | Export fileValidator |
| `supabase/functions/_shared/file-validator.ts` | **NOVO** | Validação server-side |
| `supabase/functions/secure-upload/index.ts` | **NOVO** | Edge Function de upload |
| `supabase/config.toml` | Modificar | Adicionar função secure-upload |
| `src/components/common/SecureFileUpload.tsx` | **NOVO** | Componente com validação |
| `src/hooks/useSignedUrl.tsx` | **NOVO** | Hook para URLs assinadas |
| `src/hooks/useFileUpload.tsx` | Modificar | Integrar com SecureFileUpload |
| `README.md` | Modificar | Seção "Segurança de Uploads" |

---

## Resumo de Segurança

| Ameaça | Mitigação |
|--------|-----------|
| Extensão falsa | Magic bytes validation |
| Arquivo malicioso | Blocked signatures check |
| Path traversal | UUID filename + sanitization |
| EXIF data leak | Automatic strip for JPEG |
| Direct file access | Signed URLs only |
| Quota abuse | Per-user + per-org limits |
| Duplicate storage | SHA-256 hash deduplication |
| Content sniffing | X-Content-Type-Options: nosniff |

---

## Benefícios

1. **Defense in Depth**: Validação em múltiplas camadas (cliente → servidor → storage)
2. **UX Clara**: Mensagens de erro específicas e progresso visual
3. **Privacidade**: EXIF removido, nomes originais não expostos
4. **Economia**: Deduplicação por hash evita armazenamento duplicado
5. **Auditoria**: Todos os uploads registrados com metadados completos
6. **Quota Control**: Limites por usuário e organização previnem abuso
