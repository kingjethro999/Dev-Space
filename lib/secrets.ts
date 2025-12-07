/**
 * Secrets utility - Server-side only
 * Uses environment variables to retrieve secrets
 * 
 * Note: This module can only be used in server-side code (API routes, server components)
 * For client-side usage, create API routes that use this module
 * 
 * Uses runtime checks instead of 'server-only' to avoid build errors when imported indirectly
 */

// Runtime check to ensure this only runs server-side
if (typeof window !== 'undefined') {
  throw new Error('secrets.ts can only be used server-side');
}

/**
 * Get a secret from environment variables
 * 
 * @param key - The secret key to retrieve
 * @returns The secret value from environment variable
 * @throws Error if environment variable is not set
 */
export function getSecret(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable "${key}" is not set. Please add it to your .env file.`);
  }
  return value;
}

/**
 * Get Firebase configuration from environment variables
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
 * Get Cloudinary configuration from environment variables
 */
export function getCloudinaryConfig() {
  return {
    apiKey: getSecret('CLOUDINARY_API_KEY'),
    cloudName: getSecret('CLOUDINARY_CLOUD_NAME'),
    apiSecret: getSecret('CLOUDINARY_SECRET')
  };
}

/**
 * Get OpenRouter API key from environment variables
 */
export function getOpenRouterApiKey(): string {
  return getSecret('OPENROUTER_API_KEY');
}

/**
 * Get CRON_SECRET from environment variables for Vercel cron job authentication
 */
export function getCronSecret(): string {
  return getSecret('CRON_SECRET');
}

