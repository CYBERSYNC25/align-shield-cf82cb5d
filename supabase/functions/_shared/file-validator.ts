/**
 * Server-side File Validation
 * 
 * Re-validates files after upload (defense in depth)
 * Includes EXIF stripping for privacy
 * 
 * @module file-validator
 */

// Blocked magic byte signatures (executables and scripts)
const BLOCKED_SIGNATURES: number[][] = [
  [0x4D, 0x5A], // MZ (Windows EXE/DLL)
  [0x7F, 0x45, 0x4C, 0x46], // ELF (Linux executable)
  [0x23, 0x21], // #! (Shell script shebang)
  [0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], // <script
  [0x3C, 0x3F, 0x70, 0x68, 0x70], // <?php
  [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], // <!DOCTYPE (HTML)
  [0x3C, 0x68, 0x74, 0x6D, 0x6C], // <html
  [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
  [0xFE, 0xED, 0xFA, 0xCE], // Mach-O 32-bit
  [0xFE, 0xED, 0xFA, 0xCF], // Mach-O 64-bit
];

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain', // Some CSVs may come as text/plain
];

// Allowed extensions
export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv'];

/**
 * Check if file header contains blocked signatures (executables, scripts)
 */
export function isBlockedContent(header: Uint8Array): boolean {
  return BLOCKED_SIGNATURES.some(sig => 
    sig.every((byte, i) => header[i] === byte)
  );
}

/**
 * Validate file extension
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Validate MIME type
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Detect file type from magic bytes
 */
export function detectFileType(header: Uint8Array): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'image/png';
  }
  
  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // PDF: %PDF (25 50 44 46)
  if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
    return 'application/pdf';
  }
  
  // ZIP-based (DOCX, XLSX): PK (50 4B 03 04)
  if (header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04) {
    return 'application/zip'; // Caller should verify extension for DOCX/XLSX
  }
  
  return null;
}

/**
 * Strip EXIF metadata from JPEG images for privacy
 * 
 * JPEG structure: FFD8 [segments] FFD9
 * EXIF is in APP1 segment (FFE1)
 * This removes APP1 segments containing EXIF data
 */
export function stripExifFromJpeg(data: Uint8Array): Uint8Array {
  // Verify it's a JPEG
  if (data[0] !== 0xFF || data[1] !== 0xD8) {
    return data; // Not a JPEG, return as-is
  }
  
  const result: number[] = [];
  let i = 0;
  
  // Copy SOI marker (FF D8)
  result.push(data[0], data[1]);
  i = 2;
  
  while (i < data.length - 1) {
    // Check for marker
    if (data[i] === 0xFF) {
      const marker = data[i + 1];
      
      // End of image (EOI)
      if (marker === 0xD9) {
        result.push(data[i], data[i + 1]);
        break;
      }
      
      // Start of scan (SOS) - copy rest of file
      if (marker === 0xDA) {
        while (i < data.length) {
          result.push(data[i]);
          i++;
        }
        break;
      }
      
      // APP1 segment (EXIF) - skip it
      if (marker === 0xE1) {
        if (i + 3 < data.length) {
          const length = (data[i + 2] << 8) | data[i + 3];
          i += 2 + length;
          continue;
        }
      }
      
      // Other APP segments and markers with length
      if ((marker >= 0xE0 && marker <= 0xEF) || 
          (marker >= 0xC0 && marker <= 0xCF) ||
          marker === 0xDB || marker === 0xC4 || marker === 0xFE) {
        if (i + 3 < data.length) {
          const length = (data[i + 2] << 8) | data[i + 3];
          for (let j = 0; j < 2 + length && i + j < data.length; j++) {
            result.push(data[i + j]);
          }
          i += 2 + length;
          continue;
        }
      }
      
      // Copy marker
      result.push(data[i], data[i + 1]);
      i += 2;
    } else {
      result.push(data[i]);
      i++;
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Calculate SHA-256 hash of data
 */
export async function calculateHash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate UUID-based secure filename
 */
export function generateSecureFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const uuid = crypto.randomUUID();
  return ext ? `${uuid}.${ext}` : uuid;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  let safe = filename.replace(/[\\/\\\\]/g, '_');
  safe = safe.replace(/\.\./g, '_');
  safe = safe.replace(/\0/g, '');
  safe = safe.replace(/[:\\*\\?"<>\\|]/g, '_');
  safe = safe.replace(/^[\.\s]+/, '');
  safe = safe.slice(0, 200);
  if (!safe) safe = 'unnamed_file';
  return safe;
}

/**
 * File size limits
 */
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB per file
  USER_DAILY_LIMIT: 100 * 1024 * 1024, // 100MB per day per user
  ORG_TOTAL_LIMIT: 1024 * 1024 * 1024, // 1GB total per org
};
