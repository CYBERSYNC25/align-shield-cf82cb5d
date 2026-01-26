/**
 * Text Sanitization Utilities
 * 
 * Provides functions to sanitize text for various contexts:
 * - Slack markdown
 * - CSV export (formula injection prevention)
 * - HTML escaping
 */

/**
 * Escapes Slack markdown special characters to prevent formatting issues.
 * 
 * @param text - The text to escape
 * @returns Text with Slack markdown characters escaped
 */
export function escapeSlackMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Escape Slack mrkdwn special characters
  // Reference: https://api.slack.com/reference/surfaces/formatting
  return text
    .replace(/&/g, '&amp;')  // Must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*/g, '\\*')   // Bold
    .replace(/_/g, '\\_')    // Italic
    .replace(/~/g, '\\~')    // Strikethrough
    .replace(/`/g, '\\`');   // Code
}

/**
 * Escapes a value for safe inclusion in CSV.
 * Prevents CSV injection (formula injection) attacks.
 * 
 * CSV injection occurs when cells start with =, +, -, @, \t, or \r
 * which can be interpreted as formulas by spreadsheet software.
 * 
 * @param value - The value to escape
 * @returns A CSV-safe string
 */
export function escapeCSV(value: string): string {
  if (!value || typeof value !== 'string') return '';
  
  let escaped = value;
  
  // Prevent CSV/formula injection
  // Prefix with single quote if starts with formula trigger characters
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = "'" + escaped;
  }
  
  // Standard CSV escaping: wrap in quotes and escape internal quotes
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
    escaped = `"${escaped.replace(/"/g, '""')}"`;
  }
  
  return escaped;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * 
 * @param text - The text to escape
 * @returns HTML-escaped text
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=/]/g, char => htmlEscapes[char] || char);
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed.
 * Useful for preventing excessively long strings in notifications/logs.
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 1000)
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength = 1000): string {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitizes a string for safe use in URLs.
 * 
 * @param value - The value to sanitize
 * @returns URL-safe string
 */
export function sanitizeURLComponent(value: string): string {
  if (!value || typeof value !== 'string') return '';
  
  return encodeURIComponent(value.trim());
}
