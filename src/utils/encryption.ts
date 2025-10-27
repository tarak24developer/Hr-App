/**
 * Data Encryption Utility
 * Encrypts sensitive data before storing in localStorage
 */

import CryptoJS from 'crypto-js';

// Use environment variable for encryption key, fallback to default for development
// ⚠️ IMPORTANT: Set VITE_ENCRYPTION_KEY in production .env file
const SECRET_KEY = import.meta.env['VITE_ENCRYPTION_KEY'] as string || 'hrms-default-key-change-in-production-2024';

// Salt for additional security
const SALT = 'hrms-secure-salt-2024';

/**
 * Encrypt data using AES encryption
 */
export const encryptData = (data: any): string => {
  try {
    if (data === null || data === undefined) {
      return '';
    }

    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    
    // Encrypt using AES with salt
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY + SALT).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback: return stringified data (not encrypted)
    // This ensures the app doesn't break if encryption fails
    return JSON.stringify(data);
  }
};

/**
 * Decrypt data that was encrypted with encryptData
 */
export const decryptData = (encryptedData: string): any => {
  try {
    if (!encryptedData || encryptedData === '') {
      return null;
    }

    // Try to decrypt
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY + SALT);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      // If decryption fails, try to parse as plain JSON (backward compatibility)
      return JSON.parse(encryptedData);
    }
    
    // Parse JSON
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    
    // Try to parse as plain JSON (backward compatibility with old data)
    try {
      return JSON.parse(encryptedData);
    } catch {
      // If all fails, return null
      return null;
    }
  }
};

/**
 * Hash sensitive data (one-way encryption)
 * Useful for storing passwords or sensitive identifiers
 */
export const hashData = (data: string): string => {
  try {
    return CryptoJS.SHA256(data + SALT).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    return data;
  }
};

/**
 * Generate a secure random key
 * Useful for generating encryption keys or tokens
 */
export const generateSecureKey = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Encrypt specific fields in an object
 * Useful when you only want to encrypt certain sensitive fields
 */
export const encryptFields = <T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T => {
  try {
    const result = { ...obj };
    
    fieldsToEncrypt.forEach(field => {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = encryptData(result[field]) as any;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Field encryption error:', error);
    return obj;
  }
};

/**
 * Decrypt specific fields in an object
 */
export const decryptFields = <T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T => {
  try {
    const result = { ...obj };
    
    fieldsToDecrypt.forEach(field => {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = decryptData(result[field] as string) as any;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Field decryption error:', error);
    return obj;
  }
};

/**
 * Check if encryption key is properly configured
 */
export const isEncryptionConfigured = (): boolean => {
  return import.meta.env['VITE_ENCRYPTION_KEY'] !== undefined;
};

/**
 * Get encryption status message
 */
export const getEncryptionStatus = (): string => {
  if (isEncryptionConfigured()) {
    return '🔒 Encryption enabled (custom key)';
  } else {
    return '⚠️ Encryption enabled (default key - set VITE_ENCRYPTION_KEY in production)';
  }
};

// Log encryption status in development
if (import.meta.env.DEV) {
  console.log(getEncryptionStatus());
}
