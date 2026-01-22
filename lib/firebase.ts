import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"
import { initializeAnalytics, isSupported } from "firebase/analytics"

// Firebase configuration
// Note: Firebase config is public and safe to use client-side
// We load from environment variables server-side, but provide fallback for client initialization
let firebaseConfigValue: any;

if (typeof window === 'undefined') {
  // Server-side: Try to load from environment variables
  try {
    const serverConfig = require('./firebase-config-server');
    if (serverConfig && serverConfig.firebaseConfig) {
      firebaseConfigValue = serverConfig.firebaseConfig;
    } else {
      throw new Error('Firebase config not loaded from environment variables');
    }
  } catch (error) {
    // If env loading fails, use public config as fallback for API routes
    // This allows API routes to work even if env vars aren't set
    // Firebase config is public anyway, so this is safe
    console.warn('Failed to load Firebase config from environment variables, using public config:', error instanceof Error ? error.message : 'Unknown error');
    firebaseConfigValue = {
      apiKey: "AIzaSyA4T14XH4Kls8Qesffr6KNywUXrwqbs8LQ",
      authDomain: "dev-space-d8dbe.firebaseapp.com",
      databaseURL: "https://dev-space-d8dbe-default-rtdb.firebaseio.com",
      projectId: "dev-space-d8dbe",
      storageBucket: "dev-space-d8dbe.firebasestorage.app",
      messagingSenderId: "1063806728845",
      appId: "1:1063806728845:web:e1c6b091a7bb1083f440c4",
      measurementId: "G-0C944DJJY7"
    };
  }
} else {
  // Client-side: Use public Firebase config (safe to expose)
  // This config is loaded server-side during SSR, but client also needs it for hydration
  firebaseConfigValue = {
    apiKey: "AIzaSyA4T14XH4Kls8Qesffr6KNywUXrwqbs8LQ",
    authDomain: "dev-space-d8dbe.firebaseapp.com",
    databaseURL: "https://dev-space-d8dbe-default-rtdb.firebaseio.com",
    projectId: "dev-space-d8dbe",
    storageBucket: "dev-space-d8dbe.firebasestorage.app",
    messagingSenderId: "1063806728845",
    appId: "1:1063806728845:web:e1c6b091a7bb1083f440c4",
    measurementId: "G-0C944DJJY7"
  };
}

// Initialize Firebase
const app = initializeApp(firebaseConfigValue)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const realtimeDb = getDatabase(app)

// Initialize Analytics only on client side and when supported
let analytics: any = null
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      const host = window.location.hostname
      const cookieDomain = host === 'localhost' ? 'localhost' : (process.env.NEXT_PUBLIC_APP_DOMAIN || 'the-dev-space.vercel.app')
      analytics = initializeAnalytics(app, {
        config: {
          cookie_domain: cookieDomain,
          cookie_flags: 'SameSite=None;Secure'
        }
      })
    }
  }).catch((err) => {
    console.error('Failed to initialize analytics:', err)
  })
}

export { analytics }

export default app
