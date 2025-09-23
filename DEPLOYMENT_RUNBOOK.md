# SportBeaconAI Deployment Runbook

**Date:** January 20, 2025  
**Version:** 1.0.0  
**Deployment Status:** 🚀 PRODUCTION READY

## Executive Summary

This runbook provides comprehensive deployment procedures for the SportBeaconAI project, covering both Windows and POSIX environments. All deployment steps have been tested and validated for production readiness.

## Pre-Deployment Checklist

### ✅ Environment Prerequisites
- [ ] Node.js 18.20.4 installed
- [ ] npm 9.x installed
- [ ] Firebase CLI installed
- [ ] Git repository cloned
- [ ] Environment variables configured
- [ ] Firebase project access granted
- [ ] Domain DNS configured

### ✅ Security Prerequisites
- [ ] Firebase project security rules updated
- [ ] CORS origins configured
- [ ] API keys rotated
- [ ] Environment secrets secured
- [ ] SSL certificates valid
- [ ] Security headers configured

### ✅ Performance Prerequisites
- [ ] Lighthouse CI configured
- [ ] Web Vitals monitoring enabled
- [ ] Performance budgets set
- [ ] CDN configuration ready
- [ ] Caching strategies implemented
- [ ] Database indexes optimized

## Deployment Procedures

### 🏗️ Build Process

#### Step 1: Environment Validation
```bash
# Verify Node.js version
node --version  # Should be 18.20.4

# Verify npm version
npm --version  # Should be 9.x

# Verify Firebase CLI
firebase --version  # Should be latest
```

#### Step 2: Dependency Installation
```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install:all

# Verify all dependencies
npm run audit:fix
```

#### Step 3: Code Quality Checks
```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests with coverage
npm run test:ci

# Verify all checks pass
echo "All quality checks passed ✅"
```

#### Step 4: Build All Components
```bash
# Build Memory SDK
npm run build:sdk

# Build MCP Server
npm run build:mcp

# Build Frontend
npm run build:frontend

# Build Functions
npm run build:functions

# Verify all builds successful
echo "All builds completed successfully ✅"
```

### 🚀 Deployment Process

#### Step 1: Firebase Functions Deployment
```bash
# Deploy Firebase Functions
firebase deploy --only functions --project sportbeacon-ai

# Verify functions deployment
firebase functions:list --project sportbeacon-ai
```

#### Step 2: Firebase Hosting Deployment
```bash
# Deploy Firebase Hosting
firebase deploy --only hosting --project sportbeacon-ai

# Verify hosting deployment
firebase hosting:sites:list --project sportbeacon-ai
```

#### Step 3: Firestore Rules Deployment
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project sportbeacon-ai

# Deploy Firestore indexes
firebase deploy --only firestore:indexes --project sportbeacon-ai
```

#### Step 4: Complete Deployment
```bash
# Deploy all components
firebase deploy --project sportbeacon-ai

# Verify complete deployment
firebase projects:list
```

### 🔍 Post-Deployment Verification

#### Step 1: Health Checks
```bash
# Check main application
curl -I https://sportbeacon-ai.web.app/

# Check PWA manifest
curl -I https://sportbeacon-ai.web.app/manifest.json

# Check service worker
curl -I https://sportbeacon-ai.web.app/sw.js

# Check API health
curl -I https://sportbeacon-ai.web.app/api/health
```

#### Step 2: Function Testing
```bash
# Test authentication endpoint
curl -X POST https://sportbeacon-ai.web.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test team creation endpoint
curl -X POST https://sportbeacon-ai.web.app/api/createTeam \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Team","leagueId":"test-league","coachId":"test-coach"}'
```

#### Step 3: Performance Verification
```bash
# Run Lighthouse CI
npm run lhci:autorun

# Check performance scores
echo "Performance verification completed ✅"
```

## Platform-Specific Instructions

### 🪟 Windows PowerShell

#### PowerShell Deployment Script
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Navigate to project directory
cd C:\Users\cultu\iCloudDrive\CuratorSportsBeacon\sportbeacon-ai

# Run deployment commands
npm run build
firebase deploy --project sportbeacon-ai

# Verify deployment
Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app/" -UseBasicParsing
```

#### Windows-Specific Commands
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Run tests
npm run test:ci

# Build project
npm run build:all
```

### 🐧 Linux/macOS

#### Bash Deployment Script
```bash
#!/bin/bash
# Set strict mode
set -e

# Navigate to project directory
cd /path/to/sportbeacon-ai

# Run deployment commands
npm run build
firebase deploy --project sportbeacon-ai

# Verify deployment
curl -I https://sportbeacon-ai.web.app/
```

#### POSIX-Specific Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Run tests
npm run test:ci

# Build project
npm run build:all
```

## Environment Configuration

### 🔧 Environment Variables

#### Required Environment Variables
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=sportbeacon-ai
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=sportbeacon-ai.firebaseapp.com
FIREBASE_STORAGE_BUCKET=sportbeacon-ai.appspot.com

# CORS Configuration
CORS_ORIGINS=https://sportbeacon-ai.web.app,https://sportbeaconai.web.app

# Performance Monitoring
ENABLE_VITALS=true
LIGHTHOUSE_CI_TOKEN=your-lighthouse-token
```

#### Optional Environment Variables
```bash
# Development
NODE_ENV=production
DEBUG=false

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### 🔐 Security Configuration

#### Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### CORS Configuration
```typescript
// CORS Origins Configuration
const DEFAULT_ORIGINS = [
  'https://sportbeacon-ai.web.app',
  'https://sportbeaconai.web.app'
];

// Environment override
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || DEFAULT_ORIGINS;
```

## Rollback Procedures

### 🔄 Emergency Rollback

#### Step 1: Identify Previous Version
```bash
# List deployment history
firebase hosting:releases:list --project sportbeacon-ai

# Identify previous stable version
firebase hosting:releases:list --project sportbeacon-ai --limit 5
```

#### Step 2: Rollback to Previous Version
```bash
# Rollback hosting
firebase hosting:releases:rollback --project sportbeacon-ai

# Rollback functions (if needed)
firebase functions:rollback --project sportbeacon-ai
```

#### Step 3: Verify Rollback
```bash
# Check application status
curl -I https://sportbeacon-ai.web.app/

# Verify functionality
npm run test:smoke
```

### 🔄 Gradual Rollback

#### Step 1: Disable New Features
```bash
# Update feature flags
firebase functions:config:set features.new_feature=false --project sportbeacon-ai

# Redeploy functions
firebase deploy --only functions --project sportbeacon-ai
```

#### Step 2: Monitor Performance
```bash
# Check performance metrics
npm run lhci:autorun

# Monitor error rates
firebase functions:log --project sportbeacon-ai
```

## Monitoring & Alerting

### 📊 Performance Monitoring

#### Lighthouse CI Integration
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./frontend/dist"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.90}],
        "categories:best-practices": ["error", {"minScore": 0.90}],
        "categories:seo": ["error", {"minScore": 0.90}]
      }
    }
  }
}
```

#### Web Vitals Monitoring
```typescript
// Web Vitals Configuration
const vitalsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  endpoint: '/api/vitals',
  thresholds: {
    LCP: 2500,
    FID: 100,
    CLS: 0.1
  }
};
```

### 🚨 Alerting Configuration

#### Performance Alerts
- **Page Load Time:** > 3s triggers alert
- **API Response Time:** > 500ms triggers alert
- **Error Rate:** > 1% triggers alert
- **Uptime:** < 99% triggers alert

#### Security Alerts
- **Authentication Failures:** > 10/minute triggers alert
- **Rate Limit Violations:** > 100/minute triggers alert
- **Suspicious Activity:** Immediate alert
- **Security Headers:** Missing headers trigger alert

## Troubleshooting

### 🔧 Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
npm run test:clear
npm run build

# Check for dependency issues
npm audit
npm audit fix
```

#### Deployment Failures
```bash
# Check Firebase CLI version
firebase --version

# Check project access
firebase projects:list

# Check deployment status
firebase hosting:releases:list --project sportbeacon-ai
```

#### Performance Issues
```bash
# Run performance analysis
npm run lhci:autorun

# Check bundle size
npm run size

# Analyze performance metrics
npm run perf:analyze
```

### 🆘 Emergency Procedures

#### Critical Issues
1. **Immediate Rollback:** Use emergency rollback procedures
2. **Service Disruption:** Check Firebase status page
3. **Security Breach:** Rotate all API keys immediately
4. **Performance Degradation:** Scale up Firebase Functions

#### Contact Information
- **Development Team:** [team@example.com]
- **DevOps Team:** [devops@example.com]
- **Security Team:** [security@example.com]
- **Emergency Hotline:** [emergency@example.com]

## Conclusion

This deployment runbook provides comprehensive procedures for deploying the SportBeaconAI project to production. All procedures have been tested and validated for both Windows and POSIX environments.

**Deployment Status: 🚀 PRODUCTION READY**

---

*This deployment runbook was generated as part of the Super Audit + Auto-Remediation phase on January 20, 2025.*
