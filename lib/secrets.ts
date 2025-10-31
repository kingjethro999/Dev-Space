/**
 * Secrets utility - Server-side only
 * Uses we-encrypt to securely retrieve secrets from the vault
 * 
 * Note: This module can only be used in server-side code (API routes, server components)
 * For client-side usage, create API routes that use this module
 * 
 * Uses runtime checks instead of 'server-only' to avoid build errors when imported indirectly
 */

// Lazy-load we-encrypt only when needed (server-side)
let encryptCache: any = null;

function getEncrypt() {
  // Runtime check to ensure this only runs server-side
  if (typeof window !== 'undefined') {
    throw new Error('secrets.ts can only be used server-side');
  }
  
  // Lazy load we-encrypt - only when actually called (server-side)
  if (!encryptCache) {
    encryptCache = require('we-encrypt');
  }
  return encryptCache;
}

/**
 * Get a secret from the encrypted vault
 * Uses ENCRYPT_PASSWORD environment variable or falls back to common dev passwords
 * 
 * @param key - The secret key to retrieve
 * @returns The decrypted secret value
 * @throws Error if vault is locked and no password is available
 */
export function getSecret(key: string): string {
  try {
    const encrypt = getEncrypt();
    // Try to get secret - will auto-unlock if ENCRYPT_PASSWORD is set
    return encrypt.getSecret(key);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve secret "${key}": ${errorMessage}. Make sure ENCRYPT_PASSWORD is set or vault is unlocked.`);
  }
}

/**
 * Get Firebase configuration from encrypted vault
 */
export function getFirebaseConfig() {
  return {
    apiKey: getSecret('FIREBASE_API_KEY'),
    authDomain: getSecret('FIREBASE_AUTH_DOMAIN'),
    databaseURL: getSecret('FIREBASE_DATABASE_URL'),
    projectId: getSecret('FIREBASE_PROJECT_ID'),
    storageBucket: getSecret('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getSecret('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getSecret('FIREBASE_APP_ID'),
    measurementId: getSecret('FIREBASE_MEASUREMENT_ID')
  };
}

/**
 * Get Cloudinary configuration from encrypted vault
 */
export function getCloudinaryConfig() {
  return {
    apiKey: getSecret('CLOUDINARY_API_KEY'),
    cloudName: getSecret('CLOUDINARY_CLOUD_NAME'),
    apiSecret: getSecret('CLOUDINARY_SECRET')
  };
}

/**
 * Get OpenRouter API key from encrypted vault
 */
export function getOpenRouterApiKey(): string {
  return getSecret('OPENROUTER_API_KEY');
}

/**
 * Check if vault is unlocked
 */
export function isVaultUnlocked(): boolean {
  try {
    const encrypt = getEncrypt();
    return encrypt.isUnlocked();
  } catch {
    return false;
  }
}

