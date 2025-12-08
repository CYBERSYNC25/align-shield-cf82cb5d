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
 */

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

  // Use a fixed salt derived from the secret itself
  // This ensures the same secret always produces the same key
  const salt = encoder.encode('apoc-token-encryption-salt-v1');

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
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
 * Encrypt a token using AES-256-GCM
 * 
 * @param plainText - The token to encrypt
 * @param encryptionKey - The encryption key (from TOKEN_ENCRYPTION_KEY secret)
 * @returns Encrypted token in format: iv:ciphertext (both hex-encoded)
 */
export async function encryptToken(plainText: string, encryptionKey: string): Promise<string> {
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

  // Return as hex: iv:ciphertext
  const encryptedBytes = new Uint8Array(encrypted);
  return `${bytesToHex(iv)}:${bytesToHex(encryptedBytes)}`;
}

/**
 * Decrypt a token using AES-256-GCM
 * 
 * @param encryptedText - Encrypted token in format: iv:ciphertext
 * @param encryptionKey - The encryption key (from TOKEN_ENCRYPTION_KEY secret)
 * @returns Decrypted token
 */
export async function decryptToken(encryptedText: string, encryptionKey: string): Promise<string> {
  // Parse iv:ciphertext format
  const [ivHex, ciphertextHex] = encryptedText.split(':');
  
  if (!ivHex || !ciphertextHex) {
    throw new Error('Invalid encrypted token format');
  }

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
 * Check if a token is encrypted (has the iv:ciphertext format)
 */
export function isEncrypted(token: string): boolean {
  if (!token) return false;
  // Check if it matches the hex:hex pattern
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  // IV should be 24 hex chars (12 bytes)
  if (parts[0].length !== 24) return false;
  // Both parts should be valid hex
  return /^[0-9a-f]+$/i.test(parts[0]) && /^[0-9a-f]+$/i.test(parts[1]);
}
