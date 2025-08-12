# Firebase Deployment Guide for SportBeaconAI

## 🚀 Overview

This guide covers the complete Firebase deployment process for the SportBeaconAI frontend, including setup, configuration, and CI/CD integration.

## 📋 Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project created
- Environment variables configured

## 🔧 Initial Setup

### 1. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init

# Select the following options:
# - Hosting: Configure files for Firebase Hosting
# - Use an existing project
# - Select your Firebase project
# - Public directory: frontend/build
# - Configure as single-page app: Yes
# - Set up automatic builds: No (we'll handle this in CI/CD)
```

### 2. Environment Configuration

Create `.env` file in the frontend directory:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API Configuration
REACT_APP_API_URL=your_api_url

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### 3. Firebase Configuration Files

The following files are already configured:

- `firebase.json` - Hosting configuration
- `.firebaserc` - Project configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes

## 🏗️ Build Process

### Local Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Build for production
npm run build:firebase
```

### Production Build

```bash
# Build with optimizations
npm run build:firebase

# This creates the build directory at frontend/build/
```

## 🚀 Deployment

### Manual Deployment

```bash
# Build the application
npm run build:firebase

# Deploy to Firebase
firebase deploy --only hosting

# Or use the convenience script
npm run deploy:firebase
```

### Automated Deployment (CI/CD)

The GitHub Actions workflow automatically deploys on push to main:

```yaml
# .github/workflows/ci-cd.yml
deploy-firebase:
  name: Deploy to Firebase
  runs-on: ubuntu-latest
  needs: build
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  
  steps:
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

## 🔍 Local Testing

### Firebase Emulators

```bash
# Start all emulators
npm run firebase:emulators:start:all

# Start specific emulators
npm run firebase:emulators:start

# Access emulator UI at http://localhost:4000
```

### Performance Testing

```bash
# Run Lighthouse audit locally
npm run audit:lighthouse

# Run Lighthouse audit on production
npm run audit:lighthouse:prod
```

## 📊 Performance Monitoring

### Lighthouse Audit

The automated Lighthouse audit runs on every deployment and generates reports:

```bash
# Run audit manually
npm run audit:lighthouse

# View report
cat audit/FRONTEND_LIGHTHOUSE_REPORT.md
```

### Core Web Vitals

Monitor these key metrics:

- **First Contentful Paint (FCP)**: < 2000ms
- **Largest Contentful Paint (LCP)**: < 2500ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 300ms
- **Speed Index**: < 3400ms

## 🔒 Security Configuration

### Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Public read access for certain collections
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Hosting Security Headers

The `firebase.json` includes security headers:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build:firebase
   ```

2. **Deployment Fails**
   ```bash
   # Check Firebase CLI version
   firebase --version
   
   # Re-authenticate
   firebase logout
   firebase login
   
   # Check project configuration
   firebase projects:list
   firebase use your-project-id
   ```

3. **Environment Variables Not Loading**
   ```bash
   # Verify .env file exists
   ls -la frontend/.env
   
   # Check variable names (must start with REACT_APP_)
   cat frontend/.env
   ```

### Performance Issues

1. **Bundle Size Too Large**
   ```bash
   # Analyze bundle
   npm run analyze
   
   # Check for duplicate dependencies
   npm ls
   ```

2. **Slow Loading**
   - Enable compression in Firebase hosting
   - Implement lazy loading for routes
   - Optimize images and use WebP format

## 📈 Monitoring and Analytics

### Firebase Analytics

```typescript
// frontend/src/lib/firebase.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Track custom events
logEvent(analytics, 'page_view', {
  page_title: 'Admin Dashboard',
  page_location: window.location.href
});
```

### Error Monitoring

```typescript
// frontend/src/lib/errorMonitoring.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

## 🔄 Continuous Integration

### GitHub Actions Secrets

Configure these secrets in your GitHub repository:

- `FIREBASE_SERVICE_ACCOUNT`: Base64 encoded service account JSON
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `REACT_APP_FIREBASE_API_KEY`: Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID`: Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID`: Firebase app ID

### Deployment Pipeline

1. **Push to main branch**
2. **GitHub Actions triggers**
3. **Run tests and linting**
4. **Build application**
5. **Deploy to Firebase**
6. **Run performance audit**
7. **Send notifications**

## 📚 Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Lighthouse Performance](https://developers.google.com/web/tools/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)

## 🆘 Support

For deployment issues:

1. Check the GitHub Actions logs
2. Verify Firebase project configuration
3. Test locally with emulators
4. Review performance audit reports
5. Contact the development team 