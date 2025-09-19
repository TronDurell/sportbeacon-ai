# SportBeaconAI Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Login**: Authenticate with Firebase
   ```bash
   firebase login
   ```

3. **Project Setup**: Ensure you're using the correct project
   ```bash
   firebase use sportbeacon-ai
   ```

## Quick Deployment

### Option 1: Using npm scripts (Recommended)
```bash
# Deploy everything (hosting + functions)
npm run deploy

# Deploy only hosting
npm run deploy:hosting

# Deploy only functions
npm run deploy:functions
```

### Option 2: Using deployment scripts
```bash
# Linux/macOS
./deploy.sh

# Windows
deploy.bat
```

### Option 3: Manual deployment
```bash
# Build frontend
npm run build:frontend

# Build functions
npm run build:functions

# Deploy to Firebase
firebase deploy --only hosting,functions
```

## Pre-deployment Checklist

- [ ] All tests pass: `npm run test:ci`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Frontend builds successfully: `npm run build:frontend`
- [ ] Functions build successfully: `npm run build:functions`
- [ ] Firebase emulator works: `firebase emulators:start`

## Post-deployment Verification

### Option 1: Using npm scripts
```bash
# Linux/macOS
npm run postdeploy:posix

# Windows
npm run postdeploy:powershell
```

### Option 2: Manual verification
```bash
# Check if the site is accessible
curl -I https://sportbeacon-ai.web.app

# Or visit in browser
open https://sportbeacon-ai.web.app
```

## Environment Configuration

### Required Environment Variables
- `FIREBASE_PROJECT_ID`: sportbeacon-ai
- `FIREBASE_API_KEY`: (set in Firebase console)
- `FIREBASE_AUTH_DOMAIN`: sportbeacon-ai.firebaseapp.com
- `FIREBASE_STORAGE_BUCKET`: sportbeacon-ai.appspot.com

### Firebase Configuration
- **Project ID**: sportbeacon-ai
- **Hosting URL**: https://sportbeacon-ai.web.app
- **Functions URL**: https://us-central1-sportbeacon-ai.cloudfunctions.net

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   npm run test:clear
   npm run build:frontend
   ```

2. **Firebase Authentication Issues**
   ```bash
   # Re-authenticate
   firebase logout
   firebase login
   ```

3. **Deployment Timeouts**
   ```bash
   # Deploy with increased timeout
   firebase deploy --only hosting,functions --timeout 600
   ```

4. **Function Build Issues**
   ```bash
   # Clean and rebuild functions
   cd functions
   rm -rf lib
   npm run build
   ```

### Logs and Debugging
```bash
# View Firebase logs
firebase functions:log

# View hosting logs
firebase hosting:channel:list

# Debug emulator
firebase emulators:start --debug
```

## CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Runs tests on multiple platforms (Ubuntu, Windows, macOS)
- Tests multiple Node.js versions (18, 20)
- Automatically deploys on push to main branch
- Requires `FIREBASE_SERVICE_ACCOUNT` secret in GitHub

## Security Considerations

- Never commit Firebase service account keys
- Use environment variables for sensitive data
- Enable Firebase Security Rules
- Regularly update dependencies
- Monitor Firebase usage and costs

## Performance Optimization

- Enable Firebase Hosting caching
- Use Firebase CDN for static assets
- Optimize bundle sizes with Vite
- Implement proper error boundaries
- Monitor Core Web Vitals

## Support

For deployment issues:
1. Check Firebase console for errors
2. Review GitHub Actions logs
3. Test locally with emulators
4. Contact the development team