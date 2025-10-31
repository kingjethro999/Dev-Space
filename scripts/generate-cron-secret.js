#!/usr/bin/env node

/**
 * Script to generate a secure random CRON_SECRET
 * This secret is used to authenticate Vercel cron job requests
 */

const crypto = require('crypto');

// Generate a secure random string (64 characters)
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secret = generateSecret();

console.log('\n🔐 Generated CRON_SECRET:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Add this to your vault:');
console.log(`encrypt add CRON_SECRET "${secret}"\n`);
console.log('Or add it manually to your .env file (if using .env):');
console.log(`CRON_SECRET=${secret}\n`);

// Also save to a temporary file for easy copying (optional)
const fs = require('fs');
const path = require('path');
const tempFile = path.join(__dirname, '.cron-secret-temp.txt');
fs.writeFileSync(tempFile, secret);
console.log(`💾 Secret also saved to: ${tempFile}`);
console.log('⚠️  Remember to delete this file after adding to vault!\n');

