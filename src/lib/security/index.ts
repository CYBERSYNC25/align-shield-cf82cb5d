/**
 * Security Utilities Index
 * 
 * Centralized exports for all security-related utilities.
 */

// CSS Security
export { isValidCSSColor, sanitizeCSSColor, isValidCSSVariable } from './cssValidator';

// Text Sanitization
export { 
  escapeSlackMarkdown, 
  escapeCSV, 
  escapeHTML, 
  truncateText,
  sanitizeURLComponent 
} from './textSanitizer';

// PII Sanitization (LGPD/GDPR)
export {
  sanitizeForLogs,
  maskPiiValue,
  maskByType,
  sanitizeStackTrace,
  sanitizeError,
  createSafeLogContext,
  type ClassificationLevel,
  type PiiType
} from './piiSanitizer';

// File Validation (Upload Security)
export {
  validateFile,
  validateFileType,
  validateFileSize,
  calculateFileHash,
  generateSecureFilename,
  sanitizeFilename,
  formatBytes,
  getAllowedExtensions,
  getMaxFileSizeMB,
  type FileValidationResult
} from './fileValidator';
