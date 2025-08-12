# 🚀 SportBeaconAI Deployment Guide

## 📋 Quick Start

### 1. Environment Setup
```powershell
# Generate .env.local with Firebase config
powershell -ExecutionPolicy Bypass -File setup-environment.ps1
```

### 2. Deploy to Production
```powershell
# Windows (PowerShell)
.\deploy-unified.ps1

# Linux/Mac (Bash)
chmod +x deploy-unified.sh rollback.sh test-local.sh
./deploy-unified.sh
```

### 3. Test Locally (Before Deploy)
```powershell
# Windows
.\test-local.ps1

# Linux/Mac
./test-local.sh

# Visit http://localhost:3000
```

## 🔄 Rollback & Snapshot Management

### List Available Snapshots
```powershell
# Windows
.\rollback.ps1 list

# Linux/Mac
./rollback.sh list
```

### Restore Previous Build
```powershell
# Windows
.\rollback.ps1 restore dist-20250715-183000
.\rollback.ps1 deploy

# Linux/Mac
./rollback.sh restore dist-20250715-183000
./rollback.sh deploy
```

### Manual Rollback Steps
```powershell
# 1. List snapshots
ls deploy_snapshots/

# 2. Restore specific snapshot
cp -r deploy_snapshots/dist-20250715-183000 dist

# 3. Deploy to Firebase
firebase deploy --only hosting
```

## 🛡️ Deployment Safety Net

### Protected Files (in .gitignore)
- `dist/` - Build output
- `deploy_snapshots/` - Rollback snapshots
- `.env*` - Environment configuration

### Automatic Safeguards
- ✅ Environment validation before deploy
- ✅ Build output validation
- ✅ Automatic snapshot creation
- ✅ Rollback capability

## 🔍 Pre-Deployment Checklist

### Environment
- [ ] `.env.local` exists and filled
- [ ] Firebase CLI logged in (`firebase login`)
- [ ] Firebase project configured (`firebase use sportbeacon-ai`)

### Build
- [ ] `npm install` completes successfully
- [ ] `npm run build` generates `dist/` folder
- [ ] `dist/index.html` exists and has proper paths

### Firebase Configuration
- [ ] `firebase.json` targets `dist/` directory
- [ ] Firebase hosting rewrites configured
- [ ] Firebase project permissions verified

### Local Testing
- [ ] `.\test-local.ps1` serves app at http://localhost:3000
- [ ] No console errors in browser
- [ ] All features work as expected

## 🚨 Troubleshooting

### White Screen Issues
1. Check `.env.local` exists and has Firebase config
2. Verify `dist/index.html` asset paths
3. Check Firebase hosting rewrites
4. Review browser console for errors

### Build Failures
1. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Check for TypeScript errors: `npm run type-check`
3. Verify all dependencies are installed

### Deployment Failures
1. Check Firebase CLI login: `firebase login:list`
2. Verify project selection: `firebase projects:list`
3. Check Firebase hosting configuration

### Rollback Issues
1. Verify snapshot exists: `.\rollback.ps1 list`
2. Check snapshot integrity: `ls deploy_snapshots/dist-*`
3. Manual restore if needed: `cp -r deploy_snapshots/dist-* dist`

## 📊 Deployment Scripts Overview

### `deploy-unified.ps1` / `deploy-unified.sh`
- Validates environment configuration
- Creates deployment snapshots
- Builds project with validation
- Deploys to Firebase Hosting
- Provides deployment status

### `rollback.ps1` / `rollback.sh`
- Lists available snapshots
- Restores previous builds
- Deploys restored versions
- Manages rollback workflow

### `test-local.ps1` / `test-local.sh`
- Validates build output
- Serves app locally for testing
- Provides pre-deployment validation

### `setup-environment.ps1`
- Generates `.env.local` with Firebase config
- Validates environment variables
- Sets up production environment

## 🌐 Production URLs

- **Main App**: https://sportbeacon-ai.web.app
- **Firebase Console**: https://console.firebase.google.com/project/sportbeacon-ai
- **GitHub Repository**: [Your GitHub Repo URL]

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review Firebase hosting logs
3. Check browser console for errors
4. Verify environment configuration

## 🔄 CI/CD Integration

### GitHub Actions (Optional)
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: sportbeacon-ai
```

---

**Last Updated**: $(Get-Date)
**Version**: 1.0.0 