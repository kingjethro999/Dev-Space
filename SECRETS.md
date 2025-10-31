# 🔐 Secrets Management

This project uses [we-encrypt](https://www.npmjs.com/package/we-encrypt) to securely manage API keys and secrets **directly in the code** - no environment variables needed!

## Quick Start

### 1. Unlock the vault (required before starting dev server)

```bash
pnpm run unlock
# or
encrypt setup temp-secure-password-12345
```

This unlocks the encrypted vault so secrets can be loaded by the application.

### 2. Start development

```bash
pnpm dev
```

The application will automatically load secrets from the encrypted vault during server-side initialization.

## Workflow

### Before Committing to GitHub

```bash
# Lock the vault to encrypt all secrets
pnpm run lock
# or
encrypt lockup temp-secure-password-12345
```

This encrypts all secrets so you can safely commit the `.encrypt/` directory to GitHub.

### Before Development

**Always unlock the vault first:**

```bash
pnpm run unlock
# or
encrypt setup temp-secure-password-12345
```

Then start your dev server - secrets are loaded directly from the vault.

## How It Works

Secrets are loaded **directly from the encrypted vault** using the `we-encrypt` package:

- **Firebase config**: Loaded from vault in `lib/firebase.ts`
- **Cloudinary config**: Loaded from vault in `lib/CLOUDINARY.tsx`
- **OpenRouter API key**: Loaded from vault in `app/api/openrouter/route.ts`

All secrets are accessed via the `lib/secrets.ts` utility which uses `we-encrypt` under the hood.

## Security Notes

⚠️ **Important:**
- Always lock the vault before committing (`encrypt lockup <password>`)
- Change the default password (`temp-secure-password-12345`) to a strong password
- The `.encrypt/` directory contains encrypted secrets and **is safe to commit**
- Secrets are **never** stored in `.env` files or environment variables
- Vault must be unlocked before running dev server or building

## Changing Password

```bash
# 1. Unlock with old password
encrypt setup <old-password>

# 2. Lock with new password
encrypt lockup <new-password>
```

## Available Secrets

View all encrypted secrets:
```bash
encrypt status
```

Get a specific secret:
```bash
encrypt get FIREBASE_API_KEY
```

## Troubleshooting

**Error: "Vault is locked"**
- Run `encrypt setup <password>` to unlock the vault

**Error: "Failed to load config from encrypted vault"**
- Make sure vault is unlocked: `encrypt setup <password>`
- Check that secrets exist: `encrypt status`

