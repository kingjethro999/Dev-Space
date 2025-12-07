# 🔐 Environment Variables Configuration

This project uses environment variables to securely manage API keys and secrets.

## Quick Start

### 1. Copy the example environment file

```bash
cp .env.example .env
```

### 2. Fill in your environment variables

Edit the `.env` file with your actual API keys and secrets. All required variables are listed in `.env.example`.

### 3. Start development

```bash
pnpm dev
```

The application will automatically load secrets from environment variables during server-side initialization.

## Required Environment Variables

### Firebase Configuration

- `FIREBASE_API_KEY` - Firebase API key
- `FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `FIREBASE_APP_ID` - Firebase app ID
- `FIREBASE_MEASUREMENT_ID` - Firebase Analytics measurement ID

### Firebase Config (Secondary)

- `FIREBASE_CONFIG_API_KEY` - Secondary Firebase API key
- `FIREBASE_CONFIG_AUTH_DOMAIN` - Secondary Firebase auth domain
- `FIREBASE_CONFIG_PROJECT_ID` - Secondary Firebase project ID
- `FIREBASE_CONFIG_STORAGE_BUCKET` - Secondary Firebase storage bucket
- `FIREBASE_CONFIG_MESSAGING_SENDER_ID` - Secondary Firebase messaging sender ID
- `FIREBASE_CONFIG_APP_ID` - Secondary Firebase app ID

### Cloudinary Configuration

- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_SECRET` - Cloudinary API secret (server-side only)

### OpenRouter API

- `OPENROUTER_API_KEY` - OpenRouter API key for GLOW AI

### Cron Jobs

- `CRON_SECRET` - Secret for authenticating Vercel cron job requests

### Optional

- `NEXT_PUBLIC_APP_URL` - Public URL of the application (defaults to http://localhost:3000)

## How It Works

Secrets are loaded from environment variables:

- **Firebase config**: Loaded from env in `lib/firebase.ts` and `lib/firebase-config-server.ts`
- **Cloudinary config**: Loaded from env in `lib/CLOUDINARY.tsx`
- **OpenRouter API key**: Loaded from env in `app/api/openrouter/route.ts`
- **Cron secret**: Loaded from env in cron job routes

All secrets are accessed via the `lib/secrets.ts` utility which reads from `process.env`.

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Always use `.env.example` as a template for required variables
- For production, set environment variables in your hosting platform (Vercel, etc.)
- Client-side variables must be prefixed with `NEXT_PUBLIC_` to be exposed to the browser

## Generating a New Cron Secret

To generate a new `CRON_SECRET`:

```bash
node scripts/generate-cron-secret.js
```

Then add the generated secret to your `.env` file.

## Troubleshooting

**Error: "Environment variable X is not set"**
- Check that the variable is set in your `.env` file
- Verify the variable name matches exactly (case-sensitive)
- Make sure `.env` is in the project root directory
- Restart your dev server after adding new variables

**Error: "Failed to load config from environment variables"**
- Verify all required variables are set in `.env`
- Check for typos in variable names
- Ensure there are no extra spaces around the `=` sign in `.env`
