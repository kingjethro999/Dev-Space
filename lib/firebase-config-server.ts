/**
 * Server-only Firebase config loader
 * This file is never imported by client components
 * Uses runtime check instead of server-only to avoid build errors
 */

// Runtime check - only load if server-side
if (typeof window === 'undefined') {
  const { getFirebaseConfig } = require('./secrets');
  module.exports = { firebaseConfig: getFirebaseConfig() };
} else {
  // Client-side fallback (should never reach here)
  module.exports = { firebaseConfig: null };
}

