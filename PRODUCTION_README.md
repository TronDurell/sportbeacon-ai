# 🚀 SportBeaconAI Production Deployment Guide

## 📋 Overview

This guide covers the complete production deployment of SportBeaconAI, including environment setup, authentication, AI agent orchestration, error monitoring, and deployment to production platforms.

## 🏗️ Architecture

```
SportBeaconAI Production Stack
├── Frontend (React + Vite + TypeScript)
│   ├── Admin Dashboard (Town-Rec Automation Suite)
│   ├── AI Agent Orchestration Layer
│   ├── Real-time Firebase Integration
│   └── Sentry Error Monitoring
├── Backend (Firebase Functions + Firestore)
│   ├── Authentication & Authorization
│   ├── Real-time Database
│   ├── AI Agent APIs
│   └── Payment Processing (Stripe)
└── Infrastructure
    ├── Firebase Hosting
    ├── Cloud Functions
    ├── Firestore Database
    └── Sentry Monitoring
```

## 🔧 Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Git
- Vercel CLI (optional, for Vercel deployment)
- Sentry account
- Stripe account (for payments)

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd sportbeacon-ai

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Fill in your environment variables (see Environment Configuration section)
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select the following services:
# - Firestore
# - Functions
# - Hosting
# - Authentication
```

### 3. Environment Configuration

Edit your `.env` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# AI Services
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key

# Payment Processing
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_STRIPE_SECRET_KEY=sk_test_your_stripe_secret

# Error Monitoring
VITE_SENTRY_DSN=https://your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=v1.0.0

# Feature Flags
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_AI_COACHING=true
VITE_ENABLE_TOWN_REC_ADMIN=true
```

### 4. Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### 5. Production Build

```bash
# Build for production
npm run build:prod

# Preview production build
npm run preview
```

## 🔐 Authentication Setup

### Firebase Authentication

1. **Enable Authentication Providers:**
   - Go to Firebase Console > Authentication
   - Enable Email/Password
   - Enable Google Sign-in
   - Configure authorized domains

2. **Set up User Roles:**
   ```javascript
   // In Firebase Functions
   exports.setUserRole = functions.auth.user().onCreate(async (user) => {
     const { uid, email } = user;
     
     // Set default role based on email domain
     const role = email.endsWith('@town.gov') ? 'admin' : 'user';
     
     await admin.firestore().collection('users').doc(uid).set({
       email,
       role,
       createdAt: admin.firestore.FieldValue.serverTimestamp(),
     });
   });
   ```

### Role-Based Access Control

The application supports the following roles:
- **admin**: Full access to all admin panels
- **coach**: Access to coaching tools and player management
- **player**: Access to personal training and progress tracking
- **parent**: Access to registration and payment management
- **referee**: Access to scheduling and game management

## 🧠 AI Agent Orchestration

### Agent Configuration

The AI orchestration layer manages the following agents:

1. **CoachAgent**: Personal training and workout planning
2. **ScoutEval**: Video analysis and player evaluation
3. **TownRecAgent**: Municipal sports management
4. **VenuePredictor**: Smart venue matching
5. **EventNLPBuilder**: Natural language processing
6. **CivicIndexer**: Community engagement tracking

### Usage Analytics

All AI agent usage is logged to Firestore in the `ai-usage` collection:

```javascript
// Example usage log
{
  agentId: 'coach-agent',
  userId: 'user123',
  userRole: 'coach',
  requestType: 'generate_workout',
  payload: { playerLevel: 'intermediate', focus: 'strength' },
  timestamp: serverTimestamp(),
  responseTime: 1500,
  success: true,
  environment: 'production'
}
```

## 🛡️ Error Monitoring

### Sentry Integration

1. **Create Sentry Project:**
   - Go to [Sentry.io](https://sentry.io)
   - Create a new project for React
   - Copy the DSN

2. **Configure Environment Variables:**
   ```env
   VITE_SENTRY_DSN=https://your_sentry_dsn
   VITE_SENTRY_ENVIRONMENT=production
   VITE_SENTRY_RELEASE=v1.0.0
   VITE_ENABLE_SENTRY=true
   ```

3. **Monitor Errors:**
   - Real-time error tracking
   - Performance monitoring
   - User session replay
   - Custom error contexts

## 💳 Payment Integration

### Stripe Setup

1. **Create Stripe Account:**
   - Sign up at [Stripe.com](https://stripe.com)
   - Get your API keys

2. **Configure Environment:**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   VITE_STRIPE_SECRET_KEY=sk_test_your_secret
   ```

3. **Webhook Configuration:**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

## 🚀 Deployment Options

### Option 1: Firebase Hosting

```bash
# Build the application
npm run build:prod

# Deploy to Firebase
firebase deploy

# Your app will be available at:
# https://your-project-id.web.app
```

### Option 2: Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Your app will be available at:
# https://your-project.vercel.app
```

### Option 3: Netlify Deployment

```bash
# Build the application
npm run build:prod

# Deploy to Netlify (drag and drop dist folder)
# Or use Netlify CLI
netlify deploy --prod --dir=dist
```

## 📊 Performance Optimization

### Build Optimizations

- **Code Splitting**: Admin panels are lazy-loaded
- **Tree Shaking**: Unused code is automatically removed
- **Bundle Analysis**: Use `npm run build:analyze` to analyze bundle size
- **Caching**: Static assets are cached with long TTL

### Runtime Optimizations

- **Real-time Updates**: Firebase listeners for live data
- **Pagination**: Large datasets are paginated
- **Debouncing**: Search and filter inputs are debounced
- **Memoization**: React components are memoized

## 🔍 Monitoring & Analytics

### Performance Monitoring

```bash
# Run Lighthouse audit
npm run lighthouse

# Monitor Core Web Vitals
# Use Google PageSpeed Insights
```

### Error Tracking

- **Sentry Dashboard**: Monitor errors in real-time
- **Custom Alerts**: Set up alerts for critical errors
- **Performance Tracking**: Monitor page load times

### Usage Analytics

- **Firebase Analytics**: Track user behavior
- **AI Usage**: Monitor agent performance and usage
- **Custom Events**: Track business-specific metrics

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:admin
npm run test:ai
```

### E2E Tests

```bash
# Run Cypress tests
npm run test:e2e

# Open Cypress UI
npm run test:e2e:open
```

### Performance Tests

```bash
# Run Lighthouse CI
npm run lighthouse:ci

# Load testing (if applicable)
npm run test:load
```

## 🔒 Security

### Security Headers

```javascript
// In Firebase hosting configuration
{
  "headers": [
    {
      "source": "**",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Environment Security

- **Secrets Management**: Use environment variables for all secrets
- **API Key Rotation**: Regularly rotate API keys
- **Access Control**: Implement proper RBAC
- **Input Validation**: Validate all user inputs

## 📈 Scaling

### Database Scaling

- **Firestore**: Automatically scales with usage
- **Indexing**: Create composite indexes for complex queries
- **Caching**: Implement Redis for frequently accessed data

### Application Scaling

- **CDN**: Use Cloudflare or similar for static assets
- **Load Balancing**: Multiple regions for global users
- **Caching**: Implement service worker for offline support

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Firebase Connection Issues:**
   ```bash
   # Check Firebase configuration
   firebase projects:list
   firebase use your-project-id
   ```

3. **Environment Variables:**
   ```bash
   # Verify environment variables
   npm run env:check
   ```

### Debug Mode

```bash
# Enable debug logging
VITE_DEBUG_MODE=true npm run dev

# Check Sentry configuration
VITE_ENABLE_SENTRY=true npm run dev
```

## 📞 Support

### Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support@sportbeacon.ai

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 Changelog

### v1.0.0 (Production Release)
- ✅ Complete Town-Rec Admin Suite
- ✅ AI Agent Orchestration Layer
- ✅ Real-time Firebase Integration
- ✅ Sentry Error Monitoring
- ✅ Stripe Payment Integration
- ✅ Production Build Optimization
- ✅ Comprehensive Testing Suite
- ✅ Security Hardening

---

**🎯 Ready for Production!**

Your SportBeaconAI application is now configured for production deployment with:
- Secure authentication and authorization
- Real-time data synchronization
- AI agent orchestration with usage analytics
- Comprehensive error monitoring
- Payment processing capabilities
- Performance optimizations
- Security best practices

Follow the deployment steps above to get your application live! 🚀 