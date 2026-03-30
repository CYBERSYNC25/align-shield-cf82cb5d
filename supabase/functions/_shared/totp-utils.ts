/**
 * TOTP Utilities for MFA
 * 
 * Implements RFC 6238 (TOTP) and RFC 4226 (HOTP) algorithms
 * Compatible with Google Authenticator, Authy, and other TOTP apps
 */

import { decode as base32Decode, encode as base32Encode } from "https://deno.land/std@0.190.0/encoding/base32.ts";

/**
 * Generate a cryptographically secure TOTP secret
 * @returns Base32-encoded secret (20 bytes = 160 bits)
 */
export function generateTotpSecret(): string {
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  return base32Encode(randomBytes);
}

/**
 * Generate OTPAuth URL for authenticator apps
 * @param secret Base32-encoded secret
 * @param account User's email or identifier
 * @param issuer App name (default: 'Compliance Sync')
 */
export function generateOtpAuthUrl(
  secret: string, 
  account: string, 
  issuer: string = 'Compliance Sync'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(account);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code URL using external service
 * For production, consider using a local QR library
 */
export function generateQrCodeUrl(data: string, size: number = 200): string {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&margin=10`;
}

/**
 * Generate 10 backup codes
 * Format: XXXX-XXXX (8 chars each)
 * Excludes similar characters (I, O, 0, 1)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  for (let i = 0; i < count; i++) {
    let code = '';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    for (let j = 0; j < 8; j++) {
      code += chars[randomBytes[j] % chars.length];
    }
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

/**
 * Generate TOTP token for a given counter
 * @param secret Base32-encoded secret
 * @param counter TOTP counter value
 * @returns 6-digit TOTP code
 */
export async function generateTotp(secret: string, counter: number): Promise<string> {
  // Decode base32 secret
  const secretBytes = base32Decode(secret);
  
  // Counter as 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  let tempCounter = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tempCounter & 0xff;
    tempCounter = Math.floor(tempCounter / 256);
  }
  
  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    'raw', 
    secretBytes, 
    { name: 'HMAC', hash: 'SHA-1' }, 
    false, 
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hash = new Uint8Array(signature);
  
  // Dynamic truncation (RFC 4226)
  const offset = hash[hash.length - 1] & 0xf;
  const binary = ((hash[offset] & 0x7f) << 24)
    | (hash[offset + 1] << 16)
    | (hash[offset + 2] << 8)
    | hash[offset + 3];
  
  // 6 digits
  return (binary % 1000000).toString().padStart(6, '0');
}

/**
 * Get current TOTP counter value
 * @param period TOTP period in seconds (default: 30)
 */
export function getTotpCounter(period: number = 30): number {
  return Math.floor(Date.now() / 1000 / period);
}

/**
 * Verify a TOTP token
 * @param secret Base32-encoded secret
 * @param token User-provided 6-digit code
 * @param window Number of periods to check before/after current (default: 1)
 * @returns true if token is valid
 */
export async function verifyTotp(
  secret: string, 
  token: string, 
  window: number = 1
): Promise<boolean> {
  // Validate token format
  if (!/^\d{6}$/.test(token)) {
    return false;
  }
  
  const period = 30;
  const currentCounter = getTotpCounter(period);
  
  // Check window of periods (for clock drift tolerance)
  for (let i = -window; i <= window; i++) {
    const expectedToken = await generateTotp(secret, currentCounter + i);
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

/**
 * Normalize backup code input
 * Removes hyphens/spaces and converts to uppercase
 */
export function normalizeBackupCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Verify backup code against encrypted list
 * @param code User-provided backup code
 * @param backupCodes Array of valid backup codes
 * @returns Index of matched code, or -1 if not found
 */
export function verifyBackupCode(code: string, backupCodes: string[]): number {
  const normalizedInput = normalizeBackupCode(code);
  
  for (let i = 0; i < backupCodes.length; i++) {
    if (normalizeBackupCode(backupCodes[i]) === normalizedInput) {
      return i;
    }
  }
  
  return -1;
}

/**
 * Calculate time remaining until next TOTP period
 * @returns Seconds until next period
 */
export function getSecondsUntilNextPeriod(period: number = 30): number {
  const now = Date.now() / 1000;
  return period - (Math.floor(now) % period);
}
