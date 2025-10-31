/**
 * Cloudinary configuration
 * Loaded from encrypted vault (server-side only)
 * Note: API_KEY and CLOUD_NAME can be used on client-side
 * SECRET should only be used on server-side
 */

let cloudinaryConfigValue: { apiKey: string; cloudName: string; apiSecret: string };

if (typeof window === 'undefined') {
  // Server-side: Load from encrypted vault
  try {
    const { getCloudinaryConfig } = require('./secrets');
    cloudinaryConfigValue = getCloudinaryConfig();
  } catch (error) {
    throw new Error(
      `Failed to load Cloudinary config from encrypted vault: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      `Make sure to unlock the vault first: "encrypt setup <password>"`
    );
  }
} else {
  // Client-side: Use safe defaults (API key and cloud name are public)
  cloudinaryConfigValue = {
    apiKey: "489659887456251",
    cloudName: "dcrh78d8z",
    apiSecret: "" // Never available client-side
  };
}

export const CLOUDINARY_API_KEY = cloudinaryConfigValue.apiKey
export const CLOUDINARY_CLOUD_NAME = cloudinaryConfigValue.cloudName
// SECRET should only be accessed server-side - never use CLOUDINARY_SECRET in client components
export const CLOUDINARY_SECRET = cloudinaryConfigValue.apiSecret