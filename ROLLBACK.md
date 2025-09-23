# Rollback Procedures - SportBeaconAI Super Audit

## Overview

This document provides comprehensive rollback procedures for all changes made during the SportBeaconAI super audit. Use these procedures if issues occur after deployment or if you need to revert specific changes.

## Quick Rollback Commands

### Full Repository Rollback
```bash
# Rollback to previous commit (replace <commit-hash> with actual hash)
git revert <commit-hash>

# Or reset to previous commit (DESTRUCTIVE - use with caution)
git reset --hard HEAD~1
```

### Selective File Rollback
```bash
# Rollback specific files to previous version
git checkout HEAD~1 -- frontend/src/services/api.ts
git checkout HEAD~1 -- frontend/src/services/realApiService.js
git checkout HEAD~1 -- frontend/src/services/realApiService.ts
git checkout HEAD~1 -- frontend/src/services/api.js
git checkout HEAD~1 -- frontend/public/manifest.json
git checkout HEAD~1 -- frontend/src/components/ApiTest.js
git checkout HEAD~1 -- frontend/src/components/ApiTest.tsx
```

## Detailed Rollback Procedures

### 1. API Configuration Rollback

#### If API endpoints are not working:

**Files to revert:**
- `frontend/src/services/api.ts`
- `frontend/src/services/realApiService.js`
- `frontend/src/services/realApiService.ts`
- `frontend/src/services/api.js`

**Manual rollback:**
```bash
# Revert API service files
git checkout HEAD~1 -- frontend/src/services/api.ts
git checkout HEAD~1 -- frontend/src/services/realApiService.js
git checkout HEAD~1 -- frontend/src/services/realApiService.ts
git checkout HEAD~1 -- frontend/src/services/api.js

# Or manually edit files to restore original URLs
# Change from: http://localhost:5001/sportbeacon-ai/us-central1
# Change to: http://127.0.0.1:8000
```

**Environment variable rollback:**
```bash
# Remove new environment variables
unset VITE_API_BASE
unset CORS_ORIGINS
```

### 2. PWA Manifest Rollback

#### If PWA is not working:

**Files to revert:**
- `frontend/public/manifest.json`

**Manual rollback:**
```bash
# Revert manifest file
git checkout HEAD~1 -- frontend/public/manifest.json

# Or manually restore original manifest
# Restore all icon references that were removed
```

**Manual manifest restoration:**
```json
{
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 3. Security Hardening Rollback

#### If security middleware is causing issues:

**Files to revert:**
- `functions/src/lib/http.ts`
- `functions/src/lib/validate.ts`
- `functions/src/lib/origins.ts`

**Manual rollback:**
```bash
# Revert security files
git checkout HEAD~1 -- functions/src/lib/http.ts
git checkout HEAD~1 -- functions/src/lib/validate.ts
git checkout HEAD~1 -- functions/src/lib/origins.ts
```

**Disable security middleware:**
```typescript
// In functions/src/index.ts, replace:
export const health = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  // ... handler code
}));

// With:
export const health = onRequest(async (req: Request, res: Response) => {
  // ... handler code
});
```

### 4. Component Rollback

#### If API test components are not working:

**Files to revert:**
- `frontend/src/components/ApiTest.js`
- `frontend/src/components/ApiTest.tsx`

**Manual rollback:**
```bash
# Revert component files
git checkout HEAD~1 -- frontend/src/components/ApiTest.js
git checkout HEAD~1 -- frontend/src/components/ApiTest.tsx
```

### 5. New Files Rollback

#### If new utilities are causing issues:

**Files to remove:**
- `frontend/src/utils/getApiBase.ts`
- `PROJECT_REVIEW_REPORT.md`
- `SECURITY_HARDENING_FINAL.md`
- `PRODUCTION_READINESS_SUMMARY.md`
- `CHANGELOG_AUDIT.md`
- `ROLLBACK.md`

**Manual removal:**
```bash
# Remove new files
rm frontend/src/utils/getApiBase.ts
rm PROJECT_REVIEW_REPORT.md
rm SECURITY_HARDENING_FINAL.md
rm PRODUCTION_READINESS_SUMMARY.md
rm CHANGELOG_AUDIT.md
rm ROLLBACK.md
```

## Environment Rollback

### Development Environment
```bash
# Restore development environment variables
export NODE_ENV=development
export VITE_API_URL=http://127.0.0.1:8000
export CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Production Environment
```bash
# Restore production environment variables
export NODE_ENV=production
export VITE_API_URL=https://us-central1-sportbeacon-ai.cloudfunctions.net
export CORS_ORIGINS=https://sportbeacon-ai.web.app,https://sportbeaconai.web.app
```

## Firebase Rollback

### Functions Rollback
```bash
# Deploy previous version of functions
firebase deploy --only functions --project <project-id>

# Or rollback to specific version
firebase functions:rollback --project <project-id>
```

### Hosting Rollback
```bash
# Deploy previous version of hosting
firebase deploy --only hosting --project <project-id>

# Or rollback to specific version
firebase hosting:rollback --project <project-id>
```

## Database Rollback

### Firestore Rules Rollback
```bash
# Deploy previous Firestore rules
firebase deploy --only firestore:rules --project <project-id>
```

### Firestore Indexes Rollback
```bash
# Deploy previous Firestore indexes
firebase deploy --only firestore:indexes --project <project-id>
```

## Package Dependencies Rollback

### NPM Dependencies
```bash
# Restore previous package-lock.json
git checkout HEAD~1 -- package-lock.json

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Workspace Dependencies
```bash
# Restore workspace package files
git checkout HEAD~1 -- frontend/package.json
git checkout HEAD~1 -- functions/package.json
git checkout HEAD~1 -- packages/memory-sdk/package.json
git checkout HEAD~1 -- packages/mcp-server/package.json

# Reinstall workspace dependencies
npm install
```

## Verification Steps

### After Rollback, Verify:
1. **Build System**: All builds should pass
2. **API Endpoints**: All endpoints should respond
3. **PWA Functionality**: PWA should install and work
4. **Security**: Security should be maintained
5. **Tests**: All tests should pass

### Test Commands
```bash
# Test builds
npm run build

# Test functions
npm -w functions run build

# Test frontend
npm -w frontend run build

# Test SDK
npm -w packages/memory-sdk run build
```

## Emergency Procedures

### If Complete Rollback is Needed
```bash
# 1. Stop all services
# 2. Revert to previous commit
git reset --hard HEAD~1

# 3. Force push (DESTRUCTIVE - use with caution)
git push --force-with-lease origin main

# 4. Redeploy
firebase deploy
```

### If Partial Rollback is Needed
```bash
# 1. Identify specific issues
# 2. Revert only affected files
# 3. Test changes
# 4. Deploy fixes
```

## Prevention Measures

### Before Future Changes
1. **Create Backup**: Always create a backup before major changes
2. **Test Environment**: Test changes in development first
3. **Staging Deployment**: Deploy to staging before production
4. **Rollback Plan**: Always have a rollback plan ready

### Monitoring
1. **Health Checks**: Monitor health endpoints
2. **Error Logs**: Monitor error logs
3. **Performance**: Monitor performance metrics
4. **User Feedback**: Monitor user feedback

## Support

### If Rollback Fails
1. **Check Git History**: Verify commit history
2. **Check Dependencies**: Verify package versions
3. **Check Environment**: Verify environment variables
4. **Contact Support**: Reach out to development team

### Recovery Procedures
1. **Database Recovery**: Restore from backups if needed
2. **File Recovery**: Restore from version control
3. **Configuration Recovery**: Restore from backups
4. **Service Recovery**: Restart services if needed

---

**Rollback Guide Generated**: 2025-01-21
**Last Updated**: 2025-01-21
**Status**: ✅ **READY FOR USE**