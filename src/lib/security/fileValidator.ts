/**
 * Secure File Validation
 * 
 * Validates files using magic bytes (file signatures),
 * not just extension or MIME type.
 * 
 * @module fileValidator
 */

// Blocked extensions (executables and scripts)
const BLOCKED_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.js', 
  '.html', '.htm', '.php', '.asp', '.aspx', '.jsp',
  '.msi', '.dll', '.com', '.scr', '.pif', '.jar',
  '.py', '.rb', '.pl', '.cgi', '.wsf', '.hta'
];

// Allowed extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv'];

// Max file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
  warnings: string[];
}

/**
 * Read first N bytes of file for magic bytes validation
 */
async function readFileHeader(file: File, bytes: number = 16): Promise<Uint8Array> {
  const slice = file.slice(0, bytes);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Check if bytes match a signature pattern
 */
function matchesSignature(header: Uint8Array, signature: number[]): boolean {
  if (header.length < signature.length) return false;
  return signature.every((byte, i) => header[i] === byte);
}

/**
 * Validate file type using magic bytes (file signatures)
 * This is more secure than trusting extension or MIME type
 */
export async function validateFileType(file: File): Promise<FileValidationResult> {
  const warnings: string[] = [];
  
  // 1. Check extension
  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? '.' + nameParts.pop()!.toLowerCase() : '';
  
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { 
      valid: false, 
      error: `Tipo de arquivo bloqueado: ${ext}. Arquivos executáveis não são permitidos.`, 
      warnings 
    };
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
  
  // 3. Validate by magic bytes
  let detectedType: string | undefined;
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesSignature(header, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
    detectedType = 'image/png';
    if (ext !== '.png') {
      warnings.push('Extensão não corresponde ao conteúdo real (PNG detectado)');
    }
  }
  // JPEG: FF D8 FF
  else if (matchesSignature(header, [0xFF, 0xD8, 0xFF])) {
    detectedType = 'image/jpeg';
    if (ext !== '.jpg' && ext !== '.jpeg') {
      warnings.push('Extensão não corresponde ao conteúdo real (JPEG detectado)');
    }
  }
  // PDF: %PDF (25 50 44 46)
  else if (matchesSignature(header, [0x25, 0x50, 0x44, 0x46])) {
    detectedType = 'application/pdf';
    if (ext !== '.pdf') {
      warnings.push('Extensão não corresponde ao conteúdo real (PDF detectado)');
    }
  }
  // ZIP-based formats (DOCX, XLSX): PK (50 4B 03 04)
  else if (matchesSignature(header, [0x50, 0x4B, 0x03, 0x04])) {
    if (ext === '.docx') {
      detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === '.xlsx') {
      detectedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      return { 
        valid: false, 
        error: 'Arquivo ZIP detectado mas extensão inválida. Use .docx ou .xlsx', 
        warnings 
      };
    }
  }
  // CSV (text-based, no magic bytes - validate content)
  else if (ext === '.csv') {
    const text = await file.slice(0, 1000).text();
    // Allow printable ASCII, newlines, and common CSV characters
    if (/^[\x20-\x7E\n\r\t,;\"\']+$/m.test(text)) {
      detectedType = 'text/csv';
    } else {
      return { 
        valid: false, 
        error: 'Arquivo CSV contém caracteres inválidos ou binários', 
        warnings 
      };
    }
  }
  else {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não reconhecido. O conteúdo não corresponde a nenhum formato permitido (PDF, PNG, JPG, DOCX, XLSX, CSV).', 
      warnings 
    };
  }
  
  return { valid: true, detectedType, warnings };
}

/**
 * Validate file size against maximum limit
 */
export function validateFileSize(file: File, maxBytes: number = MAX_FILE_SIZE): FileValidationResult {
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / 1024 / 1024);
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Arquivo muito grande: ${sizeMB}MB. Máximo permitido: ${maxMB}MB`,
      warnings: []
    };
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Arquivo vazio não é permitido',
      warnings: []
    };
  }
  
  return { valid: true, warnings: [] };
}

/**
 * Calculate SHA-256 hash of file content
 * Used for deduplication and integrity verification
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate secure filename using UUID
 * Preserves extension but replaces name to prevent path traversal
 */
export function generateSecureFilename(originalName: string): string {
  const parts = originalName.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  const uuid = crypto.randomUUID();
  return ext ? `${uuid}.${ext}` : uuid;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and parent directory references
  let safe = filename.replace(/[\/\\]/g, '_');
  safe = safe.replace(/\.\./g, '_');
  // Remove null bytes
  safe = safe.replace(/\0/g, '');
  // Remove other problematic characters
  safe = safe.replace(/[:\*\?"<>\|]/g, '_');
  // Remove leading dots and spaces
  safe = safe.replace(/^[\.\s]+/, '');
  // Truncate to reasonable length
  safe = safe.slice(0, 200);
  // Ensure we have something
  if (!safe) safe = 'unnamed_file';
  return safe;
}

/**
 * Full file validation combining size and type checks
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  // Size check first (fast)
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

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get allowed extensions as a comma-separated string
 */
export function getAllowedExtensions(): string {
  return ALLOWED_EXTENSIONS.map(e => e.replace('.', '').toUpperCase()).join(', ');
}

/**
 * Get maximum file size in MB
 */
export function getMaxFileSizeMB(): number {
  return Math.round(MAX_FILE_SIZE / 1024 / 1024);
}
