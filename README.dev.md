# SportBeaconAI - Developer Guide

[![CI/CD Pipeline](https://github.com/your-org/sportbeacon-ai/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/sportbeacon-ai/actions)
[![Code Coverage](https://codecov.io/gh/your-org/sportbeacon-ai/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/sportbeacon-ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-blue.svg)](https://reactjs.org/)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Firebase CLI (optional, for deployment)
- Stripe CLI (optional, for webhook testing)

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd sportbeacon-ai
   npm install
   cd frontend && npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   # Fill in your actual values in .env
   ```

3. **Start Development**
   ```bash
   # Start frontend
   cd frontend
   npm start
   
   # Start backend (in another terminal)
   cd backend
   npm run dev
   ```

## 🔧 Project Structure

```
sportbeacon-ai/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── routes/          # Route definitions
│   │   ├── contexts/        # React contexts
│   │   ├── providers/       # Provider components
│   │   ├── lib/             # Utilities and services
│   │   └── App.tsx          # Main app component
│   ├── services/            # API services
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── backend/                 # Node.js/Express backend
├── lib/                     # Shared libraries
└── scripts/                 # Build and deployment scripts
```

## 🔑 Environment Variables

### Required for Development
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
APPLE_PAY_MERCHANT_ID=merchant.com.sportbeacon

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key
```

### Optional
```bash
# Sentry Error Monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=development
VITE_ENABLE_SENTRY=false

# AWS Configuration (for media uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name
```

## 🔥 Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Authentication, Firestore, Storage, and Functions

2. **Configure Authentication**
   - Enable Email/Password, Google, and Phone providers
   - Set up custom claims for admin roles

3. **Firestore Rules**
   ```javascript
   // Example security rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Admin access
       match /{document=**} {
         allow read, write: if request.auth != null && 
           request.auth.token.admin == true;
       }
     }
   }
   ```

4. **Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 💳 Stripe Integration

1. **Create Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Get your API keys from the dashboard

2. **Configure Webhooks**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

3. **Test Mode**
   - Use test keys for development
   - Test card: 4242 4242 4242 4242
   - Test CVC: Any 3 digits

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
cd frontend
npm test

# Run specific test file
npm test -- App.test.tsx

# Run tests with coverage
npm test -- --coverage
```

### Test Structure
- **Unit Tests**: `*.test.tsx` files alongside components
- **Integration Tests**: `__tests__/` directory
- **E2E Tests**: `cypress/` directory

### Writing Tests
```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Health Check
```bash
# Run deployment health check
npm run check-deploy

# Or manually
npx ts-node scripts/check-deploy-status.ts
```

### Build for Production
```bash
cd frontend
npm run build
```

### Deploy to Firebase
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Deploy
firebase deploy
```

## 🐛 Common Issues & Solutions

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf frontend/node_modules/.cache
npx tsc --build --clean

# Check for unresolved imports
npx tsc --noEmit --skipLibCheck
```

### Build Failures
```bash
# Clear all caches
rm -rf node_modules package-lock.json
npm install

# Check for missing dependencies
npm ls
```

### Import Path Issues
- Use path aliases: `@components/`, `@pages/`, `@lib/`
- Avoid deep relative imports: `../../../`
- Update `tsconfig.json` paths if needed

### Environment Variables
- Ensure all required vars are in `.env`
- Check for typos in variable names
- Restart dev server after env changes

### Firebase Connection
```bash
# Check Firebase config
firebase projects:list
firebase use <project-id>

# Test Firestore connection
firebase firestore:rules:test
```

## 👥 Contributing

### Where to Start

1. **Admin Panels** (`frontend/src/components/admin/`)
   - Player registration review
   - Waitlist management
   - Payment processing

2. **AI Routes** (`frontend/src/routes/`)
   - Agent orchestration
   - AI assistant integration
   - Commerce features

3. **Core Components** (`frontend/src/components/`)
   - Reusable UI components
   - Form components
   - Data visualization

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow TypeScript best practices
   - Add tests for new components
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm test
   npm run build
   npm run check-deploy
   ```

4. **Submit PR**
   - Include description of changes
   - Link related issues
   - Request review from team

### Code Standards

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Testing**: Jest + React Testing Library
- **Styling**: Tailwind CSS
- **Linting**: ESLint + Prettier

### File Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts`

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

### Tools
- [VS Code Extensions](./.vscode/extensions.json)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)

### Community
- [Discord Server](link-to-discord)
- [GitHub Issues](link-to-issues)
- [Team Wiki](link-to-wiki)

## 🆘 Getting Help

1. **Check Documentation**: This README and inline code comments
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Ask Team**: Reach out on Discord or team chat
4. **Create Issue**: If problem persists, create detailed issue

### Issue Template
```markdown
## Problem
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 11]
- Node: [e.g., v18.17.0]
- npm: [e.g., v9.6.7]

## Additional Context
Screenshots, logs, etc.
```

---

**Happy Coding! 🎉** 