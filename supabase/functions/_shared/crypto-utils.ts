/**
 * Crypto Utilities for Token Encryption/Decryption
 * 
 * Uses AES-256-GCM for secure token storage
 * 
 * USAGE:
 * - encryptToken: Encrypt tokens before storing in database
 * - decryptToken: Decrypt tokens when reading from database
 * 
 * SECURITY:
 * - Uses AES-256-GCM (authenticated encryption)
 * - Random IV for each encryption
 * - Key derived from TOKEN_ENCRYPTION_KEY secret
 * 
 * KEY VERSIONING (v1.1):
 * - Encrypted format: vN:iv:ciphertext (where N is key version)
 * - Legacy format (iv:ciphertext) treated as v1
 * - Supports key rotation with backward compatibility
 */

// CRITICAL: This salt MUST be consistent across ALL functions
// Any change will break decryption of existing data
const ENCRYPTION_SALT = 'apoc-token-encryption-salt-v1';

// Current key version for new encryptions
const CURRENT_KEY_VERSION = 1;

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derive a consistent encryption key from the secret
 * Uses PBKDF2 with a fixed salt for deterministic key derivation
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Parse encrypted token to extract version, IV, and ciphertext
 */
export function parseEncryptedToken(encryptedText: string): {
  version: number;
  ivHex: string;
  ciphertextHex: string;
} {
  const parts = encryptedText.split(':');
  
  // Check for versioned format: vN:iv:ciphertext
  if (parts[0].startsWith('v') && parts.length === 3) {
    return {
      version: parseInt(parts[0].substring(1), 10),
      ivHex: parts[1],
      ciphertextHex: parts[2],
    };
  }
  
  // Legacy format: iv:ciphertext (treat as v1)
  if (parts.length === 2) {
    return {
      version: 1,
      ivHex: parts[0],
      ciphertextHex: parts[1],
    };
  }
  
  throw new Error('Invalid encrypted token format');
}

/**
 * Encrypt a token using AES-256-GCM with version prefix
 * 
 * @param plainText - The token to encrypt
 * @param encryptionKey - The encryption key (from TOKEN_ENCRYPTION_KEY secret)
 * @param keyVersion - The key version (defaults to current)
 * @returns Encrypted token in format: vN:iv:ciphertext (all hex-encoded)
 */
export async function encryptToken(
  plainText: string, 
  encryptionKey: string,
  keyVersion: number = CURRENT_KEY_VERSION
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from secret
  const key = await deriveKey(encryptionKey);

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Return with version prefix: vN:iv:ciphertext
  const encryptedBytes = new Uint8Array(encrypted);
  return `v${keyVersion}:${bytesToHex(iv)}:${bytesToHex(encryptedBytes)}`;
}

/**
 * Decrypt a token using AES-256-GCM
 * Supports both versioned and legacy formats
 * 
 * @param encryptedText - Encrypted token in format: vN:iv:ciphertext or iv:ciphertext
 * @param encryptionKey - The encryption key (from TOKEN_ENCRYPTION_KEY secret)
 * @returns Object with decrypted token and key version used
 */
export async function decryptToken(
  encryptedText: string, 
  encryptionKey: string
): Promise<string> {
  const { ivHex, ciphertextHex } = parseEncryptedToken(encryptedText);

  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  // Derive key from secret
  const key = await deriveKey(encryptionKey);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Decrypt with key version info (for migration/rotation)
 */
export async function decryptTokenWithVersion(
  encryptedText: string,
  encryptionKey: string
): Promise<{ plainText: string; keyVersion: number }> {
  const { version, ivHex, ciphertextHex } = parseEncryptedToken(encryptedText);

  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const key = await deriveKey(encryptionKey);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return {
    plainText: decoder.decode(decrypted),
    keyVersion: version,
  };
}

/**
 * Check if a token is encrypted (has the versioned or legacy format)
 */
export function isEncrypted(token: string): boolean {
  if (!token) return false;
  
  const parts = token.split(':');
  
  // Versioned format: vN:iv:ciphertext
  if (parts[0].startsWith('v') && parts.length === 3) {
    const version = parseInt(parts[0].substring(1), 10);
    if (isNaN(version) || version < 1) return false;
    if (parts[1].length !== 24) return false; // IV is 12 bytes = 24 hex chars
    return /^[0-9a-f]+$/i.test(parts[1]) && /^[0-9a-f]+$/i.test(parts[2]);
  }
  
  // Legacy format: iv:ciphertext
  if (parts.length === 2) {
    if (parts[0].length !== 24) return false;
    return /^[0-9a-f]+$/i.test(parts[0]) && /^[0-9a-f]+$/i.test(parts[1]);
  }
  
  return false;
}

/**
 * Re-encrypt a token with a new key version (for key rotation)
 * 
 * @param encryptedText - Currently encrypted token
 * @param oldKey - The old encryption key
 * @param newKey - The new encryption key
 * @param newVersion - The new key version
 * @returns Re-encrypted token with new version
 */
export async function reEncryptToken(
  encryptedText: string,
  oldKey: string,
  newKey: string,
  newVersion: number
): Promise<string> {
  const plainText = await decryptToken(encryptedText, oldKey);
  return encryptToken(plainText, newKey, newVersion);
}

/**
 * Get the encryption salt (for documentation/debugging only)
 */
export function getEncryptionSalt(): string {
  return ENCRYPTION_SALT;
}

/**
 * Get the current key version
 */
export function getCurrentKeyVersion(): number {
  return CURRENT_KEY_VERSION;
}
