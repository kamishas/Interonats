/**
 * Encryption utility for sensitive data
 * Uses AES-GCM encryption with Web Crypto API
 */

// In production, this should be stored securely (e.g., environment variable)
// For now, we'll derive it from a known string
const ENCRYPTION_KEY_MATERIAL = 'hr-portal-encryption-key-v1-secure-2024';

async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY_MATERIAL),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('hr-portal-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  
  // Web Crypto API (subtle) is only available in secure contexts (HTTPS or localhost)
  if (!window.isSecureContext || !crypto.subtle) {
    console.warn('Crypto Subtle API not available (non-HTTPS context). SSL/TLS is required for browser-side encryption. Falling back to plain text for demo.');
    return plaintext;
  }

  try {
    const encoder = new TextEncoder();
    const key = await getEncryptionKey();
    
    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encoder.encode(plaintext)
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  if (!encryptedText) return '';
  
  // If not in secure context or doesn't look like encrypted data, return as is
  if (!window.isSecureContext || !crypto.subtle || !isEncrypted(encryptedText)) {
    return encryptedText;
  }

  try {
    const key = await getEncryptionKey();
    
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );
    
    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    // Return original text if decryption fails (might be unencrypted data)
    return encryptedText;
  }
}

/**
 * Checks if a string appears to be encrypted
 * @param text - The text to check
 * @returns True if the text appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  // Base64 pattern check
  const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
  return base64Pattern.test(text) && text.length > 20;
}

/**
 * Encrypts sensitive fields in an object
 * @param obj - The object containing fields to encrypt
 * @param fields - Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export async function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = await encrypt(result[field] as string) as any;
    }
  }
  
  return result;
}

/**
 * Decrypts sensitive fields in an object
 * @param obj - The object containing encrypted fields
 * @param fields - Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export async function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = await decrypt(result[field] as string) as any;
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        // Keep original value if decryption fails
      }
    }
  }
  
  return result;
}
