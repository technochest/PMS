# Microsoft Outlook Integration Setup Guide

This guide walks you through setting up the Microsoft Outlook email integration for the Work Management Hub application.

## Prerequisites

- Microsoft 365 account (work/school) OR personal Microsoft account
- Azure Portal access (for organization accounts) OR Microsoft Entra admin center

## Option 1: Personal Microsoft Account (Quick Testing)

For testing with a personal Microsoft account (outlook.com, hotmail.com, live.com):

1. Go to [Microsoft Entra App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Sign in with your personal Microsoft account
3. Click **"New registration"**

### App Registration Details

- **Name**: `WMS App` (or any name you prefer)
- **Supported account types**: Select "Accounts in any organizational directory and personal Microsoft accounts (Any Microsoft Entra ID tenant and personal Microsoft accounts)" 
- **Redirect URI**: 
  - Platform: `Web`
  - URI: `http://localhost:3001/api/auth/outlook/callback`

4. Click **"Register"**

### Get Your Credentials

After registration, you'll see the app overview page:

1. **Application (client) ID**: Copy this value → This is your `MICROSOFT_CLIENT_ID`
2. Click **"Certificates & secrets"** in the left menu
3. Click **"New client secret"**
4. Add a description (e.g., "WMS Development")
5. Choose expiration (recommended: 24 months)
6. Click **"Add"**
7. **IMPORTANT**: Copy the **Value** immediately (not the Secret ID) → This is your `MICROSOFT_CLIENT_SECRET`

### Configure API Permissions

1. Go to **"API permissions"** in the left menu
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Search and add these permissions:
   - `Mail.Read` - Read user mail
   - `Mail.ReadWrite` - Read and write user mail
   - `User.Read` - Read user profile
   - `offline_access` - Maintain access (for refresh tokens)
6. Click **"Add permissions"**

### Update Your .env File

Open `pms-app/.env` and fill in the credentials:

```env
MICROSOFT_CLIENT_ID="your-application-client-id-here"
MICROSOFT_CLIENT_SECRET="your-client-secret-value-here"
MICROSOFT_TENANT_ID="common"
```

> **Note**: Use `common` for TENANT_ID to allow both personal and work accounts.

## Option 2: Corporate/Organization Account (Microsoft 365)

For corporate Microsoft 365 accounts (like `@mdlz.com`), you may need admin approval:

### Self-Service (if allowed by your organization)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Follow the same steps as Option 1

### Request IT Admin Help

If you don't have permissions, contact your IT administrator with this information:

**App Registration Request:**
```
App Name: WMS Work Management Hub
Purpose: Email integration for project management system

Required Settings:
- Supported account types: Single tenant (your organization only)
- Redirect URI: http://localhost:3001/api/auth/outlook/callback
- For production: https://your-domain.com/api/auth/outlook/callback

Required API Permissions (Microsoft Graph - Delegated):
- Mail.Read
- Mail.ReadWrite  
- User.Read
- offline_access

Requested by: [Your Name]
Business justification: [Why you need email integration]
```

## Testing the Integration

1. Ensure your `.env` file has the correct credentials
2. Restart the development server: `npm run dev`
3. Navigate to the **Marketplace** (store icon in header)
4. Click **"Connect"** on **Microsoft Outlook**
5. Sign in with your Microsoft account
6. Grant the requested permissions
7. You'll be redirected back with a success message
8. Click **"Sync Now"** to fetch your emails

## Troubleshooting

### "OAuth not configured" Error
- Ensure `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` are set in `.env`
- Restart the development server after changing `.env`

### "Admin approval required" Error
- Your organization requires admin consent for third-party apps
- Contact IT administrator for approval
- Or use a personal Microsoft account for testing

### "Invalid redirect URI" Error
- Ensure the redirect URI in Azure matches exactly: `http://localhost:3001/api/auth/outlook/callback`
- Check for trailing slashes or typos

### "Token exchange failed" Error
- Client secret may have expired
- Generate a new client secret in Azure Portal
- Update `.env` with the new secret

## Production Deployment

For production, you'll need to:

1. Add production redirect URI in Azure Portal:
   - `https://your-production-domain.com/api/auth/outlook/callback`

2. Update environment variables:
   ```env
   NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
   ```

3. Consider using:
   - Azure Key Vault for secrets
   - Certificate-based authentication instead of client secrets
   - Specific tenant ID instead of "common" for organization-only access

## Security Notes

- Never commit `.env` files to version control
- Rotate client secrets periodically
- Use HTTPS in production
- Store tokens encrypted in the database (implement before production)
- Implement token revocation on disconnect

## API Endpoints

The integration uses these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/outlook` | GET | Initiates OAuth flow |
| `/api/auth/outlook/callback` | GET | OAuth callback handler |
| `/api/emails/accounts` | GET | List connected accounts |
| `/api/emails/accounts` | DELETE | Disconnect an account |
| `/api/emails/sync` | POST | Sync emails from account |
| `/api/emails/sync` | GET | Get synced emails |
