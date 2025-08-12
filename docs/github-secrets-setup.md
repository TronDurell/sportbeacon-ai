# GitHub Secrets Setup for CI/CD

This document outlines the required GitHub secrets for the SportBeaconAI CI/CD pipeline.

## Required Secrets

### Vercel Deployment
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Firebase Deployment (Alternative)
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON (base64 encoded)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

### Performance Monitoring
- `LHCI_GITHUB_APP_TOKEN`: Lighthouse CI GitHub app token

### Notifications
- `SLACK_WEBHOOK_URL`: Slack webhook URL for deployment notifications

## How to Set Up Secrets

### 1. Vercel Setup

1. **Get Vercel Token**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Get your token from ~/.vercel/auth.json
   cat ~/.vercel/auth.json
   ```

2. **Get Project Details**
   ```bash
   # Link your project
   vercel link
   
   # This will create .vercel/project.json with your project details
   ```

3. **Add to GitHub Secrets**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: From .vercel/project.json
     - `VERCEL_PROJECT_ID`: From .vercel/project.json

### 2. Firebase Setup

1. **Create Service Account**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Encode Service Account**
   ```bash
   # Base64 encode the service account JSON
   base64 -i path/to/serviceAccountKey.json
   ```

3. **Add to GitHub Secrets**
   - `FIREBASE_SERVICE_ACCOUNT`: Base64 encoded service account JSON
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID

### 3. Lighthouse CI Setup

1. **Install Lighthouse CI GitHub App**
   - Go to [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
   - Install for your repository

2. **Get GitHub App Token**
   - The token will be automatically available as `LHCI_GITHUB_APP_TOKEN`

### 4. Slack Notifications

1. **Create Slack Webhook**
   - Go to your Slack workspace
   - Apps → Incoming Webhooks → Add to Slack
   - Choose channel and create webhook

2. **Add to GitHub Secrets**
   - `SLACK_WEBHOOK_URL`: Your Slack webhook URL

## Environment Variables for Vercel

If using Vercel, also set these environment variables in your Vercel project:

```bash
REACT_APP_API_URL=your_api_url
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment-specific secrets**
3. **Rotate secrets regularly**
4. **Limit secret access to necessary workflows**
5. **Use least privilege principle**

## Troubleshooting

### Common Issues

1. **Vercel deployment fails**
   - Verify Vercel token is valid
   - Check project ID and org ID
   - Ensure project is linked correctly

2. **Firebase deployment fails**
   - Verify service account has correct permissions
   - Check project ID matches
   - Ensure service account JSON is properly encoded

3. **Lighthouse CI fails**
   - Verify GitHub app is installed
   - Check repository permissions
   - Ensure token is available

### Debug Commands

```bash
# Test Vercel connection
vercel whoami

# Test Firebase connection
firebase projects:list

# Test Lighthouse CI
lhci autorun
```

## Support

For issues with CI/CD setup:
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Test locally with the same commands
4. Contact the development team 